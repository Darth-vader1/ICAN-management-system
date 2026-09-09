"""
Service abstractions for Email and WhatsApp. Business logic elsewhere in the
codebase should only ever call EmailService / WhatsAppService — never a
provider SDK directly — so the concrete provider can change without
touching call sites (spec §21, §22).
"""
import logging
from abc import ABC, abstractmethod
from typing import Optional

from django.conf import settings
from django.template import Context, Template
from django.utils import timezone

logger = logging.getLogger(__name__)


class BaseEmailProvider(ABC):
    """Abstract base class for email providers"""
    
    @abstractmethod
    def send(self, *, to: str, subject: str, body_text: str, body_html: str = "") -> dict:
        """
        Send email via provider.
        Returns dict with: {'success': bool, 'message_id': str, 'error': str}
        """
        pass


class ResendEmailProvider(BaseEmailProvider):
    """Resend email provider implementation"""
    
    def send(self, *, to: str, subject: str, body_text: str, body_html: str = "") -> dict:
        try:
            import resend
            resend.api_key = settings.RESEND_API_KEY
            
            email_data = {
                "from": settings.DEFAULT_FROM_EMAIL,
                "to": [to],
                "subject": subject,
                "text": body_text,
            }
            
            if body_html:
                email_data["html"] = body_html
            
            response = resend.Emails.send(email_data)
            
            return {
                'success': True,
                'message_id': response.get('id', ''),
                'error': ''
            }
        except Exception as e:
            logger.error(f"Resend email failed: {e}")
            return {
                'success': False,
                'message_id': '',
                'error': str(e)
            }


class SendGridEmailProvider(BaseEmailProvider):
    """SendGrid email provider implementation"""
    
    def send(self, *, to: str, subject: str, body_text: str, body_html: str = "") -> dict:
        try:
            from sendgrid import SendGridAPIClient
            from sendgrid.helpers.mail import Mail
            
            content_type = "text/html" if body_html else "text/plain"
            content = body_html if body_html else body_text
            
            message = Mail(
                from_email=settings.DEFAULT_FROM_EMAIL,
                to_emails=to,
                subject=subject,
                plain_text_content=body_text,
                html_content=body_html if body_html else None
            )
            
            sg = SendGridAPIClient(settings.SENDGRID_API_KEY)
            response = sg.send(message)
            
            return {
                'success': response.status_code in [200, 201, 202],
                'message_id': response.headers.get('X-Message-Id', ''),
                'error': ''
            }
        except Exception as e:
            logger.error(f"SendGrid email failed: {e}")
            return {
                'success': False,
                'message_id': '',
                'error': str(e)
            }


class SESEmailProvider(BaseEmailProvider):
    """Amazon SES email provider implementation"""
    
    def send(self, *, to: str, subject: str, body_text: str, body_html: str = "") -> dict:
        try:
            import boto3
            from botocore.exceptions import ClientError
            
            client = boto3.client(
                'ses',
                region_name=settings.AWS_SES_REGION,
                aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY
            )
            
            destination = {'ToAddresses': [to]}
            message = {
                'Subject': {'Data': subject, 'Charset': 'UTF-8'},
                'Body': {}
            }
            
            if body_html:
                message['Body']['Html'] = {'Data': body_html, 'Charset': 'UTF-8'}
            
            message['Body']['Text'] = {'Data': body_text, 'Charset': 'UTF-8'}
            
            response = client.send_email(
                Source=settings.DEFAULT_FROM_EMAIL,
                Destination=destination,
                Message=message
            )
            
            return {
                'success': True,
                'message_id': response['MessageId'],
                'error': ''
            }
        except Exception as e:
            logger.error(f"SES email failed: {e}")
            return {
                'success': False,
                'message_id': '',
                'error': str(e)
            }


class ConsoleEmailProvider(BaseEmailProvider):
    """Console email provider for development/testing"""
    
    def send(self, *, to: str, subject: str, body_text: str, body_html: str = "") -> dict:
        logger.info("=" * 70)
        logger.info(f"EMAIL TO: {to}")
        logger.info(f"SUBJECT: {subject}")
        logger.info("-" * 70)
        logger.info(body_text)
        if body_html:
            logger.info("-" * 70)
            logger.info("HTML VERSION:")
            logger.info(body_html)
        logger.info("=" * 70)
        
        return {
            'success': True,
            'message_id': f'console-{timezone.now().timestamp()}',
            'error': ''
        }


class EmailService:
    """
    Main email service that routes to configured provider.
    Usage: EmailService.send_template(to='user@example.com', template_key='invoice_created', context={...})
    """
    
    _provider_cache: Optional[BaseEmailProvider] = None
    
    @classmethod
    def _get_provider(cls) -> BaseEmailProvider:
        """Get or create email provider instance"""
        if cls._provider_cache is not None:
            return cls._provider_cache
        
        provider_name = getattr(settings, 'EMAIL_PROVIDER', 'console').lower()
        
        providers = {
            'resend': ResendEmailProvider,
            'sendgrid': SendGridEmailProvider,
            'ses': SESEmailProvider,
            'console': ConsoleEmailProvider,
        }
        
        provider_class = providers.get(provider_name, ConsoleEmailProvider)
        cls._provider_cache = provider_class()
        
        return cls._provider_cache
    
    @classmethod
    def send_template(cls, *, to: str, template_key: str, context: dict, user=None) -> bool:
        """
        Renders NotificationTemplate(key=template_key) with `context` and
        sends via the configured provider (settings.EMAIL_PROVIDER).
        
        Args:
            to: Recipient email address
            template_key: NotificationTemplate.key to use
            context: Variables for template rendering
            user: Optional User instance for message logging
        
        Returns:
            bool: True if sent successfully
        """
        from .models import NotificationTemplate, MessageLog
        
        try:
            # Get template
            template = NotificationTemplate.objects.filter(
                key=template_key,
                channel=NotificationTemplate.Channel.EMAIL,
                is_active=True
            ).first()
            
            if not template:
                logger.error(f"Email template '{template_key}' not found")
                return False
            
            # Render template
            subject = Template(template.subject).render(Context(context))
            body_text = Template(template.body_text).render(Context(context))
            body_html = Template(template.body_html).render(Context(context)) if template.body_html else ""
            
            # Create message log
            message_log = MessageLog.objects.create(
                user=user,
                recipient=to,
                channel=MessageLog.Channel.EMAIL,
                template_key=template_key,
                subject=subject,
                body=body_text,
                status=MessageLog.Status.PENDING
            )
            
            # Send via provider
            provider = cls._get_provider()
            result = provider.send(
                to=to,
                subject=subject,
                body_text=body_text,
                body_html=body_html
            )
            
            # Update message log
            if result['success']:
                message_log.status = MessageLog.Status.SENT
                message_log.sent_at = timezone.now()
                message_log.provider_message_id = result['message_id']
                message_log.provider = getattr(settings, 'EMAIL_PROVIDER', 'console')
            else:
                message_log.status = MessageLog.Status.FAILED
                message_log.failed_at = timezone.now()
                message_log.error_message = result['error']
            
            message_log.save()
            
            return result['success']
        
        except Exception as e:
            logger.error(f"Email send failed for template '{template_key}': {e}")
            return False
    
    @classmethod
    def send_raw(cls, *, to: str, subject: str, body_text: str, body_html: str = "", user=None) -> bool:
        """
        Send email without template.
        
        Args:
            to: Recipient email address
            subject: Email subject
            body_text: Plain text body
            body_html: Optional HTML body
            user: Optional User instance for message logging
        
        Returns:
            bool: True if sent successfully
        """
        from .models import MessageLog
        
        try:
            # Create message log
            message_log = MessageLog.objects.create(
                user=user,
                recipient=to,
                channel=MessageLog.Channel.EMAIL,
                subject=subject,
                body=body_text,
                status=MessageLog.Status.PENDING
            )
            
            # Send via provider
            provider = cls._get_provider()
            result = provider.send(
                to=to,
                subject=subject,
                body_text=body_text,
                body_html=body_html
            )
            
            # Update message log
            if result['success']:
                message_log.status = MessageLog.Status.SENT
                message_log.sent_at = timezone.now()
                message_log.provider_message_id = result['message_id']
                message_log.provider = getattr(settings, 'EMAIL_PROVIDER', 'console')
            else:
                message_log.status = MessageLog.Status.FAILED
                message_log.failed_at = timezone.now()
                message_log.error_message = result['error']
            
            message_log.save()
            
            return result['success']
        
        except Exception as e:
            logger.error(f"Raw email send failed: {e}")
            return False


class WhatsAppService:
    """
    WhatsApp Business API service abstraction.
    Never implemented via unofficial scraping/automation (spec §22, §48).
    """
    
    @staticmethod
    def send_template(*, to: str, template_key: str, context: dict, user=None) -> bool:
        """
        Sends an approved WhatsApp Business Platform template message.
        
        Args:
            to: Phone number in international format (e.g., +2348012345678)
            template_key: Approved template name on WhatsApp Business
            context: Variables for template (limited by WhatsApp approval)
            user: Optional User instance for message logging
        
        Returns:
            bool: True if sent successfully
        
        Note: Requires WhatsApp Business API credentials and approved templates.
        Implementation left as abstraction for future integration.
        """
        from .models import MessageLog
        
        logger.warning(f"WhatsApp service not yet implemented. Would send template '{template_key}' to {to}")
        
        # Create placeholder message log
        MessageLog.objects.create(
            user=user,
            recipient=to,
            channel=MessageLog.Channel.WHATSAPP,
            template_key=template_key,
            body=f"WhatsApp template: {template_key}",
            status=MessageLog.Status.PENDING,
            error_message="WhatsApp integration pending"
        )
        
        return False