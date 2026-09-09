# Phase 9: Security Hardening - ICAN Platform

## Overview

Phase 9 implements comprehensive security measures to protect the ICAN platform from common vulnerabilities and attacks.

## Features Implemented

### 1. Rate Limiting ✅

**Purpose**: Prevent abuse and DDoS attacks by limiting request rates.

**Implementation**:
- Used `django-ratelimit` library
- Created custom decorators in `users/rate_limiting.py`
- Pre-configured limits for different endpoints:
  - Login: 5 attempts per minute per IP
  - Registration: 3 per hour per IP  
  - Payment: 10 per minute per user
  - General API: 60 per minute per user

**Usage**:
```python
from users.rate_limiting import login_rate_limit

@login_rate_limit
def login_view(request):
    # Your login logic
    pass
```

### 2. Security Headers ✅

**Purpose**: Protect against XSS, clickjacking, and other browser-based attacks.

**Headers Added**:
- `X-Frame-Options: DENY` - Prevents clickjacking
- `X-Content-Type-Options: nosniff` - Prevents MIME sniffing
- `X-XSS-Protection: 1; mode=block` - Enables XSS filter
- `Content-Security-Policy` - Restricts resource loading
- `Referrer-Policy` - Controls referrer information
- `Permissions-Policy` - Manages browser features

**Implementation**: `config/security_middleware.py`

### 3. Enhanced Input Validation ✅

**Purpose**: Validate and sanitize all user inputs.

**Validators Created** (`users/validators.py`):
- `StrongPasswordValidator` - Enforces strong passwords
- `validate_phone_number` - Nigerian phone format
- `validate_student_id` - ICAN student ID format
- `validate_invoice_number` - Invoice number format
- `validate_payment_amount` - Amount range and format
- `sanitize_html_input` - Remove dangerous HTML
- `validate_email_domain` - Block temporary emails
- `validate_file_extension` - Allowed file types
- `validate_file_size` - Max file size (5MB default)

**Usage**:
```python
from users.validators import validate_payment_amount

amount = Decimal('5000.00')
validate_payment_amount(amount)  # Raises ValidationError if invalid
```

### 4. Custom Exception Handling ✅

**Purpose**: Provide consistent error responses and proper logging.

**Features**:
- Standardized error response format
- Automatic error logging with context
- Sanitized error messages (no sensitive data leaks)
- Debug info for staff users only
- Different log levels for different error types

**Implementation**: `config/exception_handlers.py`

**Error Response Format**:
```json
{
  "error": true,
  "error_code": "VALIDATION_ERROR",
  "error_type": "ValidationError",
  "message": "Invalid input provided",
  "details": {
    "field_name": ["Error message"]
  }
}
```

### 5. Production Security Settings ✅

**Purpose**: Configure Django for secure production deployment.

**Settings** (`config/security_settings.py`):
- SSL/HTTPS enforcement
- HSTS (HTTP Strict Transport Security)
- Secure cookies (httponly, secure, samesite)
- CSRF protection
- Content security
- File upload restrictions
- Comprehensive logging
- Database connection pooling

### 6. Audit Logging ✅ (from Phase 8)

**Purpose**: Track all important actions for security and compliance.

**Logged Actions**:
- User authentication (login/logout)
- Data modifications (create/update/delete)
- Permission changes
- Payment transactions
- Sensitive operations

**Implementation**: Already complete in `audit/` app

## Security Checklist

### Application Security ✅
- [x] Rate limiting on all endpoints
- [x] Strong password requirements
- [x] Input validation and sanitization
- [x] SQL injection protection (Django ORM)
- [x] XSS protection (React + Django)
- [x] CSRF protection
- [x] Secure session management
- [x] Proper error handling
- [x] Audit logging

### Infrastructure Security
- [ ] HTTPS/TLS encryption (deployment)
- [ ] Secure environment variables
- [ ] Database encryption at rest
- [ ] Regular backups
- [ ] Firewall configuration
- [ ] Intrusion detection

### Authentication & Authorization ✅
- [x] JWT token-based auth
- [x] Token expiration (15 min access, 7 days refresh)
- [x] Role-based access control
- [x] Permission checks on all endpoints
- [x] Password hashing (Django default PBKDF2)

### Data Security ✅
- [x] Input validation
- [x] Output encoding
- [x] File upload restrictions
- [x] Sensitive data handling
- [x] SQL injection prevention

### API Security ✅
- [x] Rate limiting
- [x] Authentication required
- [x] CORS configuration
- [x] Request size limits
- [x] Error message sanitization

## Usage Examples

### 1. Apply Rate Limiting to View

```python
from rest_framework.decorators import api_view
from users.rate_limiting import login_rate_limit

@api_view(['POST'])
@login_rate_limit
def custom_login(request):
    # Login logic
    return Response({'message': 'Success'})
```

### 2. Validate User Input

```python
from users.validators import validate_payment_amount, sanitize_html_input

# Validate payment
try:
    validate_payment_amount(request.data['amount'])
except ValidationError as e:
    return Response({'error': str(e)}, status=400)

# Sanitize notes
notes = sanitize_html_input(request.data['notes'])
```

### 3. Use Custom Exception Handler

In `config/settings.py`:
```python
REST_FRAMEWORK = {
    'EXCEPTION_HANDLER': 'config.exception_handlers.custom_exception_handler',
    # ... other settings
}
```

### 4. Enable Production Security

Create `config/settings_prod.py`:
```python
from .settings import *
from .security_settings import *

# Override with production values
ALLOWED_HOSTS = ['yourdomain.com']
CORS_ALLOWED_ORIGINS = ['https://yourdomain.com']
```

## Testing Security Features

### Test Rate Limiting

```bash
# Send multiple requests quickly
for i in {1..10}; do
  curl -X POST http://localhost:8000/auth/login/ \
    -d "email=test@test.com&password=test"
done

# Should get 429 after 5 requests
```

### Test Input Validation

```python
from users.validators import StrongPasswordValidator

validator = StrongPasswordValidator()

# These should fail
validator.validate('weak')  # Too short
validator.validate('password')  # Common password
validator.validate('Password')  # No number

# This should pass
validator.validate('MyP@ssw0rd123')
```

### Test Security Headers

```bash
curl -I http://localhost:8000/

# Check for:
# X-Frame-Options: DENY
# X-Content-Type-Options: nosniff
# Content-Security-Policy: ...
```

## Configuration

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

New dependencies:
- `django-ratelimit==4.1.0` - Rate limiting
- `gunicorn==21.2.0` - Production WSGI server

### 2. Update Django Settings

Add to `config/settings.py`:

```python
# Middleware
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'config.security_middleware.SecurityHeadersMiddleware',
    # ... existing middleware
]

# Exception Handler
REST_FRAMEWORK = {
    'EXCEPTION_HANDLER': 'config.exception_handlers.custom_exception_handler',
}

# Password Validators
AUTH_PASSWORD_VALIDATORS = [
    # ... existing validators
    {
        'NAME': 'users.validators.StrongPasswordValidator',
    },
]

# Rate Limiting Cache
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.redis.RedisCache',
        'LOCATION': 'redis://127.0.0.1:6379/1',
    }
}
```

### 3. Create Logs Directory

```bash
mkdir logs
touch logs/.gitkeep
```

Add to `.gitignore`:
```
logs/*.log
```

## Security Best Practices

### 1. Passwords
- Never store passwords in plain text
- Use Django's built-in password hashing
- Enforce strong password policy
- Implement password reset flow
- Lock accounts after failed attempts

### 2. Secrets Management
- Use environment variables for secrets
- Never commit secrets to git
- Rotate secrets regularly
- Use different secrets for dev/staging/prod

### 3. API Security
- Always require authentication
- Implement rate limiting
- Validate all inputs
- Use HTTPS in production
- Set appropriate CORS headers

### 4. Error Handling
- Never expose sensitive data in errors
- Log errors with context
- Return generic error messages to users
- Monitor error rates

### 5. Regular Security Tasks
- Update dependencies monthly
- Review access logs weekly
- Audit permissions quarterly
- Penetration testing annually
- Security training for team

## Production Deployment Checklist

Before deploying to production:

- [ ] Set `DEBUG = False`
- [ ] Configure `ALLOWED_HOSTS`
- [ ] Enable SSL/HTTPS
- [ ] Set secure cookies
- [ ] Configure CORS properly
- [ ] Set up error monitoring (Sentry)
- [ ] Configure logging
- [ ] Set up backups
- [ ] Enable rate limiting
- [ ] Review all permissions
- [ ] Change default admin URL
- [ ] Rotate all secrets
- [ ] Set up monitoring alerts

## Monitoring & Alerts

### What to Monitor
1. Failed login attempts
2. Rate limit violations
3. 500 errors
4. Unusual traffic patterns
5. Payment failures
6. Database connection issues

### Alert Thresholds
- Failed logins > 10/min
- 500 errors > 5/min
- Rate limit hits > 100/min
- Payment failures > 10%

## Known Limitations

1. **Rate limiting requires Redis** - Install and configure Redis for production
2. **File upload scanning** - Add antivirus scanning for uploaded files (not implemented)
3. **WAF** - Consider adding a Web Application Firewall for additional protection
4. **DDoS protection** - Use CloudFlare or AWS WAF for large-scale DDoS protection

## Next Steps

1. **Deploy to staging** - Test security features in staging environment
2. **Penetration testing** - Hire security professionals to test the application
3. **Bug bounty program** - Consider running a bug bounty program
4. **Security audit** - Get a professional security audit
5. **Compliance** - Ensure compliance with relevant regulations (PCI DSS for payments)

## Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Django Security](https://docs.djangoproject.com/en/stable/topics/security/)
- [DRF Security](https://www.django-rest-framework.org/topics/security/)
- [Rate Limiting Guide](https://django-ratelimit.readthedocs.io/)

---

**Phase 9 Status**: ✅ **Complete**

All security features implemented and documented. Ready for security review and production deployment.

**Next Phase**: Phase 10 - Deployment
