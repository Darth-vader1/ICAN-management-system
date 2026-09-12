from decimal import Decimal
from django.db import transaction
from rest_framework import serializers

from users.models import User, Role
from .models import StudentProfile


class StudentProfileSerializer(serializers.ModelSerializer):
    """Serializer for student profile details."""

    user = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(), required=False, allow_null=True
    )
    email = serializers.EmailField(write_only=True, required=False)
    password = serializers.CharField(write_only=True, required=False, allow_blank=True, min_length=10)
    phone = serializers.CharField(write_only=True, required=False, allow_blank=True)

    user_email = serializers.EmailField(source="user.email", read_only=True)
    user_phone = serializers.CharField(source="user.phone", read_only=True)
    full_name = serializers.CharField(read_only=True)
    level_name = serializers.SerializerMethodField()

    total_fees = serializers.SerializerMethodField()
    amount_paid = serializers.SerializerMethodField()
    balance = serializers.SerializerMethodField()
    payment_status = serializers.SerializerMethodField()
    payments_count = serializers.SerializerMethodField()

    def get_level_name(self, obj):
        active_enrollment = obj.enrollments.filter(status='active').first()
        if active_enrollment and active_enrollment.level:
            return active_enrollment.level.name
        latest_enrollment = obj.enrollments.first()
        if latest_enrollment and latest_enrollment.level:
            return latest_enrollment.level.name
        return ""

    def _get_financial_data(self, obj):
        if not hasattr(obj, '_cached_financial_data'):
            from billing.models import Invoice, Payment
            from django.db.models import Sum

            invoices = Invoice.objects.filter(student=obj).exclude(status='cancelled')
            total = invoices.aggregate(s=Sum('total_amount'))['s'] or Decimal('0.00')
            paid = invoices.aggregate(s=Sum('amount_paid'))['s'] or Decimal('0.00')
            bal = max(Decimal('0.00'), total - paid)

            if total == 0:
                st = 'paid'
            elif bal == 0:
                st = 'paid'
            elif paid > 0:
                st = 'partially_paid'
            else:
                st = 'pending'

            p_count = Payment.objects.filter(student=obj, status='successful').count()

            obj._cached_financial_data = {
                'total_fees': total,
                'amount_paid': paid,
                'balance': bal,
                'payment_status': st,
                'payments_count': p_count
            }
        return obj._cached_financial_data

    def get_total_fees(self, obj):
        return self._get_financial_data(obj)['total_fees']

    def get_amount_paid(self, obj):
        return self._get_financial_data(obj)['amount_paid']

    def get_balance(self, obj):
        return self._get_financial_data(obj)['balance']

    def get_payment_status(self, obj):
        return self._get_financial_data(obj)['payment_status']

    def get_payments_count(self, obj):
        return self._get_financial_data(obj)['payments_count']

    class Meta:
        model = StudentProfile
        fields = [
            "id",
            "user",
            "email",
            "password",
            "phone",
            "user_email",
            "user_phone",
            "student_code",
            "first_name",
            "last_name",
            "other_name",
            "full_name",
            "level_name",
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
            "total_fees",
            "amount_paid",
            "balance",
            "payment_status",
            "payments_count",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "student_code", "created_at", "updated_at"]

    def to_internal_value(self, data):
        if isinstance(data, dict):
            data = data.copy()
            if data.get("date_of_birth") in ["", "null", None]:
                data["date_of_birth"] = None
        return super().to_internal_value(data)

    def validate(self, attrs):
        user = attrs.get("user")
        email = attrs.get("email") or self.initial_data.get("email")
        password = attrs.get("password") or self.initial_data.get("password")
        password_confirm = self.initial_data.get("password_confirm")

        if self.instance is None:
            if password and password_confirm and password != password_confirm:
                raise serializers.ValidationError({"password_confirm": "Passwords do not match."})

            if not user:
                if not email:
                    raise serializers.ValidationError({"email": "Email address is required to create a student."})
                
                existing_user = User.objects.filter(email=email).first()
                if existing_user:
                    if hasattr(existing_user, "student_profile"):
                        raise serializers.ValidationError({"email": "A student account with this email address already exists."})
            else:
                if hasattr(user, "student_profile"):
                    raise serializers.ValidationError({"user": "This user already has a student profile."})

        ican_exam_id = attrs.get("ican_exam_id")
        if ican_exam_id:
            qs = StudentProfile.objects.filter(ican_exam_id=ican_exam_id)
            if self.instance:
                qs = qs.exclude(pk=self.instance.pk)
            if qs.exists():
                raise serializers.ValidationError({"ican_exam_id": "A student profile with this ICAN Exam ID already exists."})

        return attrs

    @transaction.atomic
    def create(self, validated_data):
        user = validated_data.pop("user", None)
        email = validated_data.pop("email", None) or self.initial_data.get("email")
        password = validated_data.pop("password", None) or self.initial_data.get("password")
        phone = (
            validated_data.pop("phone", None)
            or self.initial_data.get("phone")
            or self.initial_data.get("phone_number")
            or self.initial_data.get("user_phone")
            or ""
        )

        if not user:
            if not email:
                raise serializers.ValidationError({"email": "Email address is required."})

            user = User.objects.filter(email=email).first()
            if not user:
                user = User.objects.create_user(
                    email=email,
                    password=password or User.objects.make_random_password(),
                    phone=phone,
                    role=Role.STUDENT,
                )
            else:
                if phone and not user.phone:
                    user.phone = phone
                    user.save(update_fields=["phone"])

        student_profile = StudentProfile.objects.create(
            user=user,
            **validated_data
        )
        return student_profile

    def update(self, instance, validated_data):
        validated_data.pop("email", None)
        validated_data.pop("password", None)
        phone = (
            validated_data.pop("phone", None)
            or self.initial_data.get("phone")
            or self.initial_data.get("phone_number")
            or self.initial_data.get("user_phone")
        )

        instance = super().update(instance, validated_data)

        # Sync phone attribute on User model if provided
        if phone and instance.user and hasattr(instance.user, "phone"):
            if instance.user.phone != phone:
                instance.user.phone = phone
                instance.user.save(update_fields=["phone"])

        return instance


class StudentProfileListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for listing students."""

    user_email = serializers.EmailField(source="user.email", read_only=True)
    user_phone = serializers.CharField(source="user.phone", read_only=True)
    full_name = serializers.CharField(read_only=True)
    level_name = serializers.SerializerMethodField()

    def get_level_name(self, obj):
        active_enrollment = obj.enrollments.filter(status='active').first()
        if active_enrollment and active_enrollment.level:
            return active_enrollment.level.name
        latest_enrollment = obj.enrollments.first()
        if latest_enrollment and latest_enrollment.level:
            return latest_enrollment.level.name
        return ""

    class Meta:
        model = StudentProfile
        fields = [
            "id",
            "student_code",
            "first_name",
            "last_name",
            "full_name",
            "user_email",
            "user_phone",
            "whatsapp_number",
            "ican_exam_id",
            "level_name",
            "is_active",
            "created_at",
        ]

