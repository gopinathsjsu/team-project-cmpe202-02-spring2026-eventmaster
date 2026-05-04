from django.urls import path

from accounts.views import MeView, RegisterView, RoleTokenObtainPairView, RoleTokenRefreshView

urlpatterns = [
    path("register/", RegisterView.as_view(), name="auth-register"),
    path("login/", RoleTokenObtainPairView.as_view(), name="auth-login"),
    path("token/refresh/", RoleTokenRefreshView.as_view(), name="auth-token-refresh"),
    path("me/", MeView.as_view(), name="auth-me"),
]
