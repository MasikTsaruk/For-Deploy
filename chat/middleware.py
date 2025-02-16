from django.utils.deprecation import MiddlewareMixin


class QueryParamTokenMiddleware(MiddlewareMixin):
    def process_request(self, request):
        if "token" in request.GET and "Authorization" not in request.headers:
            request.META["HTTP_AUTHORIZATION"] = f"Bearer {request.GET['token']}"
