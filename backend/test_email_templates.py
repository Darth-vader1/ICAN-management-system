"""
Test script for email templates.
Run with: python manage.py shell < test_email_templates.py

Or in Django shell:
>>> exec(open('test_email_templates.py').read())
"""
from django.utils import timezone
from decimal import Decimal

print("=" * 70)
print("Testing Email Templates")
print("=" * 70)

# Test 1: Welcome Email
print("\n1. Testing Welcome Email Template...")
try:
    from utils.email import send_html_email
    
    context = {
        'student_name': 'John Doe',
        'student_code': 'STU2024001',
        'student_email': 'john.doe@example.com',
        'level_name': 'Foundation',
        'login_url': 'http://localhost:5173/login',
    }
    
    result = send_html_email(
        template_name='welcome',
        context=context,
        recipient_email='test@example.com',
        subject='Welcome to ICAN Tutorial Centre'
    )
    
    print(f"   ✓ Welcome email: {'SUCCESS' if result else 'FAILED'}")
except Exception as e:
    print(f"   ✗ Welcome email: ERROR - {e}")

# Test 2: Payment Receipt Email
print("\n2. Testing Payment Receipt Email Template...")
try:
    context = {
        'student_name': 'Jane Smith',
        'amount': Decimal('50000.00'),
        'payment_reference': 'PAY-TEST-12345',
        'invoice_number': 'INV-2024-001',
        'payment_method': 'Paystack',
        'payment_date': timezone.now(),
        'remaining_balance': Decimal('0.00'),
        'receipt_url': 'http://localhost:5173/billing',
    }
    
    result = send_html_email(
        template_name='payment_receipt',
        context=context,
        recipient_email='test@example.com',
        subject='Payment Receipt - PAY-TEST-12345'
    )
    
    print(f"   ✓ Payment receipt: {'SUCCESS' if result else 'FAILED'}")
except Exception as e:
    print(f"   ✗ Payment receipt: ERROR - {e}")

# Test 3: Invoice Email
print("\n3. Testing Invoice Email Template...")
try:
    context = {
        'student_name': 'Michael Johnson',
        'invoice_number': 'INV-2024-002',
        'invoice_date': timezone.now(),
        'due_date': timezone.now() + timezone.timedelta(days=30),
        'session_label': '2024/2025',
        'level_name': 'Skills Level',
        'invoice_items': [
            {'description': 'Tuition Fee - Foundation', 'amount': Decimal('75000.00')},
            {'description': 'Registration Fee', 'amount': Decimal('5000.00')},
            {'description': 'Exam Fee', 'amount': Decimal('10000.00')},
        ],
        'total_amount': Decimal('90000.00'),
        'payment_url': 'http://localhost:5173/billing',
    }
    
    result = send_html_email(
        template_name='invoice_generated',
        context=context,
        recipient_email='test@example.com',
        subject='New Invoice - INV-2024-002'
    )
    
    print(f"   ✓ Invoice email: {'SUCCESS' if result else 'FAILED'}")
except Exception as e:
    print(f"   ✗ Invoice email: ERROR - {e}")

# Test 4: Password Reset Email
print("\n4. Testing Password Reset Email Template...")
try:
    context = {
        'user_name': 'Sarah Williams',
        'reset_url': 'http://localhost:5173/reset-password?token=abc123xyz789',
        'expiry_hours': 24,
    }
    
    result = send_html_email(
        template_name='password_reset',
        context=context,
        recipient_email='test@example.com',
        subject='Reset Your Password - ICAN Tutorial Centre'
    )
    
    print(f"   ✓ Password reset: {'SUCCESS' if result else 'FAILED'}")
except Exception as e:
    print(f"   ✗ Password reset: ERROR - {e}")

# Test 5: Attendance Alert Email
print("\n5. Testing Attendance Alert Email Template...")
try:
    context = {
        'student_name': 'David Brown',
        'attendance_rate': 68,
        'total_classes': 25,
        'classes_attended': 17,
        'classes_missed': 8,
        'at_risk_courses': [
            {'code': 'FN101', 'name': 'Financial Accounting', 'rate': 65},
            {'code': 'TX201', 'name': 'Taxation', 'rate': 70},
        ],
        'attendance_url': 'http://localhost:5173/attendance',
    }
    
    result = send_html_email(
        template_name='attendance_alert',
        context=context,
        recipient_email='test@example.com',
        subject='Attendance Alert - Action Required'
    )
    
    print(f"   ✓ Attendance alert: {'SUCCESS' if result else 'FAILED'}")
except Exception as e:
    print(f"   ✗ Attendance alert: ERROR - {e}")

# Test 6: Class Reminder Email
print("\n6. Testing Class Reminder Email Template...")
try:
    context = {
        'student_name': 'Emily Davis',
        'course_code': 'EC101',
        'course_name': 'Economics',
        'class_date': timezone.now() + timezone.timedelta(days=1),
        'start_time': timezone.now().replace(hour=9, minute=0),
        'end_time': timezone.now().replace(hour=12, minute=0),
        'location': 'Room 201, Main Campus',
        'instructor_name': 'Dr. Adeyemi Ogunlesi',
        'class_topic': 'Introduction to Microeconomics',
        'preparation_notes': 'Please read Chapter 3 before class and bring your calculator.',
        'portal_url': 'http://localhost:5173',
    }
    
    result = send_html_email(
        template_name='class_reminder',
        context=context,
        recipient_email='test@example.com',
        subject='Class Reminder - EC101'
    )
    
    print(f"   ✓ Class reminder: {'SUCCESS' if result else 'FAILED'}")
except Exception as e:
    print(f"   ✗ Class reminder: ERROR - {e}")

print("\n" + "=" * 70)
print("Email Template Testing Complete")
print("=" * 70)
print("\nNote: Check console output above to see email content")
print("      (Using ConsoleEmailProvider by default)")
print("\nTo use a real email provider:")
print("  1. Set EMAIL_PROVIDER in .env (resend, sendgrid, or ses)")
print("  2. Add provider API keys to .env")
print("  3. Run this test again")
print("=" * 70)
