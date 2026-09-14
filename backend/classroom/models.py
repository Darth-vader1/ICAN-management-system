import uuid
from django.db import models
from django.conf import settings
from django.core.exceptions import ValidationError
from django.utils import timezone


class VirtualClassStatus(models.TextChoices):
    SCHEDULED = 'SCHEDULED', 'Scheduled'
    LOBBY = 'LOBBY', 'Lobby Open'
    LIVE = 'LIVE', 'Live'
    ENDED = 'ENDED', 'Ended'
    CANCELLED = 'CANCELLED', 'Cancelled'


class RecordingStatus(models.TextChoices):
    NOT_STARTED = 'NOT_STARTED', 'Not Started'
    RECORDING = 'RECORDING', 'Recording'
    PROCESSING = 'PROCESSING', 'Processing'
    READY = 'READY', 'Ready'
    FAILED = 'FAILED', 'Failed'


class AttendanceStatus(models.TextChoices):
    PRESENT = 'PRESENT', 'Present'
    PARTIAL = 'PARTIAL', 'Partial'
    ABSENT = 'ABSENT', 'Absent'


class VirtualClass(models.Model):
    """
    Represents a scheduled virtual classroom live session.
    Integrates CourseOffering + Instructor + LiveKit room credentials.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    course_offering = models.ForeignKey(
        'academics.CourseOffering',
        on_delete=models.CASCADE,
        related_name='virtual_classes',
        help_text="Course offering this virtual class belongs to"
    )
    instructor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='taught_virtual_classes',
        help_text="Primary instructor conducting the class"
    )
    title = models.CharField(max_length=250)
    description = models.TextField(blank=True)
    
    scheduled_start = models.DateTimeField()
    scheduled_end = models.DateTimeField()
    
    status = models.CharField(
        max_length=20,
        choices=VirtualClassStatus.choices,
        default=VirtualClassStatus.SCHEDULED
    )
    
    room_name = models.CharField(
        max_length=120,
        unique=True,
        help_text="Unique LiveKit room name"
    )
    
    recording_enabled = models.BooleanField(default=False)
    recording_status = models.CharField(
        max_length=20,
        choices=RecordingStatus.choices,
        default=RecordingStatus.NOT_STARTED
    )

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='created_virtual_classes'
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'classroom_virtual_class'
        ordering = ['-scheduled_start']
        indexes = [
            models.Index(fields=['course_offering', 'status']),
            models.Index(fields=['scheduled_start', 'status']),
            models.Index(fields=['room_name']),
        ]

    def __str__(self):
        return f"{self.course_offering.course.code} - {self.title} ({self.get_status_display()})"

    def clean(self):
        if self.scheduled_start and self.scheduled_end and self.scheduled_end <= self.scheduled_start:
            raise ValidationError("Scheduled end time must be after start time.")

    def save(self, *args, **kwargs):
        if not self.room_name:
            self.room_name = f"room_{self.id.hex[:12]}"
        self.full_clean()
        super().save(*args, **kwargs)

    @property
    def total_scheduled_duration_minutes(self):
        if not self.scheduled_start or not self.scheduled_end:
            return 0
        return int((self.scheduled_end - self.scheduled_start).total_seconds() / 60)

    @property
    def is_joinable(self):
        """Check if room is currently in joinable state (LOBBY or LIVE)."""
        return self.status in [VirtualClassStatus.LOBBY, VirtualClassStatus.LIVE]


class ClassMaterial(models.Model):
    """
    Associated learning resources (PDFs, slides, problem sets) for a virtual class.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    virtual_class = models.ForeignKey(
        VirtualClass,
        on_delete=models.CASCADE,
        related_name='materials'
    )
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    file = models.FileField(upload_to='classroom_materials/')
    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='uploaded_classroom_materials'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'classroom_material'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} ({self.virtual_class.title})"


class ClassRecording(models.Model):
    """
    LiveKit Egress / Video Recording Metadata.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    virtual_class = models.ForeignKey(
        VirtualClass,
        on_delete=models.CASCADE,
        related_name='recordings'
    )
    provider = models.CharField(max_length=50, default='livekit')
    egress_id = models.CharField(max_length=120, unique=True, null=True, blank=True)
    playback_url = models.URLField(max_length=500, blank=True)
    duration_seconds = models.PositiveIntegerField(default=0)
    status = models.CharField(
        max_length=20,
        choices=RecordingStatus.choices,
        default=RecordingStatus.PROCESSING
    )
    available_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'classroom_recording'
        ordering = ['-created_at']

    def __str__(self):
        return f"Recording for {self.virtual_class.title} ({self.get_status_display()})"


class ClassAttendance(models.Model):
    """
    Aggregated virtual classroom attendance for a student.
    Calculates total duration across multiple connection sessions.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    virtual_class = models.ForeignKey(
        VirtualClass,
        on_delete=models.CASCADE,
        related_name='virtual_attendances'
    )
    student = models.ForeignKey(
        'students.StudentProfile',
        on_delete=models.CASCADE,
        related_name='virtual_attendances'
    )
    first_joined_at = models.DateTimeField(null=True, blank=True)
    last_left_at = models.DateTimeField(null=True, blank=True)
    total_duration_seconds = models.PositiveIntegerField(default=0)
    attendance_status = models.CharField(
        max_length=20,
        choices=AttendanceStatus.choices,
        default=AttendanceStatus.ABSENT
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'classroom_attendance'
        unique_together = ['virtual_class', 'student']
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['virtual_class', 'attendance_status']),
            models.Index(fields=['student', 'attendance_status']),
        ]

    def __str__(self):
        return f"{self.student.full_name} - {self.virtual_class.title}: {self.get_attendance_status_display()}"


class ClassParticipation(models.Model):
    """
    Individual connection session (join to leave) for reconnection handling.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    attendance = models.ForeignKey(
        ClassAttendance,
        on_delete=models.CASCADE,
        related_name='participations'
    )
    joined_at = models.DateTimeField()
    left_at = models.DateTimeField(null=True, blank=True)
    duration_seconds = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'classroom_participation'
        ordering = ['joined_at']
        indexes = [
            models.Index(fields=['attendance', 'joined_at']),
            models.Index(fields=['left_at']),
        ]

    def __str__(self):
        return f"Participation ({self.joined_at} - {self.left_at or 'Active'})"


class ClassChatMessage(models.Model):
    """
    Persistent chat history for a virtual classroom.
    Retains chat log across page refreshes and reconnections.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    virtual_class = models.ForeignKey(
        VirtualClass,
        on_delete=models.CASCADE,
        related_name='chat_messages'
    )
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    sender_name = models.CharField(max_length=150)
    message_text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'classroom_chat_message'
        ordering = ['created_at']
        indexes = [
            models.Index(fields=['virtual_class', 'created_at']),
        ]

    def __str__(self):
        return f"{self.sender_name}: {self.message_text[:30]}"
