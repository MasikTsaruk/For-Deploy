import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from .models import Chat, Message

User = get_user_model()


class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        """Обрабатывает подключение WebSocket"""
        self.user = self.scope["user"]
        self.chat_id = self.scope["path"].strip("/").split("/")[-1]
        self.room_group_name = f"chat_{self.chat_id}"

        print(f"Attempting to connect user {self.user} to chat {self.chat_id}")

        # Проверяем, есть ли пользователь среди участников
        self.chat = await self.get_chat()
        participants = await self.get_chat_participants()

        print(f"Participants in chat: {participants}")

        if self.user not in participants:
            print(f"User {self.user} is not in the chat participants.")
            await self.close()
        else:
            # Подключаем пользователя к группе WebSocket
            await self.channel_layer.group_add(self.room_group_name, self.channel_name)
            await self.accept()
            print(f"User {self.user} connected to chat {self.chat_id}")

    async def disconnect(self, close_code):
        """Отключение WebSocket"""
        print(f"Disconnecting from chat {self.chat_id} with code {close_code}")
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    async def receive(self, text_data):
        """Обрабатывает входящее сообщение от клиента"""
        text_data_json = json.loads(text_data)
        message = text_data_json["message"]

        print(f"Received message from {self.user}: {message}")

        # Создаём сообщение в базе
        msg = await self.create_message(message)

        # Отправляем сообщение **всем, кроме отправителя**
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                "type": "chat_message",
                "message": msg.content,
                "sender_id": msg.sender.id,
                "sender_email": msg.sender.email,
                "timestamp": msg.timestamp.isoformat(),
            }
        )

    async def chat_message(self, event):
        """Обрабатывает отправку сообщений в группу"""
        message = event["message"]
        sender_id = event["sender_id"]
        sender_email = event["sender_email"]
        timestamp = event["timestamp"]

        # Отправляем сообщение только **не отправителю**
        if sender_id != self.user.id:
            await self.send(text_data=json.dumps({
                "message": message,
                "sender_id": sender_id,
                "sender_email": sender_email,
                "timestamp": timestamp
            }))

    @database_sync_to_async
    def get_chat(self):
        """Загружает объект чата по chat_id"""
        return Chat.objects.get(id=self.chat_id)

    @database_sync_to_async
    def get_chat_participants(self):
        """Получает список участников чата"""
        return list(self.chat.participants.all())

    @database_sync_to_async
    def create_message(self, content):
        """Создаёт новое сообщение в базе"""
        return Message.objects.create(chat=self.chat, sender=self.user, content=content)