"""
Serializers for billing entities with validation and read-only derived fields.
"""
from rest_framework import serializers
from decimal import Decimal

from .models import (
    FeeStructure, Invoice, InvoiceItem, Payment, 
    PaymentAllocation, Refund, FeeType, PaymentMethod, PaymentStatus
)


class FeeStructureSerializer(serializers.ModelSerializer):
    """Serializer for FeeStructure with display fields"""
    
    level_name = serializers.CharField(source='level.name', read_only=True)
    course_code = serializers.CharField(source='course.code', read_only=True)
    course_name = serializers.CharField(source='course.name', read_only=True)
    session_label = serializers.CharField(source='session.label', read_only=True)
    fee_type_display = serializers.CharField(source='get_fee_type_display', read_only=True)
    
    class Meta:
        model = FeeStructure
        fields = [
            'id', 'level', 'level_name', 'course', 'course_code', 'course_name',
            'session', 'session_label', 'fee_type', 'fee_type_display',
            'description', 'amount', 'currency', 'effective_from', 'effective_to',
            'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def validate(self, data):
        """Validate fee structure data"""
        # Ensure session is provided
        if 'session' not in data:
            raise serializers.ValidationError({
                'session': 'Session is required'
            })
        
        # Validate effective dates
        if 'effective_to' in data and data.get('effective_to'):
            if 'effective_from' in data and data.get('effective_from'):
                if data['effective_to'] < data['effective_from']:
                    raise serializers.ValidationError({
                        'effective_to': 'Effective_to must be after effective_from'
                    })
        
        # Validate amount
        if 'amount' in data and data['amount'] <= Decimal('0'):
            raise serializers.ValidationError({
                'amount': 'Amount must be greater than zero'
            })
        
        return data


class FeeStructureListSerializer(serializers.ModelSerializer):
    """Compact serializer for fee structure lists"""
    
    level_name = serializers.CharField(source='level.name', read_only=True)
    course_code = serializers.CharField(source='course.code', read_only=True)
    session_label = serializers.CharField(source='session.label', read_only=True)
    fee_type_display = serializers.CharField(source='get_fee_type_display', read_only=True)
    
    class Meta:
        model = FeeStructure
        fields = [
            'id', 'description', 'amount', 'currency', 'fee_type_display',
            'level_name', 'course_code', 'session_label', 'is_active'
        ]


class InvoiceItemSerializer(serializers.ModelSerializer):
    """Serializer for invoice items (read-only after creation)"""
    
    class Meta:
        model = InvoiceItem
        fields = [
            'id', 'description', 'quantity', 'unit_price', 'total',
            'fee_structure', 'created_at'
        ]
        read_only_fields = ['id', 'total', 'created_at']


class PaymentAllocationSerializer(serializers.ModelSerializer):
    """Serializer for payment allocations"""
    
    invoice_number = serializers.CharField(source='invoice.invoice_number', read_only=True)
    payment_reference = serializers.CharField(source='payment.provider_reference', read_only=True)
    allocated_by_email = serializers.CharField(source='allocated_by.email', read_only=True)
    
    class Meta:
        model = PaymentAllocation
        fields = [
            'id', 'payment', 'invoice', 'invoice_number', 'payment_reference',
            'amount_allocated', 'allocated_at', 'allocated_by', 'allocated_by_email',
            'notes'
        ]
        read_only_fields = ['id', 'allocated_at']


class InvoiceSerializer(serializers.ModelSerializer):
    """Full invoice serializer with nested items and allocations"""
    
    items = InvoiceItemSerializer(many=True, read_only=True)
    payment_allocations = PaymentAllocationSerializer(many=True, read_only=True)
    
    # Display fields
    student_name = serializers.CharField(source='student.full_name', read_only=True)
    student_code = serializers.CharField(source='student.student_code', read_only=True)
    enrollment_level = serializers.CharField(source='enrollment.level.name', read_only=True)
    enrollment_session = serializers.CharField(source='enrollment.session.label', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    # Computed fields
    balance = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    
    class Meta:
        model = Invoice
        fields = [
            'id', 'invoice_number', 'enrollment', 'student', 'student_name',
            'student_code', 'enrollment_level', 'enrollment_session',
            'total_amount', 'amount_paid', 'balance', 'status', 'status_display',
            'due_date', 'notes', 'items', 'payment_allocations',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'invoice_number', 'total_amount', 'amount_paid', 'balance',
            'status', 'created_at', 'updated_at'
        ]


class InvoiceListSerializer(serializers.ModelSerializer):
    """Compact serializer for invoice lists"""
    
    student_name = serializers.CharField(source='student.full_name', read_only=True)
    student_code = serializers.CharField(source='student.student_code', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    balance = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    
    class Meta:
        model = Invoice
        fields = [
            'id', 'invoice_number', 'student_name', 'student_code',
            'total_amount', 'amount_paid', 'balance', 'status', 'status_display',
            'due_date', 'created_at'
        ]


class PaymentSerializer(serializers.ModelSerializer):
    """Full payment serializer with allocations"""
    
    allocations = PaymentAllocationSerializer(many=True, read_only=True)
    
    # Display fields
    student_name = serializers.CharField(source='student.full_name', read_only=True)
    student_code = serializers.CharField(source='student.student_code', read_only=True)
    invoice_number = serializers.CharField(source='invoice.invoice_number', read_only=True)
    method_display = serializers.CharField(source='get_method_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    verified_by_email = serializers.CharField(source='verified_by.email', read_only=True)
    
    class Meta:
        model = Payment
        fields = [
            'id', 'student', 'student_name', 'student_code', 'invoice',
            'invoice_number', 'amount', 'currency', 'method', 'method_display',
            'provider', 'provider_reference', 'status', 'status_display',
            'transaction_date', 'verified_at', 'verified_by', 'verified_by_email',
            'metadata', 'receipt_upload_url', 'notes', 'allocations',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'status', 'verified_at', 'verified_by', 'created_at', 'updated_at'
        ]


class PaymentListSerializer(serializers.ModelSerializer):
    """Compact serializer for payment lists"""
    
    student_name = serializers.CharField(source='student.full_name', read_only=True)
    method_display = serializers.CharField(source='get_method_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = Payment
        fields = [
            'id', 'student_name', 'amount', 'currency', 'method_display',
            'status_display', 'transaction_date', 'provider_reference'
        ]


class ManualPaymentCreateSerializer(serializers.Serializer):
    """Serializer for creating manual payments (staff only)"""
    
    student = serializers.UUIDField()
    invoice = serializers.UUIDField(required=False, allow_null=True)
    amount = serializers.DecimalField(max_digits=10, decimal_places=2)
    currency = serializers.CharField(default='NGN', max_length=3)
    method = serializers.ChoiceField(choices=[
        PaymentMethod.BANK_TRANSFER,
        PaymentMethod.CASH,
        PaymentMethod.POS
    ])
    transaction_date = serializers.DateTimeField(required=False)
    receipt_upload_url = serializers.URLField(required=False, allow_blank=True)
    notes = serializers.CharField(required=False, allow_blank=True)
    
    def validate_amount(self, value):
        """Validate amount is positive"""
        if value <= Decimal('0'):
            raise serializers.ValidationError("Amount must be greater than zero")
        return value
    
    def validate(self, data):
        """Validate student and invoice exist"""
        from students.models import StudentProfile
        
        # Validate student exists
        try:
            StudentProfile.objects.get(id=data['student'])
        except StudentProfile.DoesNotExist:
            raise serializers.ValidationError({
                'student': 'Student not found'
            })
        
        # Validate invoice exists and belongs to student
        if 'invoice' in data and data['invoice']:
            try:
                invoice = Invoice.objects.get(id=data['invoice'])
                if str(invoice.student.id) != str(data['student']):
                    raise serializers.ValidationError({
                        'invoice': 'Invoice does not belong to the specified student'
                    })
            except Invoice.DoesNotExist:
                raise serializers.ValidationError({
                    'invoice': 'Invoice not found'
                })
        
        return data


class PaymentVerificationSerializer(serializers.Serializer):
    """Serializer for verifying manual payments"""
    
    verify = serializers.BooleanField()
    notes = serializers.CharField(required=False, allow_blank=True)
    
    def validate_verify(self, value):
        """Ensure payment is pending"""
        payment = self.context.get('payment')
        if payment and payment.status != PaymentStatus.PENDING:
            raise serializers.ValidationError(
                f"Cannot verify payment with status: {payment.get_status_display()}"
            )
        return value


class PaymentAllocationCreateSerializer(serializers.Serializer):
    """Serializer for allocating payments to invoices"""
    
    payment = serializers.UUIDField()
    invoice = serializers.UUIDField()
    amount = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        required=False,
        help_text="Amount to allocate (defaults to full payment amount)"
    )
    notes = serializers.CharField(required=False, allow_blank=True)
    
    def validate_amount(self, value):
        """Validate amount is positive"""
        if value and value <= Decimal('0'):
            raise serializers.ValidationError("Amount must be greater than zero")
        return value
    
    def validate(self, data):
        """Validate payment and invoice exist and are valid"""
        try:
            payment = Payment.objects.get(id=data['payment'])
        except Payment.DoesNotExist:
            raise serializers.ValidationError({
                'payment': 'Payment not found'
            })
        
        try:
            invoice = Invoice.objects.get(id=data['invoice'])
        except Invoice.DoesNotExist:
            raise serializers.ValidationError({
                'invoice': 'Invoice not found'
            })
        
        # Validate payment status
        if payment.status != PaymentStatus.SUCCESSFUL:
            raise serializers.ValidationError({
                'payment': f'Cannot allocate payment with status: {payment.get_status_display()}'
            })
        
        # Validate invoice belongs to same student
        if invoice.student != payment.student:
            raise serializers.ValidationError({
                'invoice': 'Invoice does not belong to the same student as the payment'
            })
        
        # Store for use in create
        data['_payment'] = payment
        data['_invoice'] = invoice
        
        return data


class RefundSerializer(serializers.ModelSerializer):
    """Serializer for refunds"""
    
    payment_reference = serializers.CharField(source='payment.provider_reference', read_only=True)
    payment_amount = serializers.DecimalField(
        source='payment.amount',
        max_digits=10,
        decimal_places=2,
        read_only=True
    )
    processed_by_email = serializers.CharField(source='processed_by.email', read_only=True)
    
    class Meta:
        model = Refund
        fields = [
            'id', 'payment', 'payment_reference', 'payment_amount',
            'amount', 'reason', 'processed_by', 'processed_by_email',
            'processed_at', 'notes', 'metadata'
        ]
        read_only_fields = ['id', 'processed_by', 'processed_at']
    
    def validate_amount(self, value):
        """Validate refund amount"""
        if value <= Decimal('0'):
            raise serializers.ValidationError("Refund amount must be greater than zero")
        return value


class RefundCreateSerializer(serializers.Serializer):
    """Serializer for creating refunds"""
    
    payment = serializers.UUIDField()
    amount = serializers.DecimalField(max_digits=10, decimal_places=2)
    reason = serializers.CharField()
    notes = serializers.CharField(required=False, allow_blank=True)
    
    def validate_amount(self, value):
        """Validate amount is positive"""
        if value <= Decimal('0'):
            raise serializers.ValidationError("Amount must be greater than zero")
        return value
    
    def validate(self, data):
        """Validate payment exists and can be refunded"""
        try:
            payment = Payment.objects.get(id=data['payment'])
        except Payment.DoesNotExist:
            raise serializers.ValidationError({
                'payment': 'Payment not found'
            })
        
        # Check payment status
        if payment.status not in [PaymentStatus.SUCCESSFUL, PaymentStatus.REVERSED]:
            raise serializers.ValidationError({
                'payment': f'Cannot refund payment with status: {payment.get_status_display()}'
            })
        
        # Check refund amount against payment amount and existing refunds
        from django.db.models import Sum
        
        existing_refunds = Refund.objects.filter(payment=payment).aggregate(
            total=Sum('amount')
        )['total'] or Decimal('0.00')
        
        if data['amount'] + existing_refunds > payment.amount:
            raise serializers.ValidationError({
                'amount': f'Total refunds ({data["amount"] + existing_refunds}) would exceed payment amount ({payment.amount})'
            })
        
        data['_payment'] = payment
        return data


class FinancialSummarySerializer(serializers.Serializer):
    """Serializer for student financial summary"""
    
    total_invoiced = serializers.DecimalField(max_digits=12, decimal_places=2)
    total_paid = serializers.DecimalField(max_digits=12, decimal_places=2)
    total_balance = serializers.DecimalField(max_digits=12, decimal_places=2)
    invoice_count = serializers.IntegerField()
    status_counts = serializers.DictField()
    invoices = InvoiceListSerializer(many=True)
