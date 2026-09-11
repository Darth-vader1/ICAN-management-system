# ICAN Tutorial Centre - Email Templates

Professional email templates for the ICAN Management System.

## 📁 Template Structure

```
emails/
├── base.html                    # Base template with layout and styling
├── welcome.html                 # New student welcome email
├── payment_receipt.html         # Payment confirmation
├── invoice_generated.html       # New invoice notification
├── password_reset.html          # Password reset request
├── attendance_alert.html        # Attendance warning notification
├── class_reminder.html          # Upcoming class reminder
└── README.md                    # This file
```

## 🎨 Design Features

### Professional Styling
- **Responsive design** - Works on all devices and email clients
- **Modern gradient headers** - Navy/slate color scheme matching the brand
- **Clean typography** - Professional fonts with optimal readability
- **Accessible colors** - WCAG compliant contrast ratios
- **Mobile-optimized** - Stacks beautifully on small screens

### Components
- **Header** - Branded header with logo and tagline
- **Content Area** - Flexible content blocks
- **Info Boxes** - Highlighted information sections
- **Details Tables** - Clean data presentation
- **CTA Buttons** - Prominent call-to-action buttons
- **Footer** - Contact info and legal links

## 📧 Available Templates

### 1. Welcome Email (`welcome.html`)
**Purpose:** Sent when a new student registers

**Context Variables:**
- `student_name` - Student's full name
- `student_code` - Unique student ID
- `student_email` - Student's email address
- `level_name` - Academic level (Foundation, Skills, Professional)
- `login_url` - Link to student portal login

**Usage:**
```python
from django.core.mail import send_mail
from django.template.loader import render_to_string

context = {
    'student_name': 'John Doe',
    'student_code': 'STU2024001',
    'student_email': 'john@example.com',
    'level_name': 'Foundation',
    'login_url': 'https://portal.ican.edu.ng/login',
}

html_message = render_to_string('emails/welcome.html', context)
send_mail(
    subject='Welcome to ICAN Tutorial Centre',
    message='',  # Plain text version
    from_email='noreply@ican.edu.ng',
    recipient_list=[student_email],
    html_message=html_message,
)
```

### 2. Payment Receipt (`payment_receipt.html`)
**Purpose:** Sent after successful payment

**Context Variables:**
- `student_name` - Student's full name
- `amount` - Payment amount (Decimal)
- `payment_reference` - Transaction reference
- `invoice_number` - Related invoice number
- `payment_method` - Payment method (e.g., "Paystack")
- `payment_date` - Transaction date
- `remaining_balance` - Outstanding balance (Decimal)
- `receipt_url` - Link to download receipt

### 3. Invoice Generated (`invoice_generated.html`)
**Purpose:** Sent when a new invoice is created

**Context Variables:**
- `student_name` - Student's full name
- `invoice_number` - Invoice number
- `invoice_date` - Invoice creation date
- `due_date` - Payment due date
- `session_label` - Academic session (e.g., "2024/2025")
- `level_name` - Academic level
- `invoice_items` - List of items: `[{'description': '...', 'amount': ...}]`
- `total_amount` - Total invoice amount (Decimal)
- `payment_url` - Link to make payment

### 4. Password Reset (`password_reset.html`)
**Purpose:** Sent when user requests password reset

**Context Variables:**
- `user_name` - User's name
- `reset_url` - Password reset link with token
- `expiry_hours` - Link validity period (default: 24)

### 5. Attendance Alert (`attendance_alert.html`)
**Purpose:** Sent when attendance falls below threshold

**Context Variables:**
- `student_name` - Student's full name
- `attendance_rate` - Overall attendance percentage
- `total_classes` - Total classes held
- `classes_attended` - Classes attended
- `classes_missed` - Classes missed
- `at_risk_courses` - List: `[{'code': '...', 'name': '...', 'rate': ...}]`
- `attendance_url` - Link to full attendance record

### 6. Class Reminder (`class_reminder.html`)
**Purpose:** Sent before upcoming class

**Context Variables:**
- `student_name` - Student's full name
- `course_code` - Course code
- `course_name` - Course name
- `class_date` - Date of class
- `start_time` - Class start time
- `end_time` - Class end time
- `location` - Classroom/location
- `instructor_name` - Instructor's name
- `class_topic` - (Optional) Topic for the class
- `preparation_notes` - (Optional) Preparation instructions
- `portal_url` - Link to student portal

## 🚀 Integration with Django

### Settings Configuration

```python
# settings.py

EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'smtp.gmail.com'  # Or your email provider
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = env('EMAIL_HOST_USER')
EMAIL_HOST_PASSWORD = env('EMAIL_HOST_PASSWORD')
DEFAULT_FROM_EMAIL = 'ICAN Tutorial Centre <noreply@ican.edu.ng>'

# Add global context for all email templates
EMAIL_CONTEXT = {
    'portal_url': 'https://portal.ican.edu.ng',
    'support_url': 'https://portal.ican.edu.ng/support',
    'privacy_url': 'https://ican.edu.ng/privacy',
}
```

### Utility Function

```python
# utils/email.py

from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.conf import settings

def send_template_email(template_name, context, recipient_email, subject):
    """
    Send an email using a template.
    
    Args:
        template_name: Template file name (e.g., 'welcome')
        context: Dictionary of template variables
        recipient_email: Recipient's email address
        subject: Email subject line
    """
    # Add global context
    full_context = {
        **settings.EMAIL_CONTEXT,
        'recipient_email': recipient_email,
        **context,
    }
    
    # Render HTML
    html_content = render_to_string(
        f'emails/{template_name}.html',
        full_context
    )
    
    # Create email
    email = EmailMultiAlternatives(
        subject=subject,
        body='',  # Plain text fallback can be added here
        from_email=settings.DEFAULT_FROM_EMAIL,
        to=[recipient_email],
    )
    email.attach_alternative(html_content, 'text/html')
    email.send()
```

## 🧪 Testing

```python
# Test in Django shell
python manage.py shell

from utils.email import send_template_email

send_template_email(
    template_name='welcome',
    context={
        'student_name': 'Test User',
        'student_code': 'TEST001',
        'student_email': 'test@example.com',
        'level_name': 'Foundation',
        'login_url': 'http://localhost:5173/login',
    },
    recipient_email='test@example.com',
    subject='Welcome to ICAN Tutorial Centre'
)
```

## 📱 Email Client Compatibility

These templates are tested and compatible with:
- ✅ Gmail (Desktop & Mobile)
- ✅ Outlook (Desktop & Mobile)
- ✅ Apple Mail (Desktop & Mobile)
- ✅ Yahoo Mail
- ✅ Thunderbird
- ✅ ProtonMail

## 🎨 Customization

### Colors
Main colors used:
- **Primary**: `#0f172a` (Navy)
- **Secondary**: `#10b981` (Green)
- **Success**: `#10b981`
- **Warning**: `#f59e0b`
- **Danger**: `#dc2626`
- **Text**: `#1e293b`
- **Gray**: `#64748b`

### Fonts
- Primary: `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif`
- Monospace: `monospace` (for code/links)

## 📝 Best Practices

1. **Keep it concise** - Respect users' time
2. **Clear CTAs** - Make actions obvious
3. **Mobile-first** - Always test on mobile
4. **Accessible** - Use semantic HTML and alt text
5. **Personalized** - Always use user's name
6. **Professional** - Maintain brand consistency

## 🔒 Security Notes

- Never include sensitive information in plain text
- Always use HTTPS for links
- Validate email addresses before sending
- Implement rate limiting for automated emails
- Log all email sends for audit trail

## 📞 Support

For questions about email templates:
- Technical: IT Department
- Content: Marketing Team
- Design: Design Team
