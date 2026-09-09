from django.db import models
from django.conf import settings


class NotificationTemplate(models.Model):
    """
    Email/SMS/WhatsApp templates with variable substitution.
    Templates are referenced by key (e.g., 'invoice_created', 'payment_reminder').
    """
    
    class Channel(models.TextChoices):
        EMAIL = 'email', 'Email'
        SMS = 'sms', 'SMS'
        WHATSAPP = 'whatsapp', 'WhatsApp'
    
    key = models.CharField(max_length=100, unique=True, db_index=True)
    channel = models.CharField(max_length=20, choices=Channel.choices)
    subject = models.CharField(max_length=200, blank=True)  # For email
    body_text = models.TextField(help_text="Plain text body with {{variable}} placeholders")
    body_html = models.TextField(blank=True, help_text="HTML body (for email)")
    
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'notifications_template'
        indexes = [
            models.Index(fields=['channel', 'is_active']),
        ]
    
    def __str__(self):
        return f"{self.key} ({self.get_channel_display()})"


class Notification(models.Model):
    """
    In-app notifications for users (students, staff).
    Displayed in notification center/dropdown.
    """
    
    class Type(models.TextChoices):
        INFO = 'info', 'Info'
        SUCCESS = 'success', 'Success'
        WARNING = 'warning', 'Warning'
        ERROR = 'error', 'Error'
    
    class Category(models.TextChoices):
        ENROLLMENT = 'enrollment', 'Enrollment'
        BILLING = 'billing', 'Billing'
        PAYMENT = 'payment', 'Payment'
        ACADEMIC = 'academic', 'Academic'
        ATTENDANCE = 'attendance', 'Attendance'
        SYSTEM = 'system', 'System'
    
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='notifications'
    )
    
    type = models.CharField(max_length=20, choices=Type.choices, default=Type.INFO)
    category = models.CharField(max_length=20, choices=Category.choices)
    
    title = models.CharField(max_length=200)
    message = models.TextField()
    
    # Optional link for "View Details" button
    action_url = models.CharField(max_length=500, blank=True)
    action_label = models.CharField(max_length=50, blank=True, default="View Details")
    
    is_read = models.BooleanField(default=False)
    read_at = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'notifications_notification'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'is_read', 'created_at']),
            models.Index(fields=['user', 'category']),
            models.Index(fields=['created_at']),
        ]
    
    def __str__(self):
        return f"{self.user.email} - {self.title}"
    
    def mark_as_read(self):
        """Mark notification as read"""
        from django.utils import timezone
        if not self.is_read:
            self.is_read = True
            self.read_at = timezone.now()
            self.save(update_fields=['is_read', 'read_at'])


class MessageLog(models.Model):
    """
    Audit trail for all sent messages (email, SMS, WhatsApp).
    Records what was sent, to whom, when, and delivery status.
    """
    
    class Channel(models.TextChoices):
        EMAIL = 'email', 'Email'
        SMS = 'sms', 'SMS'
        WHATSAPP = 'whatsapp', 'WhatsApp'
    
    class Status(models.TextChoices):
        PENDING = 'pending', 'Pending'
        SENT = 'sent', 'Sent'
        DELIVERED = 'delivered', 'Delivered'
        FAILED = 'failed', 'Failed'
        BOUNCED = 'bounced', 'Bounced'
    
    # Recipient
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='message_logs'
    )
    recipient = models.CharField(max_length=200, help_text="Email/phone number")
    
    # Message details
    channel = models.CharField(max_length=20, choices=Channel.choices)
    template_key = models.CharField(max_length=100, blank=True)
    subject = models.CharField(max_length=200, blank=True)
    body = models.TextField()
    
    # Delivery tracking
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    provider = models.CharField(max_length=50, blank=True, help_text="resend, sendgrid, ses, twilio, etc.")
    provider_message_id = models.CharField(max_length=200, blank=True)
    
    # Timestamps
    sent_at = models.DateTimeField(null=True, blank=True)
    delivered_at = models.DateTimeField(null=True, blank=True)
    failed_at = models.DateTimeField(null=True, blank=True)
    
    error_message = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'notifications_message_log'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'channel', 'created_at']),
            models.Index(fields=['status', 'created_at']),
            models.Index(fields=['template_key', 'created_at']),
            models.Index(fields=['provider_message_id']),
        ]
    
    def __str__(self):
        return f"{self.get_channel_display()} to {self.recipient} - {self.status}"
