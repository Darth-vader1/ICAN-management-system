from rest_framework import generics

from users.permissions import IsITAdminOrAbove

from .models import AuditLog
from .serializers import AuditLogSerializer


class AuditLogListView(generics.ListAPIView):
    queryset = AuditLog.objects.select_related("actor").all()
    serializer_class = AuditLogSerializer
    permission_classes = [IsITAdminOrAbove]
    filterset_fields = ["action", "entity_type", "actor"]
    search_fields = ["entity_id", "action"]
    ordering_fields = ["created_at"]