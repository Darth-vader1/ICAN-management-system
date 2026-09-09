"""
Invoice generation service with fee calculation and immutable snapshots.
"""
from decimal import Decimal
from datetime import timedelta
from django.db import transaction, models
from django.utils import timezone
from django.core.exceptions import ValidationError

from ..models import FeeStructure, Invoice, InvoiceItem, InvoiceStatus, FeeType


class InvoiceService:
    """
    Service for generating invoices from enrollments.
    Implements immutable invoice creation with fee snapshots.
    """
    
    @staticmethod
    def generate_invoice_number(enrollment):
        """
        Generate unique invoice number.
        Format: INV-{YEAR}-{SESSION_CODE}-{STUDENT_CODE}-{COUNTER}
        """
        from datetime import datetime
        
        year = datetime.now().year
        session_code = enrollment.session.label.replace('/', '')[:4]
        student_code = enrollment.student.student_code.replace('/', '')[-4:]
        
        # Get counter for this combination
        prefix = f"INV-{year}-{session_code}-{student_code}"
        
        # Find last invoice with this prefix
        last_invoice = Invoice.objects.filter(
            invoice_number__startswith=prefix
        ).order_by('-created_at').first()
        
        if last_invoice:
            # Extract counter and increment
            try:
                last_counter = int(last_invoice.invoice_number.split('-')[-1])
                counter = last_counter + 1
            except (ValueError, IndexError):
                counter = 1
        else:
            counter = 1
        
        return f"{prefix}-{counter:03d}"
    
    @staticmethod
    def calculate_applicable_fees(enrollment):
        """
        Calculate all applicable fees for an enrollment.
        Returns list of (fee_structure, quantity) tuples.
        """
        fees = []
        session = enrollment.session
        level = enrollment.level
        
        # Get active fee structures for this session
        active_fees = FeeStructure.objects.filter(
            session=session,
            is_active=True,
            effective_from__lte=timezone.now().date()
        ).filter(
            models.Q(effective_to__isnull=True) | models.Q(effective_to__gte=timezone.now().date())
        )
        
        # 1. Registration fees (level-specific or session-wide)
        registration_fees = active_fees.filter(
            fee_type=FeeType.REGISTRATION
        ).filter(
            models.Q(level=level) | models.Q(level__isnull=True)
        ).order_by('-level')  # Prefer level-specific
        
        if registration_fees.exists():
            fees.append((registration_fees.first(), 1))
        
        # 2. Level-wide fees (materials, exam, etc.)
        level_fees = active_fees.filter(
            level=level,
            course__isnull=True
        ).exclude(
            fee_type=FeeType.REGISTRATION
        )
        
        for fee in level_fees:
            fees.append((fee, 1))
        
        # 3. Course-specific fees for enrolled courses
        for enrollment_course in enrollment.enrollment_courses.filter(dropped=False):
            course = enrollment_course.course_offering.course
            
            course_fees = active_fees.filter(
                course=course,
                fee_type=FeeType.COURSE
            )
            
            for fee in course_fees:
                fees.append((fee, 1))
        
        return fees
    
    @staticmethod
    @transaction.atomic
    def create_invoice_for_enrollment(enrollment, due_days=30, notes=''):
        """
        Create an invoice for an enrollment with all applicable fees.
        
        Args:
            enrollment: Enrollment instance
            due_days: Number of days until invoice is due (default: 30)
            notes: Optional notes for the invoice
        
        Returns:
            Invoice instance
        
        Raises:
            ValidationError: If enrollment already has an invoice or is invalid
        """
        from django.db import models
        
        # Check if invoice already exists
        if hasattr(enrollment, 'invoice'):
            raise ValidationError(
                f"Invoice already exists for enrollment {enrollment.id}"
            )
        
        # Validate enrollment status
        if enrollment.status not in ['active', 'draft']:
            raise ValidationError(
                f"Cannot create invoice for enrollment with status: {enrollment.status}"
            )
        
        # Calculate applicable fees
        applicable_fees = InvoiceService.calculate_applicable_fees(enrollment)
        
        if not applicable_fees:
            raise ValidationError(
                "No applicable fees found for this enrollment. "
                "Please configure fee structures for the session/level/courses."
            )
        
        # Generate invoice number
        invoice_number = InvoiceService.generate_invoice_number(enrollment)
        
        # Calculate due date
        due_date = timezone.now().date() + timedelta(days=due_days)
        
        # Create invoice
        invoice = Invoice.objects.create(
            invoice_number=invoice_number,
            enrollment=enrollment,
            student=enrollment.student,
            total_amount=Decimal('0.00'),  # Will be updated after items
            due_date=due_date,
            status=InvoiceStatus.PENDING,
            notes=notes
        )
        
        # Create invoice items (immutable snapshots)
        total_amount = Decimal('0.00')
        
        for fee_structure, quantity in applicable_fees:
            item = InvoiceItem.objects.create(
                invoice=invoice,
                description=fee_structure.description,
                quantity=quantity,
                unit_price=fee_structure.amount,
                fee_structure=fee_structure
            )
            total_amount += item.total
        
        # Update invoice total
        invoice.total_amount = total_amount
        invoice.save(update_fields=['total_amount'])
        
        return invoice
    
    @staticmethod
    @transaction.atomic
    def add_fee_to_invoice(invoice, description, amount, quantity=1):
        """
        Add an additional fee item to an existing invoice.
        Only allowed if invoice is not paid.
        
        Args:
            invoice: Invoice instance
            description: Fee description
            amount: Unit price
            quantity: Quantity (default: 1)
        
        Returns:
            InvoiceItem instance
        
        Raises:
            ValidationError: If invoice is paid or invalid
        """
        if invoice.status == InvoiceStatus.PAID:
            raise ValidationError("Cannot modify a paid invoice")
        
        if invoice.status == InvoiceStatus.CANCELLED:
            raise ValidationError("Cannot modify a cancelled invoice")
        
        # Create the item
        item = InvoiceItem.objects.create(
            invoice=invoice,
            description=description,
            quantity=quantity,
            unit_price=Decimal(str(amount))
        )
        
        # Update invoice total
        invoice.total_amount += item.total
        invoice.save(update_fields=['total_amount', 'updated_at'])
        
        # Recalculate status
        invoice.update_status()
        
        return item
    
    @staticmethod
    @transaction.atomic
    def cancel_invoice(invoice, reason=''):
        """
        Cancel an invoice. Only allowed if no payments have been allocated.
        
        Args:
            invoice: Invoice instance
            reason: Reason for cancellation
        
        Raises:
            ValidationError: If invoice has payments
        """
        if invoice.amount_paid > Decimal('0.00'):
            raise ValidationError(
                "Cannot cancel invoice with allocated payments. "
                "Please reverse the payments first."
            )
        
        invoice.status = InvoiceStatus.CANCELLED
        
        if reason:
            if invoice.notes:
                invoice.notes += f"\n\nCancellation reason: {reason}"
            else:
                invoice.notes = f"Cancellation reason: {reason}"
        
        invoice.save(update_fields=['status', 'notes', 'updated_at'])
    
    @staticmethod
    def get_student_financial_summary(student):
        """
        Get financial summary for a student.
        
        Returns:
            dict with total_invoiced, total_paid, total_balance, invoices
        """
        from django.db.models import Sum, Q
        
        invoices = Invoice.objects.filter(
            student=student
        ).exclude(
            status=InvoiceStatus.CANCELLED
        )
        
        # Calculate totals
        totals = invoices.aggregate(
            total_invoiced=Sum('total_amount'),
            total_paid=Sum('amount_paid')
        )
        
        total_invoiced = totals['total_invoiced'] or Decimal('0.00')
        total_paid = totals['total_paid'] or Decimal('0.00')
        total_balance = total_invoiced - total_paid
        
        # Count by status
        status_counts = {
            'pending': invoices.filter(status=InvoiceStatus.PENDING).count(),
            'partially_paid': invoices.filter(status=InvoiceStatus.PARTIALLY_PAID).count(),
            'paid': invoices.filter(status=InvoiceStatus.PAID).count(),
            'overdue': invoices.filter(status=InvoiceStatus.OVERDUE).count(),
        }
        
        return {
            'total_invoiced': total_invoiced,
            'total_paid': total_paid,
            'total_balance': total_balance,
            'invoice_count': invoices.count(),
            'status_counts': status_counts,
            'invoices': invoices
        }
