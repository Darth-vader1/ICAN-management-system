"""
Custom Exception Handlers for ICAN Platform
Provides consistent error responses and logging
"""

import logging
from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status
from django.core.exceptions import ValidationError, PermissionDenied
from django.http import Http404

logger = logging.getLogger(__name__)


def custom_exception_handler(exc, context):
    """
    Custom exception handler that provides consistent error responses
    """
    # Call DRF's default exception handler first
    response = exception_handler(exc, context)

    # If DRF didn't handle it, handle it ourselves
    if response is None:
        if isinstance(exc, ValidationError):
            return handle_validation_error(exc, context)
        elif isinstance(exc, PermissionDenied):
            return handle_permission_denied(exc, context)
        elif isinstance(exc, Http404):
            return handle_not_found(exc, context)
        else:
            return handle_unexpected_error(exc, context)

    # Add custom error code and additional context
    if response is not None:
        response.data = format_error_response(
            response.data,
            exc,
            context
        )

    # Log the error
    log_exception(exc, context, response)

    return response


def format_error_response(data, exc, context):
    """
    Format error response with consistent structure
    """
    error_code = getattr(exc, 'error_code', 'ERROR')
    error_type = exc.__class__.__name__

    formatted_response = {
        'error': True,
        'error_code': error_code,
        'error_type': error_type,
        'message': get_error_message(data),
        'details': get_error_details(data),
    }

    # Add request context in debug mode
    request = context.get('request')
    if request and hasattr(request, 'user') and request.user.is_staff:
        formatted_response['debug_info'] = {
            'path': request.path,
            'method': request.method,
            'user': str(request.user),
        }

    return formatted_response


def get_error_message(data):
    """
    Extract main error message from error data
    """
    if isinstance(data, dict):
        if 'detail' in data:
            return str(data['detail'])
        elif 'message' in data:
            return str(data['message'])
        else:
            # Get first error message
            for key, value in data.items():
                if isinstance(value, list) and len(value) > 0:
                    return str(value[0])
                elif isinstance(value, str):
                    return value
    elif isinstance(data, list) and len(data) > 0:
        return str(data[0])
    elif isinstance(data, str):
        return data

    return 'An error occurred'


def get_error_details(data):
    """
    Extract detailed error information
    """
    if isinstance(data, dict):
        # Remove 'detail' as it's in the main message
        details = {k: v for k, v in data.items() if k != 'detail'}
        return details if details else None
    return None


def handle_validation_error(exc, context):
    """
    Handle Django ValidationError
    """
    return Response(
        {
            'error': True,
            'error_code': 'VALIDATION_ERROR',
            'error_type': 'ValidationError',
            'message': str(exc),
            'details': None,
        },
        status=status.HTTP_400_BAD_REQUEST
    )


def handle_permission_denied(exc, context):
    """
    Handle PermissionDenied exceptions
    """
    return Response(
        {
            'error': True,
            'error_code': 'PERMISSION_DENIED',
            'error_type': 'PermissionDenied',
            'message': str(exc) or 'You do not have permission to perform this action.',
            'details': None,
        },
        status=status.HTTP_403_FORBIDDEN
    )


def handle_not_found(exc, context):
    """
    Handle 404 Not Found errors
    """
    return Response(
        {
            'error': True,
            'error_code': 'NOT_FOUND',
            'error_type': 'NotFound',
            'message': 'The requested resource was not found.',
            'details': None,
        },
        status=status.HTTP_404_NOT_FOUND
    )


def handle_unexpected_error(exc, context):
    """
    Handle unexpected errors (500)
    """
    logger.exception('Unexpected error occurred', exc_info=exc)

    return Response(
        {
            'error': True,
            'error_code': 'INTERNAL_ERROR',
            'error_type': 'InternalServerError',
            'message': 'An unexpected error occurred. Please try again later.',
            'details': None,
        },
        status=status.HTTP_500_INTERNAL_SERVER_ERROR
    )


def log_exception(exc, context, response):
    """
    Log exception with context
    """
    request = context.get('request')
    view = context.get('view')

    log_data = {
        'exception_type': exc.__class__.__name__,
        'exception_message': str(exc),
        'view': view.__class__.__name__ if view else None,
        'path': request.path if request else None,
        'method': request.method if request else None,
        'user': str(request.user) if request and hasattr(request, 'user') else None,
        'status_code': response.status_code if response else None,
    }

    # Log at appropriate level
    if response and response.status_code >= 500:
        logger.error('Server error occurred', extra=log_data, exc_info=exc)
    elif response and response.status_code >= 400:
        logger.warning('Client error occurred', extra=log_data)
    else:
        logger.info('Exception handled', extra=log_data)
