from rest_framework import serializers

from .models import StudentProfile


class StudentProfileSerializer(serializers.ModelSerializer):
    """Serializer for student profile details."""

    user_email = serializers.EmailField(source="user.email", read_only=True)
    user_phone = serializers.CharField(source="user.phone", read_only=True)
    full_name = serializers.CharField(read_only=True)

    class Meta:
        model = StudentProfile
        fields = [
            "id",
            "user",
            "user_email",
            "user_phone",
            "student_code",
            "first_name",
            "last_name",
            "other_name",
            "full_name",
            "date_of_birth",
            "gender",
            "whatsapp_number",
            "address",
            "ican_exam_id",
            "emergency_contact_name",
            "emergency_contact_phone",
            "emergency_contact_relationship",
            "photo",
            "is_active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "student_code", "user", "created_at", "updated_at"]


class StudentProfileListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for listing students."""

    user_email = serializers.EmailField(source="user.email", read_only=True)
    full_name = serializers.CharField(read_only=True)

    class Meta:
        model = StudentProfile
        fields = [
            "id",
            "student_code",
            "full_name",
            "user_email",
            "ican_exam_id",
            "is_active",
            "created_at",
        ]
