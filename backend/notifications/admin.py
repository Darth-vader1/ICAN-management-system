from django.contrib import admin
from django.utils.html import format_html

from .models import Notification, NotificationTemplate, MessageLog


@admin.register(NotificationTemplate)
class NotificationTemplateAdmin(admin.ModelAdmin):
    """Admin interface for notification templates"""
    
    list_display = ['key', 'channel', 'subject', 'is_active', 'created_at']
    list_filter = ['channel', 'is_active', 'created_at']
    search_fields = ['key', 'subject', 'body_text']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('Template Info', {
            'fields': ('key', 'channel', 'is_active')
        }),
        ('Content', {
            'fields': ('subject', 'body_text', 'body_html')
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    """Admin interface for in-app notifications"""
    
    list_display = [
        'id',
        'user',
        'title',
        'type_badge',
        'category',
        'is_read',
        'created_at'
    ]
    list_filter = ['type', 'category', 'is_read', 'created_at']
    search_fields = ['title', 'message', 'user__email']
    readonly_fields = ['created_at', 'read_at']
    
    fieldsets = (
        ('Recipient', {
            'fields': ('user',)
        }),
        ('Notification', {
            'fields': ('type', 'category', 'title', 'message')
        }),
        ('Action', {
            'fields': ('action_url', 'action_label')
        }),
        ('Status', {
            'fields': ('is_read', 'read_at', 'created_at')
        }),
    )
    
    def type_badge(self, obj):
        """Display type as colored badge"""
        colors = {
            'info': '#3b82f6',
            'success': '#10b981',
            'warning': '#f59e0b',
            'error': '#ef4444',
        }
        color = colors.get(obj.type, '#6b7280')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 10px; border-radius: 3px; font-size: 11px;">{}</span>',
            color,
            obj.get_type_display()
        )
    type_badge.short_description = 'Type'


@admin.register(MessageLog)
class MessageLogAdmin(admin.ModelAdmin):
    """Admin interface for message logs"""
    
    list_display = [
        'id',
        'recipient',
        'channel',
        'template_key',
        'status_badge',
        'provider',
        'created_at'
    ]
    list_filter = ['channel', 'status', 'provider', 'created_at']
    search_fields = ['recipient', 'subject', 'template_key', 'provider_message_id']
    readonly_fields = [
        'created_at',
        'updated_at',
        'sent_at',
        'delivered_at',
        'failed_at'
    ]
    
    fieldsets = (
        ('Recipient', {
            'fields': ('user', 'recipient')
        }),
        ('Message', {
            'fields': ('channel', 'template_key', 'subject', 'body')
        }),
        ('Delivery', {
            'fields': (
                'status',
                'provider',
                'provider_message_id',
                'error_message'
            )
        }),
        ('Timestamps', {
            'fields': (
                'created_at',
                'sent_at',
                'delivered_at',
                'failed_at',
                'updated_at'
            ),
            'classes': ('collapse',)
        }),
    )
    
    def status_badge(self, obj):
        """Display status as colored badge"""
        colors = {
            'pending': '#6b7280',
            'sent': '#3b82f6',
            'delivered': '#10b981',
            'failed': '#ef4444',
            'bounced': '#f59e0b',
        }
        color = colors.get(obj.status, '#6b7280')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 10px; border-radius: 3px; font-size: 11px;">{}</span>',
            color,
            obj.get_status_display()
        )
    status_badge.short_description = 'Status'
    
    def has_add_permission(self, request):
        """Message logs are created automatically, not manually"""
        return False
    
    def has_change_permission(self, request, obj=None):
        """Message logs are read-only"""
        return False
