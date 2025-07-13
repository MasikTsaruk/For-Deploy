from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth import get_user_model
from .models import Chat, Message
from .serializers import ChatSerializer, MessageSerializer
from rest_framework.response import Response
from rest_framework.decorators import action

User = get_user_model()


class ChatViewSet(viewsets.ModelViewSet):
    queryset = Chat.objects.all()
    serializer_class = ChatSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return self.request.user.chats.all()

    @action(detail=False, methods=['post'])
    def get_or_create_chat(self, request):
        user_id = request.data.get('user_id')
        user = User.objects.get(id=user_id)

        chat = Chat.objects.filter(participants=request.user).filter(participants=user).first()
        if not chat:
            chat = Chat.objects.create()
            chat.participants.add(request.user, user)

        return Response(ChatSerializer(chat).data)


class MessageViewSet(viewsets.ModelViewSet):
    serializer_class = MessageSerializer
    permission_classes = [IsAuthenticated]
    queryset = Message.objects.all()

    def get_queryset(self):
        chat_id = self.request.query_params.get('chat')
        if chat_id:
            return Message.objects.filter(chat_id=chat_id).order_by("timestamp")
        return Message.objects.none()  # чтобы не отдавать все сообщения

    def perform_create(self, serializer):
        chat_id = self.request.data.get("chat_id")
        chat = Chat.objects.get(id=chat_id)

        serializer.save(sender=self.request.user, chat=chat)


