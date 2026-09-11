"""
Paystack API client for payment initialization and verification.
"""
import requests
from decimal import Decimal
from django.conf import settings
from typing import Dict, Optional


class PaystackError(Exception):
    """Base exception for Paystack errors"""
    pass


class PaystackClient:
    """
    Client for Paystack API integration.
    Handles payment initialization and verification.
    """
    
    BASE_URL = "https://api.paystack.co"
    
    def __init__(self):
        self.secret_key = getattr(settings, 'PAYSTACK_SECRET_KEY', None)
        self.public_key = getattr(settings, 'PAYSTACK_PUBLIC_KEY', None)
        
        # Debug logging
        import logging
        logger = logging.getLogger(__name__)
        logger.info(f"PaystackClient initialized with secret_key={'SET' if self.secret_key else 'NOT SET'}, public_key={'SET' if self.public_key else 'NOT SET'}")
        
        if not self.secret_key:
            raise PaystackError("PAYSTACK_SECRET_KEY not configured in settings")
        
        if len(self.secret_key) < 10:
            logger.warning(f"PAYSTACK_SECRET_KEY seems too short: {len(self.secret_key)} chars")
        
        if not self.secret_key.startswith('sk_'):
            logger.warning(f"PAYSTACK_SECRET_KEY doesn't start with 'sk_': {self.secret_key[:10]}...")
    
    def _get_headers(self) -> Dict[str, str]:
        """Get headers for Paystack API requests"""
        return {
            'Authorization': f'Bearer {self.secret_key}',
            'Content-Type': 'application/json',
        }
    
    def _make_request(
        self,
        method: str,
        endpoint: str,
        data: Optional[Dict] = None
    ) -> Dict:
        """
        Make HTTP request to Paystack API.
        
        Args:
            method: HTTP method (GET, POST, etc.)
            endpoint: API endpoint (without base URL)
            data: Request payload
        
        Returns:
            Response data dict
        
        Raises:
            PaystackError: If request fails
        """
        url = f"{self.BASE_URL}{endpoint}"
        headers = self._get_headers()
        
        try:
            if method.upper() == 'GET':
                response = requests.get(url, headers=headers, params=data, timeout=30)
            elif method.upper() == 'POST':
                response = requests.post(url, headers=headers, json=data, timeout=30)
            else:
                raise PaystackError(f"Unsupported HTTP method: {method}")
            
            # Log response for debugging
            import logging
            logger = logging.getLogger(__name__)
            logger.info(f"Paystack {method} {endpoint}: status={response.status_code}")
            
            response.raise_for_status()
            
            result = response.json()
            
            if not result.get('status'):
                error_message = result.get('message', 'Unknown Paystack error')
                logger.error(f"Paystack API error: {error_message}")
                raise PaystackError(error_message)
            
            return result.get('data', {})
            
        except requests.exceptions.RequestException as e:
            import logging
            logger = logging.getLogger(__name__)
            
            # Try to extract error message from response
            try:
                if hasattr(e, 'response') and e.response is not None:
                    error_data = e.response.json()
                    error_message = error_data.get('message', str(e))
                    logger.error(f"Paystack request failed: {error_message}")
                    raise PaystackError(error_message)
            except:
                pass
            
            logger.error(f"Paystack request exception: {str(e)}")
            raise PaystackError(f"Request failed: {str(e)}")
        except ValueError as e:
            raise PaystackError(f"Invalid JSON response: {str(e)}")
    
    def initialize_transaction(
        self,
        email: str,
        amount: Decimal,
        reference: str,
        callback_url: Optional[str] = None,
        metadata: Optional[Dict] = None
    ) -> Dict:
        """
        Initialize a payment transaction.
        
        Args:
            email: Customer email
            amount: Amount in major currency unit (e.g., NGN, not kobo)
            reference: Unique transaction reference
            callback_url: URL to redirect after payment
            metadata: Additional transaction metadata
        
        Returns:
            Dict with authorization_url, access_code, reference
        
        Example:
            {
                'authorization_url': 'https://checkout.paystack.com/...',
                'access_code': 'xyz123',
                'reference': 'INV-2024-...'
            }
        """
        # Convert amount to kobo (Paystack uses minor currency unit)
        amount_in_kobo = int(amount * 100)
        
        payload = {
            'email': email,
            'amount': amount_in_kobo,
            'reference': reference,
            'currency': 'NGN',
        }
        
        if callback_url:
            payload['callback_url'] = callback_url
        
        if metadata:
            payload['metadata'] = metadata
        
        try:
            data = self._make_request('POST', '/transaction/initialize', payload)
            
            return {
                'authorization_url': data.get('authorization_url'),
                'access_code': data.get('access_code'),
                'reference': data.get('reference'),
            }
        except PaystackError as e:
            raise PaystackError(f"Failed to initialize transaction: {str(e)}")
    
    def verify_transaction(self, reference: str) -> Dict:
        """
        Verify a transaction.
        
        Args:
            reference: Transaction reference to verify
        
        Returns:
            Dict with transaction details
        
        Example:
            {
                'id': 123456789,
                'status': 'success',
                'reference': 'INV-2024-...',
                'amount': 50000,  # in kobo
                'currency': 'NGN',
                'transaction_date': '2024-01-01T12:00:00.000Z',
                'customer': {'email': 'student@example.com'},
                'metadata': {...}
            }
        """
        try:
            data = self._make_request('GET', f'/transaction/verify/{reference}')
            
            return {
                'id': data.get('id'),
                'status': data.get('status'),
                'reference': data.get('reference'),
                'amount': data.get('amount'),  # in kobo
                'currency': data.get('currency'),
                'transaction_date': data.get('transaction_date') or data.get('paid_at'),
                'customer': data.get('customer', {}),
                'metadata': data.get('metadata', {}),
                'channel': data.get('channel'),
                'gateway_response': data.get('gateway_response'),
            }
        except PaystackError as e:
            raise PaystackError(f"Failed to verify transaction: {str(e)}")
    
    def get_transaction(self, transaction_id: int) -> Dict:
        """
        Get transaction details by ID.
        
        Args:
            transaction_id: Paystack transaction ID
        
        Returns:
            Dict with transaction details
        """
        try:
            data = self._make_request('GET', f'/transaction/{transaction_id}')
            return data
        except PaystackError as e:
            raise PaystackError(f"Failed to get transaction: {str(e)}")
    
    def list_transactions(
        self,
        per_page: int = 50,
        page: int = 1,
        customer: Optional[str] = None,
        status: Optional[str] = None,
        from_date: Optional[str] = None,
        to_date: Optional[str] = None
    ) -> Dict:
        """
        List transactions with filters.
        
        Args:
            per_page: Results per page (default: 50, max: 100)
            page: Page number
            customer: Filter by customer ID
            status: Filter by status (success, failed, abandoned)
            from_date: Start date (YYYY-MM-DD)
            to_date: End date (YYYY-MM-DD)
        
        Returns:
            Dict with transactions list and pagination info
        """
        params = {
            'perPage': per_page,
            'page': page,
        }
        
        if customer:
            params['customer'] = customer
        if status:
            params['status'] = status
        if from_date:
            params['from'] = from_date
        if to_date:
            params['to'] = to_date
        
        try:
            data = self._make_request('GET', '/transaction', params)
            return data
        except PaystackError as e:
            raise PaystackError(f"Failed to list transactions: {str(e)}")


# Singleton instance
_paystack_client = None


def get_paystack_client() -> PaystackClient:
    """
    Get or create Paystack client singleton.
    
    Returns:
        PaystackClient instance
    """
    global _paystack_client
    
    if _paystack_client is None:
        _paystack_client = PaystackClient()
    
    return _paystack_client
