from django.contrib import admin

from .models import Enrollment, EnrollmentCourse, EnrollmentStatus


class EnrollmentCourseInline(admin.TabularInline):
    """Inline display of enrollment courses."""
    model = EnrollmentCourse
    extra = 0
    readonly_fields = ['enrolled_date', 'dropped_date', 'created_at']
    fields = [
        'course_offering',
        'enrolled_date',
        'dropped',
        'dropped_date',
    ]
    autocomplete_fields = ['course_offering']

    def get_queryset(self, request):
        """Show all courses including dropped ones."""
        return super().get_queryset(request).select_related(
            'course_offering',
            'course_offering__course',
            'course_offering__session'
        )


@admin.register(Enrollment)
class EnrollmentAdmin(admin.ModelAdmin):
    list_display = [
        'student',
        'session',
        'level',
        'status',
        'enrollment_date',
        'course_count',
    ]
    list_filter = ['status', 'session', 'level', 'enrollment_date']
    search_fields = [
        'student__user__email',
        'student__student_code',
        'student__first_name',
        'student__last_name',
    ]
    ordering = ['-enrollment_date']
    date_hierarchy = 'enrollment_date'
    autocomplete_fields = ['student', 'session', 'level']
    readonly_fields = [
        'enrollment_date',
        'approval_date',
        'completion_date',
        'created_at',
        'updated_at',
    ]
    inlines = [EnrollmentCourseInline]

    fieldsets = (
        ('Student Information', {
            'fields': ('student',)
        }),
        ('Enrollment Details', {
            'fields': ('session', 'level', 'status')
        }),
        ('Dates', {
            'fields': (
                'enrollment_date',
                'approval_date',
                'completion_date',
            )
        }),
        ('Additional Information', {
            'fields': ('notes',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    def course_count(self, obj):
        """Display number of courses (excluding dropped)."""
        return obj.enrollment_courses.filter(dropped=False).count()
    course_count.short_description = 'Courses'

    def get_queryset(self, request):
        """Optimize queries."""
        return super().get_queryset(request).select_related(
            'student',
            'student__user',
            'session',
            'level'
        ).prefetch_related('enrollment_courses')

    actions = ['activate_enrollments', 'complete_enrollments']

    def activate_enrollments(self, request, queryset):
        """Bulk activate enrollments."""
        count = 0
        for enrollment in queryset.filter(status=EnrollmentStatus.DRAFT):
            enrollment.activate()
            count += 1
        self.message_user(request, f'{count} enrollment(s) activated successfully.')
    activate_enrollments.short_description = 'Activate selected enrollments'

    def complete_enrollments(self, request, queryset):
        """Bulk complete enrollments."""
        count = 0
        for enrollment in queryset.filter(status=EnrollmentStatus.ACTIVE):
            enrollment.complete()
            count += 1
        self.message_user(request, f'{count} enrollment(s) marked as completed.')
    complete_enrollments.short_description = 'Mark selected as completed'


@admin.register(EnrollmentCourse)
class EnrollmentCourseAdmin(admin.ModelAdmin):
    list_display = [
        'enrollment',
        'course_code',
        'course_name',
        'enrolled_date',
        'dropped',
    ]
    list_filter = ['dropped', 'enrolled_date', 'enrollment__session']
    search_fields = [
        'enrollment__student__user__email',
        'enrollment__student__student_code',
        'course_offering__course__code',
        'course_offering__course__name',
    ]
    ordering = ['-enrolled_date']
    date_hierarchy = 'enrolled_date'
    autocomplete_fields = ['enrollment', 'course_offering']
    readonly_fields = ['enrolled_date', 'dropped_date', 'created_at', 'updated_at']

    fieldsets = (
        ('Enrollment Course', {
            'fields': ('enrollment', 'course_offering')
        }),
        ('Status', {
            'fields': ('dropped', 'dropped_date')
        }),
        ('Dates', {
            'fields': ('enrolled_date',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    def course_code(self, obj):
        return obj.course_offering.course.code
    course_code.short_description = 'Course Code'
    course_code.admin_order_field = 'course_offering__course__code'

    def course_name(self, obj):
        return obj.course_offering.course.name
    course_name.short_description = 'Course Name'
    course_name.admin_order_field = 'course_offering__course__name'

    def get_queryset(self, request):
        """Optimize queries."""
        return super().get_queryset(request).select_related(
            'enrollment',
            'enrollment__student',
            'enrollment__student__user',
            'course_offering',
            'course_offering__course',
            'course_offering__session'
        )
