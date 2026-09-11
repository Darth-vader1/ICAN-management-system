from rest_framework import serializers

from .models import AuditLog


class AuditLogSerializer(serializers.ModelSerializer):
    actor_email = serializers.EmailField(source="actor.email", read_only=True, default=None)
    actor_name = serializers.SerializerMethodField()
    actor_initials = serializers.SerializerMethodField()
    actor_role = serializers.CharField(source="actor.role", read_only=True, default=None)
    timestamp = serializers.DateTimeField(source="created_at", read_only=True)
    description = serializers.SerializerMethodField()

    class Meta:
        model = AuditLog
        fields = [
            "id",
            "actor",
            "actor_email",
            "actor_name",
            "actor_initials",
            "actor_role",
            "action",
            "entity_type",
            "entity_id",
            "description",
            "old_value",
            "new_value",
            "ip_address",
            "created_at",
            "timestamp",
        ]
        read_only_fields = fields

    def get_actor_name(self, obj):
        if not obj.actor:
            return "System"

        if hasattr(obj.actor, "staff_profile") and obj.actor.staff_profile:
            fn = getattr(obj.actor.staff_profile, "first_name", "")
            ln = getattr(obj.actor.staff_profile, "last_name", "")
            full_name = f"{fn} {ln}".strip()
            if full_name:
                return full_name

        if hasattr(obj.actor, "student_profile") and obj.actor.student_profile:
            fn = getattr(obj.actor.student_profile, "first_name", "")
            ln = getattr(obj.actor.student_profile, "last_name", "")
            full_name = f"{fn} {ln}".strip()
            if full_name:
                return full_name

        return obj.actor.email

    def get_actor_initials(self, obj):
        name = self.get_actor_name(obj)
        parts = name.split()
        if len(parts) >= 2:
            return f"{parts[0][0]}{parts[1][0]}".upper()
        return name[:2].upper()

    def get_description(self, obj):
        if obj.new_value and isinstance(obj.new_value, dict) and "description" in obj.new_value:
            return str(obj.new_value["description"])

        action = (obj.action or "").replace("_", " ").title()
        entity = (obj.entity_type or "").replace("_", " ")
        actor = self.get_actor_name(obj)
        entity_id = f"#{obj.entity_id[:8]}" if obj.entity_id else ""

        return f"{action} action performed on {entity} {entity_id} by {actor}".strip()

