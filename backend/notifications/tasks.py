from celery import shared_task
from django.utils import timezone
from datetime import timedelta
import logging

logger = logging.getLogger(__name__)


@shared_task
def send_password_reset_email(user_id: str, uid: str, token: str):
    """Send password reset email to user"""
    from users.models import User
    from .services import EmailService

    user = User.objects.filter(id=user_id).first()
    if not user:
        return
    
    EmailService.send_template(
        to=user.email,
        template_key="password_reset",
        context={"uid": uid, "token": token, "user_name": user.get_full_name()},
        user=user
    )


@shared_task
def send_welcome_email(user_id: str):
    """Send welcome email to new user"""
    from users.models import User
    from .services import EmailService

    user = User.objects.filter(id=user_id).first()
    if not user:
        return
    
    EmailService.send_template(
        to=user.email,
        template_key="welcome",
        context={
            "user_name": user.get_full_name(),
            "email": user.email,
        },
        user=user
    )


@shared_task
def send_invoice_created_email(invoice_id: str):
    """Send email when invoice is created"""
    from billing.models import Invoice
    from .services import EmailService

    try:
        invoice = Invoice.objects.select_related(
            'student__user',
            'enrollment__session',
            'enrollment__level'
        ).get(id=invoice_id)
        
        user = invoice.student.user
        
        EmailService.send_template(
            to=user.email,
            template_key="invoice_created",
            context={
                "user_name": user.get_full_name(),
                "invoice_number": invoice.invoice_number,
                "total_amount": invoice.total_amount,
                "due_date": invoice.due_date.strftime("%B %d, %Y"),
                "session": str(invoice.enrollment.session),
                "level": invoice.enrollment.level.name,
            },
            user=user
        )
    except Exception as e:
        logger.error(f"Failed to send invoice created email: {e}")


@shared_task
def send_payment_confirmation_email(payment_id: str):
    """Send email when payment is successful"""
    from billing.models import Payment
    from .services import EmailService
    from .models import Notification

    try:
        payment = Payment.objects.select_related('student__user').get(id=payment_id)
        user = payment.student.user
        
        # Send email
        EmailService.send_template(
            to=user.email,
            template_key="payment_confirmation",
            context={
                "user_name": user.get_full_name(),
                "amount": payment.amount,
                "payment_method": payment.get_method_display(),
                "transaction_date": payment.transaction_date.strftime("%B %d, %Y at %I:%M %p"),
                "reference": payment.reference,
            },
            user=user
        )
        
        # Create in-app notification
        Notification.objects.create(
            user=user,
            type=Notification.Type.SUCCESS,
            category=Notification.Category.PAYMENT,
            title="Payment Received",
            message=f"Your payment of ₦{payment.amount:,.2f} has been received and confirmed.",
            action_url=f"/payments/{payment.id}",
            action_label="View Receipt"
        )
    except Exception as e:
        logger.error(f"Failed to send payment confirmation: {e}")


@shared_task
def scan_and_send_payment_reminders():
    """
    Celery task to scan for overdue/upcoming invoices and send reminders.
    Runs daily via Celery beat (configured in config/celery.py).
    """
    from billing.models import Invoice
    from .services import EmailService
    from .models import Notification
    
    today = timezone.now().date()
    
    # Find invoices that are:
    # 1. Pending or Partially Paid
    # 2. Due within 3 days OR overdue
    
    upcoming_due = today + timedelta(days=3)
    
    invoices_to_remind = Invoice.objects.filter(
        status__in=[Invoice.Status.PENDING, Invoice.Status.PARTIALLY_PAID],
        due_date__lte=upcoming_due
    ).select_related('student__user', 'enrollment__session', 'enrollment__level')
    
    logger.info(f"Found {invoices_to_remind.count()} invoices for reminders")
    
    for invoice in invoices_to_remind:
        try:
            user = invoice.student.user
            balance = invoice.balance
            days_until_due = (invoice.due_date - today).days
            
            # Determine reminder type
            if days_until_due < 0:
                # Overdue
                template_key = "payment_overdue"
                notification_type = Notification.Type.ERROR
                title = "Payment Overdue"
                message = f"Your invoice {invoice.invoice_number} is overdue. Balance: ₦{balance:,.2f}"
            elif days_until_due == 0:
                # Due today
                template_key = "payment_due_today"
                notification_type = Notification.Type.WARNING
                title = "Payment Due Today"
                message = f"Your invoice {invoice.invoice_number} is due today. Balance: ₦{balance:,.2f}"
            else:
                # Upcoming (1-3 days)
                template_key = "payment_reminder"
                notification_type = Notification.Type.WARNING
                title = "Payment Reminder"
                message = f"Your invoice {invoice.invoice_number} is due in {days_until_due} days. Balance: ₦{balance:,.2f}"
            
            # Send email
            EmailService.send_template(
                to=user.email,
                template_key=template_key,
                context={
                    "user_name": user.get_full_name(),
                    "invoice_number": invoice.invoice_number,
                    "balance": balance,
                    "due_date": invoice.due_date.strftime("%B %d, %Y"),
                    "days_until_due": days_until_due,
                    "session": str(invoice.enrollment.session),
                    "level": invoice.enrollment.level.name,
                },
                user=user
            )
            
            # Create in-app notification
            Notification.objects.create(
                user=user,
                type=notification_type,
                category=Notification.Category.BILLING,
                title=title,
                message=message,
                action_url=f"/invoices/{invoice.id}",
                action_label="View Invoice"
            )
            
            logger.info(f"Sent reminder for invoice {invoice.invoice_number} to {user.email}")
        
        except Exception as e:
            logger.error(f"Failed to send reminder for invoice {invoice.id}: {e}")
    
    return f"Processed {invoices_to_remind.count()} invoice reminders"