from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.db.models import Sum

from .models import (
    FeeStructure, Invoice, InvoiceItem, Payment, 
    PaymentAllocation, Refund
)


@admin.register(FeeStructure)
class FeeStructureAdmin(admin.ModelAdmin):
    list_display = [
        'description', 'fee_type', 'amount', 'currency',
        'level_display', 'course_display', 'session_display',
        'is_active', 'effective_from'
    ]
    list_filter = ['fee_type', 'is_active', 'session', 'level', 'effective_from']
    search_fields = ['description', 'course__code', 'course__name', 'level__name']
    ordering = ['-created_at']
    date_hierarchy = 'effective_from'
    
    fieldsets = (
        ('Fee Information', {
            'fields': ('description', 'fee_type', 'amount', 'currency')
        }),
        ('Scope', {
            'fields': ('session', 'level', 'course'),
            'description': 'Define the scope of this fee. Session is required. Level and/or Course are optional.'
        }),
        ('Validity Period', {
            'fields': ('effective_from', 'effective_to', 'is_active')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    readonly_fields = ['created_at', 'updated_at']
    autocomplete_fields = ['session', 'level', 'course']
    
    def level_display(self, obj):
        return obj.level.name if obj.level else '-'
    level_display.short_description = 'Level'
    
    def course_display(self, obj):
        return obj.course.code if obj.course else '-'
    course_display.short_description = 'Course'
    
    def session_display(self, obj):
        return obj.session.label
    session_display.short_description = 'Session'


class InvoiceItemInline(admin.TabularInline):
    model = InvoiceItem
    extra = 0
    can_delete = False
    readonly_fields = ['description', 'quantity', 'unit_price', 'total', 'created_at']
    fields = ['description', 'quantity', 'unit_price', 'total']
    
    def has_add_permission(self, request, obj=None):
        return False


class PaymentAllocationInline(admin.TabularInline):
    model = PaymentAllocation
    extra = 0
    can_delete = False
    readonly_fields = [
        'payment_link', 'amount_allocated', 'allocated_at',
        'allocated_by_display'
    ]
    fields = ['payment_link', 'amount_allocated', 'allocated_at', 'allocated_by_display']
    
    def payment_link(self, obj):
        url = reverse('admin:billing_payment_change', args=[obj.payment.id])
        return format_html('<a href="{}">{}</a>', url, obj.payment.provider_reference or obj.payment.id)
    payment_link.short_description = 'Payment'
    
    def allocated_by_display(self, obj):
        return obj.allocated_by.email if obj.allocated_by else 'System'
    allocated_by_display.short_description = 'Allocated By'
    
    def has_add_permission(self, request, obj=None):
        return False


@admin.register(Invoice)
class InvoiceAdmin(admin.ModelAdmin):
    list_display = [
        'invoice_number', 'student_link', 'session_display',
        'total_amount_display', 'amount_paid_display', 'balance_display',
        'status_badge', 'due_date'
    ]
    list_filter = ['status', 'due_date', 'enrollment__session', 'enrollment__level']
    search_fields = [
        'invoice_number', 'student__student_code',
        'student__first_name', 'student__last_name',
        'student__user__email'
    ]
    ordering = ['-created_at']
    date_hierarchy = 'created_at'
    
    fieldsets = (
        ('Invoice Information', {
            'fields': ('invoice_number', 'enrollment', 'student', 'status')
        }),
        ('Amounts', {
            'fields': ('total_amount', 'amount_paid', 'balance_display', 'due_date')
        }),
        ('Notes', {
            'fields': ('notes',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    readonly_fields = [
        'invoice_number', 'enrollment', 'student', 'total_amount',
        'amount_paid', 'balance_display', 'status', 'created_at', 'updated_at'
    ]
    
    inlines = [InvoiceItemInline, PaymentAllocationInline]
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related(
            'student', 'student__user', 'enrollment', 'enrollment__session'
        ).prefetch_related('items', 'payment_allocations')
    
    def student_link(self, obj):
        url = reverse('admin:students_studentprofile_change', args=[obj.student.id])
        return format_html('<a href="{}">{} ({})</a>', 
                          url, obj.student.full_name, obj.student.student_code)
    student_link.short_description = 'Student'
    
    def session_display(self, obj):
        return obj.enrollment.session.label
    session_display.short_description = 'Session'
    
    def total_amount_display(self, obj):
        return f'₦{obj.total_amount:,.2f}'
    total_amount_display.short_description = 'Total'
    total_amount_display.admin_order_field = 'total_amount'
    
    def amount_paid_display(self, obj):
        return f'₦{obj.amount_paid:,.2f}'
    amount_paid_display.short_description = 'Paid'
    amount_paid_display.admin_order_field = 'amount_paid'
    
    def balance_display(self, obj):
        balance = obj.balance
        color = 'green' if balance <= 0 else 'red'
        return format_html('<span style="color: {};">₦{:,.2f}</span>', 
                          color, balance)
    balance_display.short_description = 'Balance'
    
    def status_badge(self, obj):
        colors = {
            'draft': 'gray',
            'pending': 'orange',
            'partially_paid': 'blue',
            'paid': 'green',
            'overdue': 'red',
            'cancelled': 'black',
        }
        color = colors.get(obj.status, 'gray')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 10px; border-radius: 3px;">{}</span>',
            color, obj.get_status_display()
        )
    status_badge.short_description = 'Status'
    
    def has_add_permission(self, request):
        return False  # Invoices created via enrollment
    
    def has_delete_permission(self, request, obj=None):
        return False  # Invoices are immutable


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = [
        'id_short', 'student_link', 'amount_display', 'method',
        'status_badge', 'transaction_date', 'verified_display'
    ]
    list_filter = ['status', 'method', 'transaction_date', 'verified_at']
    search_fields = [
        'provider_reference', 'student__student_code',
        'student__first_name', 'student__last_name',
        'student__user__email'
    ]
    ordering = ['-transaction_date']
    date_hierarchy = 'transaction_date'
    
    fieldsets = (
        ('Payment Information', {
            'fields': ('student', 'invoice', 'amount', 'currency', 'method')
        }),
        ('Provider Details', {
            'fields': ('provider', 'provider_reference', 'status')
        }),
        ('Verification', {
            'fields': ('verified_at', 'verified_by', 'receipt_upload_url')
        }),
        ('Metadata', {
            'fields': ('transaction_date', 'metadata', 'notes'),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    readonly_fields = [
        'provider', 'provider_reference', 'status',
        'verified_at', 'verified_by', 'metadata',
        'created_at', 'updated_at'
    ]
    
    autocomplete_fields = ['student', 'invoice']
    
    actions = ['verify_payments']
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related(
            'student', 'student__user', 'invoice', 'verified_by'
        ).prefetch_related('allocations')
    
    def id_short(self, obj):
        return str(obj.id)[:8]
    id_short.short_description = 'ID'
    
    def student_link(self, obj):
        url = reverse('admin:students_studentprofile_change', args=[obj.student.id])
        return format_html('<a href="{}">{}</a>', url, obj.student.full_name)
    student_link.short_description = 'Student'
    
    def amount_display(self, obj):
        return f'₦{obj.amount:,.2f}'
    amount_display.short_description = 'Amount'
    amount_display.admin_order_field = 'amount'
    
    def status_badge(self, obj):
        colors = {
            'pending': 'orange',
            'successful': 'green',
            'failed': 'red',
            'reversed': 'purple',
            'refunded': 'gray',
        }
        color = colors.get(obj.status, 'gray')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 10px; border-radius: 3px;">{}</span>',
            color, obj.get_status_display()
        )
    status_badge.short_description = 'Status'
    
    def verified_display(self, obj):
        if obj.verified_at:
            verifier = obj.verified_by.email if obj.verified_by else 'System'
            return format_html('✓ {}<br/><small>{}</small>', 
                             obj.verified_at.strftime('%Y-%m-%d %H:%M'), verifier)
        return '-'
    verified_display.short_description = 'Verified'
    
    def verify_payments(self, request, queryset):
        """Bulk verify pending payments"""
        from django.utils import timezone
        
        count = 0
        for payment in queryset.filter(status='pending'):
            payment.status = 'successful'
            payment.verified_at = timezone.now()
            payment.verified_by = request.user
            payment.save()
            count += 1
        
        self.message_user(request, f'{count} payment(s) verified successfully.')
    verify_payments.short_description = 'Verify selected pending payments'


@admin.register(PaymentAllocation)
class PaymentAllocationAdmin(admin.ModelAdmin):
    list_display = [
        'id_short', 'payment_link', 'invoice_link',
        'amount_allocated_display', 'allocated_at', 'allocated_by_display'
    ]
    list_filter = ['allocated_at']
    search_fields = [
        'payment__provider_reference', 'invoice__invoice_number',
        'payment__student__student_code'
    ]
    ordering = ['-allocated_at']
    date_hierarchy = 'allocated_at'
    
    readonly_fields = [
        'payment', 'invoice', 'amount_allocated',
        'allocated_at', 'allocated_by'
    ]
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related(
            'payment', 'payment__student', 'invoice', 'allocated_by'
        )
    
    def id_short(self, obj):
        return str(obj.id)[:8]
    id_short.short_description = 'ID'
    
    def payment_link(self, obj):
        url = reverse('admin:billing_payment_change', args=[obj.payment.id])
        return format_html('<a href="{}">{}</a>', 
                          url, obj.payment.provider_reference or str(obj.payment.id)[:8])
    payment_link.short_description = 'Payment'
    
    def invoice_link(self, obj):
        url = reverse('admin:billing_invoice_change', args=[obj.invoice.id])
        return format_html('<a href="{}">{}</a>', url, obj.invoice.invoice_number)
    invoice_link.short_description = 'Invoice'
    
    def amount_allocated_display(self, obj):
        return f'₦{obj.amount_allocated:,.2f}'
    amount_allocated_display.short_description = 'Amount'
    amount_allocated_display.admin_order_field = 'amount_allocated'
    
    def allocated_by_display(self, obj):
        return obj.allocated_by.email if obj.allocated_by else 'System'
    allocated_by_display.short_description = 'Allocated By'
    
    def has_add_permission(self, request):
        return False  # Allocations created via API
    
    def has_change_permission(self, request, obj=None):
        return False  # Allocations are immutable


@admin.register(Refund)
class RefundAdmin(admin.ModelAdmin):
    list_display = [
        'id_short', 'payment_link', 'amount_display',
        'reason_short', 'processed_at', 'processed_by_display'
    ]
    list_filter = ['processed_at']
    search_fields = [
        'payment__provider_reference', 'reason',
        'payment__student__student_code'
    ]
    ordering = ['-processed_at']
    date_hierarchy = 'processed_at'
    
    fieldsets = (
        ('Refund Information', {
            'fields': ('payment', 'amount', 'reason')
        }),
        ('Processing', {
            'fields': ('processed_by', 'processed_at', 'notes')
        }),
        ('Metadata', {
            'fields': ('metadata',),
            'classes': ('collapse',)
        }),
    )
    
    readonly_fields = ['payment', 'processed_by', 'processed_at']
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related(
            'payment', 'payment__student', 'processed_by'
        )
    
    def id_short(self, obj):
        return str(obj.id)[:8]
    id_short.short_description = 'ID'
    
    def payment_link(self, obj):
        url = reverse('admin:billing_payment_change', args=[obj.payment.id])
        return format_html('<a href="{}">{}</a>', 
                          url, obj.payment.provider_reference or str(obj.payment.id)[:8])
    payment_link.short_description = 'Payment'
    
    def amount_display(self, obj):
        return f'₦{obj.amount:,.2f}'
    amount_display.short_description = 'Amount'
    amount_display.admin_order_field = 'amount'
    
    def reason_short(self, obj):
        return obj.reason[:50] + '...' if len(obj.reason) > 50 else obj.reason
    reason_short.short_description = 'Reason'
    
    def processed_by_display(self, obj):
        return obj.processed_by.email if obj.processed_by else '-'
    processed_by_display.short_description = 'Processed By'
    
    def has_change_permission(self, request, obj=None):
        return False  # Refunds are immutable
