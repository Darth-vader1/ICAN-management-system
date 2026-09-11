from rest_framework import serializers

from .models import Notification, NotificationTemplate, MessageLog, Announcement


class NotificationSerializer(serializers.ModelSerializer):
    """Serializer for in-app notifications"""
    
    type_display = serializers.CharField(source='get_type_display', read_only=True)
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    
    class Meta:
        model = Notification
        fields = [
            'id',
            'type',
            'type_display',
            'category',
            'category_display',
            'title',
            'message',
            'action_url',
            'action_label',
            'is_read',
            'read_at',
            'created_at',
        ]
        read_only_fields = ['id', 'created_at', 'read_at']


class NotificationTemplateSerializer(serializers.ModelSerializer):
    """Serializer for notification templates (admin only)"""
    
    channel_display = serializers.CharField(source='get_channel_display', read_only=True)
    
    class Meta:
        model = NotificationTemplate
        fields = [
            'id',
            'key',
            'channel',
            'channel_display',
            'subject',
            'body_text',
            'body_html',
            'is_active',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class MessageLogSerializer(serializers.ModelSerializer):
    """Serializer for message logs (staff only)"""
    
    channel_display = serializers.CharField(source='get_channel_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True, allow_null=True)
    
    class Meta:
        model = MessageLog
        fields = [
            'id',
            'user',
            'user_email',
            'recipient',
            'channel',
            'channel_display',
            'template_key',
            'subject',
            'body',
            'status',
            'status_display',
            'provider',
            'provider_message_id',
            'sent_at',
            'delivered_at',
            'failed_at',
            'error_message',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'id',
            'user_email',
            'channel_display',
            'status_display',
            'created_at',
            'updated_at',
        ]


class AnnouncementSerializer(serializers.ModelSerializer):
    """Serializer for broadcast announcements"""
    target_audience_display = serializers.SerializerMethodField()
    author_display = serializers.SerializerMethodField()

    def get_target_audience_display(self, obj):
        aud = (obj.target_audience or 'all').lower()
        if 'all' in aud or ('foundation' in aud and 'skills' in aud and 'professional' in aud):
            return 'All Students'
        parts = [p.strip().capitalize() for p in aud.split(',') if p.strip()]
        if not parts:
            return 'All Students'
        return f"{', '.join(parts)} Students"

    class Meta:
        model = Announcement
        fields = [
            'id',
            'title',
            'message',
            'target_audience',
            'target_audience_display',
            'channels',
            'author',
            'author_name',
            'author_display',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'author', 'author_name', 'created_at', 'updated_at']

    def get_author_display(self, obj):
        if obj.author_name:
            return obj.author_name
        if obj.author:
            return obj.author.email
        return 'System'
