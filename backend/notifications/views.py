from django.utils import timezone
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from users.permissions import IsStaffOrReadOnly, IsAdminUser

from .models import Notification, NotificationTemplate, MessageLog
from .serializers import (
    NotificationSerializer,
    NotificationTemplateSerializer,
    MessageLogSerializer,
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
        if user.is_staff:
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
        if notification.user != request.user and not request.user.is_staff:
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
