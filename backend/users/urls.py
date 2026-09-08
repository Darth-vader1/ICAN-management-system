from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    LoginView,
    MeView,
    PasswordResetConfirmView,
    PasswordResetRequestView,
    ProvisionStaffAccountView,
    RegisterStudentView,
)

urlpatterns = [
    path("login/", LoginView.as_view(), name="auth-login"),
    path("refresh/", TokenRefreshView.as_view(), name="auth-refresh"),
    path("register/", RegisterStudentView.as_view(), name="auth-register"),
    path("staff/", ProvisionStaffAccountView.as_view(), name="auth-staff-provision"),
    path("me/", MeView.as_view(), name="auth-me"),
    path("password-reset/", PasswordResetRequestView.as_view(), name="auth-password-reset"),
    path("password-reset/confirm/", PasswordResetConfirmView.as_view(), name="auth-password-reset-confirm"),
]