import django
import os

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "back.settings")
django.setup()  # <-- Добавь эту строку перед импортами

import os
import logging
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
from chat.routing import websocket_urlpatterns  # Импортируем маршруты для WebSocket

# Настройка логгирования
logger = logging.getLogger('django')

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "back.settings")

application = ProtocolTypeRouter({
    "http": get_asgi_application(),
    "websocket": AuthMiddlewareStack(  # Для WebSocket
        URLRouter(
            websocket_urlpatterns
        )
    ),
})

# Логируем успешное подключение WebSocket
def log_connection(scope):
    logger.info(f"WebSocket connection attempt: {scope['client']}")

# Добавим функцию для логирования
from channels.routing import ProtocolTypeRouter
