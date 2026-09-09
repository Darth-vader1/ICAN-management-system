from django.contrib import admin
from django.utils.html import format_html

from .models import ClassSession, AttendanceRecord


@admin.register(ClassSession)
class ClassSessionAdmin(admin.ModelAdmin):
    """Admin interface for class sessions"""
    
    list_display = [
        'id',
        'course_display',
        'title',
        'session_date',
        'time_display',
        'location',
        'status_badge',
        'instructor_display',
        'attendance_rate_display',
    ]
    list_filter = ['status', 'session_date', 'course_offering__session']
    search_fields = [
        'title',
        'course_offering__course__code',
        'course_offering__course__name',
        'location'
    ]
    readonly_fields = [
        'is_past',
        'duration_minutes',
        'attendance_rate',
        'attendance_marked_at',
        'attendance_marked_by',
        'created_at',
        'updated_at'
    ]
    
    fieldsets = (
        ('Course Information', {
            'fields': ('course_offering', 'instructor')
        }),
        ('Session Details', {
            'fields': ('title', 'description', 'location')
        }),
        ('Scheduling', {
            'fields': ('session_date', 'start_time', 'end_time', 'status')
        }),
        ('Attendance Metadata', {
            'fields': (
                'is_past',
                'duration_minutes',
                'attendance_rate',
                'attendance_marked_at',
                'attendance_marked_by'
            ),
            'classes': ('collapse',)
        }),
        ('Audit', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def course_display(self, obj):
        """Display course code and name"""
        return f"{obj.course_offering.course.code} - {obj.course_offering.course.name}"
    course_display.short_description = 'Course'
    
    def time_display(self, obj):
        """Display time range"""
        return f"{obj.start_time.strftime('%H:%M')} - {obj.end_time.strftime('%H:%M')}"
    time_display.short_description = 'Time'
    
    def status_badge(self, obj):
        """Display status as colored badge"""
        colors = {
            'scheduled': '#3b82f6',
            'in_progress': '#f59e0b',
            'completed': '#10b981',
            'cancelled': '#ef4444',
        }
        color = colors.get(obj.status, '#6b7280')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 10px; border-radius: 3px; font-size: 11px;">{}</span>',
            color,
            obj.get_status_display()
        )
    status_badge.short_description = 'Status'
    
    def instructor_display(self, obj):
        """Display instructor name"""
        if obj.instructor and hasattr(obj.instructor, 'staff_profile'):
            return obj.instructor.staff_profile.full_name
        return '-'
    instructor_display.short_description = 'Instructor'
    
    def attendance_rate_display(self, obj):
        """Display attendance rate with color"""
        rate = obj.attendance_rate
        if rate == 0:
            return '-'
        
        if rate >= 80:
            color = '#10b981'  # Green
        elif rate >= 60:
            color = '#f59e0b'  # Orange
        else:
            color = '#ef4444'  # Red
        
        return format_html(
            '<span style="color: {}; font-weight: bold;">{:.1f}%</span>',
            color,
            rate
        )
    attendance_rate_display.short_description = 'Attendance Rate'


@admin.register(AttendanceRecord)
class AttendanceRecordAdmin(admin.ModelAdmin):
    """Admin interface for attendance records"""
    
    list_display = [
        'id',
        'student_display',
        'course_display',
        'session_date_display',
        'status_badge',
        'marked_by_display',
        'marked_at',
    ]
    list_filter = ['status', 'marked_at', 'class_session__session_date']
    search_fields = [
        'student__user__email',
        'student__first_name',
        'student__last_name',
        'student__student_id',
        'class_session__title'
    ]
    readonly_fields = ['marked_at', 'created_at', 'updated_at']
    
    fieldsets = (
        ('Session & Student', {
            'fields': ('class_session', 'student')
        }),
        ('Attendance', {
            'fields': ('status', 'arrival_time', 'notes')
        }),
        ('Metadata', {
            'fields': ('marked_at', 'marked_by'),
            'classes': ('collapse',)
        }),
        ('Audit', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def student_display(self, obj):
        """Display student name and ID"""
        return f"{obj.student.full_name} ({obj.student.student_id})"
    student_display.short_description = 'Student'
    
    def course_display(self, obj):
        """Display course code"""
        return obj.class_session.course_offering.course.code
    course_display.short_description = 'Course'
    
    def session_date_display(self, obj):
        """Display session date"""
        return obj.class_session.session_date
    session_date_display.short_description = 'Date'
    session_date_display.admin_order_field = 'class_session__session_date'
    
    def status_badge(self, obj):
        """Display status as colored badge"""
        colors = {
            'present': '#10b981',
            'absent': '#ef4444',
            'late': '#f59e0b',
            'excused': '#3b82f6',
        }
        color = colors.get(obj.status, '#6b7280')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 10px; border-radius: 3px; font-size: 11px;">{}</span>',
            color,
            obj.get_status_display()
        )
    status_badge.short_description = 'Status'
    
    def marked_by_display(self, obj):
        """Display who marked attendance"""
        if obj.marked_by and hasattr(obj.marked_by, 'staff_profile'):
            return obj.marked_by.staff_profile.full_name
        return '-'
    marked_by_display.short_description = 'Marked By'
