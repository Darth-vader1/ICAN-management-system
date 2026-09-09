# Phase 6: Communication System - Implementation Summary

## Overview
Complete implementation of the Communication System for ICAN Tutorial Centre Platform, including email service abstraction, notification center, message logging, and payment reminders.

---

## Backend Implementation

### 1. Models (`backend/notifications/models.py`)

#### NotificationTemplate
- **Purpose**: Email/SMS/WhatsApp templates with variable substitution
- **Fields**:
  - `key`: Unique template identifier (e.g., 'invoice_created')
  - `channel`: email, sms, or whatsapp
  - `subject`: Email subject line
  - `body_text`: Plain text with `{{variable}}` placeholders
  - `body_html`: HTML version (for email)
  - `is_active`: Toggle template on/off
- **Templates Created**:
  - `welcome`: New user welcome email
  - `password_reset`: Password reset link
  - `invoice_created`: New invoice notification
  - `payment_confirmation`: Payment successful
  - `payment_reminder`: Payment due in 1-3 days
  - `payment_due_today`: Payment due today
  - `payment_overdue`: Overdue payment alert

#### Notification
- **Purpose**: In-app notifications for users
- **Fields**:
  - `user`: Recipient (ForeignKey to User)
  - `type`: info, success, warning, error
  - `category`: enrollment, billing, payment, academic, attendance, system
  - `title`: Short notification title
  - `message`: Notification body
  - `action_url`: Optional link for "View Details"
  - `action_label`: Button text (default: "View Details")
  - `is_read`: Read status
  - `read_at`: Timestamp when marked as read
- **Methods**:
  - `mark_as_read()`: Mark notification as read

#### MessageLog
- **Purpose**: Audit trail for all sent messages
- **Fields**:
  - `user`: Optional user reference
  - `recipient`: Email/phone number
  - `channel`: email, sms, whatsapp
  - `template_key`: Template used
  - `subject`: Message subject
  - `body`: Message content
  - `status`: pending, sent, delivered, failed, bounced
  - `provider`: resend, sendgrid, ses, twilio
  - `provider_message_id`: External message ID
  - Timestamps: `sent_at`, `delivered_at`, `failed_at`
  - `error_message`: Failure reason
- **Indexes**: Optimized for querying by user, channel, status, template

---

### 2. Email Service (`backend/notifications/services.py`)

#### Architecture
- **BaseEmailProvider**: Abstract base class for email providers
- **Provider Implementations**:
  - `ResendEmailProvider`: Resend email service
  - `SendGridEmailProvider`: SendGrid API
  - `SESEmailProvider`: Amazon SES
  - `ConsoleEmailProvider`: Development/testing (logs to console)

#### EmailService
- **`send_template()`**: Send email using NotificationTemplate
  - Renders template with Django Template engine
  - Creates MessageLog for audit
  - Routes to configured provider
  - Updates MessageLog with delivery status
- **`send_raw()`**: Send email without template
  - Direct email sending
  - Still creates MessageLog

#### WhatsAppService
- **`send_template()`**: Abstraction for WhatsApp Business API
  - Placeholder implementation
  - Creates MessageLog with pending status
  - Ready for future WhatsApp integration

#### Configuration (`backend/config/settings.py`)
```python
EMAIL_PROVIDER = 'console'  # Options: console, resend, sendgrid, ses
DEFAULT_FROM_EMAIL = 'noreply@icantutorial.edu'

# Provider-specific settings
RESEND_API_KEY = env('RESEND_API_KEY', default='')
SENDGRID_API_KEY = env('SENDGRID_API_KEY', default='')
AWS_SES_REGION = env('AWS_SES_REGION', default='us-east-1')
AWS_ACCESS_KEY_ID = env('AWS_ACCESS_KEY_ID', default='')
AWS_SECRET_ACCESS_KEY = env('AWS_SECRET_ACCESS_KEY', default='')
```

---

### 3. Celery Tasks (`backend/notifications/tasks.py`)

#### Email Tasks
- **`send_password_reset_email(user_id, uid, token)`**
  - Sends password reset link
  - Template: `password_reset`

- **`send_welcome_email(user_id)`**
  - Sends welcome email to new users
  - Template: `welcome`

- **`send_invoice_created_email(invoice_id)`**
  - Notifies user of new invoice
  - Template: `invoice_created`
  - Creates in-app notification

- **`send_payment_confirmation_email(payment_id)`**
  - Confirms successful payment
  - Template: `payment_confirmation`
  - Creates in-app notification

#### Payment Reminder System
- **`scan_and_send_payment_reminders()`**
  - **Schedule**: Runs daily via Celery Beat
  - **Logic**:
    1. Finds invoices that are pending/partially paid
    2. Checks if due within 3 days OR overdue
    3. Sends appropriate email template:
       - `payment_overdue`: Past due date
       - `payment_due_today`: Due today
       - `payment_reminder`: Due in 1-3 days
    4. Creates in-app notification for each reminder
  - **Configured in**: `backend/config/celery.py`

---

### 4. API Endpoints (`backend/notifications/views.py` & `urls.py`)

#### NotificationViewSet
- **Base URL**: `/api/notifications/notifications/`
- **Permissions**: IsAuthenticated
  - Students see only their own notifications
  - Staff can see all notifications
- **Endpoints**:
  - `GET /`: List notifications (paginated)
  - `GET /{id}/`: Get single notification
  - `GET /unread_count/`: Get unread count
  - `POST /{id}/mark_read/`: Mark notification as read
  - `POST /mark_all_read/`: Mark all as read
- **Filters**: `is_read`, `category`

#### NotificationTemplateViewSet
- **Base URL**: `/api/notifications/templates/`
- **Permissions**: IsAdminUser (Super Admin or IT Admin)
- **Endpoints**:
  - `GET /`: List templates
  - `POST /`: Create template
  - `GET /{id}/`: Get template
  - `PATCH /{id}/`: Update template
  - `DELETE /{id}/`: Delete template
- **Filters**: `channel`, `is_active`

#### MessageLogViewSet
- **Base URL**: `/api/notifications/message-logs/`
- **Permissions**: IsStaffOrReadOnly (Staff can view)
- **Endpoints**:
  - `GET /`: List message logs (read-only)
  - `GET /{id}/`: Get message log
- **Filters**: `user_id`, `channel`, `status`, `template_key`

---

### 5. Admin Interface (`backend/notifications/admin.py`)

#### NotificationTemplateAdmin
- **List View**: key, channel, subject, is_active, created_at
- **Filters**: channel, is_active, created_at
- **Search**: key, subject, body_text
- **Fieldsets**: Template Info, Content, Metadata

#### NotificationAdmin
- **List View**: id, user, title, type_badge (colored), category, is_read, created_at
- **Filters**: type, category, is_read, created_at
- **Search**: title, message, user__email
- **Type Badges**: Color-coded (info=blue, success=green, warning=yellow, error=red)

#### MessageLogAdmin
- **List View**: id, recipient, channel, template_key, status_badge (colored), provider, created_at
- **Filters**: channel, status, provider, created_at
- **Search**: recipient, subject, template_key, provider_message_id
- **Status Badges**: Color-coded status indicators
- **Readonly**: All fields (audit trail, not editable)

---

### 6. Database Migrations

**Created**: `backend/notifications/migrations/0001_initial.py`

**Tables**:
- `notifications_template`: Email/SMS/WhatsApp templates
- `notifications_notification`: In-app notifications
- `notifications_message_log`: Message audit trail

**Indexes**: Optimized for common queries

---

## Frontend Implementation

### 1. TypeScript Types (`frontend/src/types/notification.ts`)

```typescript
export interface Notification {
  id: string;
  type: NotificationType;  // info, success, warning, error
  category: NotificationCategory;
  title: string;
  message: string;
  action_url: string;
  action_label: string;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

export interface NotificationTemplate { ... }
export interface MessageLog { ... }
```

---

### 2. Service Layer (`frontend/src/services/notificationService.ts`)

#### notificationService
- `getAll(params)`: Get paginated notifications
- `getUnreadCount()`: Get unread count
- `markAsRead(id)`: Mark one as read
- `markAllAsRead()`: Mark all as read
- `getById(id)`: Get single notification

#### notificationTemplateService (Admin)
- Full CRUD for templates

#### messageLogService (Staff)
- Read-only access to message logs

---

### 3. Components

#### NotificationBell (`frontend/src/components/NotificationBell.tsx`)
- **Features**:
  - Bell icon with unread count badge
  - Dropdown showing 5 most recent notifications
  - Auto-refreshes every 30 seconds
  - Click to mark as read
  - "Mark all read" button
  - Link to full notification center
- **Usage**: Add to navbar/header

#### NotificationCenter Page (`frontend/src/pages/NotificationCenter.tsx`)
- **Features**:
  - Full-page notification list
  - Filter by All/Unread
  - Filter by category (enrollment, billing, payment, etc.)
  - Icon indicators for notification type
  - Relative timestamps ("2h ago", "3d ago")
  - Action buttons (View Details, Mark as Read)
  - Load more pagination
  - Empty state
- **Route**: `/notifications`

---

## Integration Points

### 1. Webhook Integration
In `backend/billing/services/webhook_handler.py`:
```python
from notifications.tasks import send_payment_confirmation_email

# After successful payment
send_payment_confirmation_email.delay(payment.id)
```

### 2. Invoice Creation
In `backend/billing/services/invoice_service.py`:
```python
from notifications.tasks import send_invoice_created_email

# After invoice creation
send_invoice_created_email.delay(invoice.id)
```

### 3. User Registration
In `backend/users/views.py`:
```python
from notifications.tasks import send_welcome_email

# After user creation
send_welcome_email.delay(user.id)
```

---

## Testing

### Email Testing (Development)
1. Set `EMAIL_PROVIDER=console` in `.env`
2. Emails will be logged to console
3. Check Django logs for email content

### Production Setup
1. Choose provider: Resend, SendGrid, or AWS SES
2. Set environment variables:
   ```bash
   EMAIL_PROVIDER=resend
   RESEND_API_KEY=your_api_key
   DEFAULT_FROM_EMAIL=noreply@yourdomain.com
   ```
3. Verify domain in provider dashboard

### Testing Payment Reminders
```bash
# Manual run
python manage.py shell
>>> from notifications.tasks import scan_and_send_payment_reminders
>>> scan_and_send_payment_reminders()
```

---

## API Usage Examples

### Get Unread Notifications
```bash
GET /api/notifications/notifications/?is_read=false
Authorization: Bearer <token>
```

### Mark as Read
```bash
POST /api/notifications/notifications/{id}/mark_read/
Authorization: Bearer <token>
```

### Get Unread Count
```bash
GET /api/notifications/notifications/unread_count/
Authorization: Bearer <token>

Response: {"count": 5}
```

---

## Deployment Checklist

### Environment Variables
- [ ] `EMAIL_PROVIDER` (console, resend, sendgrid, ses)
- [ ] `DEFAULT_FROM_EMAIL`
- [ ] Provider API keys (RESEND_API_KEY, SENDGRID_API_KEY, etc.)
- [ ] `REDIS_URL` (for Celery)

### Email Provider Setup
- [ ] Create account with provider
- [ ] Verify sending domain
- [ ] Configure SPF/DKIM records
- [ ] Test email delivery

### Celery Setup
- [ ] Redis running
- [ ] Celery worker running: `celery -A config worker -l info`
- [ ] Celery beat running: `celery -A config beat -l info`
- [ ] Monitor task execution

### Database
- [ ] Run migrations: `python manage.py migrate`
- [ ] Create templates: `python create_seed_data.py`

---

## Next Steps

### Phase 7: Attendance System
- Classes and sessions
- Attendance tracking
- Attendance reports
- QR code check-in (optional)

### Phase 8: Reporting System
- Financial reports
- Student reports
- Export to CSV/Excel/PDF

---

## Summary

**Phase 6 Status**: ✅ **COMPLETE**

**Backend**: 100% Complete
- ✅ Notification, NotificationTemplate, MessageLog models
- ✅ Email service with provider abstraction
- ✅ WhatsApp service abstraction
- ✅ 7 email templates
- ✅ Celery tasks for emails and reminders
- ✅ API endpoints with permissions
- ✅ Admin interfaces
- ✅ Migrations and seed data

**Frontend**: 100% Complete
- ✅ TypeScript types
- ✅ Notification service
- ✅ NotificationBell component
- ✅ NotificationCenter page

**Features Delivered**:
1. ✅ Email service abstraction (Resend, SendGrid, SES, Console)
2. ✅ Email templates with variable substitution
3. ✅ In-app notification center
4. ✅ WhatsApp service abstraction (ready for integration)
5. ✅ Message logs (audit trail)
6. ✅ Payment reminder system (daily Celery task)
7. ✅ Unread count with auto-refresh
8. ✅ Mark as read functionality

**Demo Accounts**:
- Admin: admin@ican.edu / admin123456
- Finance: finance@ican.edu / finance123456
- Student: student@ican.edu / student123456

**Commands**:
```bash
# Backend
cd backend
python manage.py migrate
python create_seed_data.py
python manage.py runserver

# Celery (separate terminals)
celery -A config worker -l info
celery -A config beat -l info

# Frontend
cd frontend
npm run dev
```

**API Endpoints**:
- `/api/notifications/notifications/` - In-app notifications
- `/api/notifications/templates/` - Email templates (admin)
- `/api/notifications/message-logs/` - Message audit logs (staff)
