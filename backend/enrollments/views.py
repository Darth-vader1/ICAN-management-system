from django.db import transaction
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from audit.utils import record_audit_log
from users.permissions import IsStaffOrAbove, IsSelfOrStaff, IsStudentOfficerOrAbove

from .models import Enrollment, EnrollmentCourse, EnrollmentStatus
from .serializers import (
    AddCourseSerializer,
    EnrollmentCreateSerializer,
    EnrollmentCourseSerializer,
    EnrollmentListSerializer,
    EnrollmentSerializer,
)


class EnrollmentViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing student enrollments.
    
    Students can:
    - View their own enrollments
    - Create new enrollments (self-enrollment)
    
    Staff can:
    - View all enrollments
    - Update enrollment status
    - Manage enrollments for students
    """

    queryset = Enrollment.objects.select_related(
        'student',
        'student__user',
        'session',
        'level'
    ).prefetch_related('enrollment_courses__course_offering__course').all()
    permission_classes = [IsStudentOfficerOrAbove]

    def get_permissions(self):
        """
        Allow students to access my_enrollments action and self-creation.
        """
        if self.action in ['my_enrollments', 'create_enrollment']:
            return [IsAuthenticated()]
        if self.action == 'retrieve':
            return [IsSelfOrStaff()]
        return [IsStudentOfficerOrAbove()]

    def get_serializer_class(self):
        if self.action == 'list':
            return EnrollmentListSerializer
        elif self.action == 'create_enrollment':
            return EnrollmentCreateSerializer
        return EnrollmentSerializer

    def get_queryset(self):
        """Filter queryset based on user role."""
        user = self.request.user
        queryset = super().get_queryset()

        # Students can only see their own enrollments
        if user.role == 'student':
            try:
                student_profile = user.student_profile
                queryset = queryset.filter(student=student_profile)
            except:
                queryset = queryset.none()

        # Apply filters from query params
        session_id = self.request.query_params.get('session')
        level_id = self.request.query_params.get('level')
        status_filter = self.request.query_params.get('status')

        if session_id:
            queryset = queryset.filter(session_id=session_id)
        if level_id:
            queryset = queryset.filter(level_id=level_id)
        if status_filter:
            queryset = queryset.filter(status=status_filter)

        return queryset

    @action(detail=False, methods=['get'], url_path='my_enrollments')
    def my_enrollments(self, request):
        """Get current user's enrollments (for students)."""
        if not hasattr(request.user, 'student_profile'):
            return Response([])

        student_profile = request.user.student_profile
        enrollments = self.get_queryset().filter(student=student_profile)
        serializer = self.get_serializer(enrollments, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated])
    def create_enrollment(self, request):
        """
        Create a new enrollment for a student.
        
        For students: Creates enrollment for themselves
        For staff: Can create enrollment for any student
        """
        serializer = EnrollmentCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Determine student
        if request.user.role == 'student':
            try:
                student_profile = request.user.student_profile
            except:
                return Response(
                    {'detail': 'Student profile not found'},
                    status=status.HTTP_404_NOT_FOUND
                )
        else:
            # Staff can specify student_id
            student_id = request.data.get('student_id')
            if not student_id:
                return Response(
                    {'detail': 'student_id is required for staff'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            from students.models import StudentProfile
            try:
                student_profile = StudentProfile.objects.get(id=student_id)
            except StudentProfile.DoesNotExist:
                return Response(
                    {'detail': 'Student not found'},
                    status=status.HTTP_404_NOT_FOUND
                )

        validated_data = serializer.validated_data

        # Check for duplicate active enrollment
        existing = Enrollment.objects.filter(
            student=student_profile,
            session=validated_data['session_obj'],
            level=validated_data['level_obj'],
            status=EnrollmentStatus.ACTIVE
        )

        if existing.exists():
            return Response(
                {
                    'detail': (
                        f"Student already has an active enrollment for "
                        f"{validated_data['level_obj'].name} in "
                        f"{validated_data['session_obj'].label}"
                    ),
                    'code': 'ENROLLMENT_DUPLICATE'
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # Create enrollment with courses
        with transaction.atomic():
            enrollment = Enrollment.objects.create(
                student=student_profile,
                session=validated_data['session_obj'],
                level=validated_data['level_obj'],
                status=EnrollmentStatus.DRAFT
            )

            # Add courses
            for offering in validated_data['offerings_obj']:
                EnrollmentCourse.objects.create(
                    enrollment=enrollment,
                    course_offering=offering
                )

            # Auto-activate if student is self-enrolling
            if request.user.role == 'student':
                enrollment.activate()

            # Auto-generate tuition invoice for enrollment
            try:
                from billing.services.invoice_service import InvoiceService
                InvoiceService.create_invoice_for_enrollment(enrollment)
            except Exception as e:
                import logging
                logging.getLogger(__name__).error(f"Failed to generate invoice for enrollment {enrollment.id}: {e}")

            # Audit log
            record_audit_log(
                actor=request.user,
                action='enrollment_created',
                entity_type='Enrollment',
                entity_id=str(enrollment.id),
                new_value={
                    'student': student_profile.student_code,
                    'session': validated_data['session_obj'].label,
                    'level': validated_data['level_obj'].name,
                    'courses': [str(o.id) for o in validated_data['offerings_obj']]
                },
                request=request
            )

        serializer = EnrollmentSerializer(enrollment)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'], permission_classes=[IsStaffOrAbove])
    def activate(self, request, pk=None):
        """Activate an enrollment (staff only)."""
        enrollment = self.get_object()

        if enrollment.status != EnrollmentStatus.DRAFT:
            return Response(
                {'detail': f'Cannot activate enrollment with status: {enrollment.status}'},
                status=status.HTTP_400_BAD_REQUEST
            )

        enrollment.activate()

        record_audit_log(
            actor=request.user,
            action='enrollment_activated',
            entity_type='Enrollment',
            entity_id=str(enrollment.id),
            request=request
        )

        serializer = self.get_serializer(enrollment)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], permission_classes=[IsStaffOrAbove])
    def complete(self, request, pk=None):
        """Mark enrollment as completed (staff only)."""
        enrollment = self.get_object()

        if enrollment.status != EnrollmentStatus.ACTIVE:
            return Response(
                {'detail': f'Cannot complete enrollment with status: {enrollment.status}'},
                status=status.HTTP_400_BAD_REQUEST
            )

        enrollment.complete()

        record_audit_log(
            actor=request.user,
            action='enrollment_completed',
            entity_type='Enrollment',
            entity_id=str(enrollment.id),
            request=request
        )

        serializer = self.get_serializer(enrollment)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], permission_classes=[IsStaffOrAbove])
    def withdraw(self, request, pk=None):
        """Withdraw a student from enrollment."""
        enrollment = self.get_object()

        if enrollment.status not in [EnrollmentStatus.DRAFT, EnrollmentStatus.ACTIVE]:
            return Response(
                {'detail': f'Cannot withdraw enrollment with status: {enrollment.status}'},
                status=status.HTTP_400_BAD_REQUEST
            )

        enrollment.withdraw()

        record_audit_log(
            actor=request.user,
            action='enrollment_withdrawn',
            entity_type='Enrollment',
            entity_id=str(enrollment.id),
            request=request
        )

        serializer = self.get_serializer(enrollment)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], permission_classes=[IsStaffOrAbove])
    def add_course(self, request, pk=None):
        """Add a course to existing enrollment."""
        enrollment = self.get_object()

        if enrollment.status not in [EnrollmentStatus.DRAFT, EnrollmentStatus.ACTIVE]:
            return Response(
                {'detail': 'Can only add courses to draft or active enrollments'},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = AddCourseSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        course_offering = serializer.validated_data['course_offering']

        # Validate offering matches enrollment
        if course_offering.session != enrollment.session:
            return Response(
                {'detail': 'Course offering session does not match enrollment session'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if course_offering.course.level != enrollment.level:
            return Response(
                {'detail': 'Course level does not match enrollment level'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check if already enrolled
        if EnrollmentCourse.objects.filter(
            enrollment=enrollment,
            course_offering=course_offering
        ).exists():
            return Response(
                {'detail': 'Student is already enrolled in this course'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Add course
        enrollment_course = EnrollmentCourse.objects.create(
            enrollment=enrollment,
            course_offering=course_offering
        )

        record_audit_log(
            actor=request.user,
            action='enrollment_course_added',
            entity_type='EnrollmentCourse',
            entity_id=str(enrollment_course.id),
            new_value={'course': course_offering.course.code},
            request=request
        )

        course_serializer = EnrollmentCourseSerializer(enrollment_course)
        return Response(course_serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'], permission_classes=[IsStaffOrAbove])
    def drop_course(self, request, pk=None):
        """Drop a course from enrollment."""
        enrollment = self.get_object()
        course_id = request.data.get('enrollment_course_id')

        if not course_id:
            return Response(
                {'detail': 'enrollment_course_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            enrollment_course = EnrollmentCourse.objects.get(
                id=course_id,
                enrollment=enrollment
            )
        except EnrollmentCourse.DoesNotExist:
            return Response(
                {'detail': 'Enrollment course not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        if enrollment_course.dropped:
            return Response(
                {'detail': 'Course already dropped'},
                status=status.HTTP_400_BAD_REQUEST
            )

        enrollment_course.drop()

        record_audit_log(
            actor=request.user,
            action='enrollment_course_dropped',
            entity_type='EnrollmentCourse',
            entity_id=str(enrollment_course.id),
            request=request
        )

        course_serializer = EnrollmentCourseSerializer(enrollment_course)
        return Response(course_serializer.data)
