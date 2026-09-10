from django.contrib.auth import get_user_model
from django.db import transaction
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from students.models import StudentProfile

from .models import Role, StaffProfile

User = get_user_model()


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Custom JWT token that includes user role and profile info."""

    def validate(self, attrs):
        data = super().validate(attrs)
        # Add custom claims
        data["role"] = self.user.role
        data["email"] = self.user.email
        data["is_verified"] = self.user.is_verified
        return data


class StudentRegistrationSerializer(serializers.ModelSerializer):
    """Public student registration."""

    password = serializers.CharField(write_only=True, min_length=10)
    password_confirm = serializers.CharField(write_only=True)
    first_name = serializers.CharField(max_length=100, write_only=True)
    last_name = serializers.CharField(max_length=100, write_only=True)
    phone = serializers.CharField(max_length=20, required=True)

    class Meta:
        model = User
        fields = ["email", "password", "password_confirm", "phone", "first_name", "last_name"]

    def validate(self, attrs):
        print(f"=== SERIALIZER VALIDATION ===")
        print(f"Received fields: {list(attrs.keys())}")
        print(f"Values: {attrs}")
        print(f"============================")
        
        if attrs.get("password") != attrs.get("password_confirm"):
            raise serializers.ValidationError({"password_confirm": "Passwords do not match."})
        return attrs

    @transaction.atomic
    def create(self, validated_data):
        validated_data.pop("password_confirm", None)
        first_name = validated_data.pop("first_name")
        last_name = validated_data.pop("last_name")
        
        # Create user with student role
        user = User.objects.create_user(
            email=validated_data["email"],
            password=validated_data["password"],
            phone=validated_data["phone"],
            role=Role.STUDENT,
        )
        
        # Create student profile
        StudentProfile.objects.create(
            user=user,
            first_name=first_name,
            last_name=last_name,
        )
        
        return user


class StaffAccountSerializer(serializers.ModelSerializer):
    """Staff account provisioning by IT Admin."""

    password = serializers.CharField(write_only=True, min_length=10)
    first_name = serializers.CharField(max_length=100, write_only=True)
    last_name = serializers.CharField(max_length=100, write_only=True)
    department = serializers.CharField(max_length=100, required=False, allow_blank=True, write_only=True)

    class Meta:
        model = User
        fields = ["email", "password", "phone", "role", "first_name", "last_name", "department"]

    def validate_role(self, value):
        """Ensure only staff roles can be created via this endpoint."""
        if value == Role.STUDENT:
            raise serializers.ValidationError("Use student registration endpoint for student accounts.")
        return value

    def create(self, validated_data):
        first_name = validated_data.pop("first_name")
        last_name = validated_data.pop("last_name")
        department = validated_data.pop("department", "")
        
        # Create staff user
        user = User.objects.create_user(
            email=validated_data["email"],
            password=validated_data["password"],
            phone=validated_data.get("phone", ""),
            role=validated_data["role"],
            is_verified=True,  # Staff accounts are pre-verified
        )
        
        # Create staff profile
        StaffProfile.objects.create(
            user=user,
            first_name=first_name,
            last_name=last_name,
            department=department,
        )
        
        return user


class MeSerializer(serializers.ModelSerializer):
    """Current user info with profile."""

    profile = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ["id", "email", "phone", "role", "is_active", "is_verified", "date_joined", "profile"]
        read_only_fields = ["id", "email", "role", "date_joined"]

    def get_profile(self, obj):
        if obj.role == Role.STUDENT:
            try:
                from students.serializers import StudentProfileSerializer
                profile = obj.student_profile
                return StudentProfileSerializer(profile).data
            except StudentProfile.DoesNotExist:
                return None
        elif obj.is_staff_role:
            try:
                from .models import StaffProfile
                profile = obj.staff_profile
                return {
                    "first_name": profile.first_name,
                    "last_name": profile.last_name,
                    "department": profile.department,
                }
            except StaffProfile.DoesNotExist:
                return None
        return None