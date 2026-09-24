"""
Probe (H12) and CSP report (H11) endpoints exposed by config/urls.py.

* /api/healthz   liveness — 200 OK always.
* /api/livez     alias for /api/healthz.
* /api/readyz    readiness — DB SELECT 1, Redis PING, Celery ping, Paystack ping.
* /api/security/csp-report/  — AllowAny @csrf_exempt JSON logger for CSP report-uri.
"""

from __future__ import annotations

import json
import logging
from typing import Any

from django.conf import settings
from django.db import connections
from django.http import HttpRequest, HttpResponse, JsonResponse
from django.utils.decorators import method_decorator
from django.views import View
from django.views.decorators.csrf import csrf_exempt
from rest_framework import permissions, status
from rest_framework.views import APIView

logger = logging.getLogger("django.security.csp")
_health_logger = logging.getLogger(__name__)


def _try_db_check(using: str = "default") -> tuple[bool, str]:
    try:
        with connections[using].cursor() as cursor:
            cursor.execute("SELECT 1;")
            row = cursor.fetchone()
        if row and row[0] == 1:
            return True, "ok"
        return False, f"unexpected SELECT 1 result: {row!r}"
    except Exception as exc:  # pragma: no cover - environment-dependent
        return False, f"{type(exc).__name__}: {exc}"


def _try_redis_ping() -> tuple[bool, str]:
    try:
        from django_redis import get_redis_connection
        conn = get_redis_connection("default")
        ok = conn.ping()
        return bool(ok), "ok" if ok else "redis ping returned false"
    except ImportError:
        return True, "skipped (django_redis not installed)"
    except Exception as exc:
        return False, f"{type(exc).__name__}: {exc}"


def _try_celery_ping(timeout_s: float = 2.0) -> tuple[bool, str]:
    try:
        from .celery import app as celery_app
        if celery_app is None:
            return True, "skipped (celery not configured)"
        inspect = celery_app.control.inspect(timeout=timeout_s)
        replies = inspect.ping() or {}
        if replies:
            hosts = ",".join(sorted(replies.keys()))
            return True, f"ok ({hosts})"
        return False, "no celery workers replied"
    except ImportError:
        return True, "skipped (celery not installed)"
    except Exception as exc:
        return False, f"{type(exc).__name__}: {exc}"


def _try_paystack_ping() -> tuple[bool, str]:
    try:
        from payments.paystack import PaystackClient
        secret = getattr(settings, "PAYSTACK_SECRET_KEY", "")
        if not secret:
            return True, "skipped (PAYSTACK_SECRET_KEY not set)"
        client = PaystackClient(secret_key=secret)
        try:
            client.list_banks(perPage=1)
        except Exception:
            from payments.paystack import PaystackClient as _PC
            alt = _PC(secret_key=secret)
            try:
                alt.list_banks(perPage=1)
            except Exception as exc2:
                return False, f"{type(exc2).__name__}: {exc2}"
        return True, "ok"
    except ImportError:
        return True, "skipped (payments.paystack not importable)"
    except Exception as exc:
        return False, f"{type(exc).__name__}: {exc}"


class HealthLivenessView(APIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def get(self, request: HttpRequest) -> HttpResponse:
        payload = {
            "status": "ok",
            "service": "ican-management-platform",
        }
        return JsonResponse(payload, status=status.HTTP_200_OK)


class HealthReadinessView(APIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def get(self, request: HttpRequest) -> HttpResponse:
        db_ok, db_msg = _try_db_check()
        redis_ok, redis_msg = _try_redis_ping()
        celery_ok, celery_msg = _try_celery_ping()
        paystack_ok, paystack_msg = _try_paystack_ping()

        all_ok = db_ok and redis_ok and celery_ok and paystack_ok

        payload: dict[str, Any] = {
            "status": "ok" if all_ok else "degraded",
            "checks": {
                "database": {"status": "ok" if db_ok else "fail", "detail": db_msg},
                "redis": {"status": "ok" if redis_ok else "fail", "detail": redis_msg},
                "celery": {"status": "ok" if celery_ok else "fail", "detail": celery_msg},
                "paystack": {"status": "ok" if paystack_ok else "fail", "detail": paystack_msg},
            },
        }

        code = status.HTTP_200_OK if all_ok else status.HTTP_503_SERVICE_UNAVAILABLE
        return JsonResponse(payload, status=code)


@method_decorator(csrf_exempt, name="dispatch")
class CSPReportView(View):
    """
    Receives Content-Security-Policy report-uri / report-to payloads.

    Logs the report body under ``django.security.csp`` without throwing an
    error so that the browser always receives a 204 No Content.
    """

    http_method_names = ["post", "head", "options"]

    def post(self, request: HttpRequest, *args: Any, **kwargs: Any) -> HttpResponse:
        content_length = int(request.headers.get("Content-Length") or 0)
        if content_length and content_length > 64 * 1024:
            return HttpResponse(status=204)
        raw = request.body
        if not raw:
            return HttpResponse(status=204)
        body: Any
        try:
            body = json.loads(raw.decode("utf-8"))
        except (ValueError, UnicodeDecodeError):
            logger.warning("CSP report received but failed JSON decode: %d bytes", len(raw))
            return HttpResponse(status=204)

        report = body.get("csp-report") if isinstance(body, dict) else None
        if isinstance(report, dict):
            logger.warning(
                "csp-report violated-directive=%s blocked-uri=%s original-policy=%s document-uri=%s",
                report.get("violated-directive", ""),
                report.get("blocked-uri", ""),
                report.get("original-policy", ""),
                report.get("document-uri", ""),
                extra={"csp_report": report},
            )
        else:
            logger.warning("CSP report format unexpected: %r", body)

        return HttpResponse(status=204)
