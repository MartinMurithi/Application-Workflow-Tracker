import os


class CORSMiddleware:
 
    def __init__(self, get_response):
        self.get_response = get_response
        self.allowed_origins = os.environ.get(
            "CORS_ALLOWED_ORIGINS",
            "http://localhost:5173,http://localhost:3000,http://frontend:5173",
        ).split(",")

    def __call__(self, request):
        if request.method == "OPTIONS":
            response = self._preflight_response()
            return response

        response = self.get_response(request)
        self._add_cors_headers(response, request)
        return response

    def _preflight_response(self):
        from django.http import HttpResponse

        response = HttpResponse()
        response["Access-Control-Allow-Origin"] = "*"
        response["Access-Control-Allow-Methods"] = "GET, POST, PUT, PATCH, DELETE, OPTIONS"
        response["Access-Control-Allow-Headers"] = "Content-Type, X-Role, Authorization"
        response["Access-Control-Max-Age"] = "86400"
        return response

    def _add_cors_headers(self, response, request):
        response["Access-Control-Allow-Origin"] = "*"
        response["Access-Control-Allow-Methods"] = "GET, POST, PUT, PATCH, DELETE, OPTIONS"
        response["Access-Control-Allow-Headers"] = "Content-Type, X-Role, Authorization"
