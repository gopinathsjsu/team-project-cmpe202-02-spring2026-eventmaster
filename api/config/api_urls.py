from django.urls import include, path
from django.http import JsonResponse
from django.db import connection


def health(request):
    return JsonResponse({"ok": True, "service": "django", "path": request.path})


def db_health(request):
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1;")
            row = cursor.fetchone()
        return JsonResponse({"db": "connected", "result": row[0]})
    except Exception as e:
        return JsonResponse({"db": "error", "message": str(e)}, status=500)
    
urlpatterns = [
    path("health/", health),
    path("db_health/", db_health),
    path("auth/", include("accounts.urls")),
]