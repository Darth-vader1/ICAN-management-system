from datetime import timedelta
from django.utils import timezone
from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status

from users.models import User, Role, StaffProfile
from students.models import StudentProfile
from academics.models import AcademicSession, Level, Course, CourseOffering
from enrollments.models import Enrollment, EnrollmentCourse
from classroom.models import (
    VirtualClass,
    VirtualClassStatus,
    ClassAttendance,
    AttendanceStatus,
)
from classroom.services import AttendanceService, LiveKitService


class ClassroomAPITests(APITestCase):

    def setUp(self):
        # Create users
        self.super_admin = User.objects.create_superuser('admin@ican.edu', 'password123')
        self.staff_user = User.objects.create_user('staff@ican.edu', 'password123', role=Role.STUDENT_OFFICER, is_staff=True)
        self.staff_profile = StaffProfile.objects.create(user=self.staff_user, first_name='Staff', last_name='Officer')

        self.student_user = User.objects.create_user('student@ican.edu', 'password123', role=Role.STUDENT)
        self.student_profile = StudentProfile.objects.create(user=self.student_user, first_name='John', last_name='Doe')

        self.unauthorized_student = User.objects.create_user('other@ican.edu', 'password123', role=Role.STUDENT)
        self.unauthorized_profile = StudentProfile.objects.create(user=self.unauthorized_student, first_name='Jane', last_name='Smith')

        # Academics setup
        self.session = AcademicSession.objects.create(
            label='2026/2027',
            start_date=timezone.now().date(),
            end_date=(timezone.now() + timedelta(days=180)).date(),
            is_active=True
        )
        self.level = Level.objects.create(name='Foundation', code='foundation', order=1)
        self.course = Course.objects.create(level=self.level, name='Financial Accounting', code='FA101')
        self.offering = CourseOffering.objects.create(course=self.course, session=self.session, tutor=self.staff_profile)

        # Enroll authorized student
        self.enrollment = Enrollment.objects.create(
            student=self.student_profile,
            session=self.session,
            level=self.level,
            status='active'
        )
        self.enrollment_course = EnrollmentCourse.objects.create(
            enrollment=self.enrollment,
            course_offering=self.offering
        )

        # Virtual Class
        self.virtual_class = VirtualClass.objects.create(
            course_offering=self.offering,
            instructor=self.staff_user,
            title='Introduction to FA101',
            description='Overview of double entry accounting',
            scheduled_start=timezone.now() + timedelta(minutes=10),
            scheduled_end=timezone.now() + timedelta(hours=2),
            status=VirtualClassStatus.SCHEDULED,
            recording_enabled=True,
            created_by=self.staff_user
        )

    def test_student_can_list_enrolled_classes(self):
        self.client.force_authenticate(user=self.student_user)
        response = self.client.get('/api/classrooms/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data.get('results', response.data)), 1)

    def test_unauthorized_student_cannot_see_unenrolled_class(self):
        self.client.force_authenticate(user=self.unauthorized_student)
        response = self.client.get('/api/classrooms/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get('results', response.data)
        self.assertEqual(len(results), 0)

    def test_student_can_generate_join_token(self):
        self.client.force_authenticate(user=self.student_user)
        response = self.client.post(f'/api/classrooms/{self.virtual_class.id}/join/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('token', response.data)
        self.assertIn('url', response.data)
        self.assertFalse(response.data['is_instructor'])

    def test_unauthorized_student_cannot_join_class(self):
        self.client.force_authenticate(user=self.unauthorized_student)
        response = self.client.post(f'/api/classrooms/{self.virtual_class.id}/join/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_staff_can_start_and_end_class(self):
        self.client.force_authenticate(user=self.staff_user)
        
        start_res = self.client.post(f'/api/classrooms/{self.virtual_class.id}/start/')
        self.assertEqual(start_res.status_code, status.HTTP_200_OK)
        self.assertEqual(start_res.data['status'], 'LIVE')

        end_res = self.client.post(f'/api/classrooms/{self.virtual_class.id}/end/')
        self.assertEqual(end_res.status_code, status.HTTP_200_OK)
        self.assertEqual(end_res.data['status'], 'ENDED')

    def test_attendance_service_duration_calculation(self):
        now = timezone.now()
        AttendanceService.record_join(self.virtual_class, self.student_profile, join_time=now)
        
        # 1.5 hours later (90 mins out of 120 mins = 75% -> PRESENT)
        leave_time = now + timedelta(minutes=90)
        attendance = AttendanceService.record_leave(self.virtual_class, self.student_profile, leave_time=leave_time)
        
        self.assertIsNotNone(attendance)
        self.assertEqual(attendance.total_duration_seconds, 5400)
        self.assertEqual(attendance.attendance_status, AttendanceStatus.PRESENT)
