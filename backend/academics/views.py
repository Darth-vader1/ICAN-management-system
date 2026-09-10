from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from rest_framework.permissions import IsAuthenticated

from users.permissions import IsManagerOrAbove, IsStaffOrAbove

from .models import AcademicSession, Class, ClassSchedule, Course, CourseOffering, Level
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
        if self.action in ['list', 'retrieve']:
            return [IsAuthenticated()]
        return super().get_permissions()


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

    def get_serializer_class(self):
        if self.action == 'list':
            return ClassScheduleListSerializer
        return ClassScheduleSerializer

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
