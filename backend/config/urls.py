from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/auth/", include("users.urls")),
    path("api/students/", include("students.urls")),
    path("api/academics/", include("academics.urls")),
    path("api/enrollments/", include("enrollments.urls")),
    path("api/billing/", include("billing.urls")),
    path("api/payments/", include("payments.urls")),
    path("api/attendance/", include("attendance.urls")),
    path("api/notifications/", include("notifications.urls")),
    path("api/reports/", include("reports.urls")),
    path("api/audit-logs/", include("audit.urls")),
    path("api/classrooms/", include("classroom.urls")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)