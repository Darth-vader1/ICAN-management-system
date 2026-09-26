import pytest
from decimal import Decimal
from rest_framework import status
from django.utils import timezone
from users.models import User
from students.models import StudentProfile
from academics.models import AcademicSession, Level, Course, CourseOffering
from enrollments.models import Enrollment, EnrollmentCourse, EnrollmentStatus
from billing.models import Invoice
from billing.services.invoice_service import InvoiceService


@pytest.mark.django_db
class TestStudentDetailAPI:
    """Test Student Detail API endpoint returns dynamic financial metrics & level info"""

    def test_student_detail_serializer_returns_financials(self, client):
        user = User.objects.create_user(
            username='detailstudent',
            email='adaeze.okonkwo@gmail.com',
            password='password123',
            role='student',
            first_name='Adaeze',
            last_name='Okonkwo'
        )
        student = StudentProfile.objects.create(
            user=user,
            first_name='Adaeze',
            last_name='Okonkwo',
            student_code='ICAN/2025/001',
            ican_exam_id='IC/2024/7823',
            whatsapp_number='08031234567',
            address='14 Awolowo Road, Ikoyi, Lagos',
            gender='F',
            date_of_birth='1998-03-15'
        )

        session = AcademicSession.objects.create(
            label='2025/2026',
            start_date=timezone.now().date(),
            end_date=timezone.now().date() + timezone.timedelta(days=300),
            is_active=True
        )
        level = Level.objects.create(
            name='Foundation',
            code='foundation',
            order=1,
            is_active=True
        )
        from billing.models import LevelTierPricing
        LevelTierPricing.objects.create(
            level=level,
            session=session,
            course_count=1,
            amount=Decimal('175000.00'),
            is_active=True
        )
        course = Course.objects.create(
            level=level,
            name='Financial Accounting',
            code='FA101',
            price=Decimal('175000.00'),
            is_active=True
        )
        offering = CourseOffering.objects.create(
            course=course,
            session=session,
            is_active=True
        )
        enrollment = Enrollment.objects.create(
            student=student,
            session=session,
            level=level,
            status=EnrollmentStatus.ACTIVE
        )
        EnrollmentCourse.objects.create(
            enrollment=enrollment,
            course_offering=offering
        )
        InvoiceService.create_invoice_for_enrollment(enrollment)

        staff_user = User.objects.create_user(
            username='manageruser',
            email='manager@test.com',
            password='password123',
            role='manager'
        )

        client.force_login(staff_user)

        res = client.get(f'/api/students/students/{student.id}/')
        assert res.status_code == status.HTTP_200_OK, res.data
        data = res.data
        assert data['first_name'] == 'Adaeze'
        assert data['last_name'] == 'Okonkwo'
        assert data['user_email'] == 'adaeze.okonkwo@gmail.com'
        assert data['level_name'] == 'Foundation'
        assert Decimal(str(data['total_fees'])) == Decimal('175000.00')
        assert Decimal(str(data['amount_paid'])) == Decimal('0.00')
        assert Decimal(str(data['balance'])) == Decimal('175000.00')
        assert data['payment_status'] == 'pending'

    def test_student_profile_update_syncs_user_names(self, client):
        user = User.objects.create_user(
            email='gbolahanabiodun92@gmail.com',
            password='password123',
            role='student',
            phone='08000000000'
        )
        student = StudentProfile.objects.create(
            user=user,
            first_name='OldFirst',
            last_name='OldLast',
            student_code='ICAN/2025/002'
        )

        client.force_login(user)

        payload = {
            'first_name': 'Gbolahan',
            'last_name': 'Olufemi-Abiodun',
            'phone_number': '08031234567',
            'whatsapp_number': '08031234567',
            'address': '14 Awolowo Road, Ikoyi, Lagos',
            'gender': 'M'
        }

        patch_res = client.patch(f'/api/students/students/{student.id}/', payload, format='json')
        assert patch_res.status_code == status.HTTP_200_OK, patch_res.data

        # Verify StudentProfile updated
        student.refresh_from_db()
        assert student.first_name == 'Gbolahan'
        assert student.last_name == 'Olufemi-Abiodun'

        # Verify User model phone updated
        user.refresh_from_db()
        assert user.phone == '08031234567'

