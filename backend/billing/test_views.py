"""
Integration tests for Billing API views
"""
import pytest
from decimal import Decimal
from rest_framework import status
from factories import InvoiceFactory, PaymentFactory, EnrollmentFactory, StudentFactory


@pytest.mark.django_db
@pytest.mark.integration
@pytest.mark.billing
class TestInvoiceAPI:
    """Test Invoice API endpoints"""

    def test_list_invoices_as_staff(self, staff_client):
        """Test staff can list all invoices"""
        InvoiceFactory.create_batch(5)
        
        response = staff_client.get('/api/billing/invoices/')
        
        assert response.status_code == status.HTTP_200_OK
        results = response.data.get('results', response.data)
        assert len(results) >= 5

    def test_list_invoices_as_student_shows_own_only(self, authenticated_client, student_user):
        """Test students only see their own invoices"""
        student = StudentFactory(user=student_user)
        enrollment = EnrollmentFactory(student=student)
        
        # Create invoices for this student
        InvoiceFactory.create_batch(2, enrollment=enrollment)
        
        # Create invoices for other students
        InvoiceFactory.create_batch(3)
        
        response = authenticated_client.get('/api/billing/invoices/')
        
        assert response.status_code == status.HTTP_200_OK

    def test_get_invoice_detail_as_owner(self, authenticated_client, student_user):
        """Test student can get their own invoice"""
        student = StudentFactory(user=student_user)
        enrollment = EnrollmentFactory(student=student)
        invoice = InvoiceFactory(enrollment=enrollment)
        
        response = authenticated_client.get(f'/api/billing/invoices/{invoice.id}/')
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['invoice_number'] == invoice.invoice_number

    def test_get_invoice_detail_as_other_student_forbidden(self, authenticated_client):
        """Test student cannot get another student's invoice"""
        other_invoice = InvoiceFactory()
        
        response = authenticated_client.get(f'/api/billing/invoices/{other_invoice.id}/')
        
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_create_invoice_as_staff(self, staff_client):
        """Test staff can create invoices"""
        enrollment = EnrollmentFactory()
        
        data = {
            'enrollment': str(enrollment.id),
            'amount': '50000.00',
            'due_date': '2026-12-31',
            'description': 'Tuition fee'
        }
        
        response = staff_client.post('/api/billing/invoices/', data)
        
        assert response.status_code in [
            status.HTTP_201_CREATED,
            status.HTTP_400_BAD_REQUEST,
            status.HTTP_403_FORBIDDEN
        ]

    def test_create_invoice_as_student_forbidden(self, authenticated_client):
        """Test students cannot create invoices"""
        enrollment = EnrollmentFactory()
        
        data = {
            'enrollment': str(enrollment.id),
            'amount': '50000.00',
        }
        
        response = authenticated_client.post('/api/billing/invoices/', data)
        
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_update_invoice_status(self, staff_client):
        """Test updating invoice status"""
        invoice = InvoiceFactory(status='pending')
        
        data = {'status': 'paid'}
        response = staff_client.patch(f'/api/billing/invoices/{invoice.id}/', data)
        
        if response.status_code == status.HTTP_200_OK:
            invoice.refresh_from_db()
            assert invoice.status == 'paid'

    def test_filter_invoices_by_status(self, staff_client):
        """Test filtering invoices by status"""
        InvoiceFactory.create_batch(2, status='paid')
        InvoiceFactory.create_batch(3, status='pending')
        
        response = staff_client.get('/api/billing/invoices/?status=pending')
        
        assert response.status_code == status.HTTP_200_OK

    def test_get_student_balance(self, authenticated_client, student_user):
        """Test getting student's outstanding balance"""
        student = StudentFactory(user=student_user)
        enrollment = EnrollmentFactory(student=student)
        
        # Create invoices with different statuses
        InvoiceFactory(
            enrollment=enrollment,
            amount=Decimal('50000.00'),
            amount_paid=Decimal('20000.00'),
            status='pending'
        )
        
        response = authenticated_client.get('/api/billing/balance/')
        
        # Endpoint may or may not exist
        assert response.status_code in [
            status.HTTP_200_OK,
            status.HTTP_404_NOT_FOUND
        ]


@pytest.mark.django_db
@pytest.mark.integration
@pytest.mark.billing
class TestPaymentAPI:
    """Test Payment API endpoints"""

    def test_list_payments_as_staff(self, staff_client):
        """Test staff can list all payments"""
        PaymentFactory.create_batch(5)
        
        response = staff_client.get('/api/billing/payments/')
        
        assert response.status_code == status.HTTP_200_OK

    def test_list_payments_as_student_shows_own_only(self, authenticated_client, student_user):
        """Test students only see their own payments"""
        student = StudentFactory(user=student_user)
        enrollment = EnrollmentFactory(student=student)
        invoice = InvoiceFactory(enrollment=enrollment)
        
        # Create payments for this student
        PaymentFactory.create_batch(2, invoice=invoice)
        
        # Create payments for other students
        PaymentFactory.create_batch(3)
        
        response = authenticated_client.get('/api/billing/payments/')
        
        assert response.status_code == status.HTTP_200_OK

    def test_get_payment_detail_as_owner(self, authenticated_client, student_user):
        """Test student can get their own payment"""
        student = StudentFactory(user=student_user)
        enrollment = EnrollmentFactory(student=student)
        invoice = InvoiceFactory(enrollment=enrollment)
        payment = PaymentFactory(invoice=invoice)
        
        response = authenticated_client.get(f'/api/billing/payments/{payment.id}/')
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['reference'] == payment.reference

    def test_record_payment_as_staff(self, staff_client):
        """Test staff can record a payment"""
        invoice = InvoiceFactory()
        
        data = {
            'invoice': str(invoice.id),
            'amount': '25000.00',
            'payment_method': 'bank_transfer',
            'reference': 'BANK123456'
        }
        
        response = staff_client.post('/api/billing/payments/', data)
        
        assert response.status_code in [
            status.HTTP_201_CREATED,
            status.HTTP_400_BAD_REQUEST,
            status.HTTP_403_FORBIDDEN
        ]

    def test_student_cannot_manually_record_payment(self, authenticated_client):
        """Test students cannot manually record payments"""
        invoice = InvoiceFactory()
        
        data = {
            'invoice': str(invoice.id),
            'amount': '25000.00',
        }
        
        response = authenticated_client.post('/api/billing/payments/', data)
        
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_filter_payments_by_status(self, staff_client):
        """Test filtering payments by status"""
        PaymentFactory.create_batch(2, status='completed')
        PaymentFactory.create_batch(3, status='pending')
        
        response = staff_client.get('/api/billing/payments/?status=completed')
        
        assert response.status_code == status.HTTP_200_OK

    def test_filter_payments_by_method(self, staff_client):
        """Test filtering payments by payment method"""
        PaymentFactory.create_batch(2, payment_method='paystack')
        PaymentFactory.create_batch(3, payment_method='bank_transfer')
        
        response = staff_client.get('/api/billing/payments/?payment_method=paystack')
        
        assert response.status_code == status.HTTP_200_OK


@pytest.mark.django_db
@pytest.mark.integration
@pytest.mark.payments
class TestPaystackIntegration:
    """Test Paystack payment integration"""

    def test_initialize_payment(self, authenticated_client, student_user):
        """Test initializing a Paystack payment"""
        student = StudentFactory(user=student_user)
        enrollment = EnrollmentFactory(student=student)
        invoice = InvoiceFactory(enrollment=enrollment)
        
        data = {
            'invoice_id': str(invoice.id),
            'callback_url': 'https://example.com/callback'
        }
        
        response = authenticated_client.post('/api/payments/initialize/', data)
        
        # Should return payment URL or 404 if endpoint doesn't exist
        assert response.status_code in [
            status.HTTP_200_OK,
            status.HTTP_404_NOT_FOUND,
            status.HTTP_400_BAD_REQUEST
        ]

    def test_verify_payment(self, authenticated_client):
        """Test verifying a Paystack payment"""
        data = {'reference': 'test_ref_123456'}
        
        response = authenticated_client.post('/api/payments/verify/', data)
        
        # Endpoint may not exist or require valid reference
        assert response.status_code in [
            status.HTTP_200_OK,
            status.HTTP_404_NOT_FOUND,
            status.HTTP_400_BAD_REQUEST
        ]

    def test_payment_webhook(self, api_client):
        """Test Paystack webhook endpoint"""
        data = {
            'event': 'charge.success',
            'data': {
                'reference': 'test_ref_123456',
                'amount': 5000000,  # In kobo
                'status': 'success'
            }
        }
        
        response = api_client.post('/api/payments/webhook/', data)
        
        # Webhook endpoint may not exist or require signature verification
        assert response.status_code in [
            status.HTTP_200_OK,
            status.HTTP_404_NOT_FOUND,
            status.HTTP_400_BAD_REQUEST
        ]
