from decimal import Decimal
import uuid
from django.core.exceptions import ValidationError
from django.db import models
from django.utils import timezone


class AcademicSession(models.Model):
    """
    Represents an academic year/session (e.g., 2026/2027, 2027/2028).
    Students enroll into a specific session.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    label = models.CharField(
        max_length=20,
        unique=True,
        help_text="Session label, e.g., '2026/2027'"
    )
    start_date = models.DateField()
    end_date = models.DateField()
    is_active = models.BooleanField(
        default=True,
        help_text="Only one session should be active at a time"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-start_date']
        indexes = [
            models.Index(fields=['is_active']),
            models.Index(fields=['start_date']),
        ]

    def __str__(self):
        return self.label

    def clean(self):
        """Validate that end_date is after start_date."""
        if self.end_date and self.start_date and self.end_date <= self.start_date:
            raise ValidationError("End date must be after start date.")

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)


class Level(models.Model):
    """
    ICAN qualification levels: Foundation, Skills, Professional.
    Courses are assigned to levels.
    """

    FOUNDATION = "foundation"
    SKILLS = "skills"
    PROFESSIONAL = "professional"

    LEVEL_CHOICES = [
        (FOUNDATION, "Foundation"),
        (SKILLS, "Skills"),
        (PROFESSIONAL, "Professional"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=50, unique=True)
    code = models.CharField(
        max_length=20,
        choices=LEVEL_CHOICES,
        unique=True,
        help_text="Internal code for the level"
    )
    order = models.PositiveIntegerField(
        default=0,
        help_text="Display order (1=Foundation, 2=Skills, 3=Professional)"
    )
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['order']
        indexes = [
            models.Index(fields=['is_active']),
            models.Index(fields=['order']),
        ]

    def __str__(self):
        return self.name


class Course(models.Model):
    """
    Individual course/subject within a level.
    E.g., "Financial Accounting", "Business Law", etc.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    level = models.ForeignKey(
        Level,
        on_delete=models.PROTECT,
        related_name='courses',
        help_text="Level this course belongs to"
    )
    name = models.CharField(max_length=200)
    code = models.CharField(
        max_length=20,
        unique=True,
        help_text="Course code, e.g., 'FA101'"
    )
    description = models.TextField(blank=True)
    duration = models.PositiveIntegerField(
        null=True,
        blank=True,
        help_text="Duration in weeks"
    )
    price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=Decimal('0.00'),
        help_text="Course price tag"
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['level__order', 'name']
        indexes = [
            models.Index(fields=['level', 'is_active']),
            models.Index(fields=['code']),
        ]
        unique_together = [['level', 'code']]

    def __str__(self):
        return f"{self.code} - {self.name}"


class CourseOffering(models.Model):
    """
    A specific offering of a course in a particular session.
    Links Course + Session + optional Tutor.
    Students enroll in offerings, not directly in courses.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    course = models.ForeignKey(
        Course,
        on_delete=models.PROTECT,
        related_name='offerings'
    )
    session = models.ForeignKey(
        AcademicSession,
        on_delete=models.PROTECT,
        related_name='course_offerings'
    )
    tutor = models.ForeignKey(
        'users.StaffProfile',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='course_offerings',
        help_text="Staff member teaching this offering"
    )
    capacity = models.PositiveIntegerField(
        null=True,
        blank=True,
        help_text="Maximum number of students"
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['session', 'course']
        indexes = [
            models.Index(fields=['session', 'is_active']),
            models.Index(fields=['course']),
        ]
        unique_together = [['course', 'session']]

    def __str__(self):
        return f"{self.course.code} - {self.session.label}"


class Class(models.Model):
    """
    A class instance for a course offering.
    Used for attendance and scheduling.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    course_offering = models.ForeignKey(
        CourseOffering,
        on_delete=models.CASCADE,
        related_name='classes'
    )
    name = models.CharField(
        max_length=100,
        help_text="Class name or identifier, e.g., 'Morning Batch', 'Group A'"
    )
    tutor = models.ForeignKey(
        'users.StaffProfile',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='classes'
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = "Classes"
        ordering = ['course_offering', 'name']
        indexes = [
            models.Index(fields=['course_offering', 'is_active']),
        ]

    def __str__(self):
        return f"{self.course_offering} - {self.name}"


class ClassSchedule(models.Model):
    """
    Individual scheduled sessions for a class.
    Each class can have multiple scheduled meetings.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    class_instance = models.ForeignKey(
        Class,
        on_delete=models.CASCADE,
        related_name='schedules'
    )
    date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField()
    location = models.CharField(
        max_length=200,
        blank=True,
        help_text="Physical location or room number"
    )
    meeting_url = models.URLField(
        blank=True,
        help_text="Online meeting link (Zoom, Teams, etc.)"
    )
    notes = models.TextField(blank=True)
    is_cancelled = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['date', 'start_time']
        indexes = [
            models.Index(fields=['class_instance', 'date']),
            models.Index(fields=['date']),
        ]

    def __str__(self):
        return f"{self.class_instance} - {self.date} {self.start_time}"

    def clean(self):
        """Validate that end_time is after start_time."""
        if self.end_time and self.start_time and self.end_time <= self.start_time:
            raise ValidationError("End time must be after start time.")

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)


class ScheduleTemplate(models.Model):
    """
    Recurring schedule template for driving automatic session generation.
    Displayed in Timetable Manager tab.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    course = models.ForeignKey(
        Course,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='schedule_templates'
    )
    course_code = models.CharField(max_length=20)
    course_name = models.CharField(max_length=200)
    level_code = models.CharField(max_length=32, default='foundation')  # foundation, skills, professional
    day_of_week = models.CharField(max_length=30, default='Saturdays')  # e.g. Saturdays, Wednesdays
    frequency = models.CharField(max_length=30, default='Weekly')        # e.g. Weekly, Every 2 weeks
    start_time = models.TimeField()
    end_time = models.TimeField()
    tutor_name = models.CharField(max_length=150, blank=True)
    room = models.CharField(max_length=100, default='Room A1')
    status = models.CharField(max_length=20, default='active')            # active, paused
    status_subtext = models.CharField(max_length=200, blank=True)         # e.g. Suspended pending tutor renewal
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'academics_scheduletemplate'
        ordering = ['level_code', 'course_code']

    def __str__(self):
        return f"{self.course_code} - {self.day_of_week} ({self.start_time}-{self.end_time})"

