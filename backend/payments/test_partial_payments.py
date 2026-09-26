"""
Automated Security & Financial Integrity Test Suite for Partial Payments & Webhooks
"""
from decimal import Decimal
from unittest.mock import patch
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient
from rest_framework import status

from users.models import User, Role, StaffProfile
from students.models import StudentProfile
from academics.models import AcademicSession, Level
from enrollments.models import Enrollment
from billing.models import Invoice, InvoiceStatus, Payment, PaymentStatus, PaymentAllocation
from billing.services import BalanceCalculator
from payments.paystack.webhook_handler import PaystackWebhookHandler


class PartialPaymentsSecurityTests(TestCase):
    def setUp(self):
        self.client = APIClient()

        # Create Users
        self.student_user = User.objects.create_user(
            email="student_test@ican.edu",
            password="Password123!",
            role=Role.STUDENT
        )
        self.student = StudentProfile.objects.create(
            user=self.student_user,
            first_name="John",
            last_name="Doe",
            student_code="STU-001"
        )

        self.other_student_user = User.objects.create_user(
            email="other_student@ican.edu",
            password="Password123!",
            role=Role.STUDENT
        )
        self.other_student = StudentProfile.objects.create(
            user=self.other_student_user,
            first_name="Jane",
            last_name="Smith",
            student_code="STU-002"
        )

        self.finance_user = User.objects.create_user(
            email="finance_test@ican.edu",
            password="Password123!",
            role=Role.FINANCE
        )
        StaffProfile.objects.create(
            user=self.finance_user,
            first_name="Finance",
            last_name="Officer",
            department="Finance"
        )

        # Create Academic setup & Invoice
        self.session = AcademicSession.objects.create(
            name="2025/2026",
            start_date=timezone.now().date(),
            end_date=timezone.now().date() + timezone.timedelta(days=180),
            is_current=True
        )
        self.level = Level.objects.create(name="Foundation Level")

        self.enrollment = Enrollment.objects.create(
            student=self.student,
            session=self.session,
            level=self.level,
            status="active"
        )

        self.invoice = Invoice.objects.create(
            invoice_number="INV-TEST-001",
            enrollment=self.enrollment,
            student=self.student,
            total_amount=Decimal("150000.00"),
            amount_paid=Decimal("50000.00"),
            status=InvoiceStatus.PARTIALLY_PAID,
            due_date=timezone.now().date() + timezone.timedelta(days=30)
        )
        self.initial_payment = Payment.objects.create(
            student=self.student,
            invoice=self.invoice,
            amount=Decimal("50000.00"),
            currency="NGN",
            method="bank_transfer",
            provider="manual",
            provider_reference="INIT-PAY-001",
            status=PaymentStatus.SUCCESSFUL,
        )
        PaymentAllocation.objects.create(
            payment=self.initial_payment,
            invoice=self.invoice,
            amount_allocated=Decimal("50000.00"),
        )

        self.other_enrollment = Enrollment.objects.create(
            student=self.other_student,
            session=self.session,
            level=self.level,
            status="active"
        )
        self.other_invoice = Invoice.objects.create(
            invoice_number="INV-TEST-002",
            enrollment=self.other_enrollment,
            student=self.other_student,
            total_amount=Decimal("100000.00"),
            amount_paid=Decimal("0.00"),
            status=InvoiceStatus.PENDING,
            due_date=timezone.now().date() + timezone.timedelta(days=30)
        )

    @patch("payments.views.get_paystack_client")
    def test_valid_partial_payment_initialization(self, mock_paystack):
        """Student initializes valid partial payment (₦50,000 on ₦100,000 balance)"""
        mock_client = mock_paystack.return_value
        mock_client.initialize_transaction.return_value = {
            "authorization_url": "https://checkout.paystack.com/test",
            "access_code": "code123",
            "reference": "ref123"
        }

        self.client.force_authenticate(user=self.student_user)
        response = self.client.post("/api/payments/paystack/initialize/", {
            "invoice_id": str(self.invoice.id),
            "amount": 50000
        }, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["amount"], 50000.0)
        mock_client.initialize_transaction.assert_called_once()

    def test_zero_and_negative_amount_initialization_rejected(self):
        """Initializing payment with 0 or negative amount must be rejected with 400 Bad Request"""
        self.client.force_authenticate(user=self.student_user)

        response_zero = self.client.post("/api/payments/paystack/initialize/", {
            "invoice_id": str(self.invoice.id),
            "amount": 0
        }, format="json")
        self.assertEqual(response_zero.status_code, status.HTTP_400_BAD_REQUEST)

        response_neg = self.client.post("/api/payments/paystack/initialize/", {
            "invoice_id": str(self.invoice.id),
            "amount": -5000
        }, format="json")
        self.assertEqual(response_neg.status_code, status.HTTP_400_BAD_REQUEST)

    def test_overpayment_initialization_rejected(self):
        """Attempting to pay ₦100,001 on outstanding balance of ₦100,000 must be rejected with 400"""
        self.client.force_authenticate(user=self.student_user)

        response = self.client.post("/api/payments/paystack/initialize/", {
            "invoice_id": str(self.invoice.id),
            "amount": 100001
        }, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_paid_and_cancelled_invoice_rejected(self):
        """Attempting payment on paid or cancelled invoice must be rejected"""
        self.invoice.status = InvoiceStatus.PAID
        self.invoice.amount_paid = Decimal("150000.00")
        self.invoice.save()

        self.client.force_authenticate(user=self.student_user)
        response = self.client.post("/api/payments/paystack/initialize/", {
            "invoice_id": str(self.invoice.id),
            "amount": 10000
        }, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_idor_student_cannot_pay_others_invoice(self):
        """Student A cannot initialize payment on Student B's invoice"""
        self.client.force_authenticate(user=self.student_user)

        response = self.client.post("/api/payments/paystack/initialize/", {
            "invoice_id": str(self.other_invoice.id),
            "amount": 10000
        }, format="json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    @patch("payments.paystack.webhook_handler.get_paystack_client")
    def test_idempotent_duplicate_webhook(self, mock_paystack):
        """Sending duplicate Paystack webhook must process idempotently without double payment or allocation"""
        mock_client = mock_paystack.return_value
        mock_client.verify_transaction.return_value = {
            "status": "success",
            "amount": 5000000,  # 50,000 NGN in kobo
            "customer": {"email": self.student_user.email},
            "metadata": {"invoice_id": str(self.invoice.id)}
        }

        handler = PaystackWebhookHandler()
        event_data = {
            "reference": "PAYSTACK-REF-UNIQUE-101",
            "amount": 5000000,
            "customer": {"email": self.student_user.email},
            "metadata": {"invoice_id": str(self.invoice.id)}
        }

        # First webhook call
        payment1 = handler.handle_charge_success(event_data)
        self.assertIsNotNone(payment1)
        self.assertEqual(Payment.objects.filter(provider_reference="PAYSTACK-REF-UNIQUE-101").count(), 1)
        self.invoice.refresh_from_db()
        self.assertEqual(self.invoice.amount_paid, Decimal("100000.00"))

        # Duplicate webhook call
        payment2 = handler.handle_charge_success(event_data)
        self.assertIsNone(payment2)  # Idempotently ignored
        self.assertEqual(Payment.objects.filter(provider_reference="PAYSTACK-REF-UNIQUE-101").count(), 1)
        self.invoice.refresh_from_db()
        self.assertEqual(self.invoice.amount_paid, Decimal("100000.00"))  # No double allocation!

    def test_rbac_student_cannot_create_manual_payment(self):
        """Student attempting manual payment creation must be denied with 403 Forbidden"""
        self.client.force_authenticate(user=self.student_user)

        response = self.client.post("/api/billing/payments/create_manual/", {
            "student": str(self.student.id),
            "amount": 50000,
            "method": "bank_transfer"
        }, format="json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
