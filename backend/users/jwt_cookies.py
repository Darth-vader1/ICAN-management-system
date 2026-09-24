"""
Helpers for setting / clearing the HttpOnly JWT access + refresh cookies on
Django ``HttpResponse`` / ``rest_framework.response.Response`` objects.

Centralising cookie construction in a single module guarantees the set of
flags matches the SIMPLE_JWT configuration everywhere (login, register,
refresh, token rotation, etc.) and removes a whole class of copy-paste bugs.
"""
from __future__ import annotations

from datetime import timedelta
from typing import Any

from django.conf import settings as _django_settings
from django.http import HttpResponse


def _jwt_conf() -> dict:
    return dict(getattr(_django_settings, "SIMPLE_JWT", {}) or {})


def _cookie_params(*, is_refresh: bool) -> dict:
    conf = _jwt_conf()
    access_lifetime: timedelta = conf.get(
        "ACCESS_TOKEN_LIFETIME", timedelta(minutes=30)
    )
    refresh_lifetime: timedelta = conf.get(
        "REFRESH_TOKEN_LIFETIME", timedelta(days=7)
    )
    lifetime = refresh_lifetime if is_refresh else access_lifetime
    return {
        "max_age": int(lifetime.total_seconds()),
        "expires": None,
        "path": conf.get("AUTH_COOKIE_PATH", "/"),
        "domain": conf.get("AUTH_COOKIE_DOMAIN") or None,
        "secure": bool(conf.get("AUTH_COOKIE_SECURE", not _django_settings.DEBUG)),
        "httponly": bool(conf.get("AUTH_COOKIE_HTTP_ONLY", True)),
        "samesite": conf.get("AUTH_COOKIE_SAMESITE", "Lax"),
    }


def _access_cookie_name() -> str:
    return _jwt_conf().get("AUTH_COOKIE", "access_token")


def _refresh_cookie_name() -> str:
    return _jwt_conf().get("AUTH_COOKIE_REFRESH", "refresh_token")


def set_auth_cookies(
    response: HttpResponse,
    *,
    access: str,
    refresh: str | None = None,
) -> HttpResponse:
    """Attach HttpOnly access (and optionally refresh) JWT cookies to a response."""
    response.set_cookie(
        key=_access_cookie_name(),
        value=str(access),
        **_cookie_params(is_refresh=False),
    )
    if refresh is not None:
        response.set_cookie(
            key=_refresh_cookie_name(),
            value=str(refresh),
            **_cookie_params(is_refresh=True),
        )
    return response


def clear_auth_cookies(response: HttpResponse) -> HttpResponse:
    """Delete JWT access + refresh cookies on logout."""
    base: dict[str, Any] = {
        "path": _cookie_params(is_refresh=False)["path"],
    }
    domain = _cookie_params(is_refresh=False)["domain"]
    if domain:
        base["domain"] = domain
    response.delete_cookie(key=_access_cookie_name(), **base)
    response.delete_cookie(key=_refresh_cookie_name(), **base)
    # Also remove any legacy localStorage-era CSRF cookie to guarantee a clean
    # slate after explicit logout.
    response.delete_cookie(key="csrftoken", **base)
    return response


def refresh_token_from_request(request) -> str | None:
    """
    Locate a refresh token, preferring the HttpOnly cookie over the JSON body.

    This allows the Axios refresh interceptor to call ``POST /auth/refresh/``
    with an empty body; the cookie is sent automatically by the browser and
    we read it here without ever exposing the refresh token to JavaScript.
    """
    cookie_value = request.COOKIES.get(_refresh_cookie_name())
    if isinstance(cookie_value, str) and cookie_value.strip():
        return cookie_value.strip()
    body_value = getattr(request, "data", {}).get("refresh") if hasattr(request, "data") else None
    if isinstance(body_value, str) and body_value.strip():
        return body_value.strip()
    post_value = request.POST.get("refresh") if hasattr(request, "POST") else None
    if isinstance(post_value, str) and post_value.strip():
        return post_value.strip()
    return None
