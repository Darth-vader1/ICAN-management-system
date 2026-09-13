from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from rest_framework.permissions import IsAuthenticated

from users.permissions import IsManagerOrAbove, IsStaffOrAbove

from .models import AcademicSession, Class, ClassSchedule, Course, CourseOffering, Level, ScheduleTemplate
from .serializers import (
    AcademicSessionSerializer,
    ClassScheduleListSerializer,
    ClassScheduleSerializer,
    ClassSerializer,
    CourseListSerializer,
    CourseOfferingListSerializer,
    CourseOfferingSerializer,
    CourseSerializer,
    LevelSerializer,
    ScheduleTemplateSerializer,
)


class LevelViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing ICAN levels.
    
    Managers can create/edit levels.
    Any authenticated user (including students) can view levels.
    """

    queryset = Level.objects.all()
    serializer_class = LevelSerializer
    permission_classes = [IsManagerOrAbove]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['is_active', 'code']
    search_fields = ['name', 'code']
    ordering_fields = ['order', 'name', 'created_at']
    ordering = ['order']

    def get_permissions(self):
        """Allow any authenticated user to view, but only managers can modify."""
        if self.action in ['list', 'retrieve']:
            return [IsAuthenticated()]
        return super().get_permissions()


class AcademicSessionViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing academic sessions.
    
    Managers can create/edit sessions.
    Any authenticated user (including students) can view sessions.
    """

    queryset = AcademicSession.objects.all()
    serializer_class = AcademicSessionSerializer
    permission_classes = [IsManagerOrAbove]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['is_active']
    search_fields = ['label']
    ordering_fields = ['start_date', 'created_at']
    ordering = ['-start_date']

    def get_permissions(self):
        """Allow any authenticated user to view, but only managers can modify."""
        if self.action in ['list', 'retrieve']:
            return [IsAuthenticated()]
        return super().get_permissions()

    @action(detail=False, methods=['get'])
    def active(self, request):
        """Get the currently active session."""
        active_session = AcademicSession.objects.filter(is_active=True).first()
        if active_session:
            serializer = self.get_serializer(active_session)
            return Response(serializer.data)
        return Response({'detail': 'No active session found'}, status=404)


class CourseViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing courses.
    
    Managers can create/edit courses.
    Any authenticated user (including students) can view courses.
    """

    queryset = Course.objects.select_related('level').all()
    permission_classes = [IsManagerOrAbove]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['level', 'is_active']
    search_fields = ['name', 'code', 'description']
    ordering_fields = ['name', 'code', 'created_at']
    ordering = ['level__order', 'name']

    def get_serializer_class(self):
        if self.action == 'list':
            return CourseListSerializer
        return CourseSerializer

    def get_permissions(self):
        """Allow any authenticated user to view, but only managers can modify."""
        if self.action in ['list', 'retrieve', 'summary']:
            return [IsAuthenticated()]
        return super().get_permissions()

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def summary(self, request):
        """
        Get academic summary stats for Courses & Levels dashboard.
        """
        active_session = AcademicSession.objects.filter(is_active=True).first()
        session_label = active_session.label if active_session else "N/A"

        total_courses = Course.objects.count()
        inactive_courses = Course.objects.filter(is_active=False).count()

        from enrollments.models import Enrollment
        active_enrollments = Enrollment.objects.filter(status='active').count()

        return Response({
            'active_session': session_label,
            'session_status': 'Enrollment open' if active_session else 'No active session',
            'total_courses': total_courses,
            'inactive_courses': inactive_courses,
            'active_enrollments': active_enrollments,
        })


class CourseOfferingViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing course offerings.
    
    Managers can create/edit offerings.
    Any authenticated user (including students) can view offerings.
    """

    queryset = CourseOffering.objects.select_related(
        'course',
        'course__level',
        'session',
        'tutor',
        'tutor__user'
    ).all()
    permission_classes = [IsManagerOrAbove]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['session', 'course', 'course__level', 'is_active']
    search_fields = ['course__name', 'course__code', 'session__label']
    ordering_fields = ['created_at']
    ordering = ['-session__start_date', 'course__name']

    def get_serializer_class(self):
        if self.action == 'list':
            return CourseOfferingListSerializer
        return CourseOfferingSerializer

    def get_permissions(self):
        """Allow any authenticated user to view, but only managers can modify."""
        if self.action in ['list', 'retrieve']:
            return [IsAuthenticated()]
        return super().get_permissions()

    def list(self, request, *args, **kwargs):
        session_id = request.query_params.get('session')
        if session_id:
            target_sessions = AcademicSession.objects.filter(id=session_id)
        else:
            target_sessions = AcademicSession.objects.filter(is_active=True)

        active_courses = Course.objects.filter(is_active=True)
        for s in target_sessions:
            existing_course_ids = set(
                CourseOffering.objects.filter(session=s).values_list('course_id', flat=True)
            )
            missing_courses = active_courses.exclude(id__in=existing_course_ids)
            offerings_to_create = [
                CourseOffering(course=c, session=s, is_active=True)
                for c in missing_courses
            ]
            if offerings_to_create:
                CourseOffering.objects.bulk_create(offerings_to_create)

        return super().list(request, *args, **kwargs)


class ClassViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing classes.
    
    Managers and Student Officers can create/edit classes.
    All staff can view classes.
    """

    queryset = Class.objects.select_related(
        'course_offering',
        'course_offering__course',
        'course_offering__session',
        'tutor'
    ).all()
    serializer_class = ClassSerializer
    permission_classes = [IsStaffOrAbove]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['course_offering', 'is_active']
    search_fields = ['name', 'course_offering__course__name']
    ordering_fields = ['name', 'created_at']
    ordering = ['course_offering', 'name']


class ClassScheduleViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing class schedules.
    
    Staff can create/edit schedules.
    Students can view schedules for their enrolled courses.
    """

    queryset = ClassSchedule.objects.select_related(
        'class_instance',
        'class_instance__course_offering',
        'class_instance__course_offering__course'
    ).all()
    permission_classes = [IsStaffOrAbove]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['class_instance', 'date', 'is_cancelled']
    search_fields = ['class_instance__name', 'location']
    ordering_fields = ['date', 'start_time']
    ordering = ['date', 'start_time']

    def get_permissions(self):
        if self.action in ['list', 'retrieve', 'upcoming']:
            return [IsAuthenticated()]
        return [IsStaffOrAbove()]

    def get_queryset(self):
        user = self.request.user
        queryset = super().get_queryset()
        if user.is_staff_role:
            return queryset
        if hasattr(user, 'student_profile'):
            from enrollments.models import EnrollmentCourse
            enrolled_offering_ids = EnrollmentCourse.objects.filter(
                enrollment__student=user.student_profile,
                enrollment__status='active'
            ).values_list('course_offering_id', flat=True)
            return queryset.filter(class_instance__course_offering_id__in=enrolled_offering_ids)
        return queryset.none()

    def get_serializer_class(self):
        if self.action == 'list':
            return ClassScheduleListSerializer
        return ClassScheduleSerializer

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        data = list(serializer.data)

        # Include Attendance ClassSession records for unified scheduling
        from attendance.models import ClassSession
        att_qs = ClassSession.objects.select_related(
            'course_offering__course',
            'course_offering__course__level',
            'instructor'
        ).order_by('-session_date', '-start_time')

        user = request.user
        if not user.is_staff_role and hasattr(user, 'student_profile'):
            from enrollments.models import EnrollmentCourse
            enrolled_offering_ids = EnrollmentCourse.objects.filter(
                enrollment__student=user.student_profile,
                enrollment__status='active'
            ).values_list('course_offering_id', flat=True)
            att_qs = att_qs.filter(course_offering_id__in=enrolled_offering_ids)

        for sess in att_qs:
            tutor_name = sess.instructor.full_name if sess.instructor else 'Assigned Tutor'
            course = sess.course_offering.course if sess.course_offering else None
            level = course.level if course else None

            data.append({
                'id': str(sess.id),
                'class_name': sess.title or 'Regular Batch',
                'course_name': course.name if course else 'Course Session',
                'course_code': course.code if course else 'CS',
                'level_code': level.code if level else 'foundation',
                'level_name': level.name if level else 'Foundation',
                'tutor_name': tutor_name,
                'date': sess.session_date.strftime('%Y-%m-%d') if sess.session_date else '',
                'start_time': str(sess.start_time) if sess.start_time else '09:00:00',
                'end_time': str(sess.end_time) if sess.end_time else '12:00:00',
                'location': sess.location or 'Room A1',
                'is_cancelled': sess.status == ClassSession.Status.CANCELLED,
            })

        return Response(data)

    @action(detail=False, methods=['get'])
    def upcoming(self, request):
        """Get upcoming schedules (next 30 days)."""
        from django.utils import timezone
        from datetime import timedelta

        today = timezone.now().date()
        end_date = today + timedelta(days=30)

        schedules = self.get_queryset().filter(
            date__gte=today,
            date__lte=end_date,
            is_cancelled=False
        )

        serializer = self.get_serializer(schedules, many=True)
        return Response(serializer.data)


class ScheduleTemplateViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing recurring schedule templates (Timetable Manager).
    """
    queryset = ScheduleTemplate.objects.all()
    serializer_class = ScheduleTemplateSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['level_code', 'status']
    search_fields = ['course_code', 'course_name', 'tutor_name', 'room']


