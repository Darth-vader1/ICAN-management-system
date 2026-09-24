"""
Balance calculation service with DB-level locking to prevent race conditions.
"""
from decimal import Decimal
from django.db import transaction
from django.db.models import Sum

from ..models import Invoice, Payment, PaymentAllocation, InvoiceStatus


class BalanceCalculator:
    """
    Service for calculating and updating invoice balances.
    Uses row-level locking to prevent race conditions from concurrent payments.
    """
    
    @staticmethod
    @transaction.atomic
    def recalculate_invoice_balance(invoice):
        """
        Recalculate invoice balance from payment allocations.
        Uses select_for_update to prevent race conditions.
        
        Args:
            invoice: Invoice instance or ID
        
        Returns:
            tuple: (amount_paid, balance, new_status)
        """
        # Lock the invoice row
        if isinstance(invoice, str):
            invoice = Invoice.objects.select_for_update().get(id=invoice)
        else:
            invoice = Invoice.objects.select_for_update().get(id=invoice.id)
        
        # Calculate total allocated payments
        total_allocated = invoice.payment_allocations.aggregate(
            total=Sum('amount_allocated')
        )['total'] or Decimal('0.00')
        
        # Update amount_paid
        invoice.amount_paid = total_allocated
        
        # Calculate balance
        balance = invoice.total_amount - invoice.amount_paid
        
        # Determine new status
        new_status = BalanceCalculator._determine_status(
            invoice.total_amount,
            invoice.amount_paid,
            invoice.due_date
        )
        
        # Update invoice
        invoice.status = new_status
        invoice.save(update_fields=['amount_paid', 'status', 'updated_at'])
        
        return invoice.amount_paid, balance, new_status

    @staticmethod
    @transaction.atomic
    def reconcile_student_payments(student):
        """
        Auto-reconcile any unallocated successful payments for a student
        against their unpaid or partially paid invoices.

        Locks both the ``Payment`` and ``Invoice`` rows via
        ``select_for_update()`` to prevent concurrent allocation races.
        """
        successful_payments = Payment.objects.select_for_update().filter(
            student=student,
            status='successful'
        ).order_by('transaction_date')

        for payment in successful_payments:
            allocated_sum = payment.allocations.aggregate(
                total=Sum('amount_allocated')
            )['total'] or Decimal('0.00')
            
            unallocated_amount = payment.amount - allocated_sum
            if unallocated_amount <= Decimal('0.00'):
                continue

            unpaid_invoices = Invoice.objects.select_for_update().filter(
                student=student
            ).exclude(status__in=[InvoiceStatus.PAID, InvoiceStatus.CANCELLED]).order_by('created_at')

            for inv in unpaid_invoices:
                if unallocated_amount <= Decimal('0.00'):
                    break

                inv_allocated = inv.payment_allocations.aggregate(
                    total=Sum('amount_allocated')
                )['total'] or Decimal('0.00')

                needed = inv.total_amount - inv_allocated
                if needed <= Decimal('0.00'):
                    continue

                alloc_amount = min(unallocated_amount, needed)
                PaymentAllocation.objects.create(
                    payment=payment,
                    invoice=inv,
                    amount_allocated=alloc_amount
                )
                unallocated_amount -= alloc_amount

                BalanceCalculator.recalculate_invoice_balance(inv)
    
    @staticmethod
    def _determine_status(total_amount, amount_paid, due_date):
        """
        Determine invoice status based on amounts and due date.
        
        Args:
            total_amount: Total invoice amount
            amount_paid: Amount paid so far
            due_date: Invoice due date
        
        Returns:
            InvoiceStatus value
        """
        from django.utils import timezone
        
        balance = total_amount - amount_paid
        
        # Fully paid
        if balance <= Decimal('0.00'):
            return InvoiceStatus.PAID
        
        # Partially paid
        if amount_paid > Decimal('0.00'):
            return InvoiceStatus.PARTIALLY_PAID
        
        # Overdue
        if due_date < timezone.now().date():
            return InvoiceStatus.OVERDUE
        
        # Pending
        return InvoiceStatus.PENDING
    
    @staticmethod
    @transaction.atomic
    def allocate_payment_to_invoice(payment, invoice, amount=None, allocated_by=None):
        """
        Allocate a payment (or portion) to an invoice.
        Creates PaymentAllocation and recalculates balance atomically.
        
        Args:
            payment: Payment instance
            invoice: Invoice instance
            amount: Amount to allocate (default: full payment amount)
            allocated_by: User who performed the allocation
        
        Returns:
            PaymentAllocation instance
        
        Raises:
            ValidationError: If allocation is invalid
        """
        from django.core.exceptions import ValidationError
        
        # Lock both payment and invoice
        payment = Payment.objects.select_for_update().get(id=payment.id)
        invoice = Invoice.objects.select_for_update().get(id=invoice.id)
        
        # Validate payment status
        if payment.status != 'successful':
            raise ValidationError(
                f"Cannot allocate payment with status: {payment.status}. "
                "Only successful payments can be allocated."
            )
        
        # Validate invoice status
        if invoice.status == InvoiceStatus.CANCELLED:
            raise ValidationError("Cannot allocate payment to cancelled invoice")
        
        # Determine allocation amount
        if amount is None:
            amount = payment.amount
        else:
            amount = Decimal(str(amount))
        
        # Validate allocation amount
        if amount <= Decimal('0.00'):
            raise ValidationError("Allocation amount must be positive")
        
        # Check remaining payment amount
        existing_allocations = payment.allocations.aggregate(
            total=Sum('amount_allocated')
        )['total'] or Decimal('0.00')
        
        remaining = payment.amount - existing_allocations
        
        if amount > remaining:
            raise ValidationError(
                f"Allocation amount ({amount}) exceeds remaining payment amount ({remaining})"
            )
        
        # Check invoice balance
        invoice_balance = invoice.total_amount - invoice.amount_paid
        
        if amount > invoice_balance:
            raise ValidationError(
                f"Allocation amount ({amount}) exceeds invoice balance ({invoice_balance}). "
                f"Consider partial allocation or splitting to multiple invoices."
            )
        
        # Create allocation
        allocation = PaymentAllocation.objects.create(
            payment=payment,
            invoice=invoice,
            amount_allocated=amount,
            allocated_by=allocated_by
        )
        
        # Recalculate invoice balance (this will also update status)
        BalanceCalculator.recalculate_invoice_balance(invoice)
        
        return allocation
    
    @staticmethod
    @transaction.atomic
    def auto_allocate_payment(payment, allocated_by=None):
        """
        Automatically allocate a payment to the student's oldest unpaid invoice.
        
        Args:
            payment: Payment instance
            allocated_by: User who performed the allocation
        
        Returns:
            list of PaymentAllocation instances
        
        Raises:
            ValidationError: If no suitable invoices found
        """
        from django.core.exceptions import ValidationError
        
        # Lock payment
        payment = Payment.objects.select_for_update().get(id=payment.id)
        
        # Validate payment status
        if payment.status != 'successful':
            raise ValidationError("Can only auto-allocate successful payments")
        
        # Check if already allocated
        existing_allocations = payment.allocations.aggregate(
            total=Sum('amount_allocated')
        )['total'] or Decimal('0.00')
        
        if existing_allocations >= payment.amount:
            raise ValidationError("Payment is already fully allocated")
        
        remaining_amount = payment.amount - existing_allocations
        
        # Get student's unpaid invoices (oldest first)
        unpaid_invoices = Invoice.objects.filter(
            student=payment.student
        ).exclude(
            status__in=[InvoiceStatus.PAID, InvoiceStatus.CANCELLED]
        ).order_by('due_date', 'created_at')
        
        if not unpaid_invoices.exists():
            raise ValidationError(
                "No unpaid invoices found for this student. "
                "Payment will remain unallocated."
            )
        
        allocations = []
        
        # Allocate to invoices until payment is exhausted
        for invoice in unpaid_invoices:
            if remaining_amount <= Decimal('0.00'):
                break
            
            invoice_balance = invoice.total_amount - invoice.amount_paid
            
            if invoice_balance <= Decimal('0.00'):
                continue
            
            # Allocate up to invoice balance or remaining payment
            allocation_amount = min(remaining_amount, invoice_balance)
            
            allocation = BalanceCalculator.allocate_payment_to_invoice(
                payment=payment,
                invoice=invoice,
                amount=allocation_amount,
                allocated_by=allocated_by
            )
            
            allocations.append(allocation)
            remaining_amount -= allocation_amount
        
        return allocations
    
    @staticmethod
    @transaction.atomic
    def reverse_allocation(allocation, reason=''):
        """
        Reverse a payment allocation.
        
        Args:
            allocation: PaymentAllocation instance
            reason: Reason for reversal
        
        Returns:
            bool: True if successful
        """
        invoice = allocation.invoice
        
        # Delete the allocation
        allocation.delete()
        
        # Recalculate invoice balance
        BalanceCalculator.recalculate_invoice_balance(invoice)
        
        # Add note to invoice
        if reason:
            note = f"\n[{timezone.now()}] Allocation reversed: {reason}"
            invoice.notes = (invoice.notes or '') + note
            invoice.save(update_fields=['notes'])
        
        return True
    
    @staticmethod
    def get_payment_allocation_summary(payment):
        """
        Get summary of how a payment has been allocated.
        
        Args:
            payment: Payment instance
        
        Returns:
            dict with total_allocated, remaining, allocations
        """
        allocations = payment.allocations.select_related('invoice').all()
        
        total_allocated = allocations.aggregate(
            total=Sum('amount_allocated')
        )['total'] or Decimal('0.00')
        
        remaining = payment.amount - total_allocated
        
        return {
            'payment_amount': payment.amount,
            'total_allocated': total_allocated,
            'remaining': remaining,
            'allocation_count': allocations.count(),
            'allocations': [
                {
                    'invoice_number': alloc.invoice.invoice_number,
                    'amount': alloc.amount_allocated,
                    'allocated_at': alloc.allocated_at
                }
                for alloc in allocations
            ]
        }
    
    @staticmethod
    def get_invoice_payment_history(invoice):
        """
        Get payment history for an invoice.
        
        Args:
            invoice: Invoice instance
        
        Returns:
            dict with payments, total_paid, balance
        """
        allocations = invoice.payment_allocations.select_related(
            'payment', 'payment__student'
        ).order_by('-allocated_at')
        
        payments = []
        for alloc in allocations:
            payments.append({
                'payment_id': str(alloc.payment.id),
                'amount': alloc.amount_allocated,
                'method': alloc.payment.get_method_display(),
                'status': alloc.payment.get_status_display(),
                'transaction_date': alloc.payment.transaction_date,
                'allocated_at': alloc.allocated_at,
                'provider_reference': alloc.payment.provider_reference or 'N/A'
            })
        
        return {
            'invoice_number': invoice.invoice_number,
            'total_amount': invoice.total_amount,
            'amount_paid': invoice.amount_paid,
            'balance': invoice.balance,
            'status': invoice.get_status_display(),
            'payments': payments
        }
