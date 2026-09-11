from django.urls import include, path
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    AvatarUploadView,
    ChangePasswordView,
    LoginView,
    LogoutView,
    MeView,
    PasswordResetConfirmView,
    PasswordResetRequestView,
    ProvisionStaffAccountView,
    RegisterStudentView,
    StaffViewSet,
)

router = DefaultRouter()
router.register(r"staff", StaffViewSet, basename="staff")

urlpatterns = [
    path("login/", LoginView.as_view(), name="auth-login"),
    path("logout/", LogoutView.as_view(), name="auth-logout"),
    path("refresh/", TokenRefreshView.as_view(), name="auth-refresh"),
    path("register/", RegisterStudentView.as_view(), name="auth-register"),
    path("staff/provision/", ProvisionStaffAccountView.as_view(), name="auth-staff-provision-alias"),
    path("me/", MeView.as_view(), name="auth-me"),
    path("profile/avatar/", AvatarUploadView.as_view(), name="auth-profile-avatar"),
    path("change-password/", ChangePasswordView.as_view(), name="auth-change-password"),
    path("password-reset/", PasswordResetRequestView.as_view(), name="auth-password-reset"),
    path("password-reset/confirm/", PasswordResetConfirmView.as_view(), name="auth-password-reset-confirm"),
    path("", include(router.urls)),
]