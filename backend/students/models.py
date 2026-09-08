import uuid

from django.db import models

from users.models import User


def generate_student_code():
    """Generate unique student code in format ICAN-XXXXXX"""
    import random
    import string
    
    code = "ICAN-" + "".join(random.choices(string.digits, k=6))
    while StudentProfile.objects.filter(student_code=code).exists():
        code = "ICAN-" + "".join(random.choices(string.digits, k=6))
    return code


class StudentProfile(models.Model):
    """
    Extended profile for users with role=STUDENT.
    Connected 1:1 with User model.
    """

    GENDER_CHOICES = [
        ("M", "Male"),
        ("F", "Female"),
        ("O", "Other"),
        ("", "Prefer not to say"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="student_profile")
    
    # Identification
    student_code = models.CharField(max_length=20, unique=True, default=generate_student_code)
    
    # Personal Information
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    other_name = models.CharField(max_length=100, blank=True)
    date_of_birth = models.DateField(null=True, blank=True)
    gender = models.CharField(max_length=1, choices=GENDER_CHOICES, blank=True)
    
    # Contact Information
    whatsapp_number = models.CharField(max_length=20, blank=True)
    address = models.TextField(blank=True)
    
    # ICAN-specific
    ican_exam_id = models.CharField(
        max_length=50,
        blank=True,
        help_text="Student's ICAN examination registration number if applicable"
    )
    
    # Emergency Contact
    emergency_contact_name = models.CharField(max_length=100, blank=True)
    emergency_contact_phone = models.CharField(max_length=20, blank=True)
    emergency_contact_relationship = models.CharField(max_length=50, blank=True)
    
    # Profile Photo
    photo = models.ImageField(upload_to="student_photos/", null=True, blank=True)
    
    # Status
    is_active = models.BooleanField(default=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=["student_code"]),
            models.Index(fields=["first_name", "last_name"]),
            models.Index(fields=["is_active"]),
        ]
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.student_code} - {self.first_name} {self.last_name}"

    @property
    def full_name(self):
        if self.other_name:
            return f"{self.first_name} {self.other_name} {self.last_name}"
        return f"{self.first_name} {self.last_name}"

    def save(self, *args, **kwargs):
        # Ensure student_code is always set
        if not self.student_code:
            self.student_code = generate_student_code()
        super().save(*args, **kwargs)
