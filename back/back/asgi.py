import django
django.setup()
import os
import logging
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from chat.routing import websocket_urlpatterns
from chat.middleware import JWTAuthMiddleware
logger = logging.getLogger('django')

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "back.settings")


application = ProtocolTypeRouter({
    "http": get_asgi_application(),
    "websocket": JWTAuthMiddleware(  # Для WebSocket
        URLRouter(
            websocket_urlpatterns
        )
    ),
})


def log_connection(scope):
    logger.info(f"WebSocket connection attempt: {scope['client']}")

