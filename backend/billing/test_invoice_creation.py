"""
Debug & Integration test for Student Enrollment -> Invoice Generation -> Billing API endpoints.
"""
import pytest
from decimal import Decimal
from rest_framework import status
from django.utils import timezone
from users.models import User
from students.models import StudentProfile
from academics.models import AcademicSession, Level, Course, CourseOffering
from enrollments.models import Enrollment, EnrollmentCourse, EnrollmentStatus
from billing.models import Invoice, InvoiceItem, FeeStructure, FeeType
from billing.services.invoice_service import InvoiceService
from unittest.mock import patch

@pytest.mark.django_db
class TestEnrollmentInvoiceIntegration:
    """Test full flow: Enrollment Creation -> Auto Invoice Generation -> Billing API Retrieval"""

    @pytest.fixture
    def setup_data(self, db):
        # Create student user & profile
        user = User.objects.create_user(
            username='teststudent',
            email='student@test.com',
            password='password123',
            role='student',
            first_name='Test',
            last_name='Student'
        )
        student = StudentProfile.objects.create(
            user=user,
            student_code='STD12345',
            whatsapp_number='08012345678'
        )

        # Create Session
        session = AcademicSession.objects.create(
            label='2026/2027',
            start_date=timezone.now().date(),
            end_date=timezone.now().date() + timezone.timedelta(days=300),
            is_active=True
        )

        # Create Level
        level = Level.objects.create(
            name='Foundation Level',
            code='foundation',
            order=1,
            is_active=True
        )

        # Create LevelTierPricing
        from billing.models import LevelTierPricing
        LevelTierPricing.objects.create(
            level=level,
            session=session,
            course_count=1,
            amount=Decimal('35000.00'),
            is_active=True
        )

        # Create Course
        course = Course.objects.create(
            level=level,
            name='Financial Accounting',
            code='FA101',
            price=Decimal('35000.00'),
            is_active=True
        )

        # Create Offering
        offering = CourseOffering.objects.create(
            course=course,
            session=session,
            is_active=True
        )

        return {
            'user': user,
            'student': student,
            'session': session,
            'level': level,
            'course': course,
            'offering': offering
        }

    def test_student_enrollment_creates_invoice(self, client, setup_data):
        user = setup_data['user']
        session = setup_data['session']
        level = setup_data['level']
        offering = setup_data['offering']

        client.force_login(user)

        payload = {
            'session': str(session.id),
            'level': str(level.id),
            'course_offerings': [str(offering.id)],
            'notes': 'Test enrollment invoice generation'
        }

        # 1. Post to create_enrollment
        response = client.post('/api/enrollments/create_enrollment/', payload, format='json')
        assert response.status_code == status.HTTP_201_CREATED, response.data

        # Verify enrollment created & active
        enrollment_id = response.data['id']
        enrollment = Enrollment.objects.get(id=enrollment_id)
        assert enrollment.status == EnrollmentStatus.ACTIVE

        # 2. Check Invoice was created in DB
        invoice = Invoice.objects.filter(enrollment=enrollment).first()
        assert invoice is not None, "Invoice was NOT created for enrollment!"
        assert invoice.total_amount == Decimal('35000.00'), f"Expected total 35000.00, got {invoice.total_amount}"
        assert invoice.items.count() >= 1

        # 3. Test GET /api/billing/invoices/my-invoices/
        my_inv_res = client.get('/api/billing/invoices/my-invoices/')
        assert my_inv_res.status_code == status.HTTP_200_OK
        data = my_inv_res.data
        assert len(data) == 1, f"Expected 1 invoice in my-invoices, got {len(data)}"
        assert data[0]['id'] == str(invoice.id)
        assert Decimal(str(data[0]['total_amount'])) == Decimal('35000.00')

        # 4. Test GET /api/billing/invoices/
        list_inv_res = client.get('/api/billing/invoices/')
        assert list_inv_res.status_code == status.HTTP_200_OK
        results = list_inv_res.data.get('results', list_inv_res.data)
        assert len(results) >= 1

    def test_auto_heal_generates_invoice_for_existing_enrollment(self, client, setup_data):
        user = setup_data['user']
        student = setup_data['student']
        session = setup_data['session']
        level = setup_data['level']
        offering = setup_data['offering']

        # Manually create active enrollment without invoice
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

        assert not hasattr(enrollment, 'invoice')

        client.force_login(user)

        # Call GET /api/billing/invoices/my-invoices/
        response = client.get('/api/billing/invoices/my-invoices/')
        assert response.status_code == status.HTTP_200_OK
        data = response.data
        assert len(data) == 1, f"Auto-heal should have created 1 invoice, got {len(data)}"
        assert data[0]['total_amount'] == '35000.00'

    def test_paystack_payment_verification_updates_invoice_and_dashboard_balance(self, client, setup_data):
        user = setup_data['user']
        student = setup_data['student']
        session = setup_data['session']
        level = setup_data['level']
        offering = setup_data['offering']

        # 1. Create active enrollment
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
        invoice = Invoice.objects.get(enrollment=enrollment)
        assert invoice.status == 'pending'
        assert invoice.balance == Decimal('35000.00')

        client.force_login(user)

        # 2. Simulate Paystack payment verification call from frontend
        ref = f"INV-{invoice.id}-99999"
        with patch('payments.views.get_paystack_client') as mock_get_client:
            mock_client = mock_get_client.return_value
            mock_client.verify_transaction.return_value = {
                'status': 'success',
                'amount': 3500000,
                'metadata': {'invoice_id': str(invoice.id)},
                'customer': {'email': user.email},
                'reference': ref
            }
            verify_res = client.get(f'/api/payments/paystack/verify/{ref}/')
            assert verify_res.status_code == status.HTTP_200_OK, verify_res.data
            assert verify_res.data['success'] is True

        # 3. Assert invoice in DB updated to paid with balance 0
        invoice.refresh_from_db()
        assert invoice.status == 'paid'
        assert invoice.balance == Decimal('0.00')
        assert invoice.amount_paid == Decimal('35000.00')

        # 4. Assert my-invoices API returns updated paid invoice for Dashboard/Billing frontend
        my_inv_res = client.get('/api/billing/invoices/my-invoices/')
        assert my_inv_res.status_code == status.HTTP_200_OK
        data = my_inv_res.data
        assert len(data) == 1
        assert data[0]['status'] == 'paid'
        assert Decimal(str(data[0]['balance'])) == Decimal('0.00')
        assert Decimal(str(data[0]['amount_paid'])) == Decimal('35000.00')

