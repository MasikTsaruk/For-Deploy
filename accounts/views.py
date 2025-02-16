from django.contrib.auth import get_user_model
from django.views.decorators.cache import cache_page
from django.utils import timezone
from django.utils.decorators import method_decorator
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.viewsets import ModelViewSet
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework.views import APIView
from .tasks import send_welcome_email
from .serializers import CustomUserSerializer
from .models import CustomUser


class CustomUserViewSet(ModelViewSet):
    queryset = CustomUser.objects.all()
    serializer_class = CustomUserSerializer
    permission_classes = [IsAuthenticated]

    @method_decorator(cache_page(60 * 15))
    def list(self, request, *args, **kwargs):
        response = super().list(request, *args, **kwargs)

        if request.user.is_authenticated:
            data = response.data
            data = [user for user in data if user['id'] != request.user.id]
            response.data = data

        return response


class RegisterView(generics.CreateAPIView):
    serializer_class = CustomUserSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        send_welcome_email.delay(user.email, user.first_name)

        return Response({
            "user": CustomUserSerializer(user).data,
            "message": "User registered successfully!"
        }, status=status.HTTP_201_CREATED)


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        data.update({
            'email': self.user.email,
            'first_name': self.user.first_name,
            'last_name': self.user.last_name,
        })
        return data


class LoginView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

    def post(self, request, *args, **kwargs):
        # Получаем токены
        response = super().post(request, *args, **kwargs)

        # Получаем текущего пользователя
        User = get_user_model()
        user = User.objects.get(email=request.data['email'])

        # Создаем новую сессию
        session_key = request.session.session_key
        if not session_key:
            request.session.create()

        # Пример сохранения данных в сессии
        request.session['user_id'] = user.id
        request.session['last_login'] = timezone.now()

        return response


class LogoutView(APIView):
    def post(self, request):
        # Удаляем сессию
        try:
            # Удаляем данные из текущей сессии
            request.session.flush()
            return Response({"message": "User logged out successfully!"}, status=status.HTTP_204_NO_CONTENT)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
