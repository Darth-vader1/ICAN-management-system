# Email Integration Guide

Complete guide for the ICAN Management System email functionality.

## 📧 Overview

The system uses professional HTML email templates for all student communications. Emails are sent via configurable providers (Resend, SendGrid, Amazon SES, or Console for development).

## 🎨 Available Email Templates

### 1. Welcome Email
**Trigger:** New student registration  
**Template:** `templates/emails/welcome.html`  
**Function:** `send_welcome_email(student=student_profile)`

**Example:**
```python
from utils.email import send_welcome_email
from students.models import StudentProfile

student = StudentProfile.objects.get(student_code='STU2024001')
send_welcome_email(student=student)
```

### 2. Payment Receipt
**Trigger:** Successful payment verification  
**Template:** `templates/emails/payment_receipt.html`  
**Function:** `send_payment_receipt_email(payment=payment, invoice=invoice)`

**Auto-sent:** ✅ Automatically sent after payment verification in `PaystackVerifyView`

**Example:**
```python
from utils.email import send_payment_receipt_email
from billing.models import Payment, Invoice

payment = Payment.objects.get(id='...')
invoice = Invoice.objects.get(id='...')
send_payment_receipt_email(payment=payment, invoice=invoice)
```

### 3. Invoice Generated
**Trigger:** New invoice creation  
**Template:** `templates/emails/invoice_generated.html`  
**Function:** `send_invoice_email(invoice=invoice)`

**Example:**
```python
from utils.email import send_invoice_email
from billing.models import Invoice

invoice = Invoice.objects.get(invoice_number='INV-2024-001')
send_invoice_email(invoice=invoice)
```

### 4. Password Reset
**Trigger:** User requests password reset  
**Template:** `templates/emails/password_reset.html`  
**Function:** `send_password_reset_email(user=user, reset_url=url)`

**Example:**
```python
from utils.email import send_password_reset_email
from users.models import User

user = User.objects.get(email='user@example.com')
reset_url = 'https://portal.ican.edu.ng/reset?token=abc123'
send_password_reset_email(user=user, reset_url=reset_url)
```

### 5. Attendance Alert
**Trigger:** Attendance falls below threshold  
**Template:** `templates/emails/attendance_alert.html`  
**Function:** `send_attendance_alert_email(student=student, attendance_data=data)`

**Example:**
```python
from utils.email import send_attendance_alert_email
from students.models import StudentProfile

student = StudentProfile.objects.get(student_code='STU2024001')
attendance_data = {
    'attendance_rate': 68,
    'total_classes': 25,
    'classes_attended': 17,
    'classes_missed': 8,
    'at_risk_courses': [
        {'code': 'FN101', 'name': 'Financial Accounting', 'rate': 65},
    ]
}
send_attendance_alert_email(student=student, attendance_data=attendance_data)
```

### 6. Class Reminder
**Trigger:** Upcoming class (typically 24h before)  
**Template:** `templates/emails/class_reminder.html`  
**Function:** `send_class_reminder_email(students=students, class_session=session)`

**Example:**
```python
from utils.email import send_class_reminder_email
from students.models import StudentProfile
from attendance.models import ClassSession

students = StudentProfile.objects.filter(level='foundation')
class_session = ClassSession.objects.get(id='...')
sent_count = send_class_reminder_email(students=students, class_session=class_session)
print(f"Sent {sent_count} reminders")
```

## ⚙️ Configuration

### Environment Variables

Add to `backend/.env`:

```env
# Email Provider Selection
EMAIL_PROVIDER=console  # Options: console, resend, sendgrid, ses
DEFAULT_FROM_EMAIL=noreply@icantutorial.edu

# Portal URLs (for email links)
PORTAL_URL=http://localhost:5173
SUPPORT_URL=http://localhost:5173/support
PRIVACY_URL=http://localhost:5173/privacy

# Resend (if using)
RESEND_API_KEY=re_xxxxxxxxxxxx

# SendGrid (if using)
SENDGRID_API_KEY=SG.xxxxxxxxxxxx

# Amazon SES (if using)
AWS_SES_REGION=us-east-1
AWS_ACCESS_KEY_ID=AKIAxxxxxxxxxxxx
AWS_SECRET_ACCESS_KEY=xxxxxxxxxxxx
```

### Provider Setup

#### Option 1: Console (Development)
**Default mode** - prints emails to console.

```env
EMAIL_PROVIDER=console
```

No additional setup required. Perfect for development and testing.

#### Option 2: Resend
Modern email API with great developer experience.

1. Sign up at [resend.com](https://resend.com)
2. Get API key from dashboard
3. Add to `.env`:
```env
EMAIL_PROVIDER=resend
RESEND_API_KEY=re_xxxxxxxxxxxx
```

#### Option 3: SendGrid
Enterprise email service by Twilio.

1. Sign up at [sendgrid.com](https://sendgrid.com)
2. Create API key with "Mail Send" permissions
3. Add to `.env`:
```env
EMAIL_PROVIDER=sendgrid
SENDGRID_API_KEY=SG.xxxxxxxxxxxx
```

#### Option 4: Amazon SES
AWS email service (cost-effective for high volume).

1. Set up AWS SES in your region
2. Verify domain/email addresses
3. Create IAM user with SES permissions
4. Add to `.env`:
```env
EMAIL_PROVIDER=ses
AWS_SES_REGION=us-east-1
AWS_ACCESS_KEY_ID=AKIAxxxxxxxxxxxx
AWS_SECRET_ACCESS_KEY=xxxxxxxxxxxx
```

## 🧪 Testing

### Test All Templates

Run the test script:

```bash
cd backend
python manage.py shell < test_email_templates.py
```

This will test all 6 email templates with sample data.

### Test Individual Templates

In Django shell:

```python
python manage.py shell
```

```python
from utils.email import send_html_email
from django.utils import timezone

# Test welcome email
send_html_email(
    template_name='welcome',
    context={
        'student_name': 'Test User',
        'student_code': 'TEST001',
        'student_email': 'test@example.com',
        'level_name': 'Foundation',
        'login_url': 'http://localhost:5173/login',
    },
    recipient_email='your-email@example.com',
    subject='Welcome to ICAN Tutorial Centre'
)
```

### Test with Real Student Data

```python
from utils.email import send_welcome_email
from students.models import StudentProfile

# Get a real student
student = StudentProfile.objects.first()

# Send welcome email
result = send_welcome_email(student=student)
print(f"Email sent: {result}")
```

## 🔗 Integration Points

### 1. Student Registration
Add to `students/views.py` or registration signal:

```python
from utils.email import send_welcome_email

# After student creation
send_welcome_email(student=new_student)
```

### 2. Payment Verification
✅ **Already integrated** in `payments/views.py` - automatically sends receipt after successful payment.

### 3. Invoice Generation
Add to `billing/views.py` or invoice creation signal:

```python
from utils.email import send_invoice_email

# After invoice creation
send_invoice_email(invoice=new_invoice)
```

### 4. Attendance Monitoring
Add to attendance monitoring task (Celery):

```python
# In attendance/tasks.py
from utils.email import send_attendance_alert_email

@shared_task
def check_attendance_alerts():
    """Daily task to check attendance and send alerts"""
    from students.models import StudentProfile
    
    students = StudentProfile.objects.filter(is_active=True)
    
    for student in students:
        # Calculate attendance
        attendance_rate = calculate_attendance_rate(student)
        
        if attendance_rate < 75:  # Below threshold
            attendance_data = {
                'attendance_rate': attendance_rate,
                'total_classes': ...,
                'classes_attended': ...,
                'classes_missed': ...,
                'at_risk_courses': [...]
            }
            send_attendance_alert_email(
                student=student,
                attendance_data=attendance_data
            )
```

### 5. Class Reminders
Add to class reminder task (Celery):

```python
# In attendance/tasks.py
from utils.email import send_class_reminder_email

@shared_task
def send_class_reminders():
    """Send reminders for classes in next 24 hours"""
    from attendance.models import ClassSession
    from django.utils import timezone
    
    tomorrow = timezone.now() + timezone.timedelta(days=1)
    upcoming_sessions = ClassSession.objects.filter(
        date=tomorrow.date()
    )
    
    for session in upcoming_sessions:
        # Get enrolled students
        students = session.course_offering.enrollment_set.values_list(
            'student', flat=True
        )
        
        send_class_reminder_email(
            students=students,
            class_session=session
        )
```

## 📋 Email Audit Trail

All emails are logged in the `MessageLog` model:

```python
from notifications.models import MessageLog

# View sent emails
sent_emails = MessageLog.objects.filter(
    channel='email',
    status='sent'
).order_by('-sent_at')

# View failed emails
failed_emails = MessageLog.objects.filter(
    channel='email',
    status='failed'
).order_by('-failed_at')

# View emails for a specific user
user_emails = MessageLog.objects.filter(
    user=user,
    channel='email'
).order_by('-created_at')
```

## 🎨 Customization

### Modify Templates

All templates are in `backend/templates/emails/`:
- `base.html` - Master template (header, footer, styling)
- Individual templates extend base.html

To customize:
1. Edit HTML files directly
2. Maintain responsive design (test on mobile)
3. Keep inline CSS for email client compatibility
4. Test with multiple email clients

### Add New Template

1. Create new HTML file in `templates/emails/`:
```html
{% extends "emails/base.html" %}
{% block title %}Your Title{% endblock %}
{% block content %}
<p class="greeting">Hello {{ name }}</p>
<!-- Your content -->
{% endblock %}
```

2. Create utility function in `utils/email.py`:
```python
def send_your_new_email(*, param1, param2) -> bool:
    context = {
        'name': param1,
        'data': param2,
    }
    return send_html_email(
        template_name='your_new_template',
        context=context,
        recipient_email=email,
        subject='Your Subject'
    )
```

3. Test the new template

## 🚨 Troubleshooting

### Email not sending

1. Check console output for errors
2. Verify EMAIL_PROVIDER setting
3. Check provider API keys
4. Review MessageLog for failed attempts:
```python
MessageLog.objects.filter(status='failed').order_by('-created_at')[:10]
```

### Email looks broken

1. Test in multiple email clients (Gmail, Outlook, Apple Mail)
2. Validate HTML structure
3. Check inline CSS (required for email)
4. Ensure images use absolute URLs

### Provider errors

**Resend:**
- Verify API key is valid
- Check rate limits
- Ensure sender email is verified

**SendGrid:**
- Verify API key has "Mail Send" permission
- Check sender authentication
- Review activity in SendGrid dashboard

**Amazon SES:**
- Verify sender email/domain
- Check IAM permissions
- Ensure not in SES sandbox (limits To: addresses)

## 📊 Monitoring

### Email Statistics

```python
from notifications.models import MessageLog
from django.utils import timezone
from datetime import timedelta

# Last 7 days
week_ago = timezone.now() - timedelta(days=7)

stats = {
    'sent': MessageLog.objects.filter(
        channel='email',
        status='sent',
        sent_at__gte=week_ago
    ).count(),
    'failed': MessageLog.objects.filter(
        channel='email',
        status='failed',
        created_at__gte=week_ago
    ).count(),
    'pending': MessageLog.objects.filter(
        channel='email',
        status='pending',
        created_at__gte=week_ago
    ).count()
}

print(f"Email stats (last 7 days): {stats}")
```

## 📞 Support

For email-related issues:
- Check logs: `MessageLog` model
- Review console output
- Verify provider status
- Test with `test_email_templates.py`

## ✅ Production Checklist

Before going live:

- [ ] Set real EMAIL_PROVIDER (not console)
- [ ] Add valid provider API keys
- [ ] Set production PORTAL_URL
- [ ] Verify sender email/domain
- [ ] Test all 6 templates with real data
- [ ] Set up email monitoring/alerts
- [ ] Configure rate limiting if needed
- [ ] Review and customize email content
- [ ] Test on multiple email clients
- [ ] Set up Celery tasks for automated emails

## 🎉 Summary

All email functionality is ready to use! The system will:

✅ Send professional HTML emails  
✅ Log all sends for audit trail  
✅ Support multiple providers  
✅ Work in development (console) and production  
✅ Automatically send payment receipts  
✅ Provide utility functions for all email types  

Next: Configure your preferred provider and start sending emails! 🚀
