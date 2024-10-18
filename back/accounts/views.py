from rest_framework import generics
from rest_framework.response import Response
from rest_framework import status
from .serializers import CustomUserSerializer
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.sessions.models import Session
from django.utils import timezone


class RegisterView(generics.CreateAPIView):
    serializer_class = CustomUserSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
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

