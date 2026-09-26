import csv
from datetime import timedelta
from django.db.models import Count, Q
from django.http import HttpResponse
from django.utils import timezone
from rest_framework import generics, permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from users.permissions import IsStaffOrAbove

from .models import AuditLog
from .serializers import AuditLogSerializer


class AuditLogListView(generics.ListAPIView):
    serializer_class = AuditLogSerializer
    permission_classes = [IsStaffOrAbove]
    filterset_fields = ["actor"]
    search_fields = [
        "entity_id",
        "action",
        "entity_type",
        "actor__email",
        "actor__staff_profile__first_name",
        "actor__staff_profile__last_name",
    ]
    ordering_fields = ["created_at"]

    def get_queryset(self):
        qs = AuditLog.objects.select_related("actor").all()

        action = self.request.query_params.get("action")
        entity_type = self.request.query_params.get("entity_type")
        category = self.request.query_params.get("category")
        date_from = self.request.query_params.get("date_from") or self.request.query_params.get("start_date")
        date_to = self.request.query_params.get("date_to") or self.request.query_params.get("end_date")

        if action:
            qs = qs.filter(action__iexact=action)
        if entity_type:
            qs = qs.filter(entity_type__iexact=entity_type)
        if category and category.lower() != "all":
            cat = category.lower()
            if cat == "finance":
                qs = qs.filter(entity_type__in=["Payment", "Invoice", "FeeStructure", "Refund", "payment", "invoice", "fee_structure", "refund"])
            elif cat == "students":
                qs = qs.filter(entity_type__in=["StudentProfile", "Student", "Enrollment", "EnrollmentCourse", "student", "enrollment"])
            elif cat == "academic":
                qs = qs.filter(entity_type__in=["Course", "CourseOffering", "Schedule", "Class", "AttendanceSession", "course", "schedule", "attendance_session"])
            elif cat == "admin":
                qs = qs.filter(entity_type__in=["User", "Role", "StaffProfile", "user", "role", "staff_profile"])
            elif cat == "system":
                qs = qs.filter(entity_type__in=["PaystackWebhook", "SystemSettings", "paystack_webhook"])
            elif cat == "communication":
                qs = qs.filter(entity_type__in=["Announcement", "Notification", "announcement", "notification"])

        if date_from:
            qs = qs.filter(created_at__gte=date_from)
        if date_to:
            qs = qs.filter(created_at__lte=date_to)

        return qs



class AuditLogStatsView(APIView):
    permission_classes = [IsStaffOrAbove]

    def get(self, request):
        now = timezone.now()
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)

        total_actions = AuditLog.objects.count()
        today_actions = AuditLog.objects.filter(created_at__gte=today_start).count()

        finance_actions = AuditLog.objects.filter(
            entity_type__in=["Payment", "Invoice", "FeeStructure", "payment", "invoice", "fee_structure"]
        ).count()

        sensitive_changes = AuditLog.objects.filter(
            action__in=["DELETE", "VERIFY", "REFUND", "REJECT", "delete", "verify", "refund", "reject"]
        ).count()

        # Actions breakdown
        by_action_qs = AuditLog.objects.values("action").annotate(count=Count("id")).order_by("-count")
        by_action = [{"action": item["action"], "count": item["count"]} for item in by_action_qs]

        # Entity breakdown
        by_entity_qs = AuditLog.objects.values("entity_type").annotate(count=Count("id")).order_by("-count")
        by_entity = [{"entity_type": item["entity_type"], "count": item["count"]} for item in by_entity_qs]

        # Actor breakdown
        by_actor_qs = (
            AuditLog.objects.filter(actor__isnull=False)
            .values("actor__id", "actor__email")
            .annotate(count=Count("id"))
            .order_by("-count")[:10]
        )
        by_actor = [
            {"actor_id": str(item["actor__id"]), "actor_email": item["actor__email"], "count": item["count"]}
            for item in by_actor_qs
        ]

        # Past 7 days trend
        last_7_days = []
        for i in range(6, -1, -1):
            day_date = (now - timedelta(days=i)).date()
            cnt = AuditLog.objects.filter(created_at__date=day_date).count()
            last_7_days.append({
                "date": day_date.strftime("%Y-%m-%d"),
                "count": cnt,
            })

        return Response({
            "total_actions": total_actions,
            "today_actions": today_actions,
            "finance_actions": finance_actions,
            "sensitive_changes": sensitive_changes,
            "by_action": by_action,
            "by_entity": by_entity,
            "by_actor": by_actor,
            "last_7_days": last_7_days,
        })



class AuditLogExportView(APIView):
    permission_classes = [IsStaffOrAbove]

    def get(self, request):
        qs = AuditLog.objects.select_related("actor").all()

        action = request.query_params.get("action")
        entity_type = request.query_params.get("entity_type")
        search = request.query_params.get("search")
        date_from = request.query_params.get("date_from") or request.query_params.get("start_date")
        date_to = request.query_params.get("date_to") or request.query_params.get("end_date")

        if action:
            qs = qs.filter(action__iexact=action)
        if entity_type:
            qs = qs.filter(entity_type__iexact=entity_type)
        if search:
            qs = qs.filter(
                Q(entity_id__icontains=search)
                | Q(action__icontains=search)
                | Q(entity_type__icontains=search)
                | Q(actor__email__icontains=search)
            )
        if date_from:
            qs = qs.filter(created_at__gte=date_from)
        if date_to:
            qs = qs.filter(created_at__lte=date_to)

        # Build data rows as list-of-dicts for shared export utilities
        data = []
        for log in qs[:5000]:
            data.append({
                "ID": str(log.id),
                "Timestamp": log.created_at.strftime("%Y-%m-%d %H:%M:%S") if log.created_at else "",
                "Actor Email": log.actor.email if log.actor else "System",
                "Action": log.action,
                "Entity Type": log.entity_type,
                "Entity ID": log.entity_id or "",
                "IP Address": log.ip_address or "",
            })

        export_format = (
            request.query_params.get("export_format")
            or request.query_params.get("format", "csv")
        ).lower()

        from datetime import datetime as _dt
        filename_base = f'audit_logs_{_dt.now().strftime("%Y%m%d")}'
        title = "Audit Log Export"

        if export_format == "pdf":
            from reports.utils import export_to_pdf
            return export_to_pdf(data, f"{filename_base}.pdf", title=title)

        if export_format == "excel":
            from reports.utils import export_to_excel
            return export_to_excel(data, f"{filename_base}.xlsx", title=title)

        # Default: CSV (backwards-compatible)
        response = HttpResponse(content_type="text/csv")
        response["Content-Disposition"] = f'attachment; filename="{filename_base}.csv"'

        writer = csv.writer(response)
        if data:
            writer.writerow(data[0].keys())
            for row in data:
                writer.writerow(row.values())
        else:
            writer.writerow(["ID", "Timestamp", "Actor Email", "Action", "Entity Type", "Entity ID", "IP Address"])

        return response

