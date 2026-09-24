import uuid
from django.core.exceptions import ValidationError
from django.db import models, transaction
from django.utils import timezone


class EnrollmentStatus(models.TextChoices):
    DRAFT = "draft", "Draft"
    ACTIVE = "active", "Active"
    COMPLETED = "completed", "Completed"
    WITHDRAWN = "withdrawn", "Withdrawn"
    SUSPENDED = "suspended", "Suspended"


class Enrollment(models.Model):
    """
    Represents a student's enrollment in a specific session and level.
    Links: Student → Session → Level → Courses (via EnrollmentCourse).
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    student = models.ForeignKey(
        'students.StudentProfile',
        on_delete=models.PROTECT,
        related_name='enrollments',
        help_text="Student enrolling"
    )
    session = models.ForeignKey(
        'academics.AcademicSession',
        on_delete=models.PROTECT,
        related_name='enrollments',
        help_text="Academic session for this enrollment"
    )
    level = models.ForeignKey(
        'academics.Level',
        on_delete=models.PROTECT,
        related_name='enrollments',
        help_text="ICAN level (Foundation, Skills, Professional)"
    )
    status = models.CharField(
        max_length=20,
        choices=EnrollmentStatus.choices,
        default=EnrollmentStatus.DRAFT,
        help_text="Current enrollment status"
    )
    enrollment_date = models.DateTimeField(
        default=timezone.now,
        help_text="Date when enrollment was created"
    )
    approval_date = models.DateTimeField(
        null=True,
        blank=True,
        help_text="Date when enrollment was approved/activated"
    )
    completion_date = models.DateTimeField(
        null=True,
        blank=True,
        help_text="Date when student completed the program"
    )
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __init__(self, *args, **kwargs):
        kwargs.pop("student_code", None)
        super().__init__(*args, **kwargs)

    class Meta:
        ordering = ['-enrollment_date']
        indexes = [
            models.Index(fields=['student', 'status']),
            models.Index(fields=['session', 'level']),
            models.Index(fields=['status']),
        ]
        constraints = [
            # Prevent duplicate active enrollment for same student/session/level
            models.UniqueConstraint(
                fields=['student', 'session', 'level'],
                condition=models.Q(status='active'),
                name='unique_active_enrollment'
            )
        ]

    def __str__(self):
        return f"{self.student.user.email} - {self.level.name} - {self.session.label}"

    def clean(self):
        """Validate enrollment rules."""
        errors = {}

        # Check for duplicate active enrollment
        if self.status == EnrollmentStatus.ACTIVE:
            existing = Enrollment.objects.filter(
                student=self.student,
                session=self.session,
                level=self.level,
                status=EnrollmentStatus.ACTIVE
            ).exclude(pk=self.pk)
            
            if existing.exists():
                errors['status'] = (
                    f"Student already has an active enrollment for "
                    f"{self.level.name} in {self.session.label}"
                )

        # Validate session is active when creating enrollment
        if not self.pk and self.session and not self.session.is_active:
            errors['session'] = (
                f"Cannot enroll in inactive session: {self.session.label}"
            )

        # Validate level is active
        if self.level and not self.level.is_active:
            errors['level'] = f"Cannot enroll in inactive level: {self.level.name}"

        if errors:
            raise ValidationError(errors)

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    def activate(self):
        """Activate this enrollment and set approval date."""
        if self.status == EnrollmentStatus.DRAFT:
            self.status = EnrollmentStatus.ACTIVE
            self.approval_date = timezone.now()
            self.save()

    def complete(self):
        """Mark enrollment as completed."""
        if self.status == EnrollmentStatus.ACTIVE:
            self.status = EnrollmentStatus.COMPLETED
            self.completion_date = timezone.now()
            self.save()

    def withdraw(self):
        """Withdraw student from enrollment."""
        if self.status in [EnrollmentStatus.DRAFT, EnrollmentStatus.ACTIVE]:
            self.status = EnrollmentStatus.WITHDRAWN
            self.save()


class EnrollmentCourse(models.Model):
    """
    Links an enrollment to specific course offerings.
    Student selects multiple courses within their enrolled level.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    enrollment = models.ForeignKey(
        Enrollment,
        on_delete=models.CASCADE,
        related_name='enrollment_courses',
        help_text="Parent enrollment"
    )
    course_offering = models.ForeignKey(
        'academics.CourseOffering',
        on_delete=models.PROTECT,
        related_name='enrollments',
        help_text="Course offering selected by student"
    )
    enrolled_date = models.DateTimeField(
        default=timezone.now,
        help_text="Date when this course was added to enrollment"
    )
    dropped = models.BooleanField(
        default=False,
        help_text="Whether student dropped this course"
    )
    dropped_date = models.DateTimeField(
        null=True,
        blank=True,
        help_text="Date when course was dropped"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['enrolled_date']
        indexes = [
            models.Index(fields=['enrollment']),
            models.Index(fields=['course_offering']),
        ]
        constraints = [
            # Prevent duplicate course in same enrollment
            models.UniqueConstraint(
                fields=['enrollment', 'course_offering'],
                name='unique_enrollment_course'
            )
        ]

    def __str__(self):
        status = " (Dropped)" if self.dropped else ""
        return f"{self.enrollment.student.user.email} - {self.course_offering.course.code}{status}"

    def clean(self):
        """Validate course selection rules."""
        errors = {}

        # Ensure course offering belongs to same session as enrollment
        if self.enrollment and self.course_offering:
            if self.enrollment.session != self.course_offering.session:
                errors['course_offering'] = (
                    f"Course offering session ({self.course_offering.session.label}) "
                    f"does not match enrollment session ({self.enrollment.session.label})"
                )

            # Ensure course level matches enrollment level
            if self.enrollment.level != self.course_offering.course.level:
                errors['course_offering'] = (
                    f"Course level ({self.course_offering.course.level.name}) "
                    f"does not match enrollment level ({self.enrollment.level.name})"
                )

            # Check if course offering is active (only for new course additions)
            if not self.pk and not self.course_offering.is_active:
                errors['course_offering'] = (
                    f"Course offering {self.course_offering.course.code} is not active"
                )

        if errors:
            raise ValidationError(errors)

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    def drop(self):
        """Drop this course from enrollment."""
        if not self.dropped:
            self.dropped = True
            self.dropped_date = timezone.now()
            self.save()
