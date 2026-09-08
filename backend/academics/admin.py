from django.contrib import admin

from .models import AcademicSession, Class, ClassSchedule, Course, CourseOffering, Level


@admin.register(Level)
class LevelAdmin(admin.ModelAdmin):
    list_display = ['name', 'code', 'order', 'is_active', 'created_at']
    list_filter = ['is_active', 'code']
    search_fields = ['name', 'code']
    ordering = ['order']
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'code', 'order', 'description')
        }),
        ('Status', {
            'fields': ('is_active',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    readonly_fields = ['created_at', 'updated_at']


@admin.register(AcademicSession)
class AcademicSessionAdmin(admin.ModelAdmin):
    list_display = ['label', 'start_date', 'end_date', 'is_active', 'created_at']
    list_filter = ['is_active', 'start_date']
    search_fields = ['label']
    ordering = ['-start_date']
    fieldsets = (
        ('Session Details', {
            'fields': ('label', 'start_date', 'end_date')
        }),
        ('Status', {
            'fields': ('is_active',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    readonly_fields = ['created_at', 'updated_at']


@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display = ['code', 'name', 'level', 'duration', 'is_active', 'created_at']
    list_filter = ['level', 'is_active']
    search_fields = ['name', 'code', 'description']
    ordering = ['level__order', 'name']
    fieldsets = (
        ('Course Information', {
            'fields': ('level', 'name', 'code', 'description', 'duration')
        }),
        ('Status', {
            'fields': ('is_active',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    readonly_fields = ['created_at', 'updated_at']


@admin.register(CourseOffering)
class CourseOfferingAdmin(admin.ModelAdmin):
    list_display = [
        'course',
        'session',
        'tutor',
        'capacity',
        'is_active',
        'created_at'
    ]
    list_filter = ['session', 'course__level', 'is_active']
    search_fields = ['course__name', 'course__code', 'session__label']
    ordering = ['-session__start_date', 'course__name']
    autocomplete_fields = ['course', 'session', 'tutor']
    fieldsets = (
        ('Offering Details', {
            'fields': ('course', 'session', 'tutor', 'capacity')
        }),
        ('Status', {
            'fields': ('is_active',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    readonly_fields = ['created_at', 'updated_at']


@admin.register(Class)
class ClassAdmin(admin.ModelAdmin):
    list_display = ['name', 'course_offering', 'tutor', 'is_active', 'created_at']
    list_filter = ['course_offering__session', 'is_active']
    search_fields = [
        'name',
        'course_offering__course__name',
        'course_offering__course__code'
    ]
    ordering = ['course_offering', 'name']
    autocomplete_fields = ['course_offering', 'tutor']
    fieldsets = (
        ('Class Details', {
            'fields': ('course_offering', 'name', 'tutor')
        }),
        ('Status', {
            'fields': ('is_active',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    readonly_fields = ['created_at', 'updated_at']


@admin.register(ClassSchedule)
class ClassScheduleAdmin(admin.ModelAdmin):
    list_display = [
        'class_instance',
        'date',
        'start_time',
        'end_time',
        'location',
        'is_cancelled'
    ]
    list_filter = ['date', 'is_cancelled', 'class_instance__course_offering__session']
    search_fields = [
        'class_instance__name',
        'class_instance__course_offering__course__name',
        'location'
    ]
    ordering = ['-date', 'start_time']
    date_hierarchy = 'date'
    autocomplete_fields = ['class_instance']
    fieldsets = (
        ('Schedule Details', {
            'fields': ('class_instance', 'date', 'start_time', 'end_time')
        }),
        ('Location', {
            'fields': ('location', 'meeting_url')
        }),
        ('Additional Information', {
            'fields': ('notes', 'is_cancelled')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    readonly_fields = ['created_at', 'updated_at']
