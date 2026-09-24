import uuid
from decimal import Decimal
from django.db import models
from django.core.validators import MinValueValidator
from django.core.exceptions import ValidationError
from django.utils import timezone


class FeeType(models.TextChoices):
    """Types of fees that can be charged"""
    REGISTRATION = 'registration', 'Registration Fee'
    COURSE = 'course', 'Course Fee'
    MATERIALS = 'materials', 'Materials Fee'
    EXAM = 'exam', 'Exam Fee'
    OTHER = 'other', 'Other Fee'


class FeeStructure(models.Model):
    """
    Defines fee amounts for different scopes (level/course/session).
    Can be level-specific, course-specific, or session-wide.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Scoping - at least one must be set
    level = models.ForeignKey(
        'academics.Level',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='fee_structures'
    )
    course = models.ForeignKey(
        'academics.Course',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='fee_structures'
    )
    session = models.ForeignKey(
        'academics.AcademicSession',
        on_delete=models.CASCADE,
        related_name='fee_structures'
    )
    
    # Fee details
    fee_type = models.CharField(
        max_length=20,
        choices=FeeType.choices,
        default=FeeType.COURSE
    )
    description = models.CharField(max_length=255)
    amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))]
    )
    currency = models.CharField(max_length=3, default='NGN')
    
    # Validity
    effective_from = models.DateField(default=timezone.now)
    effective_to = models.DateField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'billing_fee_structure'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['session', 'is_active']),
            models.Index(fields=['level', 'is_active']),
            models.Index(fields=['course', 'is_active']),
            models.Index(fields=['fee_type']),
        ]
    
    def clean(self):
        """Validate that at least session is set"""
        if not self.session:
            raise ValidationError("Session is required")
        
        # Validate effective dates
        if self.effective_to and self.effective_from and self.effective_to < self.effective_from:
            raise ValidationError("Effective_to date must be after effective_from date")
    
    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)
    
    def __str__(self):
        scope = []
        if self.level:
            scope.append(f"Level: {self.level.name}")
        if self.course:
            scope.append(f"Course: {self.course.code}")
        scope.append(f"Session: {self.session.label}")
        
        return f"{self.get_fee_type_display()} - {' | '.join(scope)} - {self.currency} {self.amount}"


class InvoiceStatus(models.TextChoices):
    """Invoice payment status"""
    DRAFT = 'draft', 'Draft'
    PENDING = 'pending', 'Pending Payment'
    PARTIALLY_PAID = 'partially_paid', 'Partially Paid'
    PAID = 'paid', 'Paid'
    OVERDUE = 'overdue', 'Overdue'
    CANCELLED = 'cancelled', 'Cancelled'


class Invoice(models.Model):
    """
    Invoice for a student's enrollment.
    Balance is derived from total_amount and allocations, not stored.
    Status is computed based on balance and due date.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    invoice_number = models.CharField(max_length=50, unique=True, db_index=True)
    
    # Relationships
    enrollment = models.OneToOneField(
        'enrollments.Enrollment',
        on_delete=models.PROTECT,
        related_name='invoice'
    )
    student = models.ForeignKey(
        'students.StudentProfile',
        on_delete=models.PROTECT,
        related_name='invoices'
    )
    
    # Amounts (cached for performance)
    total_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.00'))]
    )
    amount_paid = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=Decimal('0.00'),
        validators=[MinValueValidator(Decimal('0.00'))]
    )
    
    # Status
    status = models.CharField(
        max_length=20,
        choices=InvoiceStatus.choices,
        default=InvoiceStatus.PENDING,
        db_index=True
    )
    
    # Dates
    due_date = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Notes
    notes = models.TextField(blank=True)
    
    class Meta:
        db_table = 'billing_invoice'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['student', 'status']),
            models.Index(fields=['status', 'due_date']),
            models.Index(fields=['invoice_number']),
        ]
    
    def __init__(self, *args, **kwargs):
        if "amount" in kwargs and "total_amount" not in kwargs:
            kwargs["total_amount"] = kwargs.pop("amount")
        super().__init__(*args, **kwargs)

    @property
    def amount(self):
        return self.total_amount

    @amount.setter
    def amount(self, value):
        self.total_amount = value

    @property
    def balance(self):
        """Computed balance: total - paid"""
        return self.total_amount - self.amount_paid
    
    def update_status(self):
        """
        Update invoice status based on amount_paid and due_date.
        Called after payment allocation changes.
        """
        balance = self.balance
        
        if balance <= Decimal('0.00'):
            self.status = InvoiceStatus.PAID
        elif self.amount_paid > Decimal('0.00'):
            self.status = InvoiceStatus.PARTIALLY_PAID
        elif self.due_date < timezone.now().date():
            self.status = InvoiceStatus.OVERDUE
        else:
            self.status = InvoiceStatus.PENDING
        
        self.save(update_fields=['status', 'updated_at'])
    
    def recalculate_amount_paid(self):
        """
        Recalculate amount_paid from payment allocations.
        Should be called after allocations change.
        """
        from django.db.models import Sum
        
        total_allocated = self.payment_allocations.aggregate(
            total=Sum('amount_allocated')
        )['total'] or Decimal('0.00')
        
        self.amount_paid = total_allocated
        self.save(update_fields=['amount_paid', 'updated_at'])
        self.update_status()
    
    def __str__(self):
        return f"{self.invoice_number} - {self.student.full_name} - {self.status}"


class InvoiceItem(models.Model):
    """
    Line item on an invoice.
    Immutable snapshot of fee at invoice creation time.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    invoice = models.ForeignKey(
        Invoice,
        on_delete=models.CASCADE,
        related_name='items'
    )
    
    # Snapshot of fee (immutable after creation)
    description = models.CharField(max_length=255)
    quantity = models.IntegerField(default=1, validators=[MinValueValidator(1)])
    unit_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.00'))]
    )
    total = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.00'))]
    )
    
    # Reference to original fee (for audit trail)
    fee_structure = models.ForeignKey(
        FeeStructure,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='invoice_items'
    )
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'billing_invoice_item'
        ordering = ['created_at']
    
    def save(self, *args, **kwargs):
        # Auto-calculate total
        self.total = self.quantity * self.unit_price
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.description} x {self.quantity} @ {self.unit_price}"


class PaymentMethod(models.TextChoices):
    """Payment methods"""
    PAYSTACK = 'paystack', 'Paystack (Online)'
    BANK_TRANSFER = 'bank_transfer', 'Bank Transfer'
    CASH = 'cash', 'Cash'
    POS = 'pos', 'POS'


class PaymentStatus(models.TextChoices):
    """Payment status"""
    PENDING = 'pending', 'Pending Verification'
    SUCCESSFUL = 'successful', 'Successful'
    FAILED = 'failed', 'Failed'
    REVERSED = 'reversed', 'Reversed'
    REFUNDED = 'refunded', 'Refunded'


class Payment(models.Model):
    """
    Payment record. Can be linked to invoice or standalone (to be allocated later).
    Payments are never deleted - only reversed or refunded.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Relationships
    student = models.ForeignKey(
        'students.StudentProfile',
        on_delete=models.PROTECT,
        related_name='payments'
    )
    invoice = models.ForeignKey(
        Invoice,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='payments'
    )
    
    # Payment details
    amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))]
    )
    currency = models.CharField(max_length=3, default='NGN')
    method = models.CharField(
        max_length=20,
        choices=PaymentMethod.choices,
        default=PaymentMethod.PAYSTACK
    )
    
    # Provider details (for online payments)
    provider = models.CharField(max_length=50, blank=True)  # 'paystack', etc.
    provider_reference = models.CharField(
        max_length=255,
        blank=True,
        db_index=True
    )
    
    # Status
    status = models.CharField(
        max_length=20,
        choices=PaymentStatus.choices,
        default=PaymentStatus.PENDING,
        db_index=True
    )
    
    # Dates
    transaction_date = models.DateTimeField(default=timezone.now)
    verified_at = models.DateTimeField(null=True, blank=True)
    
    # Verification (for manual payments)
    verified_by = models.ForeignKey(
        'users.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='verified_payments'
    )
    
    # Metadata
    metadata = models.JSONField(default=dict, blank=True)
    receipt_upload_url = models.URLField(max_length=500, blank=True)
    notes = models.TextField(blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __init__(self, *args, **kwargs):
        ref_val = kwargs.pop("reference", None)
        paystack_ref_val = kwargs.pop("paystack_reference", None)
        method_val = kwargs.pop("payment_method", None)
        
        if "provider_reference" not in kwargs:
            p_ref = paystack_ref_val or ref_val
            if p_ref is not None:
                kwargs["provider_reference"] = p_ref
                
        if "method" not in kwargs and method_val is not None:
            kwargs["method"] = method_val
            
        super().__init__(*args, **kwargs)

    @property
    def reference(self):
        return self.provider_reference

    @reference.setter
    def reference(self, value):
        self.provider_reference = value

    @property
    def paystack_reference(self):
        return self.provider_reference

    @paystack_reference.setter
    def paystack_reference(self, value):
        self.provider_reference = value

    @property
    def payment_method(self):
        return self.method

    @payment_method.setter
    def payment_method(self, value):
        self.method = value

    class Meta:
        db_table = 'billing_payment'
        ordering = ['-transaction_date']
        indexes = [
            models.Index(fields=['student', 'status']),
            models.Index(fields=['status', 'transaction_date']),
            models.Index(fields=['provider', 'provider_reference']),
        ]
        constraints = [
            # Ensure provider_reference is unique per provider (for idempotency)
            models.UniqueConstraint(
                fields=['provider', 'provider_reference'],
                condition=models.Q(provider_reference__gt=''),
                name='unique_provider_reference'
            )
        ]
    
    def clean(self):
        """Validate payment details"""
        if self.method == PaymentMethod.PAYSTACK and not self.provider_reference:
            raise ValidationError("Provider reference is required for Paystack payments")
    
    def __str__(self):
        return f"Payment {self.id} - {self.student.full_name} - {self.currency} {self.amount} - {self.status}"


class PaymentAllocation(models.Model):
    """
    Allocates a payment (or part of it) to an invoice.
    Supports partial payments and multiple payments per invoice.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    payment = models.ForeignKey(
        Payment,
        on_delete=models.CASCADE,
        related_name='allocations'
    )
    invoice = models.ForeignKey(
        Invoice,
        on_delete=models.CASCADE,
        related_name='payment_allocations'
    )
    
    amount_allocated = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))]
    )
    
    # Metadata
    allocated_at = models.DateTimeField(auto_now_add=True)
    allocated_by = models.ForeignKey(
        'users.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='payment_allocations'
    )
    notes = models.TextField(blank=True)
    
    class Meta:
        db_table = 'billing_payment_allocation'
        ordering = ['-allocated_at']
        indexes = [
            models.Index(fields=['payment', 'invoice']),
            models.Index(fields=['invoice', 'allocated_at']),
        ]
    
    def clean(self):
        """Validate allocation amount"""
        # Check that allocated amount doesn't exceed payment amount
        if self.payment_id:
            from django.db.models import Sum
            
            # Get total already allocated for this payment
            existing_allocations = PaymentAllocation.objects.filter(
                payment=self.payment
            ).exclude(id=self.id).aggregate(
                total=Sum('amount_allocated')
            )['total'] or Decimal('0.00')
            
            total_with_this = existing_allocations + self.amount_allocated
            
            if total_with_this > self.payment.amount:
                raise ValidationError(
                    f"Total allocation ({total_with_this}) exceeds payment amount ({self.payment.amount})"
                )
    
    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)
        
        # Trigger invoice balance recalculation
        self.invoice.recalculate_amount_paid()
    
    def __str__(self):
        return f"Allocation: {self.amount_allocated} from Payment {self.payment.id} to Invoice {self.invoice.invoice_number}"


class Refund(models.Model):
    """
    Refund record for reversed payments.
    Payments are never deleted - only marked as refunded via this model.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    payment = models.ForeignKey(
        Payment,
        on_delete=models.CASCADE,
        related_name='refunds'
    )
    
    amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))]
    )
    reason = models.TextField()
    
    # Processing
    processed_by = models.ForeignKey(
        'users.User',
        on_delete=models.SET_NULL,
        null=True,
        related_name='processed_refunds'
    )
    processed_at = models.DateTimeField(auto_now_add=True)
    
    # Metadata
    notes = models.TextField(blank=True)
    metadata = models.JSONField(default=dict, blank=True)
    
    class Meta:
        db_table = 'billing_refund'
        ordering = ['-processed_at']
        indexes = [
            models.Index(fields=['payment', 'processed_at']),
        ]
    
    def clean(self):
        """Validate refund amount"""
        if self.payment_id:
            from django.db.models import Sum
            
            # Check total refunds don't exceed payment amount
            existing_refunds = Refund.objects.filter(
                payment=self.payment
            ).exclude(id=self.id).aggregate(
                total=Sum('amount')
            )['total'] or Decimal('0.00')
            
            total_with_this = existing_refunds + self.amount
            
            if total_with_this > self.payment.amount:
                raise ValidationError(
                    f"Total refunds ({total_with_this}) exceed payment amount ({self.payment.amount})"
                )
    
    def save(self, *args, **kwargs):
        self.full_clean()
        
        is_new = self.pk is None
        super().save(*args, **kwargs)
        
        if is_new:
            # Update payment status
            from django.db.models import Sum
            
            total_refunded = Refund.objects.filter(
                payment=self.payment
            ).aggregate(total=Sum('amount'))['total'] or Decimal('0.00')
            
            if total_refunded >= self.payment.amount:
                self.payment.status = PaymentStatus.REFUNDED
            else:
                self.payment.status = PaymentStatus.REVERSED
            
            self.payment.save(update_fields=['status', 'updated_at'])
            
            # Recalculate invoice balances if payment was allocated
            for allocation in self.payment.allocations.all():
                allocation.invoice.recalculate_amount_paid()
    
    def __str__(self):
        return f"Refund: {self.amount} for Payment {self.payment.id} - {self.reason[:50]}"


class LevelTierPricing(models.Model):
    """
    Defines tier pricing based on Level and number of enrolled courses.
    Example: Foundation level with 1 course = ₦30,000; 2 courses = ₦40,000; 3 courses = ₦59,000.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    level = models.ForeignKey(
        'academics.Level',
        on_delete=models.CASCADE,
        related_name='tier_pricings'
    )
    session = models.ForeignKey(
        'academics.AcademicSession',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='tier_pricings'
    )
    course_count = models.PositiveIntegerField(
        validators=[MinValueValidator(1)],
        help_text="Number of courses enrolled in this level (1, 2, 3, etc.)"
    )
    amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.00'))]
    )
    currency = models.CharField(max_length=3, default='NGN')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'billing_level_tier_pricing'
        ordering = ['level', 'course_count']
        unique_together = ['level', 'session', 'course_count']

    def __str__(self):
        session_label = f" ({self.session.label})" if self.session else ""
        return f"{self.level.name}{session_label} - {self.course_count} Course(s): ₦{self.amount:,.2f}"

