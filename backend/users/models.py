import uuid

from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models


class Role(models.TextChoices):
    SUPER_ADMIN = "super_admin", "Super Admin"
    MANAGER = "manager", "Manager"
    FINANCE = "finance", "Finance Staff"
    STUDENT_OFFICER = "student_officer", "Student Officer / Staff"
    IT_ADMIN = "it_admin", "IT Admin"
    STUDENT = "student", "Student"


class UserManager(BaseUserManager):
    use_in_migrations = True

    def _create_user(self, email, password, **extra_fields):
        if not email:
            raise ValueError("Email is required")
        email = email.strip().lower()
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_user(self, email, password=None, **extra_fields):
        extra_fields.setdefault("role", Role.STUDENT)
        extra_fields.setdefault("is_staff", False)
        extra_fields.setdefault("is_superuser", False)
        return self._create_user(email, password, **extra_fields)

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("role", Role.SUPER_ADMIN)
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("is_verified", True)
        if extra_fields.get("is_staff") is not True:
            raise ValueError("Superuser must have is_staff=True.")
        if extra_fields.get("is_superuser") is not True:
            raise ValueError("Superuser must have is_superuser=True.")
        return self._create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    """
    Single auth entity for everyone in the system. Role determines which
    profile (StudentProfile / StaffProfile) is attached and which DRF
    permission classes grant access downstream.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=20, blank=True)
    role = models.CharField(max_length=32, choices=Role.choices, default=Role.STUDENT)

    avatar = models.ImageField(upload_to="avatars/", null=True, blank=True)

    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)  # Django admin access, distinct from Role
    is_verified = models.BooleanField(default=False)
    must_change_password = models.BooleanField(default=False)

    date_joined = models.DateTimeField(auto_now_add=True)
    last_login = models.DateTimeField(null=True, blank=True)

    objects = UserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []

    def __init__(self, *args, **kwargs):
        kwargs.pop("username", None)
        first_name = kwargs.pop("first_name", "")
        last_name = kwargs.pop("last_name", "")
        super().__init__(*args, **kwargs)
        self.first_name = first_name
        self.last_name = last_name

    class Meta:
        indexes = [
            models.Index(fields=["email"]),
            models.Index(fields=["phone"]),
            models.Index(fields=["role"]),
        ]

    def __str__(self):
        return self.email

    @property
    def display_role(self):
        return f"{self.email} ({self.role})"

    @property
    def is_staff_role(self):
        return self.role in {
            Role.SUPER_ADMIN,
            Role.MANAGER,
            Role.FINANCE,
            Role.STUDENT_OFFICER,
            Role.IT_ADMIN,
        }

    @property
    def avatar_url(self):
        if self.avatar:
            try:
                return self.avatar.url
            except ValueError:
                pass
        if hasattr(self, "student_profile") and self.student_profile and self.student_profile.photo:
            try:
                return self.student_profile.photo.url
            except ValueError:
                pass
        return None

    @property
    def full_name(self):
        if hasattr(self, "staff_profile") and self.staff_profile and self.staff_profile.full_name:
            return self.staff_profile.full_name
        if hasattr(self, "student_profile") and self.student_profile and self.student_profile.full_name:
            return self.student_profile.full_name
        if self.email:
            name_part = self.email.split("@")[0].replace(".", " ").replace("_", " ").title()
            return name_part
        return "System"


class StaffProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="staff_profile")
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    department = models.CharField(max_length=100, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __init__(self, *args, **kwargs):
        self._phone_number = kwargs.pop("phone_number", "")
        self._employee_id = kwargs.pop("employee_id", "")
        super().__init__(*args, **kwargs)

    @property
    def phone_number(self):
        return self._phone_number

    @phone_number.setter
    def phone_number(self, value):
        self._phone_number = value

    @property
    def employee_id(self):
        return self._employee_id

    @employee_id.setter
    def employee_id(self, value):
        self._employee_id = value

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}".strip()

    def __str__(self):
        return f"{self.first_name} {self.last_name} — {self.user.role}"


# Lazy alias for test compatibility
def __getattr__(name):
    if name == "StudentProfile":
        from students.models import StudentProfile
        return StudentProfile
    raise AttributeError(f"module {__name__!r} has no attribute {name!r}")