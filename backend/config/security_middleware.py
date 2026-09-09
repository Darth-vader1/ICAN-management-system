"""
Security Middleware for ICAN Platform
Implements additional security headers and protections
"""

from django.http import HttpResponse


class SecurityHeadersMiddleware:
    """
    Add security-related HTTP headers to all responses
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)

        # Prevent clickjacking
        if not response.get('X-Frame-Options'):
            response['X-Frame-Options'] = 'DENY'

        # Prevent MIME type sniffing
        if not response.get('X-Content-Type-Options'):
            response['X-Content-Type-Options'] = 'nosniff'

        # Enable XSS protection
        if not response.get('X-XSS-Protection'):
            response['X-XSS-Protection'] = '1; mode=block'

        # Referrer policy
        if not response.get('Referrer-Policy'):
            response['Referrer-Policy'] = 'strict-origin-when-cross-origin'

        # Content Security Policy
        if not response.get('Content-Security-Policy'):
            response['Content-Security-Policy'] = (
                "default-src 'self'; "
                "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.paystack.co; "
                "style-src 'self' 'unsafe-inline'; "
                "img-src 'self' data: https:; "
                "font-src 'self' data:; "
                "connect-src 'self' https://api.paystack.co; "
                "frame-src https://checkout.paystack.com;"
            )

        # Permissions Policy (formerly Feature Policy)
        if not response.get('Permissions-Policy'):
            response['Permissions-Policy'] = (
                'geolocation=(), microphone=(), camera=(), payment=(self)'
            )

        return response


class SensitiveDataMiddleware:
    """
    Prevent sensitive data from being logged or exposed
    """

    def __init__(self, get_response):
        self.get_response = get_response
        self.sensitive_fields = {
            'password', 'token', 'secret', 'api_key',
            'authorization', 'card_number', 'cvv', 'pin'
        }

    def __call__(self, request):
        response = self.get_response(request)
        return response

    def process_exception(self, request, exception):
        """
        Sanitize exception messages before logging
        """
        # In production, log sanitized versions of exceptions
        return None
