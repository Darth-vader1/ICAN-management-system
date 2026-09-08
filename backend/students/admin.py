from django.contrib import admin

from .models import StudentProfile


@admin.register(StudentProfile)
class StudentProfileAdmin(admin.ModelAdmin):
    list_display = [
        "student_code",
        "first_name",
        "last_name",
        "user",
        "ican_exam_id",
        "is_active",
        "created_at",
    ]
    list_filter = ["is_active", "gender", "created_at"]
    search_fields = [
        "student_code",
        "first_name",
        "last_name",
        "user__email",
        "user__phone",
        "ican_exam_id",
    ]
    readonly_fields = ["student_code", "created_at", "updated_at"]
    fieldsets = (
        ("Student Identification", {"fields": ("student_code", "user")}),
        (
            "Personal Information",
            {
                "fields": (
                    "first_name",
                    "last_name",
                    "other_name",
                    "date_of_birth",
                    "gender",
                    "photo",
                )
            },
        ),
        (
            "Contact Information",
            {"fields": ("whatsapp_number", "address")},
        ),
        (
            "ICAN Information",
            {"fields": ("ican_exam_id",)},
        ),
        (
            "Emergency Contact",
            {
                "fields": (
                    "emergency_contact_name",
                    "emergency_contact_phone",
                    "emergency_contact_relationship",
                )
            },
        ),
        ("Status", {"fields": ("is_active",)}),
        ("Timestamps", {"fields": ("created_at", "updated_at")}),
    )
