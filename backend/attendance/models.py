from django.db import models
from django.conf import settings
from django.core.exceptions import ValidationError
from django.utils import timezone


class ClassSession(models.Model):
    """
    Represents a scheduled class session for a course.
    Instructors use this to mark attendance for students.
    """
    
    class Status(models.TextChoices):
        SCHEDULED = 'scheduled', 'Scheduled'
        IN_PROGRESS = 'in_progress', 'In Progress'
        COMPLETED = 'completed', 'Completed'
        CANCELLED = 'cancelled', 'Cancelled'
    
    # Course and session info
    course_offering = models.ForeignKey(
        'academics.CourseOffering',
        on_delete=models.CASCADE,
        related_name='class_sessions'
    )
    
    # Instructor
    instructor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='taught_sessions',
        help_text="Staff member conducting the class"
    )
    
    # Session details
    title = models.CharField(max_length=200, help_text="e.g., 'Week 1: Introduction to Financial Accounting'")
    description = models.TextField(blank=True)
    
    # Scheduling
    session_date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField()
    location = models.CharField(max_length=200, blank=True, help_text="e.g., 'Room 101' or 'Online'")
    
    # Status
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.SCHEDULED)
    
    # Attendance metadata
    attendance_marked_at = models.DateTimeField(null=True, blank=True)
    attendance_marked_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='marked_attendances'
    )
    
    # Audit
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'attendance_class_session'
        ordering = ['-session_date', '-start_time']
        indexes = [
            models.Index(fields=['course_offering', 'session_date']),
            models.Index(fields=['session_date', 'status']),
            models.Index(fields=['instructor', 'session_date']),
        ]
    
    def __str__(self):
        return f"{self.course_offering.course.code} - {self.title} ({self.session_date})"
    
    def clean(self):
        """Validate session times"""
        if self.start_time and self.end_time and self.start_time >= self.end_time:
            raise ValidationError("End time must be after start time")
    
    @property
    def is_past(self):
        """Check if session is in the past"""
        session_datetime = timezone.make_aware(
            timezone.datetime.combine(self.session_date, self.end_time)
        )
        return timezone.now() > session_datetime
    
    @property
    def duration_minutes(self):
        """Calculate session duration in minutes"""
        if not self.start_time or not self.end_time:
            return 0
        
        start = timezone.datetime.combine(self.session_date, self.start_time)
        end = timezone.datetime.combine(self.session_date, self.end_time)
        return int((end - start).total_seconds() / 60)
    
    @property
    def attendance_rate(self):
        """Calculate attendance rate for this session"""
        total = self.attendance_records.count()
        if total == 0:
            return 0
        
        present = self.attendance_records.filter(status=AttendanceRecord.Status.PRESENT).count()
        return round((present / total) * 100, 2)


class AttendanceRecord(models.Model):
    """
    Records attendance for a student in a specific class session.
    """
    
    class Status(models.TextChoices):
        PRESENT = 'present', 'Present'
        ABSENT = 'absent', 'Absent'
        LATE = 'late', 'Late'
        EXCUSED = 'excused', 'Excused'
    
    # Session and student
    class_session = models.ForeignKey(
        ClassSession,
        on_delete=models.CASCADE,
        related_name='attendance_records'
    )
    student = models.ForeignKey(
        'students.StudentProfile',
        on_delete=models.CASCADE,
        related_name='attendance_records'
    )
    
    # Attendance status
    status = models.CharField(max_length=20, choices=Status.choices)
    
    # Optional details
    marked_at = models.DateTimeField(auto_now_add=True)
    marked_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='marked_attendance_records'
    )
    
    notes = models.TextField(blank=True, help_text="Optional notes (e.g., reason for absence)")
    
    # Late arrival tracking
    arrival_time = models.TimeField(null=True, blank=True, help_text="Time student arrived (for late status)")
    
    # Audit
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'attendance_record'
        ordering = ['-created_at']
        unique_together = [('class_session', 'student')]
        indexes = [
            models.Index(fields=['student', 'status']),
            models.Index(fields=['class_session', 'status']),
            models.Index(fields=['marked_at']),
        ]
    
    def __str__(self):
        return f"{self.student.full_name} - {self.class_session} - {self.get_status_display()}"
    
    def clean(self):
        """Validate enrollment"""
        # Check if student is enrolled in the course
        from enrollments.models import EnrollmentCourse
        
        enrolled = EnrollmentCourse.objects.filter(
            enrollment__student=self.student,
            course_offering=self.class_session.course_offering,
            enrollment__status='active'
        ).exists()
        
        if not enrolled:
            raise ValidationError(
                f"{self.student.full_name} is not enrolled in {self.class_session.course_offering.course.name}"
            )
