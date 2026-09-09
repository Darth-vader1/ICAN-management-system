from django.test import TestCase

from students.models import StudentProfile
from users.models import StaffProfile, User


class StudentProfileCompatibilityTests(TestCase):
    def test_student_profile_exposes_student_id_alias(self):
        user = User.objects.create_user(email='student@example.com', password='StrongPass123!')
        student = StudentProfile.objects.create(
            user=user,
            first_name='Jane',
            last_name='Doe',
        )

        self.assertEqual(student.student_id, student.student_code)

    def test_staff_profile_exposes_full_name(self):
        user = User.objects.create_user(
            email='staff@example.com',
            password='StrongPass123!',
            role='manager',
        )
        staff = StaffProfile.objects.create(
            user=user,
            first_name='Alice',
            last_name='Brown',
        )

        self.assertEqual(staff.full_name, 'Alice Brown')
