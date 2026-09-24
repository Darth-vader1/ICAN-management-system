"""
Security Middleware for ICAN Platform
Implements security headers, CSP tightening, and sensitive data redaction.
"""

import json
import logging
import re
from typing import Any, Iterable

from django.conf import settings
from django.http import HttpResponse

logger = logging.getLogger(__name__)

REDACTION_MARKER = "[REDACTED]"

_SENSITIVE_FIELDS_BASE: frozenset[str] = frozenset(
    {
        "password",
        "new_password",
        "password_confirm",
        "current_password",
        "old_password",
        "token",
        "refresh",
        "access",
        "secret",
        "api_key",
        "apikey",
        "cv",
        "cvv",
        "cvc",
        "credit_card",
        "card_number",
        "cardnumber",
        "pin",
        "authorization",
        "authorization_bearer",
        "ssn",
        "nin",
        "bvn",
        "account_number",
        "routing_number",
    }
)

_SENSITIVE_PATTERNS: tuple[re.Pattern[str], ...] = tuple(
    re.compile(p, re.IGNORECASE)
    for p in (
        r"\bpassword\b",
        r"\btoken\b",
        r"\bsecret\b",
        r"\bcvv\b",
        r"\bcard[_ ]?number\b",
        r"\bapi[_ ]?key\b",
        r"\bauthorization\b",
    )
)


def _is_sensitive_key(key: Any) -> bool:
    if not isinstance(key, str):
        return False
    k = key.strip().lower()
    if k in _SENSITIVE_FIELDS_BASE:
        return True
    return any(p.search(k) for p in _SENSITIVE_PATTERNS)


def _redact_value(value: Any) -> Any:
    return REDACTION_MARKER


def _redact_collection(obj: Any) -> Any:
    if isinstance(obj, dict):
        return {
            k: (_redact_value(v) if _is_sensitive_key(k) else _redact_collection(v))
            for k, v in obj.items()
        }
    if isinstance(obj, list):
        return [_redact_collection(item) for item in obj]
    if isinstance(obj, tuple):
        return tuple(_redact_collection(item) for item in obj)
    return obj


def _redact_text(text: str) -> str:
    if not isinstance(text, str) or not text:
        return text
    lowered = text.lower()
    for pattern in _SENSITIVE_PATTERNS:
        for m in pattern.finditer(text):
            start = m.end()
            tail = text[start:]
            value_match = re.search(
                r"[:=]\s*[\"']?([^\"',\s}\]]+)", tail, re.IGNORECASE
            )
            if value_match:
                whole = value_match.group(0)
                val = value_match.group(1)
                if val and val not in ("null", "true", "false", "none"):
                    text = text.replace(whole, whole[: -len(val)] + REDACTION_MARKER)
    return text


class SecurityHeadersMiddleware:
    """
    Add security-related HTTP headers to all responses.

    H11 behavior:
    * ``'unsafe-eval'`` is emitted only when ``settings.DEBUG`` is True.
    * Every CSP carries a ``report-uri`` pointing at ``/api/security/csp-report/``.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    @staticmethod
    def _build_csp() -> str:
        debug = getattr(settings, "DEBUG", False)
        script_src_unsafe_eval = " 'unsafe-eval'" if debug else ""
        report_uri = "/api/security/csp-report/"
        return (
            "default-src 'self'; "
            f"script-src 'self' 'unsafe-inline'{script_src_unsafe_eval} https://js.paystack.co; "
            "style-src 'self' 'unsafe-inline'; "
            "img-src 'self' data: https:; "
            "font-src 'self' data:; "
            "connect-src 'self' https://api.paystack.co ws: wss:; "
            "frame-src https://checkout.paystack.com; "
            "object-src 'none'; "
            "base-uri 'self'; "
            "form-action 'self'; "
            "frame-ancestors 'none'; "
            f"report-uri {report_uri}; "
            f"report-to csp-endpoint;"
        )

    def __call__(self, request):
        response = self.get_response(request)

        if not response.get("X-Frame-Options"):
            response["X-Frame-Options"] = "DENY"

        if not response.get("X-Content-Type-Options"):
            response["X-Content-Type-Options"] = "nosniff"

        if not response.get("X-XSS-Protection"):
            response["X-XSS-Protection"] = "1; mode=block"

        if not response.get("Referrer-Policy"):
            response["Referrer-Policy"] = "strict-origin-when-cross-origin"

        if not response.get("Content-Security-Policy"):
            response["Content-Security-Policy"] = self._build_csp()

        if not response.get("Permissions-Policy"):
            response["Permissions-Policy"] = (
                "geolocation=(), microphone=(), camera=(), payment=(self)"
            )

        if not response.get("Strict-Transport-Security") and not getattr(
            settings, "DEBUG", False
        ):
            response["Strict-Transport-Security"] = (
                "max-age=63072000; includeSubDomains; preload"
            )

        if not response.get("Cross-Origin-Opener-Policy"):
            response["Cross-Origin-Opener-Policy"] = "same-origin"

        return response


class SensitiveDataMiddleware:
    """
    Redact sensitive fields from:
    * Logging of request bodies (via ``request.sensitive_body`` copy)
    * Exception messages (``process_exception``)
    * 4xx/5xx JSON response bodies before rendering to the user/logs.
    """

    def __init__(self, get_response):
        self.get_response = get_response
        self.max_body_size = 1024 * 512

    @staticmethod
    def _parse_json_body(body: bytes) -> Any | None:
        try:
            return json.loads(body.decode("utf-8"))
        except (ValueError, UnicodeDecodeError):
            return None

    def _attach_sensitive_body(self, request) -> None:
        try:
            raw = request.body
        except Exception:
            return
        if not raw or len(raw) > self.max_body_size:
            request.safe_body = None
            return
        parsed = self._parse_json_body(raw)
        if parsed is None:
            text = raw.decode("utf-8", errors="replace")
            request.safe_body = _redact_text(text)
            return
        request.safe_body = _redact_collection(parsed)

    def __call__(self, request):
        self._attach_sensitive_body(request)

        response = self.get_response(request)

        status = getattr(response, "status_code", 200)
        if status >= 400 and status < 600:
            try:
                content_type = response.get("Content-Type", "") or ""
                if "json" in content_type.lower() and getattr(response, "content", b""):
                    raw = response.content
                    if raw and len(raw) <= self.max_body_size:
                        parsed = self._parse_json_body(raw)
                        if parsed is not None:
                            redacted = _redact_collection(parsed)
                            try:
                                response.content = json.dumps(redacted).encode("utf-8")
                            except Exception:
                                pass
            except Exception as exc:
                logger.warning(
                    "SensitiveDataMiddleware failed to redact response body: %s",
                    str(exc),
                )
        return response

    def process_exception(self, request, exception):
        try:
            exc_args = []
            for arg in getattr(exception, "args", []) or []:
                if isinstance(arg, str):
                    exc_args.append(_redact_text(arg))
                elif isinstance(arg, (dict, list, tuple)):
                    exc_args.append(_redact_collection(arg))
                else:
                    exc_args.append(arg)
            if exc_args and exc_args != list(exception.args):
                try:
                    exception.args = tuple(exc_args)
                except Exception:
                    pass
        except Exception as exc:
            logger.warning(
                "SensitiveDataMiddleware failed to redact exception args: %s",
                str(exc),
            )
        return None
