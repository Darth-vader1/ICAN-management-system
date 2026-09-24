"""
ViewSets for billing with role-based permissions and custom actions.
"""
from decimal import Decimal
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db import transaction
from django.db.models import Q, F
from django.shortcuts import get_object_or_404
from django.utils import timezone

from users.permissions import IsManagerOrAbove, IsFinanceOrAbove, IsSelfOrStaff
from audit.utils import log_audit

from .models import (
    FeeStructure, Invoice, Payment, PaymentAllocation, 
    Refund, PaymentStatus, LevelTierPricing
)
from .serializers import (
    FeeStructureSerializer, FeeStructureListSerializer,
    InvoiceSerializer, InvoiceListSerializer,
    PaymentSerializer, PaymentListSerializer,
    ManualPaymentCreateSerializer, PaymentVerificationSerializer,
    PaymentAllocationSerializer, PaymentAllocationCreateSerializer,
    RefundSerializer, RefundCreateSerializer,
    FinancialSummarySerializer, LevelTierPricingSerializer
)
from .services import InvoiceService, BalanceCalculator


class LevelTierPricingViewSet(viewsets.ModelViewSet):
    """
    ViewSet for LevelTierPricing (Level-based tiered pricing by course count).
    - Managers/Admin can CRUD
    - All authenticated users can view
    """
    queryset = LevelTierPricing.objects.all()
    serializer_class = LevelTierPricingSerializer
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsManagerOrAbove()]
        return [IsAuthenticated()]

    def get_queryset(self):
        queryset = LevelTierPricing.objects.select_related('level', 'session').all()
        level_id = self.request.query_params.get('level')
        session_id = self.request.query_params.get('session')
        course_count = self.request.query_params.get('course_count')
        if level_id:
            queryset = queryset.filter(level_id=level_id)
        if session_id:
            queryset = queryset.filter(Q(session_id=session_id) | Q(session_id__isnull=True))
        if course_count:
            queryset = queryset.filter(course_count=course_count)
        return queryset.order_by('level_id', 'course_count', F('session_id').asc(nulls_last=True))

    @transaction.atomic
    def perform_create(self, serializer):
        level = serializer.validated_data.get('level')
        course_count = serializer.validated_data.get('course_count')
        session = serializer.validated_data.get('session', None)
        
        defaults = {
            k: v for k, v in serializer.validated_data.items()
            if k not in ('level', 'course_count', 'session')
        }

        obj, created = LevelTierPricing.objects.select_for_update().update_or_create(
            level=level,
            course_count=course_count,
            session=session,
            defaults=defaults
        )
        serializer.instance = obj


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


class InvoiceViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Invoice.
    
    - Students can view their own
    - Staff can view all
    - Finance/Manager can create/cancel invoices
    """
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action == 'list':
            return InvoiceListSerializer
        return InvoiceSerializer

    def get_permissions(self):
        if self.action == 'cancel':
            return [IsManagerOrAbove()]
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsFinanceOrAbove()]
        return [IsAuthenticated()]
    
    def get_queryset(self):
        user = self.request.user
        
        queryset = Invoice.objects.select_related(
            'student', 'student__user', 'enrollment', 'enrollment__level',
            'enrollment__session'
        ).prefetch_related(
            'items', 'payment_allocations', 'payment_allocations__payment'
        )
        
        # Students see only their own invoices
        if user.role == 'student':
            if hasattr(user, 'student_profile'):
                student_obj = user.student_profile
                from enrollments.models import Enrollment
                from billing.services.invoice_service import InvoiceService
                student_enrollments = Enrollment.objects.filter(student=student_obj).exclude(status='withdrawn')
                for enrollment in student_enrollments:
                    if not hasattr(enrollment, 'invoice'):
                        try:
                            InvoiceService.create_invoice_for_enrollment(enrollment)
                        except Exception:
                            pass
                queryset = queryset.filter(student=student_obj)
            else:
                queryset = queryset.none()
        
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
        user = request.user
        
        # Ensure student profile exists for student role
        from students.models import StudentProfile
        student = getattr(user, 'student_profile', None)
        if not student:
            if user.role == 'student':
                student, _ = StudentProfile.objects.get_or_create(
                    user=user,
                    defaults={
                        'first_name': user.first_name or user.username,
                        'last_name': user.last_name or 'Student',
                    }
                )
            else:
                return Response([])

        from enrollments.models import Enrollment, EnrollmentCourse, EnrollmentStatus
        from academics.models import AcademicSession, Level, CourseOffering, Course
        from billing.services.invoice_service import InvoiceService
        from django.db import transaction
        from django.utils import timezone

        # Auto-heal: Ensure all non-withdrawn enrollments for this student have invoices
        student_enrollments = Enrollment.objects.filter(student=student).exclude(status='withdrawn')
        for enrollment in student_enrollments:
            if not hasattr(enrollment, 'invoice'):
                try:
                    InvoiceService.create_invoice_for_enrollment(enrollment)
                except Exception as e:
                    import traceback
                    print(f"=== INVOICE CREATION ERROR FOR ENROLLMENT {enrollment.id} ===")
                    print(f"Error type: {type(e).__name__}, details: {e}")
                    traceback.print_exc()

        # Auto-reconcile any successful payments for this student
        try:
            from billing.services import BalanceCalculator
            BalanceCalculator.reconcile_student_payments(student)
        except Exception as e:
            print(f"Error auto-reconciling payments for student {student.id}: {e}")

        invoices = Invoice.objects.filter(
            student=student
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

    @action(detail=False, methods=['get'], permission_classes=[IsFinanceOrAbove])
    def overview(self, request):
        """
        Get dynamic financial overview summary for the Finance Overview dashboard.
        GET /api/billing/invoices/overview/
        """
        from academics.models import AcademicSession
        from django.db.models import Sum, Q, F

        active_session = AcademicSession.objects.filter(is_active=True).first()
        session_label = f"{active_session.label} Academic Session" if active_session else "N/A"

        valid_invoices = Invoice.objects.exclude(status='cancelled')

        expected_revenue = valid_invoices.aggregate(total=Sum('total_amount'))['total'] or Decimal('0.00')
        collected = valid_invoices.aggregate(paid=Sum('amount_paid'))['paid'] or Decimal('0.00')
        outstanding = max(0, float(expected_revenue - collected))

        overdue_invoices = valid_invoices.filter(status='overdue')
        overdue_count = overdue_invoices.count()
        overdue_amount = sum(float(inv.balance) for inv in overdue_invoices)

        collection_rate = round(float((collected / expected_revenue) * 100), 1) if expected_revenue > 0 else 0.0

        pending_payments = Payment.objects.filter(status=PaymentStatus.PENDING).select_related('student', 'student__user').order_by('-transaction_date')
        pending_count = pending_payments.count()
        latest_pending = None
        if pending_count > 0:
            p = pending_payments.first()
            student_name = p.student.full_name if p.student else 'Unknown Student'
            latest_pending = {
                'id': str(p.id),
                'student_name': student_name,
                'amount': float(p.amount)
            }

        unpaid_invoices = valid_invoices.filter(
            status__in=['overdue', 'pending', 'partially_paid']
        ).select_related('student', 'enrollment__level').order_by('-total_amount')

        outstanding_by_student = []
        for inv in unpaid_invoices:
            bal = float(inv.balance)
            if bal <= 0:
                continue

            student_name = inv.student.full_name if inv.student else 'Unknown Student'
            level_name = inv.enrollment.level.name if (inv.enrollment and inv.enrollment.level) else 'General'
            status_label = 'Overdue' if inv.status == 'overdue' else 'Pending'

            outstanding_by_student.append({
                'id': str(inv.id),
                'student_name': student_name,
                'invoice_number': inv.invoice_number,
                'level_name': level_name,
                'amount': bal,
                'status': status_label
            })
            if len(outstanding_by_student) >= 8:
                break

        outstanding_by_student.sort(key=lambda x: x['amount'], reverse=True)

        recent_payments = Payment.objects.select_related('student', 'student__user').order_by('-transaction_date')[:8]
        recent_transactions = []
        for p in recent_payments:
            student_name = p.student.full_name if p.student else 'Unknown Student'
            ref = p.payment_reference if hasattr(p, 'payment_reference') and p.payment_reference else f"PAY-{str(p.id)[:8].upper()}"
            date_str = p.transaction_date.strftime('%d %b %Y') if p.transaction_date else ''

            recent_transactions.append({
                'id': str(p.id),
                'student_name': student_name,
                'payment_reference': ref,
                'date': date_str,
                'amount': float(p.amount),
                'status': p.status,
                'method': p.method
            })

        return Response({
            'session_label': session_label,
            'expected_revenue': float(expected_revenue),
            'collected': float(collected),
            'outstanding': float(outstanding),
            'overdue': float(overdue_amount),
            'overdue_count': overdue_count,
            'collection_rate': collection_rate,
            'pending_verification': {
                'count': pending_count,
                'latest': latest_pending
            },
            'outstanding_by_student': outstanding_by_student,
            'recent_transactions': recent_transactions
        })



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
        if self.action in ['create_manual', 'verify', 'allocate', 'create', 'update', 'partial_update', 'destroy']:
            return [IsFinanceOrAbove()]
        return [IsAuthenticated()]
    
    def get_queryset(self):
        user = self.request.user
        
        queryset = Payment.objects.select_related(
            'student', 'student__user', 'invoice', 'verified_by'
        ).prefetch_related('allocations', 'allocations__invoice')
        
        # Students see only their own payments
        if user.role == 'student':
            if hasattr(user, 'student_profile'):
                queryset = queryset.filter(student=user.student_profile)
            else:
                queryset = queryset.none()
        
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
