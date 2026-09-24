"""
Email utility functions for sending HTML template emails.
Uses the professional email templates in templates/emails/
"""
import logging
from typing import Dict, Optional

from django.conf import settings
from django.template.loader import render_to_string
from notifications.services import EmailService

logger = logging.getLogger(__name__)


def send_html_email(
    *,
    template_name: str,
    context: Dict,
    recipient_email: str,
    subject: str,
    user=None
) -> bool:
    """
    Send an email using Django HTML templates from templates/emails/
    
    Args:
        template_name: Template file name without extension (e.g., 'welcome', 'payment_receipt')
        context: Dictionary of template variables
        recipient_email: Recipient's email address
        subject: Email subject line
        user: Optional User instance for audit logging
    
    Returns:
        bool: True if sent successfully
    
    Example:
        send_html_email(
            template_name='welcome',
            context={
                'student_name': 'John Doe',
                'student_code': 'STU2024001',
                'login_url': 'https://portal.ican.edu.ng/login',
            },
            recipient_email='john@example.com',
            subject='Welcome to ICAN Tutorial Centre',
        )
    """
    try:
        # Add global context variables
        full_context = {
            'recipient_email': recipient_email,
            'portal_url': getattr(settings, 'PORTAL_URL', 'http://localhost:5173'),
            'support_url': getattr(settings, 'SUPPORT_URL', 'http://localhost:5173/support'),
            'privacy_url': getattr(settings, 'PRIVACY_URL', 'http://localhost:5173/privacy'),
            **context,
        }
        
        # Render HTML template
        html_content = render_to_string(
            f'emails/{template_name}.html',
            full_context
        )
        
        # Generate plain text fallback (basic version without HTML)
        # In production, you might want to create separate .txt templates
        plain_text = f"""
{subject}

This email was sent to {recipient_email} from ICAN Tutorial Centre.

Please view this email in an HTML-capable email client for the best experience.

---
ICAN Tutorial Centre
Lagos, Nigeria
        """.strip()
        
        # Send via EmailService
        success = EmailService.send_raw(
            to=recipient_email,
            subject=subject,
            body_text=plain_text,
            body_html=html_content,
            user=user
        )
        
        if success:
            logger.info(f"HTML email '{template_name}' sent successfully to {recipient_email}")
        else:
            logger.error(f"Failed to send HTML email '{template_name}' to {recipient_email}")
        
        return success
        
    except Exception as e:
        logger.error(f"Error sending HTML email '{template_name}': {e}", exc_info=True)
        return False


def send_welcome_email(*, student, login_url: Optional[str] = None) -> bool:
    """
    Send welcome email to new student.
    
    Args:
        student: StudentProfile instance
        login_url: Optional custom login URL
    
    Returns:
        bool: True if sent successfully
    """
    if not login_url:
        portal_url = getattr(settings, 'PORTAL_URL', 'http://localhost:5173')
        login_url = f"{portal_url}/login"
    
    context = {
        'student_name': student.user.get_full_name() or student.user.username,
        'student_code': student.student_code,
        'student_email': student.user.email,
        'level_name': student.get_level_display() if hasattr(student, 'get_level_display') else 'N/A',
        'login_url': login_url,
    }
    
    return send_html_email(
        template_name='welcome',
        context=context,
        recipient_email=student.user.email,
        subject='Welcome to ICAN Tutorial Centre',
        user=student.user
    )


def send_payment_receipt_email(*, payment, invoice) -> bool:
    """
    Send payment receipt email after successful payment.
    
    Args:
        payment: Payment instance
        invoice: Invoice instance
    
    Returns:
        bool: True if sent successfully
    """
    context = {
        'student_name': invoice.student.user.get_full_name() or invoice.student.user.username,
        'amount': payment.amount,
        'payment_reference': payment.provider_reference,
        'invoice_number': invoice.invoice_number,
        'payment_method': payment.payment_method or 'Paystack',
        'payment_date': payment.payment_date,
        'remaining_balance': invoice.balance,
        'receipt_url': f"{getattr(settings, 'PORTAL_URL', 'http://localhost:5173')}/billing",
    }
    
    return send_html_email(
        template_name='payment_receipt',
        context=context,
        recipient_email=invoice.student.user.email,
        subject=f'Payment Receipt - {payment.provider_reference}',
        user=invoice.student.user
    )


def send_invoice_email(*, invoice) -> bool:
    """
    Send invoice notification email when new invoice is generated.
    
    Args:
        invoice: Invoice instance
    
    Returns:
        bool: True if sent successfully
    """
    # Get invoice items (line items)
    invoice_items = []
    if hasattr(invoice, 'items'):
        invoice_items = [
            {
                'description': item.description,
                'amount': item.amount
            }
            for item in invoice.items.all()
        ]
    else:
        # Fallback if no line items
        invoice_items = [{
            'description': 'Tuition Fee',
            'amount': invoice.amount
        }]
    
    context = {
        'student_name': invoice.student.user.get_full_name() or invoice.student.user.username,
        'invoice_number': invoice.invoice_number,
        'invoice_date': invoice.generated_date,
        'due_date': invoice.due_date,
        'session_label': invoice.session.label if hasattr(invoice, 'session') else 'N/A',
        'level_name': invoice.student.get_level_display() if hasattr(invoice.student, 'get_level_display') else 'N/A',
        'invoice_items': invoice_items,
        'total_amount': invoice.amount,
        'payment_url': f"{getattr(settings, 'PORTAL_URL', 'http://localhost:5173')}/billing",
    }
    
    return send_html_email(
        template_name='invoice_generated',
        context=context,
        recipient_email=invoice.student.user.email,
        subject=f'New Invoice - {invoice.invoice_number}',
        user=invoice.student.user
    )


def send_attendance_alert_email(*, student, attendance_data: Dict) -> bool:
    """
    Send attendance warning email to student.
    
    Args:
        student: StudentProfile instance
        attendance_data: Dict containing:
            - attendance_rate: Overall attendance percentage
            - total_classes: Total number of classes
            - classes_attended: Classes attended
            - classes_missed: Classes missed
            - at_risk_courses: List of courses with low attendance (optional)
    
    Returns:
        bool: True if sent successfully
    """
    context = {
        'student_name': student.user.get_full_name() or student.user.username,
        'attendance_rate': attendance_data.get('attendance_rate', 0),
        'total_classes': attendance_data.get('total_classes', 0),
        'classes_attended': attendance_data.get('classes_attended', 0),
        'classes_missed': attendance_data.get('classes_missed', 0),
        'at_risk_courses': attendance_data.get('at_risk_courses', []),
        'attendance_url': f"{getattr(settings, 'PORTAL_URL', 'http://localhost:5173')}/attendance",
    }
    
    return send_html_email(
        template_name='attendance_alert',
        context=context,
        recipient_email=student.user.email,
        subject='Attendance Alert - Action Required',
        user=student.user
    )


def send_class_reminder_email(*, students, class_session) -> int:
    """
    Send class reminder email to students.
    
    Args:
        students: List or QuerySet of StudentProfile instances
        class_session: ClassSession instance with class details
    
    Returns:
        int: Number of emails sent successfully
    """
    sent_count = 0
    
    for student in students:
        context = {
            'student_name': student.user.get_full_name() or student.user.username,
            'course_code': class_session.course_offering.course.code,
            'course_name': class_session.course_offering.course.name,
            'class_date': class_session.date,
            'start_time': class_session.start_time,
            'end_time': class_session.end_time,
            'location': class_session.location or 'Main Campus',
            'instructor_name': class_session.course_offering.tutor.full_name if class_session.course_offering.tutor else 'TBA',
            'class_topic': class_session.topic if hasattr(class_session, 'topic') else None,
            'preparation_notes': class_session.notes if hasattr(class_session, 'notes') else None,
            'portal_url': getattr(settings, 'PORTAL_URL', 'http://localhost:5173'),
        }
        
        success = send_html_email(
            template_name='class_reminder',
            context=context,
            recipient_email=student.user.email,
            subject=f'Class Reminder - {class_session.course_offering.course.code}',
            user=student.user
        )
        
        if success:
            sent_count += 1
    
    logger.info(f"Sent {sent_count} class reminder emails for {class_session}")
    return sent_count


def send_password_reset_email(*, user, reset_url: str, expiry_hours: int = 24) -> bool:
    """
    Send password reset email.
    
    Args:
        user: User instance
        reset_url: Password reset URL with token
        expiry_hours: Number of hours until link expires
    
    Returns:
        bool: True if sent successfully
    """
    context = {
        'user_name': user.get_full_name() or user.username,
        'reset_url': reset_url,
        'expiry_hours': expiry_hours,
    }
    
    return send_html_email(
        template_name='password_reset',
        context=context,
        recipient_email=user.email,
        subject='Reset Your Password - ICAN Tutorial Centre',
        user=user
    )


def send_temporary_password_email(*, user, temporary_password: str) -> bool:
    """
    Email a freshly-reset temporary password out-of-band.
    The API layer must never echo the temporary password back
    in the response payload; delivery is exclusive to this email.

    Args:
        user: User instance
        temporary_password: Auto-generated (or admin-provided) one-shot password

    Returns:
        bool: True if sent successfully
    """
    from django.conf import settings

    context = {
        'user_name': getattr(user, 'full_name', None) or user.email,
        'email': user.email,
        'temporary_password': temporary_password,
        'portal_url': getattr(settings, 'PORTAL_URL', ''),
        'support_url': getattr(settings, 'SUPPORT_URL', ''),
        'privacy_url': getattr(settings, 'PRIVACY_URL', ''),
    }

    return send_html_email(
        template_name='temporary_password',
        context=context,
        recipient_email=user.email,
        subject='Your Temporary Password - ICAN Tutorial Centre',
        user=user,
    )
