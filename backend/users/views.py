from django.contrib.auth.tokens import default_token_generator
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView

from audit.utils import record_audit_log

from .models import User
from .permissions import IsITAdminOrAbove
from .serializers import (
    CustomTokenObtainPairSerializer,
    MeSerializer,
    StaffAccountSerializer,
    StudentRegistrationSerializer,
)


class LoginView(TokenObtainPairView):
    """
    JWT-based login.
    POST /api/auth/login/
    Body: {"email": "...", "password": "..."}
    Returns: {"access": "...", "refresh": "...", "role": "...", "email": "..."}
    """

    serializer_class = CustomTokenObtainPairSerializer


class RegisterStudentView(generics.CreateAPIView):
    """
    Public self-registration. Always creates a Student account.
    POST /api/auth/register/
    Body: {"email": "...", "password": "...", "password_confirm": "...", "first_name": "...", "last_name": "...", "phone": "..."}
    """

    queryset = User.objects.all()
    serializer_class = StudentRegistrationSerializer
    permission_classes = [permissions.AllowAny]
    
    def create(self, request, *args, **kwargs):
        # Debug logging
        print(f"=== REGISTRATION REQUEST ===")
        print(f"Request data: {request.data}")
        print(f"Data keys: {list(request.data.keys())}")
        print(f"==========================")
        return super().create(request, *args, **kwargs)


class ProvisionStaffAccountView(generics.CreateAPIView):
    """
    IT Admin / Super Admin only — creates internal staff accounts.
    POST /api/auth/staff/provision/
    """

    queryset = User.objects.all()
    serializer_class = StaffAccountSerializer
    permission_classes = [IsITAdminOrAbove]

    def perform_create(self, serializer):
        user = serializer.save()
        record_audit_log(
            actor=self.request.user,
            action="staff_account_created",
            entity_type="User",
            entity_id=str(user.id),
            new_value={"email": user.email, "role": user.role},
            request=self.request,
        )


class MeView(generics.RetrieveAPIView):
    """
    Get current user info with profile.
    GET /api/auth/me/
    """

    serializer_class = MeSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


class PasswordResetRequestView(APIView):
    """
    Request password reset link.
    POST /api/auth/password-reset/
    Body: {"email": "..."}
    """

    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = request.data.get("email", "")
        user = User.objects.filter(email=email).first()
        if user:
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            token = default_token_generator.make_token(user)
            from notifications.tasks import send_password_reset_email

            send_password_reset_email.delay(str(user.id), uid, token)

        # Always return 200 — never reveal whether an email exists.
        return Response({"detail": "If that account exists, a reset link has been sent."})


class PasswordResetConfirmView(APIView):
    """
    Confirm password reset with token.
    POST /api/auth/password-reset/confirm/
    Body: {"uid": "...", "token": "...", "password": "..."}
    """

    permission_classes = [permissions.AllowAny]

    def post(self, request):
        uidb64 = request.data.get("uid")
        token = request.data.get("token")
        new_password = request.data.get("password")
        
        if not all([uidb64, token, new_password]):
            return Response(
                {"detail": "Missing required fields.", "code": "VALIDATION_ERROR"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        
        try:
            uid = force_str(urlsafe_base64_decode(uidb64))
            user = User.objects.get(pk=uid)
        except (User.DoesNotExist, ValueError, TypeError, OverflowError):
            return Response(
                {"detail": "Invalid reset link.", "code": "AUTH_INVALID_TOKEN"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not default_token_generator.check_token(user, token):
            return Response(
                {"detail": "Invalid or expired reset link.", "code": "AUTH_TOKEN_EXPIRED"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user.set_password(new_password)
        user.save(update_fields=["password"])
        
        record_audit_log(
            actor=user,
            action="password_reset",
            entity_type="User",
            entity_id=str(user.id),
            request=request,
        )
        
        return Response({"detail": "Password has been reset."})



class LogoutView(APIView):
    """
    Logout by blacklisting the refresh token.
    POST /api/auth/logout/
    Body: {"refresh": "..."}
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data.get("refresh")
            if not refresh_token:
                return Response(
                    {"detail": "Refresh token is required."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            
            # Blacklist the token
            token = RefreshToken(refresh_token)
            token.blacklist()
            
            # Log the logout
            record_audit_log(
                actor=request.user,
                action="logout",
                entity_type="User",
                entity_id=str(request.user.id),
                request=request,
            )
            
            return Response({"detail": "Successfully logged out."}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {"detail": f"Logout failed: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST,
            )
