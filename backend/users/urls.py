from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    AvatarUploadView,
    ChangePasswordView,
    CookieTokenRefreshView,
    CSRFTokenView,
    LoginView,
    LogoutView,
    MeView,
    PasswordResetConfirmView,
    PasswordResetRequestView,
    PermissionViewSet,
    ProvisionStaffAccountView,
    RegisterStudentView,
    RoleViewSet,
    StaffViewSet,
    DashboardStatsView,
)

router = DefaultRouter()
router.register(r"staff", StaffViewSet, basename="staff")
router.register(r"roles", RoleViewSet, basename="role")
router.register(r"permissions", PermissionViewSet, basename="permission")

urlpatterns = [
    path("csrf/", CSRFTokenView.as_view(), name="auth-csrf"),
    path("login/", LoginView.as_view(), name="auth-login"),
    path("logout/", LogoutView.as_view(), name="auth-logout"),
    path("refresh/", CookieTokenRefreshView.as_view(), name="auth-refresh"),
    path("token/refresh/", CookieTokenRefreshView.as_view(), name="auth-token-refresh"),
    path("register/", RegisterStudentView.as_view(), name="auth-register"),
    path("staff/provision/", ProvisionStaffAccountView.as_view(), name="auth-staff-provision-alias"),
    path("me/", MeView.as_view(), name="auth-me"),
    path("profile/avatar/", AvatarUploadView.as_view(), name="auth-profile-avatar"),
    path("change-password/", ChangePasswordView.as_view(), name="auth-change-password"),
    path("password-reset/", PasswordResetRequestView.as_view(), name="auth-password-reset"),
    path("password-reset/confirm/", PasswordResetConfirmView.as_view(), name="auth-password-reset-confirm"),
    path("dashboard/stats/", DashboardStatsView.as_view(), name="dashboard-stats"),
    path("", include(router.urls)),
]