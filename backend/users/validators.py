"""
Custom Validators for ICAN Platform
Provides enhanced input validation and sanitization
"""

import re
from django.core.exceptions import ValidationError
from django.core.validators import RegexValidator
from decimal import Decimal, InvalidOperation


class StrongPasswordValidator:
    """
    Validates that password meets strong security requirements
    """

    def validate(self, password, user=None):
        if len(password) < 8:
            raise ValidationError('Password must be at least 8 characters long.')

        if not re.search(r'[A-Z]', password):
            raise ValidationError('Password must contain at least one uppercase letter.')

        if not re.search(r'[a-z]', password):
            raise ValidationError('Password must contain at least one lowercase letter.')

        if not re.search(r'\d', password):
            raise ValidationError('Password must contain at least one digit.')

        if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
            raise ValidationError('Password must contain at least one special character.')

        # Check for common passwords
        common_passwords = ['password', '12345678', 'qwerty', 'admin123']
        if password.lower() in common_passwords:
            raise ValidationError('This password is too common.')

    def get_help_text(self):
        return (
            'Your password must contain at least 8 characters, including uppercase, '
            'lowercase, numbers, and special characters.'
        )


def validate_phone_number(value):
    """
    Validates Nigerian phone number format
    """
    phone_regex = r'^(\+?234|0)[789]\d{9}$'
    validator = RegexValidator(
        regex=phone_regex,
        message='Enter a valid Nigerian phone number (e.g., 08012345678 or +2348012345678)'
    )
    validator(value)


def validate_student_id(value):
    """
    Validates student ID format
    """
    if not re.match(r'^ICAN-\d{6}$', value):
        raise ValidationError(
            'Student ID must be in format ICAN-XXXXXX (e.g., ICAN-000001)'
        )


def validate_invoice_number(value):
    """
    Validates invoice number format
    """
    if not re.match(r'^INV-\d{4}-\d{6}$', value):
        raise ValidationError(
            'Invoice number must be in format INV-YYYY-NNNNNN'
        )


def validate_payment_amount(value):
    """
    Validates payment amount is positive and reasonable
    """
    try:
        amount = Decimal(str(value))
    except (ValueError, InvalidOperation):
        raise ValidationError('Invalid amount format.')

    if amount <= 0:
        raise ValidationError('Amount must be greater than zero.')

    if amount > Decimal('10000000'):  # 10 million naira max
        raise ValidationError('Amount exceeds maximum allowed (₦10,000,000).')


def sanitize_html_input(value):
    """
    Sanitizes HTML input to prevent XSS attacks
    """
    if not value:
        return value

    # Remove dangerous HTML tags
    dangerous_tags = ['script', 'iframe', 'object', 'embed', 'link']
    for tag in dangerous_tags:
        value = re.sub(
            rf'<{tag}[^>]*>.*?</{tag}>',
            '',
            value,
            flags=re.IGNORECASE | re.DOTALL
        )

    # Remove event handlers
    value = re.sub(r'on\w+\s*=\s*["\'][^"\']*["\']', '', value, flags=re.IGNORECASE)

    return value


def validate_email_domain(email):
    """
    Validates that email domain is not from temporary email services
    """
    temp_domains = [
        'tempmail.com', 'guerrillamail.com', '10minutemail.com',
        'mailinator.com', 'throwaway.email'
    ]

    domain = email.split('@')[1].lower() if '@' in email else ''
    if domain in temp_domains:
        raise ValidationError('Temporary email addresses are not allowed.')


def validate_file_extension(value, allowed_extensions):
    """
    Validates uploaded file extension
    """
    import os
    ext = os.path.splitext(value.name)[1].lower()
    if ext not in allowed_extensions:
        raise ValidationError(
            f'File extension {ext} is not allowed. '
            f'Allowed extensions: {", ".join(allowed_extensions)}'
        )


def validate_file_size(value, max_size_mb=5):
    """
    Validates uploaded file size
    """
    filesize = value.size
    max_size_bytes = max_size_mb * 1024 * 1024

    if filesize > max_size_bytes:
        raise ValidationError(
            f'File size exceeds maximum allowed ({max_size_mb}MB). '
            f'Your file is {filesize / (1024 * 1024):.2f}MB.'
        )
