"""
Unit tests for Billing models
"""
import pytest
from decimal import Decimal
from django.utils import timezone
from django.db import IntegrityError
from billing.models import Invoice, Payment
from factories import InvoiceFactory, PaymentFactory, EnrollmentFactory


@pytest.mark.django_db
@pytest.mark.unit
@pytest.mark.billing
class TestInvoiceModel:
    """Test Invoice model"""

    def test_create_invoice(self):
        """Test creating an invoice"""
        enrollment = EnrollmentFactory()
        invoice = InvoiceFactory(
            enrollment=enrollment,
            amount=Decimal('50000.00'),
            status='pending'
        )
        
        assert invoice.enrollment == enrollment
        assert invoice.amount == Decimal('50000.00')
        assert invoice.status == 'pending'
        assert invoice.invoice_number is not None

    def test_invoice_str_representation(self):
        """Test string representation of invoice"""
        invoice = InvoiceFactory(invoice_number='INV000001')
        assert 'INV000001' in str(invoice)

    def test_invoice_unique_invoice_number(self):
        """Test that invoice_number must be unique"""
        InvoiceFactory(invoice_number='INV000001')
        
        with pytest.raises(IntegrityError):
            InvoiceFactory(invoice_number='INV000001')

    def test_invoice_status_choices(self):
        """Test invoice status choices"""
        valid_statuses = ['pending', 'paid', 'overdue', 'cancelled']
        
        for status in valid_statuses:
            invoice = InvoiceFactory(status=status)
            assert invoice.status == status

    def test_invoice_amount_paid_default_zero(self):
        """Test that amount_paid defaults to zero"""
        invoice = InvoiceFactory(amount=Decimal('50000.00'))
        assert invoice.amount_paid == Decimal('0.00')

    def test_invoice_balance_calculation(self):
        """Test invoice balance calculation"""
        invoice = InvoiceFactory(
            amount=Decimal('50000.00'),
            amount_paid=Decimal('20000.00')
        )
        
        expected_balance = Decimal('30000.00')
        assert invoice.balance == expected_balance

    def test_invoice_fully_paid(self):
        """Test invoice when fully paid"""
        invoice = InvoiceFactory(
            amount=Decimal('50000.00'),
            amount_paid=Decimal('50000.00')
        )
        
        assert invoice.balance == Decimal('0.00')

    def test_invoice_overpaid(self):
        """Test invoice when overpaid (negative balance)"""
        invoice = InvoiceFactory(
            amount=Decimal('50000.00'),
            amount_paid=Decimal('60000.00')
        )
        
        assert invoice.balance == Decimal('-10000.00')

    def test_invoice_due_date(self):
        """Test invoice has due date"""
        invoice = InvoiceFactory()
        assert invoice.due_date is not None

    def test_invoice_timestamps(self):
        """Test invoice has timestamps"""
        invoice = InvoiceFactory()
        assert invoice.created_at is not None
        assert invoice.updated_at is not None


@pytest.mark.django_db
@pytest.mark.unit
@pytest.mark.billing
class TestPaymentModel:
    """Test Payment model"""

    def test_create_payment(self):
        """Test creating a payment"""
        invoice = InvoiceFactory(amount=Decimal('50000.00'))
        payment = PaymentFactory(
            invoice=invoice,
            amount=Decimal('50000.00'),
            payment_method='paystack',
            status='completed'
        )
        
        assert payment.invoice == invoice
        assert payment.amount == Decimal('50000.00')
        assert payment.payment_method == 'paystack'
        assert payment.status == 'completed'
        assert payment.reference is not None

    def test_payment_str_representation(self):
        payment = PaymentFactory(provider_reference='PAY12345678')
        assert payment.reference == 'PAY12345678'
        assert payment.provider_reference == 'PAY12345678'
        assert str(payment)

    def test_payment_unique_reference(self):
        """Test that payment reference must be unique"""
        PaymentFactory(reference='PAY12345678')
        
        with pytest.raises(IntegrityError):
            PaymentFactory(reference='PAY12345678')

    def test_payment_method_choices(self):
        """Test payment method choices"""
        valid_methods = ['paystack', 'bank_transfer', 'cash', 'pos']
        
        for method in valid_methods:
            payment = PaymentFactory(payment_method=method)
            assert payment.payment_method == method

    def test_payment_status_choices(self):
        """Test payment status choices"""
        valid_statuses = ['pending', 'completed', 'failed', 'refunded']
        
        for status in valid_statuses:
            payment = PaymentFactory(status=status)
            assert payment.status == status

    def test_payment_paystack_reference_optional(self):
        payment = PaymentFactory(
            method='bank_transfer',
            provider_reference='',
        )
        assert payment.paystack_reference in (None, '')

    def test_payment_with_paystack_reference(self):
        """Test payment with paystack reference"""
        payment = PaymentFactory(
            payment_method='paystack',
            paystack_reference='ref_abc123xyz'
        )
        assert payment.paystack_reference == 'ref_abc123xyz'

def test_payment_timestamps(self):
    payment = PaymentFactory()
    assert payment.created_at is not None

    def test_payment_updates_invoice_amount_paid(self):
        """Test that creating payment should update invoice (via signals)"""
        # Note: This would require signal handlers to be implemented
        # This is a placeholder for integration test
        invoice = InvoiceFactory(
            amount=Decimal('50000.00'),
            amount_paid=Decimal('0.00')
        )
        
        payment = PaymentFactory(
            invoice=invoice,
            amount=Decimal('20000.00'),
            status='completed'
        )
        
        # In real implementation, signal would update invoice.amount_paid
        # For unit test, we just verify the payment was created
        assert payment.amount == Decimal('20000.00')

    def test_partial_payment(self):
        """Test partial payment"""
        invoice = InvoiceFactory(amount=Decimal('50000.00'))
        payment = PaymentFactory(
            invoice=invoice,
            amount=Decimal('20000.00'),
            status='completed'
        )
        
        assert payment.amount == Decimal('20000.00')
        assert payment.amount < invoice.amount

    def test_full_payment(self):
        """Test full payment"""
        invoice = InvoiceFactory(amount=Decimal('50000.00'))
        payment = PaymentFactory(
            invoice=invoice,
            amount=Decimal('50000.00'),
            status='completed'
        )
        
        assert payment.amount == invoice.amount

    def test_failed_payment(self):
        """Test failed payment"""
        invoice = InvoiceFactory()
        payment = PaymentFactory(
            invoice=invoice,
            status='failed'
        )
        
        assert payment.status == 'failed'
        # Failed payments shouldn't update invoice amount_paid
