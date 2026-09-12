import logging
from django.core.files.storage import FileSystemStorage
from django.contrib.auth.tokens import default_token_generator
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from rest_framework import generics, parsers, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView

from audit.utils import record_audit_log

logger = logging.getLogger(__name__)

from .models import User, Role, StaffProfile
from .permissions import IsITAdminOrAbove, IsManagerOrAbove, IsStaffOrAbove
from .serializers import (
    CustomTokenObtainPairSerializer,
    MeSerializer,
    StaffAccountSerializer,
    StaffUserSerializer,
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


class AvatarUploadView(APIView):
    """
    Upload or update profile photo / avatar for currently authenticated user.
    POST /api/auth/profile/avatar/
    Accepts multipart/form-data with key 'avatar' or 'file' or 'photo'.
    """
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [parsers.MultiPartParser, parsers.FormParser, parsers.JSONParser]

    def post(self, request):
        file_obj = request.FILES.get('avatar') or request.FILES.get('file') or request.FILES.get('photo')
        if not file_obj:
            return Response(
                {"detail": "No image file provided. Please select an image file to upload."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # File size check (max 5MB)
        if file_obj.size > 5 * 1024 * 1024:
            return Response(
                {"detail": "Image file size exceeds maximum limit of 5MB."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # File extension check
        valid_extensions = ('.jpg', '.jpeg', '.png', '.webp', '.gif')
        if not file_obj.name.lower().endswith(valid_extensions):
            return Response(
                {"detail": "Invalid file format. Only JPG, JPEG, PNG, WEBP, and GIF images are allowed."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = request.user
        try:
            try:
                user.avatar = file_obj
                user.save(update_fields=['avatar'])
            except Exception as storage_err:
                logger.warning(f"Primary storage upload failed ({storage_err}), attempting FileSystemStorage fallback...")
                fs = FileSystemStorage()
                saved_filename = fs.save(f"avatars/{file_obj.name}", file_obj)
                user.avatar.name = saved_filename
                user.save(update_fields=['avatar'])

            # Keep student profile photo in sync safely without re-opening closed file stream
            if hasattr(user, 'student_profile') and user.student_profile and user.avatar:
                try:
                    user.student_profile.photo.name = user.avatar.name
                    user.student_profile.save(update_fields=['photo'])
                except Exception as sync_err:
                    logger.warning(f"Failed to sync student_profile photo: {sync_err}")

            record_audit_log(
                actor=user,
                action="profile_photo_updated",
                entity_type="User",
                entity_id=str(user.id),
                request=request,
            )

            avatar_url = user.avatar_url
            if avatar_url and request:
                avatar_url = request.build_absolute_uri(avatar_url)

            return Response({
                "detail": "Profile photo updated successfully.",
                "avatar_url": avatar_url,
                "user": MeSerializer(user, context={'request': request}).data,
            }, status=status.HTTP_200_OK)

        except Exception as e:
            logger.error(f"Avatar upload failed for user {user.id}: {e}", exc_info=True)
            return Response(
                {"detail": f"Failed to upload profile photo: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


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


class ChangePasswordView(APIView):
    """
    Change password for currently authenticated user.
    POST /api/auth/change-password/
    Body: {"current_password": "...", "new_password": "..."}
    """

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user
        current_password = request.data.get("current_password")
        new_password = request.data.get("new_password")

        if not current_password or not new_password:
            return Response(
                {"detail": "Both current_password and new_password are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not user.check_password(current_password):
            return Response(
                {"detail": "Incorrect current password."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user.set_password(new_password)
        user.save(update_fields=["password"])

        record_audit_log(
            actor=user,
            action="password_change",
            entity_type="User",
            entity_id=str(user.id),
            request=request,
        )

        return Response({"detail": "Password changed successfully."})



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


class StaffViewSet(viewsets.ModelViewSet):
    """
    Staff Management ViewSet for Managers, IT Admins, Super Admins, and Staff.
    Supports listing, provisioning, role updating, deactivating, and password reset.
    """
    queryset = User.objects.all()
    serializer_class = StaffUserSerializer
    permission_classes = [IsStaffOrAbove]

    def get_queryset(self):
        queryset = User.objects.select_related('staff_profile', 'student_profile').order_by('-date_joined')
        
        # Include all users or filter by staff / student
        include_students = self.request.query_params.get('include_students', 'false').lower() == 'true'
        if not include_students:
            queryset = queryset.filter(role__in=[
                Role.SUPER_ADMIN, Role.MANAGER, Role.FINANCE, 
                Role.STUDENT_OFFICER, Role.IT_ADMIN
            ])
            
        role_filter = self.request.query_params.get('role')
        if role_filter:
            queryset = queryset.filter(role=role_filter)
            
        is_active_param = self.request.query_params.get('is_active')
        if is_active_param is not None:
            is_active_bool = is_active_param.lower() == 'true'
            queryset = queryset.filter(is_active=is_active_bool)

        department = self.request.query_params.get('department')
        if department:
            queryset = queryset.filter(staff_profile__department__icontains=department)
            
        search = self.request.query_params.get('search') or self.request.query_params.get('q')
        if search:
            from django.db import models
            queryset = queryset.filter(
                models.Q(email__icontains=search) |
                models.Q(phone__icontains=search) |
                models.Q(staff_profile__first_name__icontains=search) |
                models.Q(staff_profile__last_name__icontains=search)
            )
            
        return queryset

    @action(detail=False, methods=['post'], permission_classes=[IsManagerOrAbove])
    def provision(self, request):
        serializer = StaffAccountSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        record_audit_log(
            actor=request.user,
            action="staff_account_created",
            entity_type="User",
            entity_id=str(user.id),
            new_value={"email": user.email, "role": user.role},
            request=request,
        )
        
        return Response(StaffUserSerializer(user).data, status=status.HTTP_201_CREATED)

    def partial_update(self, request, *args, **kwargs):
        user = self.get_object()
        role = request.data.get('role')
        is_active = request.data.get('is_active')
        phone = request.data.get('phone')
        first_name = request.data.get('first_name')
        last_name = request.data.get('last_name')
        department = request.data.get('department')
        
        if role and role in Role.values:
            user.role = role
        if is_active is not None:
            user.is_active = bool(is_active)
        if phone is not None:
            user.phone = phone
        user.save()
        
        if hasattr(user, 'staff_profile') and user.staff_profile:
            sp = user.staff_profile
            if first_name is not None: sp.first_name = first_name
            if last_name is not None: sp.last_name = last_name
            if department is not None: sp.department = department
            sp.save()
        elif user.is_staff_role:
            StaffProfile.objects.create(
                user=user,
                first_name=first_name or user.email.split('@')[0],
                last_name=last_name or '',
                department=department or ''
            )

        record_audit_log(
            actor=request.user,
            action="staff_account_updated",
            entity_type="User",
            entity_id=str(user.id),
            new_value={"email": user.email, "role": user.role, "is_active": user.is_active},
            request=request,
        )
        
        return Response(StaffUserSerializer(user).data)

    @action(detail=True, methods=['post'], permission_classes=[IsManagerOrAbove])
    def deactivate(self, request, pk=None):
        user = self.get_object()
        user.is_active = False
        user.save(update_fields=['is_active'])
        
        record_audit_log(
            actor=request.user,
            action="staff_account_deactivated",
            entity_type="User",
            entity_id=str(user.id),
            request=request,
        )
        return Response({"success": True, "message": f"Account for {user.email} deactivated."})

    @action(detail=True, methods=['post'], permission_classes=[IsManagerOrAbove])
    def reactivate(self, request, pk=None):
        user = self.get_object()
        user.is_active = True
        user.save(update_fields=['is_active'])
        
        record_audit_log(
            actor=request.user,
            action="staff_account_reactivated",
            entity_type="User",
            entity_id=str(user.id),
            request=request,
        )
        return Response({"success": True, "message": f"Account for {user.email} reactivated."})

    @action(detail=True, methods=['post'], permission_classes=[IsManagerOrAbove])
    def reset_password(self, request, pk=None):
        user = self.get_object()
        new_password = request.data.get('new_password') or "IcanStaff@2026!"
        user.set_password(new_password)
        user.save(update_fields=['password'])
        
        record_audit_log(
            actor=request.user,
            action="staff_password_reset_by_admin",
            entity_type="User",
            entity_id=str(user.id),
            request=request,
        )
        return Response({"success": True, "temporary_password": new_password})

    @action(detail=True, methods=['post'], permission_classes=[IsManagerOrAbove], parser_classes=[parsers.MultiPartParser, parsers.FormParser, parsers.JSONParser])
    def avatar(self, request, pk=None):
        user = self.get_object()
        file_obj = request.FILES.get('avatar') or request.FILES.get('file') or request.FILES.get('photo')
        if not file_obj:
            return Response(
                {"detail": "No image file provided."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if file_obj.size > 5 * 1024 * 1024:
            return Response(
                {"detail": "Image file size exceeds maximum limit of 5MB."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        valid_extensions = ('.jpg', '.jpeg', '.png', '.webp', '.gif')
        if not file_obj.name.lower().endswith(valid_extensions):
            return Response(
                {"detail": "Invalid file format. Only JPG, JPEG, PNG, WEBP, and GIF images are allowed."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            try:
                user.avatar = file_obj
                user.save(update_fields=['avatar'])
            except Exception as storage_err:
                logger.warning(f"Primary storage upload failed ({storage_err}), attempting FileSystemStorage fallback...")
                fs = FileSystemStorage()
                saved_filename = fs.save(f"avatars/{file_obj.name}", file_obj)
                user.avatar.name = saved_filename
                user.save(update_fields=['avatar'])

            if hasattr(user, 'student_profile') and user.student_profile and user.avatar:
                try:
                    user.student_profile.photo.name = user.avatar.name
                    user.student_profile.save(update_fields=['photo'])
                except Exception as sync_err:
                    logger.warning(f"Failed to sync student_profile photo: {sync_err}")

            record_audit_log(
                actor=request.user,
                action="staff_avatar_updated_by_admin",
                entity_type="User",
                entity_id=str(user.id),
                request=request,
            )

            return Response(StaffUserSerializer(user, context={'request': request}).data)

        except Exception as e:
            logger.error(f"Staff avatar upload failed for user {user.id}: {e}", exc_info=True)
            return Response(
                {"detail": f"Failed to upload profile photo: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
