import os

try:
    from celery import Celery
    CELERY_AVAILABLE = True
except ImportError:  # pragma: no cover - defensive guard for env without celery
    Celery = None  # type: ignore
    CELERY_AVAILABLE = False

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

if CELERY_AVAILABLE and Celery:
    app = Celery("ican_platform")
    app.config_from_object("django.conf:settings", namespace="CELERY")
    app.autodiscover_tasks()

    app.conf.beat_schedule = {
        "scan-payment-reminders-daily": {
            "task": "notifications.tasks.scan_and_send_payment_reminders",
            "schedule": 3600.0 * 6,  # every 6 hours
        },
        "cleanup-stale-classroom-sessions": {
            "task": "classroom.tasks.cleanup_stale_classroom_sessions",
            "schedule": 1800.0,  # every 30 minutes
        },
    }


    @app.on_after_configure.connect
    def _validate_beat_tasks_on_startup(**_kwargs):
        """
        Fail-fast validation of every Celery beat scheduled task.

        Runs AFTER Celery/Django configuration is loaded and all apps are
        importable, so task module imports succeed. If any dotted task path
        is not importable we raise RuntimeError to prevent silent task
        outages where beat runs successfully but no scheduled task fires.
        """
        import importlib
        import logging

        logger = logging.getLogger(__name__)
        beat_schedule = app.conf.beat_schedule or {}
        for name, entry in beat_schedule.items():
            task_path = entry.get("task") if isinstance(entry, dict) else None
            if not task_path:
                continue
            module_path, _, func_name = task_path.rpartition(".")
            try:
                mod = importlib.import_module(module_path)
                getattr(mod, func_name)
            except (ImportError, AttributeError) as exc:
                raise RuntimeError(
                    f"Celery beat task validation FAILED for entry '{name!r}': "
                    f"cannot import task {task_path!r} ({exc}). "
                    f"Beat schedule aborted to prevent silent task outages."
                ) from exc
            logger.info("Celery beat task validated: entry=%s task=%s", name, task_path)
else:
    # Celery not available, create a None app for graceful degradation
    app = None  # type: ignore
    import logging
    logging.getLogger(__name__).warning(
        "Celery is not installed. Async task scheduling is disabled. "
        "Install celery to enable background task processing."
    )