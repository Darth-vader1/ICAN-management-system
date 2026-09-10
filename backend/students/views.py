from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from users.permissions import IsStaffOrAbove

from .models import StudentProfile
from .serializers import StudentProfileListSerializer, StudentProfileSerializer


class StudentProfileViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing student profiles.
    
    Staff can view/edit all students.
    Students can only view their own profile.
    """

    queryset = StudentProfile.objects.select_related("user").all()
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

    @action(detail=False, methods=["get"], permission_classes=[])
    def me(self, request):
        """
        Allow a student to retrieve their own profile.
        Endpoint: GET /api/students/me/
        Permission: Any authenticated user (students can view their own profile)
        """
        try:
            profile = StudentProfile.objects.get(user=request.user)
            serializer = self.get_serializer(profile)
            return Response(serializer.data)
        except StudentProfile.DoesNotExist:
            return Response(
                {"detail": "Student profile not found", "code": "PROFILE_NOT_FOUND"},
                status=404,
            )
