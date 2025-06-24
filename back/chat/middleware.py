from django.utils.deprecation import MiddlewareMixin
from urllib.parse import parse_qs
from channels.middleware import BaseMiddleware
from django.contrib.auth.models import AnonymousUser
from rest_framework_simplejwt.tokens import AccessToken
from django.contrib.auth import get_user_model
from jwt import InvalidTokenError

User = get_user_model()


class QueryParamTokenMiddleware(MiddlewareMixin):
    def process_request(self, request):
        if "token" in request.GET and "Authorization" not in request.headers:
            request.META["HTTP_AUTHORIZATION"] = f"Bearer {request.GET['token']}"
            print(f"Token added to request: Bearer {request.GET['token']}")  # Логирование


class JWTAuthMiddleware(BaseMiddleware):
    async def __call__(self, scope, receive, send):
        # Получаем токен из query string
        query_string = scope.get("query_string", b"").decode()
        token = parse_qs(query_string).get("token")

        if token:
            try:
                access_token = AccessToken(token[0])
                user_id = access_token["user_id"]
                user = await self.get_user(user_id)
                scope["user"] = user
            except InvalidTokenError:
                scope["user"] = AnonymousUser()
        else:
            scope["user"] = AnonymousUser()

        return await super().__call__(scope, receive, send)

    @staticmethod
    async def get_user(user_id):
        try:
            return await User.objects.aget(id=user_id)
        except User.DoesNotExist:
            return AnonymousUser()