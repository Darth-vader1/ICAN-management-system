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
from users.models import Role, StaffProfile
from students.models import StudentProfile
from academics.models import AcademicSession, Level, Course, CourseOffering

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
            
            if created:
                offerings_created += 1
        
        print(f"   ✅ Created {offerings_created} course offerings for {active_session.label}")
    else:
        print("   ⏭️  No active session or courses available")

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
