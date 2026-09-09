"""
Paystack webhook handler with signature verification and idempotent payment processing.
"""
import hashlib
import hmac
import json
from decimal import Decimal
from django.conf import settings
from django.db import transaction
from django.utils import timezone
from typing import Dict, Optional

from billing.models import Payment, PaymentStatus, PaymentMethod
from billing.services import BalanceCalculator
from audit.utils import log_audit
from .client import get_paystack_client, PaystackError


class WebhookError(Exception):
    """Base exception for webhook errors"""
    pass


class PaystackWebhookHandler:
    """
    Handler for Paystack webhook events.
    Implements signature verification and idempotent payment processing.
    """
    
    SUPPORTED_EVENTS = [
        'charge.success',
        'charge.failed',
    ]
    
    def __init__(self):
        self.webhook_secret = getattr(settings, 'PAYSTACK_WEBHOOK_SECRET', None)
        if not self.webhook_secret:
            raise WebhookError("PAYSTACK_WEBHOOK_SECRET not configured in settings")
    
    def verify_signature(self, payload: bytes, signature: str) -> bool:
        """
        Verify Paystack webhook signature.
        
        Args:
            payload: Raw request body (bytes)
            signature: X-Paystack-Signature header value
        
        Returns:
            True if signature is valid
        """
        computed_signature = hmac.new(
            self.webhook_secret.encode('utf-8'),
            payload,
            hashlib.sha512
        ).hexdigest()
        
        return hmac.compare_digest(computed_signature, signature)
    
    def parse_event(self, payload: bytes) -> Dict:
        """
        Parse webhook event payload.
        
        Args:
            payload: Raw request body
        
        Returns:
            Parsed event dict
        
        Raises:
            WebhookError: If payload is invalid
        """
        try:
            event = json.loads(payload.decode('utf-8'))
            return event
        except (json.JSONDecodeError, UnicodeDecodeError) as e:
            raise WebhookError(f"Invalid payload: {str(e)}")
    
    @transaction.atomic
    def handle_charge_success(self, event_data: Dict) -> Optional[Payment]:
        """
        Handle successful charge event.
        Creates or updates payment with idempotency on provider_reference.
        
        Args:
            event_data: Event data from webhook
        
        Returns:
            Payment instance or None if already processed
        """
        # Extract transaction details
        reference = event_data.get('reference')
        
        if not reference:
            raise WebhookError("Missing reference in event data")
        
        # Check if payment already exists (idempotency)
        existing_payment = Payment.objects.filter(
            provider='paystack',
            provider_reference=reference
        ).first()
        
        if existing_payment and existing_payment.status == PaymentStatus.SUCCESSFUL:
            # Already processed
            return None
        
        # Verify transaction with Paystack API (independent verification)
        try:
            client = get_paystack_client()
            verified_data = client.verify_transaction(reference)
        except PaystackError as e:
            raise WebhookError(f"Failed to verify transaction: {str(e)}")
        
        # Validate transaction status
        if verified_data.get('status') != 'success':
            raise WebhookError(
                f"Transaction status is not success: {verified_data.get('status')}"
            )
        
        # Convert amount from kobo to naira
        amount_in_kobo = verified_data.get('amount', 0)
        amount = Decimal(str(amount_in_kobo)) / 100
        
        # Get customer email
        customer_email = verified_data.get('customer', {}).get('email')
        
        if not customer_email:
            raise WebhookError("Missing customer email in transaction data")
        
        # Find student by email
        from students.models import StudentProfile
        
        try:
            student = StudentProfile.objects.select_related('user').get(
                user__email=customer_email
            )
        except StudentProfile.DoesNotExist:
            raise WebhookError(f"Student not found with email: {customer_email}")
        
        # Extract metadata
        metadata = verified_data.get('metadata', {})
        invoice_id = metadata.get('invoice_id')
        
        # Get invoice if specified
        invoice = None
        if invoice_id:
            from billing.models import Invoice
            
            try:
                invoice = Invoice.objects.get(id=invoice_id, student=student)
            except Invoice.DoesNotExist:
                # Log but don't fail - payment can be allocated later
                pass
        
        # Create or update payment
        if existing_payment:
            payment = existing_payment
            payment.status = PaymentStatus.SUCCESSFUL
            payment.verified_at = timezone.now()
            payment.metadata = {
                **payment.metadata,
                'verified_data': verified_data,
                'webhook_event': 'charge.success'
            }
            payment.save()
        else:
            payment = Payment.objects.create(
                student=student,
                invoice=invoice,
                amount=amount,
                currency='NGN',
                method=PaymentMethod.PAYSTACK,
                provider='paystack',
                provider_reference=reference,
                status=PaymentStatus.SUCCESSFUL,
                transaction_date=timezone.now(),
                verified_at=timezone.now(),
                metadata={
                    'verified_data': verified_data,
                    'webhook_event': 'charge.success',
                    'channel': verified_data.get('channel'),
                    'gateway_response': verified_data.get('gateway_response'),
                }
            )
        
        # Log audit
        log_audit(
            user=None,  # System action
            action='PAYSTACK_WEBHOOK',
            entity_type='Payment',
            entity_id=str(payment.id),
            new_value={
                'reference': reference,
                'amount': float(amount),
                'status': 'successful'
            }
        )
        
        # Auto-allocate payment to invoice if specified
        if invoice:
            try:
                BalanceCalculator.allocate_payment_to_invoice(
                    payment=payment,
                    invoice=invoice,
                    allocated_by=None  # System allocation
                )
            except Exception as e:
                # Log error but don't fail the webhook
                # Payment is recorded, allocation can be done manually
                log_audit(
                    user=None,
                    action='ALLOCATION_FAILED',
                    entity_type='Payment',
                    entity_id=str(payment.id),
                    new_value={'error': str(e)}
                )
        
        # TODO: Queue email notification task
        # from notifications.tasks import send_payment_receipt
        # send_payment_receipt.delay(payment.id)
        
        return payment
    
    @transaction.atomic
    def handle_charge_failed(self, event_data: Dict) -> Optional[Payment]:
        """
        Handle failed charge event.
        
        Args:
            event_data: Event data from webhook
        
        Returns:
            Payment instance or None if already processed
        """
        reference = event_data.get('reference')
        
        if not reference:
            raise WebhookError("Missing reference in event data")
        
        # Check if payment already exists
        existing_payment = Payment.objects.filter(
            provider='paystack',
            provider_reference=reference
        ).first()
        
        if existing_payment and existing_payment.status == PaymentStatus.FAILED:
            # Already processed
            return None
        
        # Get customer email
        customer_email = event_data.get('customer', {}).get('email')
        
        if not customer_email:
            raise WebhookError("Missing customer email in event data")
        
        # Find student
        from students.models import StudentProfile
        
        try:
            student = StudentProfile.objects.select_related('user').get(
                user__email=customer_email
            )
        except StudentProfile.DoesNotExist:
            raise WebhookError(f"Student not found with email: {customer_email}")
        
        # Convert amount
        amount_in_kobo = event_data.get('amount', 0)
        amount = Decimal(str(amount_in_kobo)) / 100
        
        # Create or update payment
        if existing_payment:
            payment = existing_payment
            payment.status = PaymentStatus.FAILED
            payment.metadata = {
                **payment.metadata,
                'webhook_event': 'charge.failed',
                'failure_reason': event_data.get('gateway_response')
            }
            payment.save()
        else:
            payment = Payment.objects.create(
                student=student,
                amount=amount,
                currency='NGN',
                method=PaymentMethod.PAYSTACK,
                provider='paystack',
                provider_reference=reference,
                status=PaymentStatus.FAILED,
                transaction_date=timezone.now(),
                metadata={
                    'webhook_event': 'charge.failed',
                    'failure_reason': event_data.get('gateway_response')
                }
            )
        
        # Log audit
        log_audit(
            user=None,
            action='PAYSTACK_WEBHOOK',
            entity_type='Payment',
            entity_id=str(payment.id),
            new_value={
                'reference': reference,
                'amount': float(amount),
                'status': 'failed'
            }
        )
        
        return payment
    
    def handle_event(self, event: Dict) -> Optional[Payment]:
        """
        Route event to appropriate handler.
        
        Args:
            event: Parsed webhook event
        
        Returns:
            Payment instance or None
        
        Raises:
            WebhookError: If event type is not supported
        """
        event_type = event.get('event')
        
        if event_type not in self.SUPPORTED_EVENTS:
            raise WebhookError(f"Unsupported event type: {event_type}")
        
        event_data = event.get('data', {})
        
        if event_type == 'charge.success':
            return self.handle_charge_success(event_data)
        elif event_type == 'charge.failed':
            return self.handle_charge_failed(event_data)
        
        return None
    
    def process_webhook(self, payload: bytes, signature: str) -> Dict:
        """
        Main entry point for webhook processing.
        Verifies signature and processes event.
        
        Args:
            payload: Raw request body (bytes)
            signature: X-Paystack-Signature header value
        
        Returns:
            Dict with success status and message
        
        Raises:
            WebhookError: If processing fails
        """
        # Verify signature
        if not self.verify_signature(payload, signature):
            raise WebhookError("Invalid signature")
        
        # Parse event
        event = self.parse_event(payload)
        
        # Handle event
        payment = self.handle_event(event)
        
        if payment:
            return {
                'success': True,
                'message': 'Webhook processed successfully',
                'payment_id': str(payment.id),
                'status': payment.status
            }
        else:
            return {
                'success': True,
                'message': 'Event already processed (idempotent)',
            }


# Singleton instance
_webhook_handler = None


def get_webhook_handler() -> PaystackWebhookHandler:
    """
    Get or create webhook handler singleton.
    
    Returns:
        PaystackWebhookHandler instance
    """
    global _webhook_handler
    
    if _webhook_handler is None:
        _webhook_handler = PaystackWebhookHandler()
    
    return _webhook_handler
