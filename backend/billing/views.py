"""
ViewSets for billing with role-based permissions and custom actions.
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.utils import timezone

from users.permissions import IsManagerOrAbove, IsFinanceOrAbove, IsSelfOrStaff
from audit.utils import log_audit

from .models import (
    FeeStructure, Invoice, Payment, PaymentAllocation, 
    Refund, PaymentStatus
)
from .serializers import (
    FeeStructureSerializer, FeeStructureListSerializer,
    InvoiceSerializer, InvoiceListSerializer,
    PaymentSerializer, PaymentListSerializer,
    ManualPaymentCreateSerializer, PaymentVerificationSerializer,
    PaymentAllocationSerializer, PaymentAllocationCreateSerializer,
    RefundSerializer, RefundCreateSerializer,
    FinancialSummarySerializer
)
from .services import InvoiceService, BalanceCalculator


class FeeStructureViewSet(viewsets.ModelViewSet):
    """
    ViewSet for FeeStructure.
    - Managers can CRUD
    - Others can view
    """
    queryset = FeeStructure.objects.all()
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action == 'list':
            return FeeStructureListSerializer
        return FeeStructureSerializer
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsManagerOrAbove()]
        return [IsAuthenticated()]
    
    def get_queryset(self):
        queryset = FeeStructure.objects.select_related(
            'level', 'course', 'session'
        ).all()
        
        # Filter by query params
        session = self.request.query_params.get('session')
        level = self.request.query_params.get('level')
        course = self.request.query_params.get('course')
        fee_type = self.request.query_params.get('fee_type')
        is_active = self.request.query_params.get('is_active')
        
        if session:
            queryset = queryset.filter(session_id=session)
        if level:
            queryset = queryset.filter(level_id=level)
        if course:
            queryset = queryset.filter(course_id=course)
        if fee_type:
            queryset = queryset.filter(fee_type=fee_type)
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')
        
        return queryset
    
    def perform_create(self, serializer):
        fee = serializer.save()
        log_audit(
            user=self.request.user,
            action='CREATE',
            entity_type='FeeStructure',
            entity_id=str(fee.id),
            new_value={'description': fee.description, 'amount': float(fee.amount)}
        )
    
    def perform_update(self, serializer):
        old_values = {
            'amount': float(serializer.instance.amount),
            'is_active': serializer.instance.is_active
        }
        fee = serializer.save()
        log_audit(
            user=self.request.user,
            action='UPDATE',
            entity_type='FeeStructure',
            entity_id=str(fee.id),
            old_value=old_values,
            new_value={'amount': float(fee.amount), 'is_active': fee.is_active}
        )


class InvoiceViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for Invoice (read-only).
    Invoices are created automatically via enrollment.
    
    - Students can view their own
    - Staff can view all
    """
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action == 'list':
            return InvoiceListSerializer
        return InvoiceSerializer
    
    def get_queryset(self):
        user = self.request.user
        
        queryset = Invoice.objects.select_related(
            'student', 'student__user', 'enrollment', 'enrollment__level',
            'enrollment__session'
        ).prefetch_related(
            'items', 'payment_allocations', 'payment_allocations__payment'
        )
        
        # Students see only their own invoices
        if user.role == 'student' and hasattr(user, 'student_profile'):
            queryset = queryset.filter(student=user.student_profile)
        
        # Filter by query params
        student = self.request.query_params.get('student')
        status_filter = self.request.query_params.get('status')
        session = self.request.query_params.get('session')
        
        if student and user.role != 'student':
            queryset = queryset.filter(student_id=student)
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        if session:
            queryset = queryset.filter(enrollment__session_id=session)
        
        return queryset.order_by('-created_at')
    
    @action(detail=False, methods=['get'], url_path='my-invoices', permission_classes=[IsAuthenticated])
    def my_invoices(self, request):
        """Get current student's invoices"""
        if not hasattr(request.user, 'student_profile'):
            return Response([])
        
        invoices = Invoice.objects.filter(
            student=request.user.student_profile
        ).select_related(
            'enrollment', 'enrollment__level', 'enrollment__session'
        ).prefetch_related(
            'items', 'payment_allocations'
        ).order_by('-created_at')
        
        serializer = InvoiceSerializer(invoices, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'], permission_classes=[IsManagerOrAbove])
    def cancel(self, request, pk=None):
        """Cancel an invoice (manager only)"""
        invoice = self.get_object()
        reason = request.data.get('reason', '')
        
        try:
            InvoiceService.cancel_invoice(invoice, reason)
            log_audit(
                user=request.user,
                action='CANCEL',
                entity_type='Invoice',
                entity_id=str(invoice.id),
                new_value={'reason': reason}
            )
            return Response({
                'success': True,
                'message': 'Invoice cancelled successfully'
            })
        except Exception as e:
            return Response(
                {'detail': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )


class PaymentViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Payment.
    
    - Students can view their own
    - Finance/Manager can create manual payments and verify
    - Staff can view all
    """
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action == 'list':
            return PaymentListSerializer
        elif self.action == 'create_manual':
            return ManualPaymentCreateSerializer
        elif self.action == 'verify':
            return PaymentVerificationSerializer
        return PaymentSerializer
    
    def get_permissions(self):
        if self.action in ['create_manual', 'verify']:
            return [IsFinanceOrAbove()]
        return [IsAuthenticated()]
    
    def get_queryset(self):
        user = self.request.user
        
        queryset = Payment.objects.select_related(
            'student', 'student__user', 'invoice', 'verified_by'
        ).prefetch_related('allocations', 'allocations__invoice')
        
        # Students see only their own payments
        if user.role == 'student' and hasattr(user, 'student_profile'):
            queryset = queryset.filter(student=user.student_profile)
        
        # Filter by query params
        student = self.request.query_params.get('student')
        status_filter = self.request.query_params.get('status')
        method = self.request.query_params.get('method')
        
        if student and user.role != 'student':
            queryset = queryset.filter(student_id=student)
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        if method:
            queryset = queryset.filter(method=method)
        
        return queryset.order_by('-transaction_date')
    
    @action(detail=False, methods=['post'], permission_classes=[IsFinanceOrAbove])
    def create_manual(self, request):
        """Create a manual payment (finance/manager)"""
        serializer = ManualPaymentCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        data = serializer.validated_data
        
        # Create payment with pending status
        payment = Payment.objects.create(
            student_id=data['student'],
            invoice_id=data.get('invoice'),
            amount=data['amount'],
            currency=data.get('currency', 'NGN'),
            method=data['method'],
            status=PaymentStatus.PENDING,
            transaction_date=data.get('transaction_date', timezone.now()),
            receipt_upload_url=data.get('receipt_upload_url', ''),
            notes=data.get('notes', '')
        )
        
        log_audit(
            user=request.user,
            action='CREATE',
            entity_type='Payment',
            entity_id=str(payment.id),
            new_value={
                'amount': float(payment.amount),
                'method': payment.method,
                'status': 'pending'
            }
        )
        
        return Response(
            PaymentSerializer(payment).data,
            status=status.HTTP_201_CREATED
        )
    
    @action(detail=True, methods=['post'], permission_classes=[IsFinanceOrAbove])
    def verify(self, request, pk=None):
        """Verify a manual payment (finance/manager)"""
        payment = self.get_object()
        
        serializer = PaymentVerificationSerializer(
            data=request.data,
            context={'payment': payment}
        )
        serializer.is_valid(raise_exception=True)
        
        verify = serializer.validated_data['verify']
        notes = serializer.validated_data.get('notes', '')
        
        if verify:
            payment.status = PaymentStatus.SUCCESSFUL
            payment.verified_at = timezone.now()
            payment.verified_by = request.user
            
            if notes:
                payment.notes = f"{payment.notes}\n\nVerification notes: {notes}" if payment.notes else f"Verification notes: {notes}"
            
            payment.save()
            
            # Auto-allocate to invoice if specified
            if payment.invoice:
                try:
                    BalanceCalculator.allocate_payment_to_invoice(
                        payment=payment,
                        invoice=payment.invoice,
                        allocated_by=request.user
                    )
                except Exception as e:
                    # Payment is verified but allocation failed
                    return Response({
                        'success': True,
                        'message': f'Payment verified but allocation failed: {str(e)}',
                        'payment': PaymentSerializer(payment).data
                    })
            
            log_audit(
                user=request.user,
                action='VERIFY',
                entity_type='Payment',
                entity_id=str(payment.id),
                new_value={'status': 'successful'}
            )
            
            return Response({
                'success': True,
                'message': 'Payment verified successfully',
                'payment': PaymentSerializer(payment).data
            })
        else:
            payment.status = PaymentStatus.FAILED
            payment.notes = f"{payment.notes}\n\nRejection reason: {notes}" if payment.notes else f"Rejection reason: {notes}"
            payment.save()
            
            log_audit(
                user=request.user,
                action='REJECT',
                entity_type='Payment',
                entity_id=str(payment.id),
                new_value={'status': 'failed'}
            )
            
            return Response({
                'success': True,
                'message': 'Payment rejected',
                'payment': PaymentSerializer(payment).data
            })
    
    @action(detail=True, methods=['post'], permission_classes=[IsFinanceOrAbove])
    def allocate(self, request, pk=None):
        """Allocate payment to invoice"""
        payment = self.get_object()
        
        serializer = PaymentAllocationCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        try:
            allocation = BalanceCalculator.allocate_payment_to_invoice(
                payment=payment,
                invoice=serializer.validated_data['_invoice'],
                amount=serializer.validated_data.get('amount'),
                allocated_by=request.user
            )
            
            log_audit(
                user=request.user,
                action='ALLOCATE',
                entity_type='Payment',
                entity_id=str(payment.id),
                new_value={
                    'invoice': serializer.validated_data['_invoice'].invoice_number,
                    'amount': float(allocation.amount_allocated)
                }
            )
            
            return Response({
                'success': True,
                'message': 'Payment allocated successfully',
                'allocation': PaymentAllocationSerializer(allocation).data
            })
        except Exception as e:
            return Response(
                {'detail': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )


class RefundViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Refund.
    Only finance/manager can create refunds.
    """
    queryset = Refund.objects.all()
    permission_classes = [IsFinanceOrAbove]
    serializer_class = RefundSerializer
    
    def get_queryset(self):
        return Refund.objects.select_related(
            'payment', 'payment__student', 'processed_by'
        ).order_by('-processed_at')
    
    def create(self, request, *args, **kwargs):
        """Create a refund"""
        serializer = RefundCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        data = serializer.validated_data
        
        refund = Refund.objects.create(
            payment=data['_payment'],
            amount=data['amount'],
            reason=data['reason'],
            processed_by=request.user,
            notes=data.get('notes', '')
        )
        
        log_audit(
            user=request.user,
            action='REFUND',
            entity_type='Payment',
            entity_id=str(data['_payment'].id),
            new_value={
                'refund_amount': float(refund.amount),
                'reason': refund.reason
            }
        )
        
        return Response(
            RefundSerializer(refund).data,
            status=status.HTTP_201_CREATED
        )


class FinancialProfileViewSet(viewsets.ViewSet):
    """
    ViewSet for student financial profiles.
    Provides comprehensive financial summary.
    """
    permission_classes = [IsAuthenticated]
    
    def retrieve(self, request, pk=None):
        """Get financial profile for a student"""
        from students.models import StudentProfile
        
        # Get student
        if pk == 'me':
            if request.user.role != 'student' or not hasattr(request.user, 'student_profile'):
                return Response(
                    {'detail': 'Not a student'},
                    status=status.HTTP_403_FORBIDDEN
                )
            student = request.user.student_profile
        else:
            student = get_object_or_404(StudentProfile, id=pk)
            
            # Only staff or the student themselves can view
            if request.user.role == 'student':
                if not hasattr(request.user, 'student_profile') or request.user.student_profile.id != student.id:
                    return Response(
                        {'detail': 'Access denied'},
                        status=status.HTTP_403_FORBIDDEN
                    )
        
        # Get financial summary
        summary = InvoiceService.get_student_financial_summary(student)
        
        serializer = FinancialSummarySerializer(summary)
        return Response(serializer.data)
