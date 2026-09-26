"""
Rate Limiting Decorators for ICAN Platform
Protects endpoints from abuse
"""
from __future__ import annotations

from functools import wraps
from typing import Callable

from django_ratelimit.decorators import ratelimit
from rest_framework import status
from rest_framework.response import Response


def rate_limit_key_user_or_ip(*args, **kwargs) -> str:
    """
    django-ratelimit ``key`` callable: authenticated user PK else client IP.
    Accepts (request, view=None, *args, **kwargs) or (group, request) signatures.
    """
    req = None
    for arg in args:
        if hasattr(arg, "META") or hasattr(arg, "user"):
            req = arg
            break
    if req is None:
        req = kwargs.get("request", None)

    if req is None:
        return "ip:0.0.0.0"

    user = getattr(req, "user", None)
    if user is not None and getattr(user, "is_authenticated", False) and getattr(user, "pk", None):
        return f"user:{user.pk}"
    addr = (
        req.META.get("HTTP_X_FORWARDED_FOR", req.META.get("REMOTE_ADDR", "0.0.0.0"))
        if hasattr(req, "META") else "0.0.0.0"
    ) or "0.0.0.0"
    return f"ip:{addr.split(',')[0].strip()}"



import logging

logger = logging.getLogger(__name__)


def rate_limit_view(rate: str = "5/m", method: str = "POST", key: str | Callable = "ip"):
    """
    Custom rate limit decorator for DRF views.

    Args:
        rate: Rate limit (e.g. ``'5/m'`` = 5 per minute).
        method: HTTP method to rate limit.
        key: String shortcut (``ip`` / ``user``) or a callable ``(request) -> str``
            such as ``rate_limit_key_user_or_ip``.
    """
    def decorator(view_func):
        @wraps(view_func)
        def wrapped_view(*args, **kwargs):
            # Locate the HttpRequest object in args/kwargs (handles both func(request) and method(self, request))
            request = None
            for arg in args:
                if hasattr(arg, "META"):
                    request = arg
                    break
            if request is None:
                request = kwargs.get("request")

            try:
                ratelimited = ratelimit(key=key, rate=rate, method=method, block=False)(view_func)
                response = ratelimited(*args, **kwargs)
                if request is not None and getattr(request, "limited", False):
                    return Response(
                        {
                            "detail": "Too many requests. Please try again later.",
                            "error_code": "RATE_LIMIT_EXCEEDED",
                        },
                        status=status.HTTP_429_TOO_MANY_REQUESTS,
                    )
                return response
            except Exception as exc:
                # If cache backend is unavailable or connection refused, fail open with warning
                logger.warning("Rate limit check failed, allowing request through: %s", exc)
                return view_func(*args, **kwargs)

        return wrapped_view
    return decorator


def login_rate_limit(view_func):
    """5 login attempts per minute per IP (anti brute-force)."""
    return rate_limit_view(rate="5/m", method="POST", key="ip")(view_func)


def registration_rate_limit(view_func):
    """3 new accounts per hour per IP (anti-bot)."""
    return rate_limit_view(rate="3/h", method="POST", key="ip")(view_func)


def payment_rate_limit(view_func):
    """10 payment-init attempts per minute per user-or-IP."""
    return rate_limit_view(
        rate="10/m", method="POST", key=rate_limit_key_user_or_ip
    )(view_func)


def api_rate_limit(view_func):
    """60 general API calls per minute per user-or-IP."""
    return rate_limit_view(
        rate="60/m", method="ALL", key=rate_limit_key_user_or_ip
    )(view_func)


def strict_rate_limit(view_func):
    """3 sensitive operations per hour per user-or-IP (password reset, etc)."""
    return rate_limit_view(
        rate="3/h", method="ALL", key=rate_limit_key_user_or_ip
    )(view_func)
