from django.utils import timezone
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from audit.utils import log_audit
from users.permissions import IsStaffOrReadOnly, IsAdminUser

from .models import Notification, NotificationTemplate, MessageLog, Announcement
from .serializers import (
    NotificationSerializer,
    NotificationTemplateSerializer,
    MessageLogSerializer,
    AnnouncementSerializer,
)


class NotificationViewSet(viewsets.ModelViewSet):
    """
    ViewSet for in-app notifications.
    Students see only their own notifications.
    Staff can see all notifications.
    """

    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user

        # Staff can see all notifications
        if user.is_staff_role:
            return Notification.objects.select_related('user').all()

        # Students see only their own
        return Notification.objects.filter(user=user)

    @action(detail=False, methods=['get'])
    def unread_count(self, request):
        """Get count of unread notifications for current user"""
        count = Notification.objects.filter(
            user=request.user,
            is_read=False
        ).count()

        return Response({'count': count})

    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        """Mark a notification as read"""
        notification = self.get_object()

        # Ensure user can only mark their own notifications
        if notification.user != request.user and not request.user.is_staff_role:
            return Response(
                {'error': 'You can only mark your own notifications'},
                status=status.HTTP_403_FORBIDDEN
            )

        notification.mark_as_read()
        serializer = self.get_serializer(notification)

        return Response(serializer.data)

    @action(detail=False, methods=['post'])
    def mark_all_read(self, request):
        """Mark all notifications as read for current user"""
        updated = Notification.objects.filter(
            user=request.user,
            is_read=False
        ).update(
            is_read=True,
            read_at=timezone.now()
        )

        return Response({'marked_read': updated})


class NotificationTemplateViewSet(viewsets.ModelViewSet):
    """
    ViewSet for notification templates.
    Admin only - used to manage email/SMS/WhatsApp templates.
    """

    queryset = NotificationTemplate.objects.all()
    serializer_class = NotificationTemplateSerializer
    permission_classes = [IsAdminUser]

    def get_queryset(self):
        queryset = super().get_queryset()

        # Filter by channel if provided
        channel = self.request.query_params.get('channel')
        if channel:
            queryset = queryset.filter(channel=channel)

        # Filter by active status
        is_active = self.request.query_params.get('is_active')
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')

        return queryset

    def perform_create(self, serializer):
        instance = serializer.save()
        log_audit(
            self.request.user,
            action="CREATE",
            entity_type="NotificationTemplate",
            entity_id=instance.id,
            new_value={
                "name": instance.name,
                "key": instance.key,
                "description": f"Created notification template '{instance.name}' ({instance.key})",
            },
            request=self.request,
        )

    def perform_update(self, serializer):
        old_name = serializer.instance.name
        instance = serializer.save()
        log_audit(
            self.request.user,
            action="UPDATE",
            entity_type="NotificationTemplate",
            entity_id=instance.id,
            old_value={"name": old_name},
            new_value={
                "name": instance.name,
                "description": f"Updated notification template '{instance.name}'",
            },
            request=self.request,
        )

    def perform_destroy(self, instance):
        name = instance.name
        item_id = instance.id
        instance.delete()
        log_audit(
            self.request.user,
            action="DELETE",
            entity_type="NotificationTemplate",
            entity_id=item_id,
            old_value={"name": name},
            new_value={
                "description": f"Deleted notification template '{name}'",
            },
            request=self.request,
        )


class MessageLogViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for message logs.
    Staff only - read-only audit trail of sent messages.
    """

    queryset = MessageLog.objects.select_related('user').all()
    serializer_class = MessageLogSerializer
    permission_classes = [IsStaffOrReadOnly]

    def get_queryset(self):
        queryset = super().get_queryset()

        # Filter by user if provided
        user_id = self.request.query_params.get('user_id')
        if user_id:
            queryset = queryset.filter(user_id=user_id)

        # Filter by channel
        channel = self.request.query_params.get('channel')
        if channel:
            queryset = queryset.filter(channel=channel)

        # Filter by status
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)

        # Filter by template
        template_key = self.request.query_params.get('template_key')
        if template_key:
            queryset = queryset.filter(template_key=template_key)

        return queryset


class AnnouncementViewSet(viewsets.ModelViewSet):
    """
    ViewSet for broadcast announcements.
    Staff can CRUD announcements and broadcast messages to students.
    Students can view announcements targeted to them or 'all'.
    """
    serializer_class = AnnouncementSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        try:
            queryset = Announcement.objects.select_related('author').all()
            if not queryset.exists():
                self._seed_sample_announcements()
                queryset = Announcement.objects.select_related('author').all()
        except Exception as e:
            print(f"Error querying announcements, running migrations: {e}")
            try:
                from django.core.management import call_command
                call_command('migrate', 'notifications')
                queryset = Announcement.objects.select_related('author').all()
                if not queryset.exists():
                    self._seed_sample_announcements()
                    queryset = Announcement.objects.select_related('author').all()
            except Exception as migrate_err:
                print(f"Failed to migrate notifications table: {migrate_err}")
                return Announcement.objects.none()

        if user.is_staff_role:
            return queryset

        level_code = 'all'
        if hasattr(user, 'student_profile'):
            enrollment = user.student_profile.enrollments.filter(status='active').first()
            if enrollment and enrollment.level:
                level_code = enrollment.level.code.lower()

        from django.db.models import Q
        return queryset.filter(Q(target_audience__icontains='all') | Q(target_audience__icontains=level_code))

    def _seed_sample_announcements(self):
        from users.models import User
        manager = User.objects.filter(role='manager').first() or User.objects.first()
        author_name = "Adaobi Okafor"

        samples = [
            {
                "title": "Q3 Class Schedule Update",
                "message": "Please review the updated lecture timetable for the upcoming Q3 session. All Foundation level classes will now begin at 9:00 AM prompt.",
                "target_audience": "foundation",
                "channels": ["Email", "WhatsApp"],
                "author": manager,
                "author_name": author_name,
            },
            {
                "title": "Fee Payment Deadline Reminder",
                "message": "This is a reminder to all enrolled students that outstanding tuition fee balances must be cleared prior to mid-term examinations.",
                "target_audience": "all",
                "channels": ["Email"],
                "author": manager,
                "author_name": "Aisha Mohammed",
            },
            {
                "title": "New Study Materials Available",
                "message": "Revised study packs and past question solutions for Skills level courses are now available for download in the portal resource library.",
                "target_audience": "skills",
                "channels": ["Email", "In-App"],
                "author": manager,
                "author_name": author_name,
            },
        ]

        for s in samples:
            Announcement.objects.create(**s)

    def perform_create(self, serializer):
        author_name = self.request.user.email
        if hasattr(self.request.user, 'staff_profile'):
            author_name = self.request.user.staff_profile.full_name
        elif hasattr(self.request.user, 'student_profile'):
            author_name = self.request.user.student_profile.full_name

        instance = serializer.save(author=self.request.user, author_name=author_name)
        log_audit(
            self.request.user,
            action="CREATE",
            entity_type="Announcement",
            entity_id=instance.id,
            new_value={
                "title": instance.title,
                "target_audience": instance.target_audience,
                "description": f"Broadcasted announcement '{instance.title}' to {instance.target_audience}",
            },
            request=self.request,
        )

    def perform_update(self, serializer):
        old_title = serializer.instance.title
        instance = serializer.save()
        log_audit(
            self.request.user,
            action="UPDATE",
            entity_type="Announcement",
            entity_id=instance.id,
            old_value={"title": old_title},
            new_value={
                "title": instance.title,
                "description": f"Updated announcement '{instance.title}'",
            },
            request=self.request,
        )

    def perform_destroy(self, instance):
        title = instance.title
        item_id = instance.id
        instance.delete()
        log_audit(
            self.request.user,
            action="DELETE",
            entity_type="Announcement",
            entity_id=item_id,
            old_value={"title": title},
            new_value={
                "description": f"Deleted announcement '{title}'",
            },
            request=self.request,
        )

