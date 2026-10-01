from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path

from .views import (
    CSPReportView,
    HealthLivenessView,
    HealthReadinessView,
)

urlpatterns = [
    path('', root), 
    path("admin/", admin.site.urls),
    path("api/auth/", include("users.urls")),
    path("api/users/", include("users.urls")),
    path("api/students/", include("students.urls")),
    path("api/academics/", include("academics.urls")),
    path("api/enrollments/", include("enrollments.urls")),
    path("api/billing/", include("billing.urls")),
    path("api/payments/", include("payments.urls")),
    path("api/attendance/", include("attendance.urls")),
    path("api/notifications/", include("notifications.urls")),
    path("api/reports/", include("reports.urls")),
    path("api/audit-logs/", include("audit.urls")),
    path("api/audit/", include("audit.urls")),
    path("api/classrooms/", include("classroom.urls")),
    path("api/healthz/", HealthLivenessView.as_view(), name="health-liveness"),
    path("api/livez/", HealthLivenessView.as_view(), name="health-liveness-alias"),
    path("api/readyz/", HealthReadinessView.as_view(), name="health-readiness"),
    path("api/security/csp-report/", CSPReportView.as_view(), name="csp-report"),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)