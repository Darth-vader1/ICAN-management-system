from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from audit.utils import log_audit
from enrollments.models import EnrollmentCourse
from .models import (
    VirtualClass,
    ClassMaterial,
    ClassRecording,
    ClassAttendance,
    VirtualClassStatus,
    RecordingStatus,
)
from .serializers import (
    VirtualClassListSerializer,
    VirtualClassDetailSerializer,
    VirtualClassCreateUpdateSerializer,
    ClassMaterialSerializer,
    ClassRecordingSerializer,
    ClassAttendanceSerializer,
    ClassChatMessageSerializer,
)
from .permissions import IsClassParticipantOrStaff, IsClassInstructorOrStaff
from .services import LiveKitService, AttendanceService


class VirtualClassViewSet(viewsets.ModelViewSet):
    """
    API endpoint for Virtual Classrooms.
    Supports role-based scheduling, authorized live joining, moderation,
    attendance reports, learning materials, and class recordings.
    """

    queryset = VirtualClass.objects.all().select_related(
        'course_offering__course__level',
        'course_offering__session',
        'course_offering__tutor',
        'instructor',
        'created_by'
    ).prefetch_related('materials', 'recordings')

    def get_permissions(self):
        if self.action in ['create', 'destroy']:
            return [permissions.IsAuthenticated(), IsClassInstructorOrStaff()]
        elif self.action in ['update', 'partial_update', 'start', 'end']:
            return [permissions.IsAuthenticated(), IsClassInstructorOrStaff()]
        elif self.action == 'materials' and self.request.method == 'POST':
            # Material upload requires instructor/staff permission
            return [permissions.IsAuthenticated(), IsClassInstructorOrStaff()]
        return [permissions.IsAuthenticated(), IsClassParticipantOrStaff()]

    def get_serializer_class(self):
        if self.action == 'list':
            return VirtualClassListSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return VirtualClassCreateUpdateSerializer
        return VirtualClassDetailSerializer

    def get_queryset(self):
        user = self.request.user
        qs = super().get_queryset()

        # Filters
        course_offering_id = self.request.query_params.get('course_offering')
        status_param = self.request.query_params.get('status')
        session_id = self.request.query_params.get('session')
        date_param = self.request.query_params.get('date')

        if course_offering_id:
            qs = qs.filter(course_offering_id=course_offering_id)
        if status_param:
            qs = qs.filter(status=status_param)
        if session_id:
            qs = qs.filter(course_offering__session_id=session_id)
        if date_param:
            qs = qs.filter(scheduled_start__date=date_param)

        # Role scoping
        if user.is_staff_role:
            return qs

        # Tutors see classes where they are assigned as instructor
        if user.role == 'tutor':
            return qs.filter(instructor=user)

        # Students see classes for courses in which they have active or draft enrollments
        if hasattr(user, 'student_profile') and user.student_profile:
            active_offering_ids = EnrollmentCourse.objects.filter(
                enrollment__student=user.student_profile,
                enrollment__status__in=['active', 'draft'],
                dropped=False
            ).values_list('course_offering_id', flat=True)
            return qs.filter(course_offering_id__in=active_offering_ids)

        return qs.none()

    def perform_create(self, serializer):
        instance = serializer.save(created_by=self.request.user)
        log_audit(
            user=self.request.user,
            action='VIRTUAL_CLASS_CREATED',
            entity_type='VirtualClass',
            entity_id=instance.id,
            new_value={'title': instance.title, 'scheduled_start': str(instance.scheduled_start)}
        )

    def perform_update(self, serializer):
        old_status = self.get_object().status
        instance = serializer.save()
        log_audit(
            user=self.request.user,
            action='VIRTUAL_CLASS_UPDATED',
            entity_type='VirtualClass',
            entity_id=instance.id,
            old_value={'status': old_status},
            new_value={'status': instance.status}
        )

    @action(detail=True, methods=['post'])
    def join(self, request, pk=None):
        """
        Authorize user and generate short-lived LiveKit classroom token.
        """
        virtual_class = self.get_object()

        # Verify status
        if virtual_class.status == VirtualClassStatus.ENDED:
            return Response(
                {'detail': 'This virtual classroom session has ended.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        if virtual_class.status == VirtualClassStatus.CANCELLED:
            return Response(
                {'detail': 'This virtual classroom session was cancelled.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Automatically open lobby if scheduled time is reached
        if virtual_class.status == VirtualClassStatus.SCHEDULED:
            virtual_class.status = VirtualClassStatus.LOBBY
            virtual_class.save(update_fields=['status', 'updated_at'])

        role = 'instructor' if (request.user.is_staff_role or (virtual_class.instructor and virtual_class.instructor == request.user)) else 'student'

        token_data = LiveKitService.generate_token(request.user, virtual_class, role)

        # Record join for student self-service if student
        if role == 'student' and hasattr(request.user, 'student_profile') and request.user.student_profile:
            AttendanceService.record_join(virtual_class, request.user.student_profile)

        log_audit(
            user=request.user,
            action='VIRTUAL_CLASS_TOKEN_GENERATED',
            entity_type='VirtualClass',
            entity_id=virtual_class.id,
            new_value={'role': role}
        )

        return Response(token_data)

    @action(detail=True, methods=['post'])
    def start(self, request, pk=None):
        """Transition class status to LIVE."""
        virtual_class = self.get_object()
        virtual_class.status = VirtualClassStatus.LIVE
        virtual_class.save(update_fields=['status', 'updated_at'])

        log_audit(
            user=request.user,
            action='VIRTUAL_CLASS_STARTED',
            entity_type='VirtualClass',
            entity_id=virtual_class.id
        )
        return Response({'status': 'LIVE', 'message': 'Classroom is now live.'})

    @action(detail=True, methods=['post'])
    def end(self, request, pk=None):
        """End live classroom session."""
        virtual_class = self.get_object()
        virtual_class.status = VirtualClassStatus.ENDED
        virtual_class.save(update_fields=['status', 'updated_at'])

        log_audit(
            user=request.user,
            action='VIRTUAL_CLASS_ENDED',
            entity_type='VirtualClass',
            entity_id=virtual_class.id
        )
        return Response({'status': 'ENDED', 'message': 'Classroom session ended.'})

    @action(detail=True, methods=['get', 'post'])
    def materials(self, request, pk=None):
        """List or upload classroom learning materials."""
        virtual_class = self.get_object()

        if request.method == 'GET':
            materials = virtual_class.materials.all()
            serializer = ClassMaterialSerializer(materials, many=True, context={'request': request})
            return Response(serializer.data)

        # POST: Upload material (permission already checked in get_permissions)
        serializer = ClassMaterialSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        serializer.save(virtual_class=virtual_class, uploaded_by=request.user)

        log_audit(
            user=request.user,
            action='CLASSROOM_MATERIAL_UPLOADED',
            entity_type='VirtualClass',
            entity_id=virtual_class.id
        )

        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['get'])
    def attendance(self, request, pk=None):
        """Get attendance report for virtual class."""
        virtual_class = self.get_object()

        if request.user.is_staff_role or (virtual_class.instructor and virtual_class.instructor == request.user):
            records = virtual_class.virtual_attendances.all()
        elif hasattr(request.user, 'student_profile') and request.user.student_profile:
            records = virtual_class.virtual_attendances.filter(student=request.user.student_profile)
        else:
            records = ClassAttendance.objects.none()

        serializer = ClassAttendanceSerializer(records, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def recordings(self, request, pk=None):
        """Get recordings for virtual class."""
        virtual_class = self.get_object()
        recordings = virtual_class.recordings.filter(status=RecordingStatus.READY)
        serializer = ClassRecordingSerializer(recordings, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get', 'post'])
    def chat(self, request, pk=None):
        """List or send persistent chat messages for virtual class."""
        virtual_class = self.get_object()

        if request.method == 'GET':
            messages = virtual_class.chat_messages.all()
            serializer = ClassChatMessageSerializer(messages, many=True)
            return Response(serializer.data)

        # POST: Save chat message
        serializer = ClassChatMessageSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        sender_name = request.user.full_name if hasattr(request.user, 'full_name') and request.user.full_name else request.user.email.split('@')[0]
        instance = serializer.save(
            virtual_class=virtual_class,
            sender=request.user,
            sender_name=sender_name
        )
        return Response(ClassChatMessageSerializer(instance).data, status=status.HTTP_201_CREATED)
