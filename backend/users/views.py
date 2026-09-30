import logging
import secrets
import string

from django.conf import settings as _settings
from django.core.exceptions import ValidationError
from django.core.files.storage import FileSystemStorage
from django.contrib.auth.tokens import default_token_generator
from django.utils.decorators import method_decorator
from django.utils.encoding import force_bytes, force_str
from django.http import JsonResponse
from django.middleware.csrf import get_token as _get_csrf_token
from django.views.decorators.csrf import ensure_csrf_cookie
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from rest_framework import generics, parsers, permissions, status, viewsets
from rest_framework.serializers import ValidationError as DRFValidationError
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from audit.utils import record_audit_log
from config.file_validators import validate_image_upload
from .jwt_cookies import clear_auth_cookies, refresh_token_from_request, set_auth_cookies
from .rate_limiting import (
    api_rate_limit,
    login_rate_limit,
    payment_rate_limit,
    registration_rate_limit,
    strict_rate_limit,
)

logger = logging.getLogger(__name__)


def generate_secure_temporary_password(length: int = 20) -> str:
    alphabet = string.ascii_letters + string.digits + "!@#$%^&*-_=+?"
    while True:
        candidate = ''.join(secrets.choice(alphabet) for _ in range(length))
        has_upper = any(c.isupper() for c in candidate)
        has_lower = any(c.islower() for c in candidate)
        has_digit = any(c.isdigit() for c in candidate)
        has_symbol = any(c in "!@#$%^&*-_=+?" for c in candidate)
        if has_upper and has_lower and has_digit and has_symbol:
            return candidate

from .models import User, Role, RoleModel, Permission, StaffProfile
from .permissions import IsITAdminOrAbove, IsManagerOrAbove, IsStaffOrAbove, HasPermission
from .serializers import (
    CustomTokenObtainPairSerializer,
    MeSerializer,
    PermissionSerializer,
    RoleSerializer,
    StaffAccountSerializer,
    StaffUserSerializer,
    StudentRegistrationSerializer,
)


@method_decorator(login_rate_limit, name="post")
class LoginView(TokenObtainPairView):
    """
    JWT-based login.

    Sets access + refresh JWT as HttpOnly cookies so they are never exposed to
    JavaScript on the page. Tokens are also returned in the JSON body for
    consumers that cannot attach cookies (mobile / third-party scripts) but
    the browser-based frontend should never persist them.

    POST /api/auth/login/
    Body: ``{"email": "...", "password": "..."}``
    """

    serializer_class = CustomTokenObtainPairSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        try:
            serializer.is_valid(raise_exception=True)
        except Exception as exc:
            raw_email = request.data.get("email") if isinstance(request.data, dict) else ""
            record_audit_log(
                actor=None,
                action="failed_login",
                entity_type="User",
                entity_id="",
                new_value={"email": str(raw_email or "")},
                request=request,
            )
            raise exc

        try:
            user = serializer.user
            record_audit_log(
                actor=user,
                action="login",
                entity_type="User",
                entity_id=str(user.pk),
                request=request,
            )

            access = str(serializer.validated_data["access"])
            refresh = str(serializer.validated_data["refresh"])
            body = {
                "access": access,
                "role": serializer.validated_data.get("role") or user.role,
                "email": serializer.validated_data.get("email") or user.email,
                "is_verified": bool(serializer.validated_data.get("is_verified", getattr(user, "is_verified", False))),
            }
            response = Response(body, status=status.HTTP_200_OK)
            return set_auth_cookies(response, access=access, refresh=refresh)
        except Exception as exc:
            logger.exception("Unexpected error completing login for user %s: %s", getattr(serializer, 'user', 'unknown'), exc)
            raise exc


class CSRFTokenView(APIView):
    """
    CSRF-token bootstrapping endpoint for the SPA.

    The browser-based frontend must call this endpoint *once* before its first
    state-changing request (POST/PUT/PATCH/DELETE). Django sets the ``csrftoken``
    cookie and returns the token value so the Axios client can attach it to
    outgoing requests via the ``X-CSRFToken`` header.
    """

    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    @method_decorator(ensure_csrf_cookie)
    def get(self, request):
        return Response({
            "csrf_token": _get_csrf_token(request),
            "cookie_name": "csrftoken",
            "header_name": "X-CSRFToken",
        })


@method_decorator(registration_rate_limit, name="post")
class RegisterStudentView(generics.CreateAPIView):
    """
    Public self-registration. Always creates a Student account.

    Sets access + refresh as HttpOnly cookies on success. See
    :class:`LoginView` for details on the cookie-only authentication strategy.

    POST /api/auth/register/
    """

    queryset = User.objects.all()
    serializer_class = StudentRegistrationSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        refresh = RefreshToken.for_user(user)
        access = str(refresh.access_token)
        refresh_str = str(refresh)

        headers = self.get_success_headers(serializer.data)
        body = {
            "access": access,
            "role": user.role,
            "email": user.email,
            "is_verified": user.is_verified,
            "user": {
                "id": str(user.id),
                "email": user.email,
                "role": user.role,
                "first_name": getattr(getattr(user, 'student_profile', None), 'first_name', ''),
                "last_name": getattr(getattr(user, 'student_profile', None), 'last_name', ''),
            },
            "message": "Student registered successfully",
        }
        response = Response(body, status=status.HTTP_201_CREATED, headers=headers)
        return set_auth_cookies(response, access=access, refresh=refresh_str)


class CookieTokenRefreshView(TokenRefreshView):
    """
    Token refresh that reads the refresh token from the HttpOnly refresh
    cookie *before* checking the JSON body. The frontend refresh interceptor
    can therefore POST with an empty body and no longer needs to hold the
    refresh token anywhere JS-visible.

    As with login, the newly-minted access + refresh tokens are written back
    as HttpOnly cookies.
    """

    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def post(self, request, *args, **kwargs):
        raw_refresh = refresh_token_from_request(request)
        if not raw_refresh:
            return Response(
                {"detail": "Refresh token is required.", "code": "AUTH_REFRESH_MISSING"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = self.get_serializer(data={"refresh": raw_refresh})
        try:
            serializer.is_valid(raise_exception=True)
        except TokenError as exc:
            # Any refresh failure → force a fresh login: clear cookies
            response = Response(
                {"detail": "Session expired. Please re-authenticate.", "code": "AUTH_REFRESH_INVALID"},
                status=status.HTTP_401_UNAUTHORIZED,
            )
            return clear_auth_cookies(response)
        except InvalidToken as exc:
            response = Response(
                {"detail": "Invalid refresh token.", "code": "AUTH_REFRESH_INVALID"},
                status=status.HTTP_401_UNAUTHORIZED,
            )
            return clear_auth_cookies(response)

        new_access = str(serializer.validated_data["access"])
        # simplejwt ROTATE_REFRESH_TOKENS emits a new refresh too.
        new_refresh = serializer.validated_data.get("refresh")

        body = {"access": new_access}
        if new_refresh:
            body["refresh"] = new_refresh
        response = Response(body, status=status.HTTP_200_OK)
        if new_refresh:
            return set_auth_cookies(response, access=new_access, refresh=str(new_refresh))
        return set_auth_cookies(response, access=new_access)


@method_decorator(api_rate_limit, name="post")
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


class MeView(generics.RetrieveUpdateAPIView):
    """
    Get or update current user info with profile.
    GET/PUT/PATCH /api/auth/me/
    """

    serializer_class = MeSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


@method_decorator(api_rate_limit, name="post")
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

        # H6: Validate size, extension, and magic-byte content type
        try:
            validate_image_upload(file_obj)
        except ValidationError as ve:
            return Response(
                {"detail": ve.message if hasattr(ve, 'message') else str(ve)},
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


@method_decorator(strict_rate_limit, name="post")
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


@method_decorator(strict_rate_limit, name="post")
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


@method_decorator(api_rate_limit, name="post")
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
    Logout: blacklist the refresh token and clear HttpOnly auth cookies.

    Accepts an optional ``{"refresh": "..."}`` body for clients that hold the
    refresh token themselves (mobile / third-party). The browser-based SPA no
    longer needs to include it — the refresh cookie is auto-included, we read
    it via :func:`refresh_token_from_request` and always wipe all cookies on
    the response.
    """

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        refresh_token = (
            request.data.get("refresh") or refresh_token_from_request(request)
        )

        if refresh_token:
            try:
                token = RefreshToken(refresh_token)
                token.blacklist()
            except Exception as e:
                err_str = str(e).lower()
                if not ("blacklisted" in err_str or "expired" in err_str or "invalid" in err_str):
                    logger.warning(
                        "Unexpected error blacklisting refresh token for user=%s: %s",
                        getattr(request.user, "id", None),
                        str(e),
                    )

        record_audit_log(
            actor=request.user,
            action="logout",
            entity_type="User",
            entity_id=str(request.user.id),
            request=request,
        )

        response = Response(
            {"detail": "Successfully logged out."},
            status=status.HTTP_200_OK,
        )
        return clear_auth_cookies(response)


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
            queryset = queryset.exclude(role=Role.STUDENT)
            
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

    @method_decorator(api_rate_limit)
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

    @method_decorator(api_rate_limit)
    def partial_update(self, request, *args, **kwargs):
        user = self.get_object()
        role = request.data.get('role')
        is_active = request.data.get('is_active')
        phone = request.data.get('phone')
        first_name = request.data.get('first_name')
        last_name = request.data.get('last_name')
        department = request.data.get('department')
        
        if role:
            # 1. Update the dynamic ManyToMany RoleModel association
            role_obj = RoleModel.objects.filter(code=role).first()
            if role_obj:
                user.roles.clear()
                user.roles.add(role_obj)
            
            # 2. Update the legacy role field for frontend compatibility
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

    @method_decorator(api_rate_limit)
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

    @method_decorator(api_rate_limit)
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

    @method_decorator(api_rate_limit)
    @action(detail=True, methods=['post'], permission_classes=[IsManagerOrAbove])
    def reset_password(self, request, pk=None):
        user = self.get_object()
        provided_password = request.data.get('new_password')
        if provided_password:
            temp_password = provided_password
            source_note = "provided_in_request"
        else:
            temp_password = generate_secure_temporary_password()
            source_note = "auto_generated"

        user.set_password(temp_password)
        user.must_change_password = True
        user.save(update_fields=['password', 'must_change_password'])

        password_delivery_ok = False
        try:
            from utils.email import send_temporary_password_email
            send_temporary_password_email(user=user, temporary_password=temp_password)
            password_delivery_ok = True
        except Exception as exc:
            logger.exception(
                "Failed to email temporary password to user_id=%s email=%s error=%s",
                user.id,
                user.email,
                str(exc),
            )

        record_audit_log(
            actor=request.user,
            action="staff_password_reset_by_admin",
            entity_type="User",
            entity_id=str(user.id),
            new_value={
                "source": source_note,
                "must_change_password_on_next_login": True,
                "email_sent": password_delivery_ok,
            },
            request=request,
        )

        response_payload = {
            "success": True,
            "must_change_password_on_next_login": True,
            "email_sent": password_delivery_ok,
        }
        if not password_delivery_ok:
            response_payload["detail"] = (
                "Password was reset but the notification email could not be delivered. "
                "Please share the temporary credentials out-of-band and advise the user "
                "to reset their password immediately."
            )
        return Response(response_payload, status=status.HTTP_200_OK)

    @method_decorator(api_rate_limit)
    @action(detail=True, methods=['post'], permission_classes=[IsManagerOrAbove], parser_classes=[parsers.MultiPartParser, parsers.FormParser, parsers.JSONParser])
    def avatar(self, request, pk=None):
        user = self.get_object()
        file_obj = request.FILES.get('avatar') or request.FILES.get('file') or request.FILES.get('photo')
        if not file_obj:
            return Response(
                {"detail": "No image file provided."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # H6: Validate size, extension, and magic-byte content type
        try:
            validate_image_upload(file_obj)
        except ValidationError as ve:
            return Response(
                {"detail": ve.message if hasattr(ve, 'message') else str(ve)},
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


class PermissionViewSet(viewsets.ReadOnlyModelViewSet):
    """
    List and retrieve system permissions.
    GET /api/permissions/
    """
    queryset = Permission.objects.all().order_by("module", "codename")
    serializer_class = PermissionSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = None

    def list(self, request, *args, **kwargs):
        group_by_module = request.query_params.get("group_by_module", "false").lower() == "true"
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        data = serializer.data

        if group_by_module:
            grouped = {}
            for item in data:
                mod = item["module"]
                grouped.setdefault(mod, []).append(item)
            return Response(grouped)

        return Response(data)


class RoleViewSet(viewsets.ModelViewSet):
    """
    Manage dynamic roles and permissions matrix.
    GET/POST/PUT/PATCH/DELETE /api/roles/
    """
    queryset = RoleModel.objects.prefetch_related("permissions", "users").all()
    serializer_class = RoleSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = None

    def get_permissions(self):
        if self.action in ["list", "retrieve"]:
            return [permissions.IsAuthenticated()]
        return [IsManagerOrAbove()]

    def perform_create(self, serializer):
        actor = self.request.user
        perms = self.request.data.get("permissions", [])
        
        # Self-escalation safeguard: non-super_admin cannot grant permissions they lack
        is_super = actor.is_superuser or actor.role == Role.SUPER_ADMIN
        if not is_super:
            try:
                is_super = actor.roles.filter(code=Role.SUPER_ADMIN).exists()
            except Exception:
                pass
        if not is_super:
            actor_perms = actor.get_all_permissions()
            unauthorized = [p for p in perms if p not in actor_perms]
            if unauthorized:
                raise DRFValidationError({
                    "permissions": f"You cannot grant permissions you do not possess: {', '.join(unauthorized)}"
                })

        code = self.request.data.get("code") or self.request.data.get("name", "").lower().replace(" ", "_")
        role = serializer.save(code=code, is_system=False, is_protected=False)

        record_audit_log(
            actor=actor,
            action="role_created",
            entity_type="RoleModel",
            entity_id=str(role.id),
            new_value={"name": role.name, "code": role.code, "permissions": list(role.permissions.values_list("codename", flat=True))},
            request=self.request,
        )

    def perform_update(self, serializer):
        role = self.get_object()
        actor = self.request.user

        is_super = actor.is_superuser or actor.role == Role.SUPER_ADMIN
        if not is_super:
            try:
                is_super = actor.roles.filter(code=Role.SUPER_ADMIN).exists()
            except Exception:
                pass

        if role.is_protected and not is_super:
            raise DRFValidationError("Protected system roles (e.g., Super Admin) can only be modified by Super Admins.")

        perms = self.request.data.get("permissions", None)
        if perms is not None and not is_super:
            # Only check newly-added permissions the actor doesn't already have
            existing_perms = set(role.permissions.values_list("codename", flat=True))
            newly_added = [p for p in perms if p not in existing_perms]
            if newly_added:
                actor_perms = actor.get_all_permissions()
                unauthorized = [p for p in newly_added if p not in actor_perms]
                if unauthorized:
                    raise DRFValidationError({
                        "permissions": f"You cannot grant permissions you do not possess: {', '.join(unauthorized)}"
                    })

        old_perms = list(role.permissions.values_list("codename", flat=True))
        updated_role = serializer.save()
        new_perms = list(updated_role.permissions.values_list("codename", flat=True))

        record_audit_log(
            actor=actor,
            action="role_updated",
            entity_type="RoleModel",
            entity_id=str(updated_role.id),
            old_value={"name": role.name, "permissions": old_perms},
            new_value={"name": updated_role.name, "permissions": new_perms},
            request=self.request,
        )

    def destroy(self, request, *args, **kwargs):
        role = self.get_object()
        if role.is_system or role.is_protected:
            return Response(
                {"detail": f"System role '{role.name}' is protected and cannot be deleted."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if role.users.exists():
            return Response(
                {"detail": f"Cannot delete role '{role.name}' because {role.users.count()} users are assigned to it."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        actor = request.user
        role_id = str(role.id)
        role_name = role.name
        role.delete()

        record_audit_log(
            actor=actor,
            action="role_deleted",
            entity_type="RoleModel",
            entity_id=role_id,
            old_value={"name": role_name},
            request=request,
        )

        return Response({"detail": f"Role '{role_name}' deleted successfully."}, status=status.HTTP_200_OK)
