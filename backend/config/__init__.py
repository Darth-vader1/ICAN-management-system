# config/__init__.py
# Defensively import celery_app so that `@shared_task` decorators resolve at
# runtime. If `celery` is not installed in the current environment (e.g. a
# developer running `manage.py makemigrations` on a machine without the queue
# dependencies) we fall back to `None` instead of crashing the entire Django
# import chain. Async task scheduling will simply be unavailable.
try:
    from .celery import app as celery_app  # noqa: F401
    __all__ = ("celery_app",)
except ImportError as _celery_import_exc:  # pragma: no cover - env dependent
    import logging as _logging

    _logging.getLogger(__name__).warning(
        "Celery is not installed in this environment; async task scheduling is "
        "disabled. Install requirements.txt to restore Celery support. (%s)",
        _celery_import_exc,
    )
    celery_app = None  # type: ignore[assignment]
    __all__ = ()