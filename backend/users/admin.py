from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as DjangoUserAdmin

from .models import StaffProfile, User


@admin.register(User)
class UserAdmin(DjangoUserAdmin):
    ordering = ["email"]
    list_display = ["email", "role", "is_active", "is_verified", "date_joined"]
    list_filter = ["role", "is_active", "is_verified"]
    search_fields = ["email", "phone"]
    fieldsets = (
        (None, {"fields": ("email", "password")}),
        ("Role & status", {"fields": ("role", "is_active", "is_staff", "is_superuser", "is_verified")}),
        ("Contact", {"fields": ("phone",)}),
        ("Important dates", {"fields": ("last_login", "date_joined")}),
    )
    add_fieldsets = (
        (None, {"classes": ("wide",), "fields": ("email", "role", "password1", "password2")}),
    )
    readonly_fields = ["date_joined"]


@admin.register(StaffProfile)
class StaffProfileAdmin(admin.ModelAdmin):
    list_display = ["first_name", "last_name", "user", "department", "is_active"]
    search_fields = ["first_name", "last_name", "user__email"]