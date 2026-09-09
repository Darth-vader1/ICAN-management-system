"""
Rate Limiting Decorators for ICAN Platform
Protects endpoints from abuse
"""

from functools import wraps
from django_ratelimit.decorators import ratelimit
from rest_framework.response import Response
from rest_framework import status


def rate_limit_view(rate='5/m', method='POST', key='ip'):
    """
    Custom rate limit decorator for DRF views
    
    Args:
        rate: Rate limit (e.g., '5/m' = 5 requests per minute)
        method: HTTP method to rate limit
        key: What to key on ('ip', 'user', or callable)
    """
    def decorator(view_func):
        @wraps(view_func)
        @ratelimit(key=key, rate=rate, method=method, block=True)
        def wrapped_view(request, *args, **kwargs):
            was_limited = getattr(request, 'limited', False)
            if was_limited:
                return Response(
                    {
                        'detail': 'Too many requests. Please try again later.',
                        'error_code': 'RATE_LIMIT_EXCEEDED'
                    },
                    status=status.HTTP_429_TOO_MANY_REQUESTS
                )
            return view_func(request, *args, **kwargs)
        return wrapped_view
    return decorator


# Pre-configured decorators for common use cases

def login_rate_limit(view_func):
    """Rate limit login attempts: 5 per minute per IP"""
    return rate_limit_view(rate='5/m', method='POST', key='ip')(view_func)


def registration_rate_limit(view_func):
    """Rate limit registrations: 3 per hour per IP"""
    return rate_limit_view(rate='3/h', method='POST', key='ip')(view_func)


def payment_rate_limit(view_func):
    """Rate limit payment initialization: 10 per minute per user"""
    return rate_limit_view(rate='10/m', method='POST', key='user_or_ip')(view_func)


def api_rate_limit(view_func):
    """Rate limit general API calls: 60 per minute per user"""
    return rate_limit_view(rate='60/m', method='ALL', key='user_or_ip')(view_func)


def strict_rate_limit(view_func):
    """Strict rate limit for sensitive operations: 3 per hour"""
    return rate_limit_view(rate='3/h', method='ALL', key='user_or_ip')(view_func)
