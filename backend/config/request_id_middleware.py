"""
M4 – X-Request-ID middleware.

Generates or adopts an ``X-Request-ID`` header so every request/response pair
carries a unique correlation ID.  The ID is also stored in ``threading.local``
so that logging formatters and Celery tasks can reference it.

Usage in log formatters:
    ``%(request_id)s``  →  pulled from the thread-local via ``RequestIDFilter``

Usage in Celery tasks:
    ``from config.request_id_middleware import get_request_id``
"""

from __future__ import annotations

import logging
import threading
import uuid

from django.http import HttpRequest, HttpResponse

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Thread-local storage
# ---------------------------------------------------------------------------
_request_id_var = threading.local()


def get_request_id() -> str | None:
    """Return the request ID bound to the current thread, or None."""
    return getattr(_request_id_var, "request_id", None)


def set_request_id(request_id: str) -> None:
    """Bind a request ID to the current thread."""
    _request_id_var.request_id = request_id


def clear_request_id() -> None:
    """Remove the request ID from the current thread."""
    _request_id_var.request_id = None


# ---------------------------------------------------------------------------
# Logging filter
# ---------------------------------------------------------------------------
class RequestIDFilter(logging.Filter):
    """
    Inject ``request_id`` into every log record.

    Add to ``settings.LOGGING['filters']``::

        'request_id': {
            '()': 'config.request_id_middleware.RequestIDFilter',
        }

    Then reference ``%(request_id)s`` in the formatter.
    """

    def filter(self, record: logging.LogRecord) -> bool:
        record.request_id = get_request_id() or "-"  # type: ignore[attr-defined]
        return True


# ---------------------------------------------------------------------------
# Django middleware
# ---------------------------------------------------------------------------
_HEADER = "X-Request-ID"
_META_KEY = "HTTP_X_REQUEST_ID"       # Django META convention
_MAX_ID_LEN = 64                       # Reject absurdly long client IDs
_VALID_CHARS = frozenset(
    "abcdefghijklmnopqrstuvwxyz"
    "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
    "0123456789-_."
)


def _sanitize_id(raw: str | None) -> str | None:
    """Return the upstream ID if it looks safe, else ``None``."""
    if not raw or len(raw) > _MAX_ID_LEN:
        return None
    if not all(c in _VALID_CHARS for c in raw):
        return None
    return raw


class RequestIDMiddleware:
    """
    Assign or adopt an ``X-Request-ID`` on every request.

    * If the inbound request carries a valid ``X-Request-ID`` header the value
      is reused (useful for gateway/load-balancer propagation).
    * Otherwise a new UUID4 is generated.
    * The ID is stored in ``request.request_id``, in thread-local storage,
      and echoed back on the response.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request: HttpRequest) -> HttpResponse:
        upstream = _sanitize_id(request.META.get(_META_KEY))
        request_id = upstream or uuid.uuid4().hex

        # Attach to request object (useful in views / audit logs)
        request.request_id = request_id  # type: ignore[attr-defined]

        # Store in thread-local for log filters and Celery task headers
        set_request_id(request_id)

        try:
            response = self.get_response(request)
            response[_HEADER] = request_id
            return response
        finally:
            clear_request_id()
