from rest_framework import serializers
from .models import Chat, Message
from accounts.serializers import CustomUserSerializer


class MessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Message
        fields = ['id', 'chat', 'sender', 'content', 'timestamp']
        extra_kwargs = {
            'chat': {'required': False},
            'sender': {'required': False}
        }


class ChatSerializer(serializers.ModelSerializer):
    participants = CustomUserSerializer(many=True, read_only=True)
    messages = MessageSerializer(many=True, read_only=True)

    class Meta:
        model = Chat
        fields = '__all__'
