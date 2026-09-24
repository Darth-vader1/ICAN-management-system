"""
Authentication backends for the ICAN platform.

CookieOrHeaderJWTAuthentication
-------------------------------
A drop-in replacement for DRF SimpleJWT's stock JWTAuthentication that reads
the access token from an HttpOnly cookie *before* checking the
``Authorization: Bearer …`` header. Cookies cannot be read by malicious
scripts on the page, which eliminates the primary XSS→token-exfiltration
vector that exists when tokens are held in ``localStorage``.

The fallback to the standard header allows mobile/third-party API consumers
that cannot attach cookies to continue to work without changes.
"""
from __future__ import annotations

from typing import Optional, Tuple

from django.conf import settings as _settings
from django.http import HttpRequest
from rest_framework.request import Request
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.tokens import Token
from rest_framework_simplejwt.exceptions import AuthenticationFailed, InvalidToken


def _cookie_name() -> str:
    return (
        getattr(_settings, "SIMPLE_JWT", {}).get("AUTH_COOKIE")
        or "access_token"
    )


class CookieOrHeaderJWTAuthentication(JWTAuthentication):
    """Authenticate via HttpOnly cookie first, Authorization header second."""

    def get_header(self, request: Request) -> bytes:
        header = super().get_header(request)
        if header:
            return header

        cookie_token = self._get_cookie_token(request)
        if cookie_token:
            # Re-compose a synthetic Bearer header so the rest of the parent
            # class pipeline (validate_authorization_header, get_raw_token,
            # get_validated_token, get_user) works without further patching.
            return f"Bearer {cookie_token}".encode("utf-8")

        return b""

    @staticmethod
    def _get_cookie_token(request: Request) -> Optional[str]:
        name = _cookie_name()
        value = request.COOKIES.get(name)
        if isinstance(value, str) and value:
            return value.strip()
        return None

    def get_validated_token(self, raw_token: bytes) -> Token:
        try:
            return super().get_validated_token(raw_token)
        except InvalidToken as exc:
            raise AuthenticationFailed(
                "Invalid or expired authentication token. Please re-authenticate.",
                code="invalid_token",
            ) from exc

    def authenticate(self, request: Request) -> Optional[Tuple]:
        result = super().authenticate(request)
        if result is None:
            # Do not expose whether the cookie was set vs missing — treat both
            # the same way so attackers cannot enumerate valid cookies by
            # response body.
            return None
        return result
