import os
from django.core.management.base import BaseCommand
from django.db import transaction

from users.models import User, Role, StaffProfile
from academics.models import Level, AcademicSession, Course, CourseOffering, ScheduleTemplate
from students.models import StudentProfile
from enrollments.models import Enrollment, EnrollmentCourse
from billing.models import FeeStructure, LevelTierPricing, Invoice, InvoiceItem, Payment, PaymentAllocation, Refund
from attendance.models import AttendanceRecord, ClassSession
from notifications.models import Announcement
from audit.models import AuditLog


class Command(BaseCommand):
    help = 'Wipes the database and creates a default admin user and levels'

    @transaction.atomic
    def handle(self, *args, **options):
        self.wipe_database()
        self.setup_default_levels()
        self.create_admin_user()

    def wipe_database(self):
        self.stdout.write("🧹 Wiping database clean...")
        PaymentAllocation.objects.all().delete()
        Refund.objects.all().delete()
        Payment.objects.all().delete()
        InvoiceItem.objects.all().delete()
        Invoice.objects.all().delete()
        LevelTierPricing.objects.all().delete()
        FeeStructure.objects.all().delete()
        AttendanceRecord.objects.all().delete()
        ClassSession.objects.all().delete()
        Announcement.objects.all().delete()
        AuditLog.objects.all().delete()
        EnrollmentCourse.objects.all().delete()
        Enrollment.objects.all().delete()
        ScheduleTemplate.objects.all().delete()
        CourseOffering.objects.all().delete()
        Course.objects.all().delete()
        AcademicSession.objects.all().delete()
        StudentProfile.objects.all().delete()
        StaffProfile.objects.all().delete()
        User.objects.all().delete()
        self.stdout.write(self.style.SUCCESS("✨ Database successfully wiped clean!"))

    def setup_default_levels(self):
        levels_data = [
            {"name": "Foundation", "code": Level.FOUNDATION, "order": 1, "description": "ICAN Foundation Level Qualification"},
            {"name": "Skills", "code": Level.SKILLS, "order": 2, "description": "ICAN Skills Level Qualification"},
            {"name": "Professional", "code": Level.PROFESSIONAL, "order": 3, "description": "ICAN Professional Level Qualification"},
        ]
        for ld in levels_data:
            Level.objects.get_or_create(code=ld["code"], defaults=ld)
        self.stdout.write(self.style.SUCCESS("✅ Created default ICAN Academic Levels (Foundation, Skills, Professional)."))

    def create_admin_user(self):
        admin_email = os.environ.get("ADMIN_EMAIL", "admin@icantutorial.com")
        admin_password = os.environ.get("ADMIN_PASSWORD", "AdminPass123!")

        user, created = User.objects.get_or_create(
            email=admin_email,
            defaults={
                "role": Role.SUPER_ADMIN,
                "is_staff": True,
                "is_superuser": True,
                "is_verified": True,
                "is_active": True,
            },
        )

        if not created:
            user.is_staff = True
            user.is_superuser = True
            user.is_verified = True
            user.is_active = True
            user.role = Role.SUPER_ADMIN
            
        user.set_password(admin_password)
        user.save()

        StaffProfile.objects.get_or_create(
            user=user,
            defaults={
                "first_name": "System",
                "last_name": "Admin",
                "department": "IT Administration",
            },
        )
        self.stdout.write(self.style.SUCCESS(f"✅ Successfully created Super Admin account: {admin_email} (Password: {admin_password})"))
