import os

from celery import Celery

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

app = Celery("ican_platform")
app.config_from_object("django.conf:settings", namespace="CELERY")
app.autodiscover_tasks()

app.conf.beat_schedule = {
    "scan-payment-reminders-daily": {
        "task": "apps.communications.tasks.scan_and_send_payment_reminders",
        "schedule": 3600.0 * 6,  # every 6 hours
    },
    "cleanup-stale-classroom-sessions": {
        "task": "classroom.tasks.cleanup_stale_classroom_sessions",
        "schedule": 1800.0,  # every 30 minutes
    },
}