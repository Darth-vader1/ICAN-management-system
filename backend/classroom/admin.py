from django.contrib import admin
from .models import (
    VirtualClass,
    ClassMaterial,
    ClassRecording,
    ClassAttendance,
    ClassParticipation,
)


@admin.register(VirtualClass)
class VirtualClassAdmin(admin.ModelAdmin):
    list_display = ('title', 'course_offering', 'instructor', 'status', 'scheduled_start', 'scheduled_end', 'recording_enabled')
    list_filter = ('status', 'recording_enabled', 'course_offering__session', 'scheduled_start')
    search_fields = ('title', 'room_name', 'course_offering__course__name', 'course_offering__course__code')


@admin.register(ClassMaterial)
class ClassMaterialAdmin(admin.ModelAdmin):
    list_display = ('title', 'virtual_class', 'uploaded_by', 'created_at')
    search_fields = ('title', 'virtual_class__title')


@admin.register(ClassRecording)
class ClassRecordingAdmin(admin.ModelAdmin):
    list_display = ('virtual_class', 'provider', 'status', 'duration_seconds', 'created_at')
    list_filter = ('status', 'provider')


@admin.register(ClassAttendance)
class ClassAttendanceAdmin(admin.ModelAdmin):
    list_display = ('student', 'virtual_class', 'attendance_status', 'total_duration_seconds', 'first_joined_at')
    list_filter = ('attendance_status', 'virtual_class')
    search_fields = ('student__first_name', 'student__last_name', 'student__student_code')


@admin.register(ClassParticipation)
class ClassParticipationAdmin(admin.ModelAdmin):
    list_display = ('attendance', 'joined_at', 'left_at', 'duration_seconds')
