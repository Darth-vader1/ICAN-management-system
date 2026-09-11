"""
Seed data creation script for ICAN Platform
Run this after migrations: python create_seed_data.py
"""
import os
import sys
import django
from datetime import date, timedelta

# Setup Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model
from django.utils import timezone
from users.models import Role, StaffProfile
from students.models import StudentProfile
from academics.models import AcademicSession, Level, Course, CourseOffering
from enrollments.models import Enrollment, EnrollmentCourse, EnrollmentStatus

User = get_user_model()


def create_seed_data():
    print("🌱 Creating seed data...")

    # 1. Create Super Admin
    print("\n1. Creating Super Admin...")
    if not User.objects.filter(email="admin@ican.edu").exists():
        admin = User.objects.create_superuser(
            email="admin@ican.edu",
            password="admin123456",
            role=Role.SUPER_ADMIN,
        )
        StaffProfile.objects.create(
            user=admin,
            first_name="System",
            last_name="Administrator",
            department="IT"
        )
        print("   ✅ Super Admin created: admin@ican.edu / admin123456")
    else:
        print("   ⏭️  Super Admin already exists")

    # 2. Create Manager
    print("\n2. Creating Manager...")
    if not User.objects.filter(email="manager@ican.edu").exists():
        manager = User.objects.create_user(
            email="manager@ican.edu",
            password="manager123456",
            role=Role.MANAGER,
            is_verified=True,
        )
        StaffProfile.objects.create(
            user=manager,
            first_name="John",
            last_name="Manager",
            department="Administration"
        )
        print("   ✅ Manager created: manager@ican.edu / manager123456")
    else:
        print("   ⏭️  Manager already exists")

    # 3. Create Finance Staff
    print("\n3. Creating Finance Staff...")
    if not User.objects.filter(email="finance@ican.edu").exists():
        finance = User.objects.create_user(
            email="finance@ican.edu",
            password="finance123456",
            role=Role.FINANCE,
            is_verified=True,
        )
        StaffProfile.objects.create(
            user=finance,
            first_name="Jane",
            last_name="Accountant",
            department="Finance"
        )
        print("   ✅ Finance Staff created: finance@ican.edu / finance123456")
    else:
        print("   ⏭️  Finance Staff already exists")

    # 4. Create Student Officer
    print("\n4. Creating Student Officer...")
    if not User.objects.filter(email="officer@ican.edu").exists():
        officer = User.objects.create_user(
            email="officer@ican.edu",
            password="officer123456",
            role=Role.STUDENT_OFFICER,
            is_verified=True,
        )
        StaffProfile.objects.create(
            user=officer,
            first_name="Mary",
            last_name="Officer",
            department="Student Services"
        )
        print("   ✅ Student Officer created: officer@ican.edu / officer123456")
    else:
        print("   ⏭️  Student Officer already exists")

    # 5. Create IT Admin
    print("\n5. Creating IT Admin...")
    if not User.objects.filter(email="it@ican.edu").exists():
        it_admin = User.objects.create_user(
            email="it@ican.edu",
            password="itadmin123456",
            role=Role.IT_ADMIN,
            is_verified=True,
        )
        StaffProfile.objects.create(
            user=it_admin,
            first_name="David",
            last_name="Tech",
            department="IT"
        )
        print("   ✅ IT Admin created: it@ican.edu / itadmin123456")
    else:
        print("   ⏭️  IT Admin already exists")

    # 6. Create Demo Students
    print("\n6. Creating Demo Students...")
    
    demo_students = [
        {
            "email": "student@ican.edu",
            "password": "student123456",
            "first_name": "Alice",
            "last_name": "Johnson",
            "phone": "+234 800 111 2222",
            "ican_exam_id": "ICAN/2024/001"
        },
        {
            "email": "student2@ican.edu",
            "password": "student123456",
            "first_name": "Bob",
            "last_name": "Williams",
            "phone": "+234 800 222 3333",
            "ican_exam_id": "ICAN/2024/002"
        },
        {
            "email": "student3@ican.edu",
            "password": "student123456",
            "first_name": "Carol",
            "last_name": "Davis",
            "phone": "+234 800 333 4444",
            "ican_exam_id": "ICAN/2024/003"
        },
    ]

    for student_data in demo_students:
        email = student_data["email"]
        if not User.objects.filter(email=email).exists():
            user = User.objects.create_user(
                email=email,
                password=student_data["password"],
                phone=student_data.get("phone", ""),
                role=Role.STUDENT,
                is_verified=True,  # Pre-verify demo students
            )
            StudentProfile.objects.create(
                user=user,
                first_name=student_data["first_name"],
                last_name=student_data["last_name"],
                ican_exam_id=student_data.get("ican_exam_id", ""),
            )
            print(f"   ✅ Student created: {email} / {student_data['password']}")
        else:
            print(f"   ⏭️  Student {email} already exists")

    # 7. Create Academic Sessions
    print("\n7. Creating Academic Sessions...")
    sessions_data = [
        {
            "label": "2026/2027",
            "start_date": date(2026, 9, 1),
            "end_date": date(2027, 8, 31),
            "is_active": True
        },
        {
            "label": "2027/2028",
            "start_date": date(2027, 9, 1),
            "end_date": date(2028, 8, 31),
            "is_active": False
        }
    ]
    
    for session_data in sessions_data:
        if not AcademicSession.objects.filter(label=session_data["label"]).exists():
            AcademicSession.objects.create(**session_data)
            print(f"   ✅ Session created: {session_data['label']}")
        else:
            print(f"   ⏭️  Session {session_data['label']} already exists")

    # 8. Create Levels
    print("\n8. Creating ICAN Levels...")
    levels_data = [
        {
            "name": "Foundation",
            "code": Level.FOUNDATION,
            "order": 1,
            "description": "Foundation level courses for ICAN certification"
        },
        {
            "name": "Skills",
            "code": Level.SKILLS,
            "order": 2,
            "description": "Skills level courses for ICAN certification"
        },
        {
            "name": "Professional",
            "code": Level.PROFESSIONAL,
            "order": 3,
            "description": "Professional level courses for ICAN certification"
        }
    ]
    
    created_levels = {}
    for level_data in levels_data:
        level, created = Level.objects.get_or_create(
            code=level_data["code"],
            defaults=level_data
        )
        created_levels[level_data["code"]] = level
        if created:
            print(f"   ✅ Level created: {level_data['name']}")
        else:
            print(f"   ⏭️  Level {level_data['name']} already exists")

    # 9. Create Courses
    print("\n9. Creating Demo Courses...")
    courses_data = [
        # Foundation Courses
        {
            "level": Level.FOUNDATION,
            "name": "Financial Accounting",
            "code": "FA101",
            "description": "Introduction to financial accounting principles",
            "duration": 12
        },
        {
            "level": Level.FOUNDATION,
            "name": "Business Law",
            "code": "BL101",
            "description": "Fundamentals of business law",
            "duration": 10
        },
        {
            "level": Level.FOUNDATION,
            "name": "Economics",
            "code": "EC101",
            "description": "Basic economic principles",
            "duration": 8
        },
        # Skills Courses
        {
            "level": Level.SKILLS,
            "name": "Management Accounting",
            "code": "MA201",
            "description": "Cost and management accounting",
            "duration": 14
        },
        {
            "level": Level.SKILLS,
            "name": "Financial Reporting",
            "code": "FR201",
            "description": "Advanced financial reporting",
            "duration": 14
        },
        {
            "level": Level.SKILLS,
            "name": "Taxation",
            "code": "TX201",
            "description": "Principles of taxation",
            "duration": 12
        },
        # Professional Courses
        {
            "level": Level.PROFESSIONAL,
            "name": "Advanced Financial Reporting",
            "code": "AFR301",
            "description": "Complex financial reporting scenarios",
            "duration": 16
        },
        {
            "level": Level.PROFESSIONAL,
            "name": "Strategic Management",
            "code": "SM301",
            "description": "Strategic business management",
            "duration": 14
        },
        {
            "level": Level.PROFESSIONAL,
            "name": "Advanced Audit & Assurance",
            "code": "AAA301",
            "description": "Advanced auditing principles",
            "duration": 16
        }
    ]
    
    created_courses = []
    for course_data in courses_data:
        level_code = course_data.pop("level")
        level = created_levels[level_code]
        
        course, created = Course.objects.get_or_create(
            code=course_data["code"],
            defaults={**course_data, "level": level}
        )
        created_courses.append(course)
        
        if created:
            print(f"   ✅ Course created: {course_data['code']} - {course_data['name']}")
        else:
            print(f"   ⏭️  Course {course_data['code']} already exists")

    # 10. Create Course Offerings
    print("\n10. Creating Course Offerings for 2026/2027...")
    active_session = AcademicSession.objects.filter(is_active=True).first()
    
    course_offerings = []
    if active_session and created_courses:
        # Get a tutor (manager) for demo purposes
        demo_tutor = StaffProfile.objects.filter(user__role=Role.MANAGER).first()
        
        offerings_created = 0
        for course in created_courses[:6]:  # Create offerings for first 6 courses
            offering, created = CourseOffering.objects.get_or_create(
                course=course,
                session=active_session,
                defaults={
                    "tutor": demo_tutor,
                    "capacity": 50,
                    "is_active": True
                }
            )
            course_offerings.append(offering)
            
            if created:
                offerings_created += 1
        
        print(f"   ✅ Created {offerings_created} course offerings for {active_session.label}")
    else:
        print("   ⏭️  No active session or courses available")

    # 11. Create Sample Enrollments
    print("\n11. Creating Sample Enrollments...")
    
    if active_session and course_offerings:
        # Get the demo students
        alice = StudentProfile.objects.filter(user__email="student@ican.edu").first()
        bob = StudentProfile.objects.filter(user__email="student2@ican.edu").first()
        carol = StudentProfile.objects.filter(user__email="student3@ican.edu").first()
        
        # Get levels
        foundation_level = created_levels.get(Level.FOUNDATION)
        skills_level = created_levels.get(Level.SKILLS)
        
        enrollments_data = [
            {
                "student": alice,
                "session": active_session,
                "level": foundation_level,
                "status": EnrollmentStatus.ACTIVE,
                "courses": course_offerings[:3],  # First 3 foundation courses
                "notes": "Active enrollment - Foundation Level"
            },
            {
                "student": bob,
                "session": active_session,
                "level": foundation_level,
                "status": EnrollmentStatus.DRAFT,
                "courses": course_offerings[:2],  # First 2 foundation courses
                "notes": "Draft enrollment - awaiting confirmation"
            },
            {
                "student": carol,
                "session": active_session,
                "level": skills_level,
                "status": EnrollmentStatus.ACTIVE,
                "courses": course_offerings[3:6] if len(course_offerings) > 3 else [],  # Skills courses
                "notes": "Active enrollment - Skills Level"
            },
        ]
        
        enrollments_created = 0
        for enrollment_data in enrollments_data:
            student = enrollment_data.pop("student")
            courses = enrollment_data.pop("courses")
            
            if student and courses:
                # Check if enrollment already exists
                existing = Enrollment.objects.filter(
                    student=student,
                    session=enrollment_data["session"],
                    level=enrollment_data["level"]
                ).first()
                
                if not existing:
                    # Create enrollment
                    enrollment = Enrollment.objects.create(
                        student=student,
                        **enrollment_data
                    )
                    
                    # Activate if status is active
                    if enrollment_data["status"] == EnrollmentStatus.ACTIVE:
                        enrollment.activate()
                    
                    # Add courses
                    for course_offering in courses:
                        EnrollmentCourse.objects.create(
                            enrollment=enrollment,
                            course_offering=course_offering
                        )
                    
                    enrollments_created += 1
                    print(f"   ✅ Enrollment created: {student.full_name} - {enrollment_data['level'].name} Level ({enrollment_data['status']})")
                else:
                    print(f"   ⏭️  Enrollment for {student.full_name} already exists")
        
        print(f"   ✅ Created {enrollments_created} enrollments")
    else:
        print("   ⏭️  No active session or course offerings available")

    # 12. Create Fee Structures
    print("\n12. Creating Fee Structures...")
    
    from billing.models import FeeStructure, FeeType
    from django.db import models as django_models
    from decimal import Decimal
    
    if active_session and created_levels:
        fee_structures_data = [
            # Registration fees (level-specific)
            {
                "session": active_session,
                "level": created_levels[Level.FOUNDATION],
                "fee_type": FeeType.REGISTRATION,
                "description": "Foundation Level Registration Fee",
                "amount": Decimal("15000.00")
            },
            {
                "session": active_session,
                "level": created_levels[Level.SKILLS],
                "fee_type": FeeType.REGISTRATION,
                "description": "Skills Level Registration Fee",
                "amount": Decimal("20000.00")
            },
            {
                "session": active_session,
                "level": created_levels[Level.PROFESSIONAL],
                "fee_type": FeeType.REGISTRATION,
                "description": "Professional Level Registration Fee",
                "amount": Decimal("25000.00")
            },
            # Course fees (per course)
            {
                "session": active_session,
                "level": created_levels[Level.FOUNDATION],
                "fee_type": FeeType.COURSE,
                "description": "Foundation Course Fee (per course)",
                "amount": Decimal("12000.00")
            },
            {
                "session": active_session,
                "level": created_levels[Level.SKILLS],
                "fee_type": FeeType.COURSE,
                "description": "Skills Course Fee (per course)",
                "amount": Decimal("18000.00")
            },
            {
                "session": active_session,
                "level": created_levels[Level.PROFESSIONAL],
                "fee_type": FeeType.COURSE,
                "description": "Professional Course Fee (per course)",
                "amount": Decimal("25000.00")
            },
            # Materials fees (level-wide)
            {
                "session": active_session,
                "level": created_levels[Level.FOUNDATION],
                "fee_type": FeeType.MATERIALS,
                "description": "Foundation Study Materials",
                "amount": Decimal("8000.00")
            },
            {
                "session": active_session,
                "level": created_levels[Level.SKILLS],
                "fee_type": FeeType.MATERIALS,
                "description": "Skills Study Materials",
                "amount": Decimal("10000.00")
            },
            {
                "session": active_session,
                "level": created_levels[Level.PROFESSIONAL],
                "fee_type": FeeType.MATERIALS,
                "description": "Professional Study Materials",
                "amount": Decimal("12000.00")
            },
        ]
        
        fees_created = 0
        for fee_data in fee_structures_data:
            fee, created = FeeStructure.objects.get_or_create(
                session=fee_data["session"],
                level=fee_data.get("level"),
                fee_type=fee_data["fee_type"],
                defaults=fee_data
            )
            if created:
                fees_created += 1
        
        print(f"   ✅ Created {fees_created} fee structures for {active_session.label}")
    else:
        print("   ⏭️  No active session or levels available")
    
    # 13. Create Sample Invoices
    print("\n13. Creating Sample Invoices...")
    
    from billing.services import InvoiceService
    from billing.models import Invoice, Payment, PaymentStatus, PaymentMethod
    from billing.services import BalanceCalculator
    
    # Get enrollments
    enrollments = Enrollment.objects.filter(
        session=active_session
    ).select_related('student', 'level')
    
    invoices_created = 0
    for enrollment in enrollments:
        # Check if invoice already exists
        if not hasattr(enrollment, 'invoice'):
            try:
                invoice = InvoiceService.create_invoice_for_enrollment(
                    enrollment=enrollment,
                    due_days=30,
                    notes=f"Auto-generated invoice for {enrollment.student.full_name}"
                )
                invoices_created += 1
                print(f"   ✅ Invoice created: {invoice.invoice_number} for {enrollment.student.full_name}")
            except Exception as e:
                print(f"   ⚠️  Failed to create invoice for {enrollment.student.full_name}: {e}")
        else:
            print(f"   ⏭️  Invoice already exists for {enrollment.student.full_name}")
    
    print(f"   ✅ Created {invoices_created} invoices")
    
    # 14. Create Sample Payments
    print("\n14. Creating Sample Payments...")
    
    # Get invoices
    alice_invoice = Invoice.objects.filter(
        student__user__email="student@ican.edu"
    ).first()
    
    bob_invoice = Invoice.objects.filter(
        student__user__email="student2@ican.edu"
    ).first()
    
    finance_staff = User.objects.filter(role='finance').first() or User.objects.filter(role='super_admin').first()
    payments_created = 0
    
    # Alice - Full payment (paid invoice)
    if alice_invoice and not Payment.objects.filter(
        student=alice_invoice.student,
        provider_reference__startswith=alice_invoice.invoice_number
    ).exists():
        alice_payment = Payment.objects.create(
            student=alice_invoice.student,
            invoice=alice_invoice,
            amount=alice_invoice.total_amount,
            currency='NGN',
            method=PaymentMethod.BANK_TRANSFER,
            provider='manual',
            provider_reference=f"{alice_invoice.invoice_number}-DEMO-001",
            status=PaymentStatus.SUCCESSFUL,
            verified_at=timezone.now(),
            verified_by=finance_staff,
            notes="Demo payment - Bank transfer (fully paid)"
        )
        
        # Allocate payment
        BalanceCalculator.allocate_payment_to_invoice(
            payment=alice_payment,
            invoice=alice_invoice,
            allocated_by=finance_staff
        )
        
        payments_created += 1
        print(f"   ✅ Full payment created for Alice (₦{alice_payment.amount:,.2f})")
    
    # Bob - Partial payment
    if bob_invoice and not Payment.objects.filter(
        student=bob_invoice.student,
        provider_reference__startswith=bob_invoice.invoice_number
    ).exists():
        partial_amount = bob_invoice.total_amount / 2
        bob_payment = Payment.objects.create(
            student=bob_invoice.student,
            invoice=bob_invoice,
            amount=partial_amount,
            currency='NGN',
            method=PaymentMethod.CASH,
            provider='manual',
            provider_reference=f"{bob_invoice.invoice_number}-DEMO-002",
            status=PaymentStatus.SUCCESSFUL,
            verified_at=timezone.now(),
            verified_by=finance_staff,
            notes="Demo payment - Cash (partial payment)"
        )
        
        # Allocate payment
        BalanceCalculator.allocate_payment_to_invoice(
            payment=bob_payment,
            invoice=bob_invoice,
            allocated_by=None
        )
        
        payments_created += 1
        print(f"   ✅ Partial payment created for Bob (₦{bob_payment.amount:,.2f})")
    
    print(f"   ✅ Created {payments_created} payments")

    # 15. Create Notification Templates
    print("\n15. Creating Notification Templates...")
    
    from notifications.models import NotificationTemplate
    
    templates_data = [
        # Welcome email
        {
            "key": "welcome",
            "channel": NotificationTemplate.Channel.EMAIL,
            "subject": "Welcome to ICAN Tutorial Centre!",
            "body_text": """Hello {{user_name}},

Welcome to ICAN Tutorial Centre Management Platform!

Your account has been successfully created with the email: {{email}}

You can now:
- View your enrollments and courses
- Check your invoices and make payments
- Track your attendance
- Stay updated with notifications

If you have any questions, please contact our support team.

Best regards,
ICAN Tutorial Centre Team""",
            "body_html": """<html>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <h2 style="color: #2563eb;">Welcome to ICAN Tutorial Centre!</h2>
    <p>Hello <strong>{{user_name}}</strong>,</p>
    <p>Welcome to ICAN Tutorial Centre Management Platform!</p>
    <p>Your account has been successfully created with the email: <strong>{{email}}</strong></p>
    <h3>What you can do now:</h3>
    <ul>
        <li>View your enrollments and courses</li>
        <li>Check your invoices and make payments</li>
        <li>Track your attendance</li>
        <li>Stay updated with notifications</li>
    </ul>
    <p>If you have any questions, please contact our support team.</p>
    <p style="margin-top: 30px;">Best regards,<br><strong>ICAN Tutorial Centre Team</strong></p>
</body>
</html>"""
        },
        # Password reset
        {
            "key": "password_reset",
            "channel": NotificationTemplate.Channel.EMAIL,
            "subject": "Reset Your Password - ICAN Tutorial Centre",
            "body_text": """Hello {{user_name}},

You requested to reset your password for your ICAN Tutorial Centre account.

Use the following link to reset your password:
{{reset_url}}

This link will expire in 24 hours.

If you didn't request this, please ignore this email.

Best regards,
ICAN Tutorial Centre Team""",
            "body_html": """<html>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <h2 style="color: #2563eb;">Reset Your Password</h2>
    <p>Hello <strong>{{user_name}}</strong>,</p>
    <p>You requested to reset your password for your ICAN Tutorial Centre account.</p>
    <p><a href="{{reset_url}}" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0;">Reset Password</a></p>
    <p>This link will expire in 24 hours.</p>
    <p>If you didn't request this, please ignore this email.</p>
    <p style="margin-top: 30px;">Best regards,<br><strong>ICAN Tutorial Centre Team</strong></p>
</body>
</html>"""
        },
        # Invoice created
        {
            "key": "invoice_created",
            "channel": NotificationTemplate.Channel.EMAIL,
            "subject": "New Invoice {{invoice_number}} - ICAN Tutorial Centre",
            "body_text": """Hello {{user_name}},

A new invoice has been generated for your enrollment.

Invoice Number: {{invoice_number}}
Session: {{session}}
Level: {{level}}
Total Amount: ₦{{total_amount}}
Due Date: {{due_date}}

Please log in to your account to view the full invoice and make payment.

Best regards,
ICAN Tutorial Centre Team""",
            "body_html": """<html>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <h2 style="color: #2563eb;">New Invoice Generated</h2>
    <p>Hello <strong>{{user_name}}</strong>,</p>
    <p>A new invoice has been generated for your enrollment.</p>
    <table style="border-collapse: collapse; width: 100%; max-width: 500px; margin: 20px 0;">
        <tr style="background-color: #f3f4f6;">
            <td style="padding: 10px; border: 1px solid #e5e7eb;"><strong>Invoice Number</strong></td>
            <td style="padding: 10px; border: 1px solid #e5e7eb;">{{invoice_number}}</td>
        </tr>
        <tr>
            <td style="padding: 10px; border: 1px solid #e5e7eb;"><strong>Session</strong></td>
            <td style="padding: 10px; border: 1px solid #e5e7eb;">{{session}}</td>
        </tr>
        <tr style="background-color: #f3f4f6;">
            <td style="padding: 10px; border: 1px solid #e5e7eb;"><strong>Level</strong></td>
            <td style="padding: 10px; border: 1px solid #e5e7eb;">{{level}}</td>
        </tr>
        <tr>
            <td style="padding: 10px; border: 1px solid #e5e7eb;"><strong>Total Amount</strong></td>
            <td style="padding: 10px; border: 1px solid #e5e7eb;"><strong>₦{{total_amount}}</strong></td>
        </tr>
        <tr style="background-color: #f3f4f6;">
            <td style="padding: 10px; border: 1px solid #e5e7eb;"><strong>Due Date</strong></td>
            <td style="padding: 10px; border: 1px solid #e5e7eb;">{{due_date}}</td>
        </tr>
    </table>
    <p>Please log in to your account to view the full invoice and make payment.</p>
    <p style="margin-top: 30px;">Best regards,<br><strong>ICAN Tutorial Centre Team</strong></p>
</body>
</html>"""
        },
        # Payment confirmation
        {
            "key": "payment_confirmation",
            "channel": NotificationTemplate.Channel.EMAIL,
            "subject": "Payment Received - ICAN Tutorial Centre",
            "body_text": """Hello {{user_name}},

Your payment has been received and confirmed!

Amount Paid: ₦{{amount}}
Payment Method: {{payment_method}}
Transaction Date: {{transaction_date}}
Reference: {{reference}}

Thank you for your payment.

Best regards,
ICAN Tutorial Centre Team""",
            "body_html": """<html>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <h2 style="color: #10b981;">Payment Received</h2>
    <p>Hello <strong>{{user_name}}</strong>,</p>
    <p>Your payment has been received and confirmed!</p>
    <table style="border-collapse: collapse; width: 100%; max-width: 500px; margin: 20px 0;">
        <tr style="background-color: #f3f4f6;">
            <td style="padding: 10px; border: 1px solid #e5e7eb;"><strong>Amount Paid</strong></td>
            <td style="padding: 10px; border: 1px solid #e5e7eb;"><strong>₦{{amount}}</strong></td>
        </tr>
        <tr>
            <td style="padding: 10px; border: 1px solid #e5e7eb;"><strong>Payment Method</strong></td>
            <td style="padding: 10px; border: 1px solid #e5e7eb;">{{payment_method}}</td>
        </tr>
        <tr style="background-color: #f3f4f6;">
            <td style="padding: 10px; border: 1px solid #e5e7eb;"><strong>Transaction Date</strong></td>
            <td style="padding: 10px; border: 1px solid #e5e7eb;">{{transaction_date}}</td>
        </tr>
        <tr>
            <td style="padding: 10px; border: 1px solid #e5e7eb;"><strong>Reference</strong></td>
            <td style="padding: 10px; border: 1px solid #e5e7eb;">{{reference}}</td>
        </tr>
    </table>
    <p>Thank you for your payment.</p>
    <p style="margin-top: 30px;">Best regards,<br><strong>ICAN Tutorial Centre Team</strong></p>
</body>
</html>"""
        },
        # Payment reminder
        {
            "key": "payment_reminder",
            "channel": NotificationTemplate.Channel.EMAIL,
            "subject": "Payment Reminder - Invoice {{invoice_number}}",
            "body_text": """Hello {{user_name}},

This is a reminder that your invoice is due soon.

Invoice Number: {{invoice_number}}
Balance: ₦{{balance}}
Due Date: {{due_date}}
Days Until Due: {{days_until_due}}

Session: {{session}}
Level: {{level}}

Please log in to make your payment before the due date.

Best regards,
ICAN Tutorial Centre Team""",
            "body_html": """<html>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <h2 style="color: #f59e0b;">Payment Reminder</h2>
    <p>Hello <strong>{{user_name}}</strong>,</p>
    <p>This is a reminder that your invoice is due soon.</p>
    <table style="border-collapse: collapse; width: 100%; max-width: 500px; margin: 20px 0;">
        <tr style="background-color: #f3f4f6;">
            <td style="padding: 10px; border: 1px solid #e5e7eb;"><strong>Invoice Number</strong></td>
            <td style="padding: 10px; border: 1px solid #e5e7eb;">{{invoice_number}}</td>
        </tr>
        <tr>
            <td style="padding: 10px; border: 1px solid #e5e7eb;"><strong>Balance</strong></td>
            <td style="padding: 10px; border: 1px solid #e5e7eb;"><strong>₦{{balance}}</strong></td>
        </tr>
        <tr style="background-color: #f3f4f6;">
            <td style="padding: 10px; border: 1px solid #e5e7eb;"><strong>Due Date</strong></td>
            <td style="padding: 10px; border: 1px solid #e5e7eb;">{{due_date}}</td>
        </tr>
        <tr>
            <td style="padding: 10px; border: 1px solid #e5e7eb;"><strong>Days Until Due</strong></td>
            <td style="padding: 10px; border: 1px solid #e5e7eb;">{{days_until_due}}</td>
        </tr>
    </table>
    <p><strong>Session:</strong> {{session}} | <strong>Level:</strong> {{level}}</p>
    <p>Please log in to make your payment before the due date.</p>
    <p style="margin-top: 30px;">Best regards,<br><strong>ICAN Tutorial Centre Team</strong></p>
</body>
</html>"""
        },
        # Payment due today
        {
            "key": "payment_due_today",
            "channel": NotificationTemplate.Channel.EMAIL,
            "subject": "Payment Due Today - Invoice {{invoice_number}}",
            "body_text": """Hello {{user_name}},

URGENT: Your invoice is due today!

Invoice Number: {{invoice_number}}
Balance: ₦{{balance}}
Due Date: {{due_date}} (TODAY)

Session: {{session}}
Level: {{level}}

Please make your payment today to avoid late fees.

Best regards,
ICAN Tutorial Centre Team""",
            "body_html": """<html>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <h2 style="color: #f59e0b;">Payment Due Today</h2>
    <p>Hello <strong>{{user_name}}</strong>,</p>
    <p style="color: #dc2626; font-weight: bold;">URGENT: Your invoice is due today!</p>
    <table style="border-collapse: collapse; width: 100%; max-width: 500px; margin: 20px 0;">
        <tr style="background-color: #f3f4f6;">
            <td style="padding: 10px; border: 1px solid #e5e7eb;"><strong>Invoice Number</strong></td>
            <td style="padding: 10px; border: 1px solid #e5e7eb;">{{invoice_number}}</td>
        </tr>
        <tr>
            <td style="padding: 10px; border: 1px solid #e5e7eb;"><strong>Balance</strong></td>
            <td style="padding: 10px; border: 1px solid #e5e7eb;"><strong style="color: #dc2626;">₦{{balance}}</strong></td>
        </tr>
        <tr style="background-color: #f3f4f6;">
            <td style="padding: 10px; border: 1px solid #e5e7eb;"><strong>Due Date</strong></td>
            <td style="padding: 10px; border: 1px solid #e5e7eb;"><strong>{{due_date}} (TODAY)</strong></td>
        </tr>
    </table>
    <p><strong>Session:</strong> {{session}} | <strong>Level:</strong> {{level}}</p>
    <p>Please make your payment today to avoid late fees.</p>
    <p style="margin-top: 30px;">Best regards,<br><strong>ICAN Tutorial Centre Team</strong></p>
</body>
</html>"""
        },
        # Payment overdue
        {
            "key": "payment_overdue",
            "channel": NotificationTemplate.Channel.EMAIL,
            "subject": "OVERDUE: Invoice {{invoice_number}} - ICAN Tutorial Centre",
            "body_text": """Hello {{user_name}},

IMPORTANT: Your invoice is now overdue!

Invoice Number: {{invoice_number}}
Balance: ₦{{balance}}
Due Date: {{due_date}} (OVERDUE)

Session: {{session}}
Level: {{level}}

Please make payment immediately to avoid further penalties.

Best regards,
ICAN Tutorial Centre Team""",
            "body_html": """<html>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <h2 style="color: #dc2626;">Payment Overdue</h2>
    <p>Hello <strong>{{user_name}}</strong>,</p>
    <p style="color: #dc2626; font-weight: bold;">IMPORTANT: Your invoice is now overdue!</p>
    <table style="border-collapse: collapse; width: 100%; max-width: 500px; margin: 20px 0;">
        <tr style="background-color: #fee2e2;">
            <td style="padding: 10px; border: 1px solid #fecaca;"><strong>Invoice Number</strong></td>
            <td style="padding: 10px; border: 1px solid #fecaca;">{{invoice_number}}</td>
        </tr>
        <tr style="background-color: #fee2e2;">
            <td style="padding: 10px; border: 1px solid #fecaca;"><strong>Balance</strong></td>
            <td style="padding: 10px; border: 1px solid #fecaca;"><strong style="color: #dc2626;">₦{{balance}}</strong></td>
        </tr>
        <tr style="background-color: #fee2e2;">
            <td style="padding: 10px; border: 1px solid #fecaca;"><strong>Due Date</strong></td>
            <td style="padding: 10px; border: 1px solid #fecaca;"><strong style="color: #dc2626;">{{due_date}} (OVERDUE)</strong></td>
        </tr>
    </table>
    <p><strong>Session:</strong> {{session}} | <strong>Level:</strong> {{level}}</p>
    <p style="color: #dc2626;">Please make payment immediately to avoid further penalties.</p>
    <p style="margin-top: 30px;">Best regards,<br><strong>ICAN Tutorial Centre Team</strong></p>
</body>
</html>"""
        },
    ]
    
    templates_created = 0
    for template_data in templates_data:
        template, created = NotificationTemplate.objects.get_or_create(
            key=template_data["key"],
            defaults=template_data
        )
        if created:
            templates_created += 1
            print(f"   ✅ Created template: {template.key}")
        else:
            print(f"   ⏭️  Template already exists: {template.key}")
    
    print(f"   ✅ Created {templates_created} notification templates")

    # 16. Create Sample Class Sessions
    print("\n16. Creating Sample Class Sessions...")
    
    from attendance.models import ClassSession, AttendanceRecord
    from datetime import time
    
    if active_session and course_offerings:
        sessions_data = []
        
        # Get instructor (use IT admin as default instructor)
        instructor = User.objects.filter(role=Role.IT_ADMIN).first()
        
        # Create sessions for each course offering
        for offering in course_offerings:
            
            # Create 4 past sessions and 2 upcoming sessions
            base_date = date.today()
            
            for week in range(1, 7):
                # Calculate session date (going back 4 weeks, then forward 2 weeks)
                days_offset = (week - 5) * 7  # Weeks 1-4 are in the past, 5-6 are future
                session_date = base_date + timedelta(days=days_offset)
                
                session_status = ClassSession.Status.COMPLETED if week <= 4 else ClassSession.Status.SCHEDULED
                
                sessions_data.append({
                    'course_offering': offering,
                    'instructor': instructor,
                    'title': f'Week {week}: {offering.course.name} Session',
                    'description': f'Week {week} session covering key concepts',
                    'session_date': session_date,
                    'start_time': time(9, 0),
                    'end_time': time(11, 0),
                    'location': f'Room {100 + (week % 3)}',
                    'status': session_status,
                })
        
        sessions_created = 0
        for session_data in sessions_data:
            session, created = ClassSession.objects.get_or_create(
                course_offering=session_data['course_offering'],
                session_date=session_data['session_date'],
                start_time=session_data['start_time'],
                defaults=session_data
            )
            if created:
                sessions_created += 1
        
        print(f"   ✅ Created {sessions_created} class sessions")
    else:
        print("   ⏭️  No active session or course offerings available")
    
    # 17. Create Sample Attendance Records
    print("\n17. Creating Sample Attendance Records...")
    
    # Get completed sessions
    completed_sessions = ClassSession.objects.filter(
        status=ClassSession.Status.COMPLETED
    )
    
    attendance_created = 0
    for session in completed_sessions:
        # Get enrolled students for this course
        from enrollments.models import EnrollmentCourse
        
        enrolled = EnrollmentCourse.objects.filter(
            course_offering=session.course_offering,
            enrollment__status='active'
        ).select_related('enrollment__student')
        
        for enrollment_course in enrolled:
            student = enrollment_course.enrollment.student
            
            # Randomize attendance (80% present, 10% late, 10% absent)
            import random
            rand = random.random()
            
            if rand < 0.80:
                status_choice = AttendanceRecord.Status.PRESENT
                notes = ''
                arrival_time = None
            elif rand < 0.90:
                status_choice = AttendanceRecord.Status.LATE
                notes = 'Arrived 15 minutes late'
                arrival_time = time(9, 15)
            else:
                status_choice = AttendanceRecord.Status.ABSENT
                notes = 'No show'
                arrival_time = None
            
            record, created = AttendanceRecord.objects.get_or_create(
                class_session=session,
                student=student,
                defaults={
                    'status': status_choice,
                    'notes': notes,
                    'arrival_time': arrival_time,
                    'marked_by': session.instructor,
                }
            )
            
            if created:
                attendance_created += 1
        
        # Mark attendance as complete
        if not session.attendance_marked_at:
            session.attendance_marked_at = timezone.now()
            session.attendance_marked_by = session.instructor
            session.save()
    
    print(f"   ✅ Created {attendance_created} attendance records")

    print("\n✨ Seed data creation complete!")
    print("\n📋 Summary of Created Accounts:")
    print("=" * 60)
    print(f"{'Role':<20} {'Email':<30} {'Password':<20}")
    print("=" * 60)
    print(f"{'Super Admin':<20} {'admin@ican.edu':<30} {'admin123456':<20}")
    print(f"{'Manager':<20} {'manager@ican.edu':<30} {'manager123456':<20}")
    print(f"{'Finance Staff':<20} {'finance@ican.edu':<30} {'finance123456':<20}")
    print(f"{'Student Officer':<20} {'officer@ican.edu':<30} {'officer123456':<20}")
    print(f"{'IT Admin':<20} {'it@ican.edu':<30} {'itadmin123456':<20}")
    print(f"{'Student':<20} {'student@ican.edu':<30} {'student123456':<20}")
    print(f"{'Student':<20} {'student2@ican.edu':<30} {'student123456':<20}")
    print(f"{'Student':<20} {'student3@ican.edu':<30} {'student123456':<20}")
    print("=" * 60)
    
    print("\n📚 Academic Data Summary:")
    print("=" * 60)
    print(f"Sessions: {AcademicSession.objects.count()}")
    print(f"Levels: {Level.objects.count()}")
    print(f"Courses: {Course.objects.count()}")
    print(f"Course Offerings: {CourseOffering.objects.count()}")
    print(f"Enrollments: {Enrollment.objects.count()}")
    print(f"  - Active: {Enrollment.objects.filter(status=EnrollmentStatus.ACTIVE).count()}")
    print(f"  - Draft: {Enrollment.objects.filter(status=EnrollmentStatus.DRAFT).count()}")
    print("=" * 60)
    
    print("\n💰 Billing Data Summary:")
    print("=" * 60)
    from billing.models import FeeStructure, Invoice, Payment
    print(f"Fee Structures: {FeeStructure.objects.count()}")
    print(f"Invoices: {Invoice.objects.count()}")
    print(f"  - Paid: {Invoice.objects.filter(status='paid').count()}")
    print(f"  - Partially Paid: {Invoice.objects.filter(status='partially_paid').count()}")
    print(f"  - Pending: {Invoice.objects.filter(status='pending').count()}")
    print(f"Payments: {Payment.objects.count()}")
    print(f"  - Successful: {Payment.objects.filter(status='successful').count()}")
    print("=" * 60)
    
    print("\n📧 Communication Data Summary:")
    print("=" * 60)
    from notifications.models import NotificationTemplate
    print(f"Notification Templates: {NotificationTemplate.objects.count()}")
    print(f"  - Email: {NotificationTemplate.objects.filter(channel='email').count()}")
    print("=" * 60)
    
    print("\n📋 Attendance Data Summary:")
    print("=" * 60)
    from attendance.models import ClassSession, AttendanceRecord
    print(f"Class Sessions: {ClassSession.objects.count()}")
    print(f"  - Completed: {ClassSession.objects.filter(status='completed').count()}")
    print(f"  - Scheduled: {ClassSession.objects.filter(status='scheduled').count()}")
    print(f"Attendance Records: {AttendanceRecord.objects.count()}")
    print(f"  - Present: {AttendanceRecord.objects.filter(status='present').count()}")
    print(f"  - Late: {AttendanceRecord.objects.filter(status='late').count()}")
    print(f"  - Absent: {AttendanceRecord.objects.filter(status='absent').count()}")
    print("=" * 60)
    
    print("\n🎉 You can now login with any of these accounts!")
    print("\n⚠️  Note: Change these passwords before deploying to production!")


if __name__ == "__main__":
    try:
        create_seed_data()
    except Exception as e:
        print(f"\n❌ Error creating seed data: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
