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
        
        # 2. Level-wide non-tuition fees (materials, exam, etc. if explicitly configured)
        level_fees = active_fees.filter(
            level=level,
            course__isnull=True
        ).exclude(
            fee_type__in=[FeeType.REGISTRATION, FeeType.COURSE]
        )
        
        for fee in level_fees:
            fees.append((fee, 1))
        
        # 3. Level-Based Course Count Tiered Tuition Fee
        active_courses = enrollment.enrollment_courses.filter(dropped=False)
        course_count = active_courses.count()

        if course_count > 0:
            from ..models import LevelTierPricing
            
            # Lookup configured tier pricing for level & session (or default tier pricing)
            tier = LevelTierPricing.objects.filter(
                level=level,
                course_count=course_count,
                session=session,
                is_active=True
            ).first()

            if not tier:
                tier = LevelTierPricing.objects.filter(
                    level=level,
                    course_count=course_count,
                    session__isnull=True,
                    is_active=True
                ).first()

            if not tier:
                tier = LevelTierPricing.objects.filter(
                    level=level,
                    course_count=course_count,
                    is_active=True
                ).first()

            if tier:
                fee_amount = tier.amount
            else:
                # Default Tier Fallbacks if tier pricing is not set explicitly in DB:
                # Foundation: 1=30,000, 2=40,000, 3=59,000
                # Skills: 1=35,000, 2=50,000, 3=70,000
                # Professional: 1=40,000, 2=60,000, 3=85,000
                level_name = (level.name or '').lower()
                if 'foundation' in level_name:
                    defaults_map = {1: Decimal('30000.00'), 2: Decimal('40000.00'), 3: Decimal('59000.00')}
                    fee_amount = defaults_map.get(course_count, Decimal('59000.00') + Decimal(str((course_count - 3) * 15000)))
                elif 'skill' in level_name:
                    defaults_map = {1: Decimal('35000.00'), 2: Decimal('50000.00'), 3: Decimal('70000.00')}
                    fee_amount = defaults_map.get(course_count, Decimal('70000.00') + Decimal(str((course_count - 3) * 20000)))
                else:
                    defaults_map = {1: Decimal('40000.00'), 2: Decimal('60000.00'), 3: Decimal('85000.00')}
                    fee_amount = defaults_map.get(course_count, Decimal('85000.00') + Decimal(str((course_count - 3) * 25000)))

            course_codes = ", ".join([ec.course_offering.course.code for ec in active_courses if ec.course_offering and ec.course_offering.course])
            fee_struct, _ = FeeStructure.objects.get_or_create(
                session=session,
                level=level,
                fee_type=FeeType.COURSE,
                description=f"Tuition Fee ({level.name} Level - {course_count} Course{'s' if course_count > 1 else ''}: {course_codes})",
                defaults={
                    'amount': fee_amount,
                    'is_active': True,
                    'effective_from': timezone.now().date()
                }
            )
            # Ensure amount is synced if tier amount changed
            if fee_struct.amount != fee_amount:
                fee_struct.amount = fee_amount
                fee_struct.save(update_fields=['amount'])

            fees.append((fee_struct, 1))

        return fees
    
    @staticmethod
    @transaction.atomic
    def create_invoice_for_enrollment(enrollment, due_days=30, notes=''):
        """
        Create an invoice for an enrollment with all applicable fees.
        """
        from django.db import models
        
        # Check if invoice already exists
        if hasattr(enrollment, 'invoice'):
            invoice = enrollment.invoice
            if invoice.status != InvoiceStatus.PAID:
                applicable_fees = InvoiceService.calculate_applicable_fees(enrollment)
                if applicable_fees:
                    # Clear previous line items and recreate according to new level tier calculation
                    invoice.items.all().delete()
                    total_amount = Decimal('0.00')
                    for fee_structure, quantity in applicable_fees:
                        item_desc = fee_structure.description if fee_structure.description else fee_structure.fee_type
                        unit_price = Decimal(str(fee_structure.amount))
                        item_total = unit_price * Decimal(str(quantity))
                        InvoiceItem.objects.create(
                            invoice=invoice,
                            description=item_desc,
                            quantity=quantity,
                            unit_price=unit_price,
                            total=item_total,
                            fee_structure=fee_structure
                        )
                        total_amount += item_total
                    invoice.total_amount = total_amount
                    invoice.save(update_fields=['total_amount'])
            return invoice
        
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
            item_desc = fee_structure.description if fee_structure.description else fee_structure.name
            unit_price = Decimal(str(fee_structure.amount))
            item_total = unit_price * Decimal(str(quantity))
            item = InvoiceItem.objects.create(
                invoice=invoice,
                description=item_desc,
                quantity=quantity,
                unit_price=unit_price,
                total=item_total,
                fee_structure=fee_structure
            )
            total_amount += item_total
        
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
