import json
from channels.generic.websocket import AsyncWebsocketConsumer
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import AccessToken
from channels.db import database_sync_to_async
from .models import Chat, Message

User = get_user_model()


class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        # Получаем токен из query_string (например, ?token=<JWT_TOKEN>)
        self.user = None
        self.chat_id = self.scope["path"].strip("/").split("/")[-1]

        try:
            query_string = self.scope["query_string"].decode()
            token_key = query_string.split("token=")[-1] if "token=" in query_string else None

            if token_key:
                access_token = AccessToken(token_key)
                self.user = await database_sync_to_async(User.objects.get)(id=access_token["user_id"])
                print(f"✅ Успешная аутентификация: {self.user.email}")
            else:
                print("❌ Токен отсутствует в запросе")

        except Exception as e:
            print(f"❌ Ошибка аутентификации: {e}")
            await self.close()
            return

        # Получаем объект чата
        self.chat = await self.get_chat()

        if self.user not in await self.get_chat_participants():
            print(f"❌ Пользователь {self.user.email} не является участником чата {self.chat_id}")
            await self.close()
        else:
            # Определяем имя группы WebSocket (все участники чата слушают эту группу)
            self.room_group_name = f"chat_{self.chat_id}"

            # Присоединяем пользователя к группе
            await self.channel_layer.group_add(self.room_group_name, self.channel_name)

            await self.accept()
            print(f"✅ {self.user.email} подключился к чату {self.chat_id}")

    @database_sync_to_async
    def get_chat(self):
        return Chat.objects.get(id=self.chat_id)

    @database_sync_to_async
    def get_chat_participants(self):
        return list(self.chat.participants.all())

    async def disconnect(self, close_code):
        print(f"🔴 {self.user.email if self.user else 'Анонимный пользователь'} отключился от чата {self.chat_id}")

        # Удаляем пользователя из группы
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    async def receive(self, text_data):
        data = json.loads(text_data)
        message_content = data.get("message", "").strip()

        if not message_content:
            print("❌ Пустое сообщение, не отправляем")
            return

        # Сохраняем сообщение в базе данных
        message = await self.save_message(message_content)

        # Отправляем сообщение в WebSocket группу
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                "type": "chat_message",
                "message": message_content,
                "sender": self.user.email,
                "timestamp": str(message.timestamp),
            },
        )

        print(f"📩 {self.user.email} отправил сообщение в чат {self.chat_id}: {message_content}")

    @database_sync_to_async
    def save_message(self, content):
        return Message.objects.create(chat=self.chat, sender=self.user, content=content)

    async def chat_message(self, event):
        """Обработчик для отправки сообщения всем пользователям в группе"""
        message = event["message"]
        sender = event["sender"]
        timestamp = event["timestamp"]

        await self.send(text_data=json.dumps({
            "message": message,
            "sender": sender,
            "timestamp": timestamp
        }))

        print(f"📤 Отправлено сообщение в WebSocket: {message} от {sender}")
