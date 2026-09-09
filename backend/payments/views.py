"""
Paystack payment views for initialization and webhook handling.
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.http import HttpResponse
from django.utils import timezone

from billing.models import Invoice
from audit.utils import log_audit

from .paystack import get_paystack_client, get_webhook_handler, PaystackError, WebhookError


class PaystackInitializeView(APIView):
    """
    Initialize a Paystack transaction for invoice payment.
    
    POST /api/payments/paystack/initialize/
    {
        "invoice_id": "uuid",
        "callback_url": "https://example.com/payment-callback"  // optional
    }
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        invoice_id = request.data.get('invoice_id')
        callback_url = request.data.get('callback_url')
        
        if not invoice_id:
            return Response(
                {'detail': 'invoice_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get invoice
        try:
            invoice = Invoice.objects.select_related('student', 'student__user').get(
                id=invoice_id
            )
        except Invoice.DoesNotExist:
            return Response(
                {'detail': 'Invoice not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check ownership (students can only pay their own invoices)
        if request.user.role == 'student':
            if not hasattr(request.user, 'student_profile') or invoice.student != request.user.student_profile:
                return Response(
                    {'detail': 'Access denied'},
                    status=status.HTTP_403_FORBIDDEN
                )
        
        # Check invoice status
        if invoice.status == 'paid':
            return Response(
                {'detail': 'Invoice is already paid'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if invoice.status == 'cancelled':
            return Response(
                {'detail': 'Invoice is cancelled'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Calculate amount to pay (balance)
        amount_to_pay = invoice.balance
        
        if amount_to_pay <= 0:
            return Response(
                {'detail': 'Invoice has no outstanding balance'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Generate reference using invoice number
        reference = f"{invoice.invoice_number}-{int(timezone.now().timestamp())}"
        
        # Initialize transaction with Paystack
        try:
            client = get_paystack_client()
            
            result = client.initialize_transaction(
                email=invoice.student.user.email,
                amount=amount_to_pay,
                reference=reference,
                callback_url=callback_url,
                metadata={
                    'invoice_id': str(invoice.id),
                    'invoice_number': invoice.invoice_number,
                    'student_id': str(invoice.student.id),
                    'student_name': invoice.student.full_name,
                }
            )
            
            log_audit(
                user=request.user,
                action='PAYSTACK_INITIALIZE',
                entity_type='Invoice',
                entity_id=str(invoice.id),
                new_value={
                    'reference': reference,
                    'amount': float(amount_to_pay)
                }
            )
            
            return Response({
                'success': True,
                'authorization_url': result['authorization_url'],
                'access_code': result['access_code'],
                'reference': result['reference'],
                'amount': float(amount_to_pay),
                'invoice_number': invoice.invoice_number,
            })
            
        except PaystackError as e:
            return Response(
                {'detail': f'Payment initialization failed: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class PaystackVerifyView(APIView):
    """
    Verify a Paystack transaction (for frontend polling).
    
    GET /api/payments/paystack/verify/{reference}/
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request, reference):
        try:
            client = get_paystack_client()
            result = client.verify_transaction(reference)
            
            # Check if payment record exists
            from billing.models import Payment
            
            payment = Payment.objects.filter(
                provider='paystack',
                provider_reference=reference
            ).first()
            
            response_data = {
                'success': True,
                'reference': reference,
                'status': result.get('status'),
                'amount': result.get('amount'),
                'currency': result.get('currency'),
                'transaction_date': result.get('transaction_date'),
            }
            
            if payment:
                response_data['payment_id'] = str(payment.id)
                response_data['payment_status'] = payment.status
            
            return Response(response_data)
            
        except PaystackError as e:
            return Response(
                {'detail': f'Verification failed: {str(e)}'},
                status=status.HTTP_400_BAD_REQUEST
            )


@method_decorator(csrf_exempt, name='dispatch')
class PaystackWebhookView(APIView):
    """
    Webhook endpoint for Paystack events.
    
    POST /api/payments/paystack/webhook/
    
    Headers:
        X-Paystack-Signature: signature
    """
    permission_classes = []  # No authentication required (signature-based)
    authentication_classes = []
    
    def post(self, request):
        # Get signature from header
        signature = request.META.get('HTTP_X_PAYSTACK_SIGNATURE')
        
        if not signature:
            return HttpResponse('Missing signature', status=400)
        
        # Get raw body
        payload = request.body
        
        try:
            handler = get_webhook_handler()
            result = handler.process_webhook(payload, signature)
            
            return Response(result, status=status.HTTP_200_OK)
            
        except WebhookError as e:
            # Log webhook error
            log_audit(
                user=None,
                action='WEBHOOK_ERROR',
                entity_type='PaystackWebhook',
                entity_id='',
                new_value={'error': str(e)}
            )
            
            return HttpResponse(
                f'Webhook error: {str(e)}',
                status=400
            )
        except Exception as e:
            # Log unexpected error
            log_audit(
                user=None,
                action='WEBHOOK_EXCEPTION',
                entity_type='PaystackWebhook',
                entity_id='',
                new_value={'error': str(e)}
            )
            
            return HttpResponse(
                'Internal server error',
                status=500
            )
