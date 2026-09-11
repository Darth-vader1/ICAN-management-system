from django.urls import path

from .views import AuditLogExportView, AuditLogListView, AuditLogStatsView

urlpatterns = [
    path("", AuditLogListView.as_view(), name="audit-log-list"),
    path("stats/", AuditLogStatsView.as_view(), name="audit-log-stats"),
    path("export/", AuditLogExportView.as_view(), name="audit-log-export"),
]