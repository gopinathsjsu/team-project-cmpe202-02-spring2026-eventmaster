from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from accounts.views import MeView, RegisterView, RoleTokenObtainPairView

urlpatterns = [
    path("register/", RegisterView.as_view(), name="auth-register"),
    path("login/", RoleTokenObtainPairView.as_view(), name="auth-login"),
    path("token/refresh/", TokenRefreshView.as_view(), name="auth-token-refresh"),
    path("me/", MeView.as_view(), name="auth-me"),
]
