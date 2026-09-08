from celery import shared_task


@shared_task
def send_password_reset_email(user_id: str, uid: str, token: str):
    from users.models import User

    from .services import EmailService

    user = User.objects.filter(id=user_id).first()
    if not user:
        return
    EmailService.send_template(
        to=user.email,
        template_key="password_reset",
        context={"uid": uid, "token": token},
    )


@shared_task
def scan_and_send_payment_reminders():
    """
    Placeholder for the Phase 6 reminder engine (spec §20). Wired into
    Celery beat in config/celery.py; implementation lands with the Billing
    phase once Invoice/Payment models exist.
    """
    return