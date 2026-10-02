from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from users.permissions import IsStaffOrAbove, IsSelfOrStaff, IsStudentOfficerOrAbove

from .models import StudentProfile
from .serializers import StudentProfileListSerializer, StudentProfileSerializer


class StudentProfileViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing student profiles.
    
    Staff can view/edit all students.
    Students can only view their own profile.
    """

    queryset = StudentProfile.objects.select_related("user").prefetch_related("enrollments__level").all()
    permission_classes = [IsStaffOrAbove]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["is_active", "gender"]
    search_fields = ["student_code", "first_name", "last_name", "user__email", "ican_exam_id"]
    ordering_fields = ["created_at", "first_name", "last_name"]
    ordering = ["-created_at"]

    def get_serializer_class(self):
        if self.action == "list":
            return StudentProfileListSerializer
        return StudentProfileSerializer

    def get_permissions(self):
        if self.action == "me":
            return [IsAuthenticated()]
        if self.action in ["retrieve", "update", "partial_update"]:
            return [IsSelfOrStaff()]
        if self.action in ["list", "create", "destroy"]:
            return [IsStudentOfficerOrAbove()]
        return super().get_permissions()

    def get_queryset(self):
        user = self.request.user
        queryset = super().get_queryset()
        if self.action in ["retrieve", "update", "partial_update", "destroy"]:
            return queryset
        if user.is_staff_role:
            return queryset
        if hasattr(user, "student_profile"):
            return queryset.filter(user=user)
        return queryset.none()

    def perform_destroy(self, instance):
        """
        Delete student profile and associated user auth account cleanly.
        Protected by models.PROTECT if student has active enrollments/invoices.
        """
        user = instance.user
        instance.delete()
        if user:
            user.delete()

    def perform_update(self, serializer):
        """
        Log when a student profile is edited (typically by staff)
        """
        updated_profile = serializer.save()
        from audit.utils import record_audit_log
        record_audit_log(
            actor=self.request.user,
            action="student_profile_updated_by_admin",
            entity_type="StudentProfile",
            entity_id=str(updated_profile.id),
            request=self.request,
        )

    @action(detail=False, methods=["get", "patch", "put"], permission_classes=[IsAuthenticated])
    def me(self, request):
        """
        Allow a student to retrieve or update their own profile.
        Endpoint: GET/PATCH/PUT /api/students/me/
        Permission: Any authenticated user
        """
        from users.models import Role
        try:
            profile = StudentProfile.objects.get(user=request.user)
        except StudentProfile.DoesNotExist:
            if request.user.role == Role.STUDENT:
                names = (request.user.full_name or "").split()
                first_name = names[0] if names else "Student"
                last_name = " ".join(names[1:]) if len(names) > 1 else ""
                profile = StudentProfile.objects.create(
                    user=request.user,
                    first_name=first_name,
                    last_name=last_name,
                )
            else:
                return Response(
                    {"detail": "Student profile not found", "code": "PROFILE_NOT_FOUND"},
                    status=404,
                )

        if request.method in ["PATCH", "PUT"]:
            serializer = self.get_serializer(profile, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            updated_profile = serializer.save()
            
            from audit.utils import record_audit_log
            record_audit_log(
                actor=request.user,
                action="student_profile_updated",
                entity_type="StudentProfile",
                entity_id=str(updated_profile.id),
                request=request,
            )
            
            return Response(serializer.data)

        serializer = self.get_serializer(profile)
        return Response(serializer.data)
