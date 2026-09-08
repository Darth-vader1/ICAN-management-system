# ICAN Tutorial Centre Platform — Phase 0: Architecture & Design

Per the build prompt's own rules (§3, §44, §51), this document is produced *before* implementation code. It covers: system architecture, ERD, role/permission matrix, database schema, API specification, frontend routes, folder structure, core workflows, and the V1/V2 MVP boundary.

---

## A. System Architecture

```
┌─────────────────────┐         ┌──────────────────────┐
│   React SPA (TS)     │ HTTPS   │   Django + DRF API    │
│  Tailwind/RHF/Zod/    │◄──────►│  (source of truth for  │
│  TanStack Query       │  JSON   │  all business logic)  │
└─────────────────────┘         └──────────┬────────────┘
                                            │
                     ┌──────────────────────┼───────────────────────┐
                     │                      │                       │
             ┌───────▼──────┐     ┌─────────▼────────┐    ┌────────▼────────┐
             │ PostgreSQL    │     │  Redis            │    │  Celery workers │
             │ (system of    │     │ (broker + cache)  │    │ (email/WhatsApp/│
             │  record)      │     │                   │    │  reminders/recon)│
             └───────────────┘     └───────────────────┘    └────────┬────────┘
                                                                       │
                              ┌────────────────────────────────────────┼─────────────────┐
                              │                                        │                 │
                     ┌────────▼────────┐                     ┌─────────▼───────┐ ┌───────▼──────┐
                     │ Paystack API      │                     │ Email provider   │ │ WhatsApp     │
                     │ (init + verify +  │                     │ (Resend/SES/     │ │ Business API │
                     │  webhook)         │                     │  SendGrid) behind │ │ behind        │
                     │                   │                     │  EmailService     │ │ WhatsAppService│
                     └───────────────────┘                     └───────────────────┘ └───────────────┘
```

**Key architectural decisions**

- **Backend is the sole source of truth.** All fee calculation, balance derivation, invoice state transitions, and permission checks happen server-side. The frontend never computes a balance — it displays what the API returns.
- **Paystack webhook is the only trigger that can mark a payment "Successful."** The frontend redirect after checkout only shows a "processing" state; it polls the payment status endpoint, which itself reflects webhook-verified state.
- **Celery/Redis decouples slow or external-dependent work** (sending email/WhatsApp, running the reminder scan, reconciling payments) from the request/response cycle. Nothing that touches Paystack, email, or WhatsApp should block an HTTP response.
- **Email and WhatsApp are behind service interfaces** (`EmailService`, `WhatsAppService`) so the concrete provider (Resend vs SES; WhatsApp Cloud API vs a BSP) can be swapped via configuration, not code changes throughout the app.
- **Financial writes happen inside DB transactions** with row-level locking on the invoice/payment aggregate to prevent race conditions from concurrent webhook deliveries or double-submitted manual payments.
- **Multi-tenancy readiness**: every core model that would need per-organization scoping (Student, Staff, Course, Session, Invoice, Payment, etc.) is designed so an `organization_id` foreign key can be added later without restructuring relationships — see §34 of the spec and the MVP boundary below.

---

## B. Entity Relationship Diagram (core entities)

```
User ──1:1── StudentProfile
User ──1:1── StaffProfile (role: MANAGER | FINANCE | STUDENT_OFFICER | IT_ADMIN | SUPER_ADMIN)

AcademicSession ──1:N── CourseOffering
Level ──1:N── Course ──1:N── CourseOffering
CourseOffering ──1:N── Class ──1:N── ClassSchedule
CourseOffering ──1:1(optional)── Tutor (StaffProfile)

StudentProfile ──1:N── Enrollment
Enrollment ──N:1── AcademicSession
Enrollment ──N:1── Level
Enrollment ──1:N── EnrollmentCourse ──N:1── CourseOffering

Enrollment ──1:1── Invoice
Invoice ──1:N── InvoiceItem (snapshot of FeeStructure amounts at creation time)
Invoice ──1:N── Payment (via PaymentAllocation, supports partial/multiple payments)
Payment ──1:N── PaymentAllocation ──N:1── Invoice
Payment ──0:N── Refund

Class ──1:N── Attendance ──N:1── StudentProfile

StudentProfile ──1:N── Notification
StudentProfile ──1:N── PaymentReminder ──N:1── Invoice
Announcement ──N:M── (target: Level | Course | Session | All)

AuditLog ──N:1── User (actor), polymorphic reference to entity_type + entity_id
SystemSetting (key-value, singleton-ish config)
NotificationTemplate ──1:N── Notification / PaymentReminder (rendered from)
```

**Notable integrity rules encoded as constraints, not app logic alone:**
- `unique(student, session, level)` where enrollment status = active → prevents duplicate active enrollment.
- `check(course.level_id == enrollment.level_id)` enforced at the EnrollmentCourse write path → prevents cross-level enrollment.
- `unique(payment.provider, payment.provider_reference)` → idempotency for Paystack references.
- `InvoiceItem.unit_price` is copied from `FeeStructure` at invoice-creation time and never re-reads FeeStructure afterward → historical invoices are immutable to future fee changes.
- Payments are never deleted; a `Refund` or a `Payment.status = REVERSED` is the only way to negate one, always with an audit trail.

---

## C. Role / Permission Matrix

| Feature | Student | Staff (Officer) | Finance | Manager | IT Admin | Super Admin |
|---|---|---|---|---|---|---|
| View own profile/enrollment | ✅ | – | – | – | – | ✅ |
| Register/edit student records | ❌ | ✅ | View only | View only | ❌ | ✅ |
| Manage courses/levels/sessions | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ |
| Manage fee structures | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ |
| Create invoices (system-triggered) | – | ✅ (via enrollment) | View | View | – | ✅ |
| Record manual payment | ❌ | ❌ | ✅ | ✅ | ❌ | ✅ |
| Verify manual payment | ❌ | ❌ | ✅ | ✅ (optional gate) | ❌ | ✅ |
| Make online payment (self) | ✅ | – | – | – | – | – |
| View financial reports | ❌ | ❌ | ✅ | ✅ | ❌ | ✅ |
| Manage user accounts/roles | ❌ | ❌ | ❌ | ❌ | ✅ (accounts only) | ✅ |
| Manage system settings/integrations | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| View audit logs | ❌ | ❌ | ❌ (own actions only) | Partial (non-system) | ✅ (technical) | ✅ (full) |
| Mark attendance | ❌ | ✅ (assigned classes) | ❌ | ✅ | ❌ | ✅ |
| Send announcements | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ |

This is enforced via DRF permission classes composed per-viewset (e.g. `IsFinanceOrAbove`, `IsSelfOrStaff`), never via frontend route guards alone.

---

## D. Database Schema (key fields)

**User** — id, email (unique), phone, password_hash, role, is_active, is_verified, date_joined, last_login

**StudentProfile** — user_id (FK), student_code (unique, generated), first_name, last_name, other_name, dob, gender, address, whatsapp_number, ican_exam_id, emergency_contact, photo_url

**StaffProfile** — user_id (FK), staff_role (enum), department

**AcademicSession** — id, label ("2026/2027"), start_date, end_date, is_active

**Level** — id, name (Foundation/Skills/Professional), order, is_active

**Course** — id, level_id (FK), name, code (unique), description, duration, is_active

**CourseOffering** — id, course_id (FK), session_id (FK), tutor_id (FK nullable), capacity, is_active

**Enrollment** — id, student_id (FK), session_id (FK), level_id (FK), status (draft/active/completed/withdrawn), created_at

**EnrollmentCourse** — id, enrollment_id (FK), course_offering_id (FK)

**FeeStructure** — id, level_id (FK nullable), course_id (FK nullable), session_id (FK), fee_type (registration/course/materials/exam/other), amount, currency, effective_from, is_active

**Invoice** — id, invoice_number (unique), enrollment_id (FK), student_id (FK), total_amount, amount_paid (derived/cached + recalculated), balance (derived), status (draft/pending/partially_paid/paid/overdue/cancelled), due_date, created_at

**InvoiceItem** — id, invoice_id (FK), description, quantity, unit_price, total (snapshot, immutable)

**Payment** — id, student_id (FK), invoice_id (FK nullable — a payment can pre-date allocation), amount, currency, method (paystack/bank_transfer/cash/pos), provider, provider_reference (unique w/ provider), status (pending/successful/failed/reversed/refunded), transaction_date, verified_at, verified_by (FK nullable), metadata (JSON), receipt_upload_url

**PaymentAllocation** — id, payment_id (FK), invoice_id (FK), amount_allocated

**Refund** — id, payment_id (FK), amount, reason, processed_by (FK), processed_at

**Class** — id, course_offering_id (FK), tutor_id (FK)

**ClassSchedule** — id, class_id (FK), date, start_time, end_time, location, meeting_url

**Attendance** — id, class_id (FK), student_id (FK), status (present/absent/late/excused), marked_by (FK), marked_at

**Notification** — id, student_id (FK), type, message, is_read, created_at

**NotificationTemplate** — id, key, channel (email/whatsapp/in_app), subject, body_template, variables (JSON)

**Announcement** — id, title, body, target_type, target_id (nullable), channels (JSON array), scheduled_for, created_by (FK)

**AuditLog** — id, user_id (FK), action, entity_type, entity_id, old_value (JSON), new_value (JSON), ip_address, created_at

**PaymentReminder** — id, invoice_id (FK), student_id (FK), rule_triggered, channel, template_used, sent_at, delivery_status

**SystemSetting** — id, key (unique), value (JSON), description

Indexes: `email`, `phone`, `student_code`, `invoice_number`, `payment.provider_reference`, `enrollment(session_id, level_id)`, `payment.status`.

---

## E. API Specification (representative endpoints)

```
POST   /api/auth/login/
POST   /api/auth/logout/
POST   /api/auth/password-reset/
POST   /api/auth/password-reset/confirm/
GET    /api/auth/me/

GET    /api/students/                 (staff+, filterable/paginated)
GET    /api/students/{id}/
GET    /api/students/{id}/financial-profile/   (invoice + payments + balance rollup)
PATCH  /api/students/{id}/

GET    /api/sessions/ | POST | PATCH /api/sessions/{id}/
GET    /api/levels/   | POST | PATCH /api/levels/{id}/
GET    /api/courses/  | POST | PATCH /api/courses/{id}/
GET    /api/course-offerings/

POST   /api/enrollments/              (creates Enrollment + EnrollmentCourse[] + triggers Invoice generation)
GET    /api/enrollments/{id}/

GET    /api/invoices/{id}/
GET    /api/invoices/mine/            (student-scoped)

POST   /api/payments/paystack/initialize/
POST   /api/payments/paystack/webhook/       (signature-verified, idempotent)
POST   /api/payments/manual/                 (staff creates pending-verification payment)
POST   /api/payments/{id}/verify/            (finance/manager only)
GET    /api/payments/{id}/receipt/

GET    /api/attendance/class/{class_id}/
POST   /api/attendance/class/{class_id}/mark/
GET    /api/attendance/student/{id}/summary/

GET    /api/reports/financial/summary/
GET    /api/reports/financial/export/?format=csv|xlsx|pdf

GET    /api/notifications/mine/
POST   /api/announcements/

GET    /api/audit-logs/               (IT/Super Admin only, filterable)
```

Consistent envelope for errors: `{"detail": "...", "code": "..."}`; list endpoints follow `{"count", "next", "previous", "results"}` pagination.

### Error Code Standards

All API errors follow a consistent structure:
```json
{
  "detail": "Human-readable message",
  "code": "ERROR_CODE",
  "field_errors": {  // optional, for validation errors
    "email": ["This email is already registered"],
    "amount": ["Amount must be positive"]
  }
}
```

**Standard error codes:**
- `AUTH_INVALID_CREDENTIALS` — login failed
- `AUTH_TOKEN_EXPIRED` — session expired
- `AUTH_INSUFFICIENT_PERMISSION` — role check failed
- `VALIDATION_ERROR` — input validation failed
- `ENROLLMENT_DUPLICATE` — duplicate enrollment attempt
- `ENROLLMENT_INVALID_COURSE_LEVEL` — course doesn't match level
- `PAYMENT_ALREADY_VERIFIED` — cannot re-verify
- `PAYMENT_VERIFICATION_FAILED` — Paystack verification failed
- `PAYMENT_DUPLICATE_REFERENCE` — idempotency violation
- `INVOICE_ALREADY_PAID` — cannot modify paid invoice
- `INVOICE_NOT_FOUND` — invalid invoice
- `INSUFFICIENT_BALANCE` — refund exceeds paid amount
- `RESOURCE_NOT_FOUND` — generic 404
- `RATE_LIMIT_EXCEEDED` — too many requests

### Rate Limiting Strategy

```python
# Applied per-endpoint via DRF throttling classes
DEFAULT_THROTTLE_RATES = {
    'anon': '100/hour',      # unauthenticated requests
    'user': '1000/hour',     # authenticated non-sensitive
    'payment': '10/minute',  # payment initialization
    'auth': '5/minute',      # login/password reset per IP
}
```

Webhook endpoints exempt from rate limiting (authenticated via signature).

### Session/Token Policy

- **Access token TTL**: 24 hours
- **Refresh token TTL**: 7 days (if using JWT refresh pattern)
- **Session inactivity timeout**: 30 minutes (configurable)
- **Password reset token TTL**: 1 hour
- **Email verification token TTL**: 24 hours
- Tokens invalidated on password change or explicit logout

### File Upload Security

**Allowed file types:**
- Payment receipts: `image/jpeg`, `image/png`, `application/pdf`
- Profile photos: `image/jpeg`, `image/png`, `image/webp`

**Validation rules:**
```python
MAX_UPLOAD_SIZE = 5 * 1024 * 1024  # 5 MB
ALLOWED_RECEIPT_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.pdf']
ALLOWED_PHOTO_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp']

# Server-side validation:
# 1. Check file extension (case-insensitive)
# 2. Validate MIME type via python-magic (actual content)
# 3. Scan file size before reading
# 4. Generate new UUID-based filename (never trust client filename)
# 5. Store outside web root or use signed URLs
# 6. Set Content-Disposition: attachment for downloads
```

### Audit Log Retention

- **Financial records** (payments, invoices, refunds): retain indefinitely
- **User actions** (CRUD on students, courses, etc.): 2 years
- **Login attempts**: 90 days
- **System config changes**: indefinitely
- Logs stored in PostgreSQL with partitioning by month for performance

---

## E.1. Paystack Payment Flow (Sequence Diagram)

```
Student          Frontend         Backend          Paystack         Celery
   |                |                |                |                |
   |-- Open Invoice-|                |                |                |
   |                |                |                |                |
   |-- Click Pay -->|                |                |                |
   |                |                |                |                |
   |                |-- POST /payments/paystack/initialize/            |
   |                |                |                |                |
   |                |                |-- Initialize Transaction ---->  |
   |                |                |<-- {access_code, reference} --  |
   |                |                |                |                |
   |                |<-- {checkout_url, ref} ---------|                |
   |                |                |                |                |
   |-- Redirect to Paystack -------->|                |                |
   |<-- Checkout UI -----------------|                |                |
   |                |                |                |                |
   |-- Complete Payment ------------>|                |                |
   |<-- Redirect to /payment-callback|                |                |
   |                |                |                |                |
   |                |-- Poll GET /payments/{ref}/status/               |
   |                |<-- {status: "processing"} ------|                |
   |                |                |                |                |
   |                |                |                |                |
   |                |                |<-- POST /payments/paystack/webhook/
   |                |                |   {event: "charge.success", ...}
   |                |                |                |                |
   |                |                |-- Verify signature              |
   |                |                |-- GET /transaction/verify/{ref} ->
   |                |                |<-- {status: "success", ...} ----
   |                |                |                |                |
   |                |                |-- Upsert Payment (idempotent on ref)
   |                |                |-- Create PaymentAllocation      |
   |                |                |-- Recalc invoice.balance        |
   |                |                |                |                |
   |                |                |-- Queue receipt email --------->|
   |                |                |                |                |
   |                |-- Poll again --|                |                |
   |                |<-- {status: "successful"} -----|                |
   |                |                |                |                |
   |-- Show success|                |                |                |
```

**Critical rule**: the frontend redirect is *not* trusted. Status only updates when webhook is verified.

---

## E.2. Environment Variables Structure

Create `.env.example`:
```bash
# Django
DEBUG=False
SECRET_KEY=your-secret-key-here
ALLOWED_HOSTS=localhost,127.0.0.1,yourdomain.com
CORS_ALLOWED_ORIGINS=http://localhost:3000,https://yourdomain.com

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/ican_platform

# Redis
REDIS_URL=redis://localhost:6379/0

# Celery
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/0

# Paystack
PAYSTACK_PUBLIC_KEY=pk_test_...
PAYSTACK_SECRET_KEY=sk_test_...
PAYSTACK_WEBHOOK_SECRET=your_webhook_secret

# Email (example with Resend)
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.resend.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=resend
EMAIL_HOST_PASSWORD=your_resend_api_key
DEFAULT_FROM_EMAIL=noreply@yourdomain.com

# WhatsApp (deferred to V2, but structure prepared)
WHATSAPP_PROVIDER=cloud_api  # or 'bsp'
WHATSAPP_API_KEY=your_key
WHATSAPP_PHONE_NUMBER_ID=your_phone_id
WHATSAPP_BUSINESS_ACCOUNT_ID=your_account_id

# Frontend URL (for email links)
FRONTEND_URL=http://localhost:3000

# Security
SESSION_COOKIE_SECURE=True  # production only
CSRF_COOKIE_SECURE=True     # production only
SECURE_SSL_REDIRECT=True    # production only

# Rate Limiting
RATE_LIMIT_ENABLED=True

# File Upload
MAX_UPLOAD_SIZE_MB=5
MEDIA_ROOT=/var/www/ican_platform/media
MEDIA_URL=/media/

# Logging
LOG_LEVEL=INFO
SENTRY_DSN=  # optional for error tracking
```

---

## E.3. Reminder Timing Configuration Format

Stored in `SystemSetting` model as JSON:
```json
{
  "payment_reminders": {
    "enabled": true,
    "rules": [
      {"days_before_due": 7, "channels": ["email", "whatsapp"], "template": "reminder_7d"},
      {"days_before_due": 3, "channels": ["email"], "template": "reminder_3d"},
      {"days_before_due": 1, "channels": ["email", "whatsapp"], "template": "reminder_1d"},
      {"days_before_due": 0, "channels": ["email", "whatsapp"], "template": "reminder_due"},
      {"days_after_due": 3, "channels": ["email"], "template": "overdue_3d"},
      {"days_after_due": 7, "channels": ["email", "whatsapp"], "template": "overdue_7d"}
    ],
    "max_reminders_per_invoice": 10,
    "quiet_hours": {"start": "22:00", "end": "08:00", "timezone": "Africa/Lagos"}
  }
}
```

Celery beat task runs daily, checks each unpaid/partially-paid invoice against these rules, skips if `PaymentReminder` record already exists for that rule+invoice combo.

---

## F. Frontend Route Structure

```
/login  /register  /forgot-password

/student/dashboard
/student/profile
/student/enrollment          (session → level → course selection wizard)
/student/invoices
/student/invoices/:id
/student/payments
/student/payments/:id/pay    (Paystack checkout)
/student/schedule
/student/attendance
/student/notifications

/admin/dashboard              (role-aware widgets)
/admin/students
/admin/students/:id           (financial profile view)
/admin/enrollments
/admin/invoices
/admin/payments
/admin/payments/:id/verify
/admin/courses
/admin/levels
/admin/sessions
/admin/fees
/admin/attendance
/admin/reports
/admin/announcements
/admin/users                  (IT/Super Admin)
/admin/audit-logs             (IT/Super Admin)
/admin/settings               (IT/Super Admin)
```

Route guards check role client-side for UX only; every underlying API call re-enforces permissions server-side.

---

## G. Application Folder Structure

**Backend (Django)**
```
backend/
  config/                  settings, urls, celery.py, wsgi/asgi
  apps/
    accounts/               User, StaffProfile, auth, permissions
    students/                StudentProfile, search
    academics/                Session, Level, Course, CourseOffering, Class, ClassSchedule
    enrollments/               Enrollment, EnrollmentCourse, validation rules
    billing/                    FeeStructure, Invoice, InvoiceItem, Payment, PaymentAllocation, Refund
      services/                  invoice_service.py, payment_service.py, balance_calculator.py
    payments_paystack/            client.py, webhook_handler.py
    attendance/
    communications/                 email/ (EmailService + templates), whatsapp/ (WhatsAppService), reminders/
    notifications/
    announcements/
    reports/
    audit/                          middleware + AuditLog model + decorators
  tests/
```

**Frontend (React)**
```
frontend/src/
  app/                    router, providers (QueryClient, Auth)
  features/
    auth/  students/  enrollments/  invoices/  payments/  attendance/  reports/  admin/
    (each: components/, hooks/, api.ts, types.ts)
  components/ui/          shared design-system components
  lib/                    api client, zod schemas, formatters
  routes/                 route definitions grouped by role
```

---

## H. Core Workflows (as specified)

**Registration → Enrollment → Invoice**: account creation → optional verification → profile completion → session/level/course selection → backend computes applicable `FeeStructure` rows → `Invoice` + `InvoiceItem[]` created atomically → confirmation email queued via Celery.

**Online payment**: student opens invoice → initializes Paystack transaction server-side → completes checkout → Paystack webhook (signature-verified) → backend independently re-verifies with Paystack's verify endpoint → `Payment` upserted idempotently on `provider_reference` → `PaymentAllocation` created → invoice balance recalculated inside a DB transaction → receipt + confirmation queued.

**Manual payment**: staff records payment (status=pending_verification, optional receipt upload) → finance/manager reviews and verifies → status→verified → allocation + balance recalculation → receipt.

**Reminder engine**: scheduled Celery beat task scans invoices against configured rules (7/3/1 days before, due date, N days overdue) → skips if already sent for that rule/invoice → renders template → queues email/WhatsApp → logs `PaymentReminder` with delivery status.

**Attendance**: tutor opens class session → marks present/absent/late/excused per enrolled student → aggregated into per-student, per-course attendance percentage.

---

## I. MVP Boundary (V1 vs V2)

**V1 (build now)**
- Auth, roles, permissions
- Sessions/Levels/Courses/CourseOfferings CRUD
- Student registration, profile, search
- Enrollment with validation rules
- Fee structures, invoice generation, invoice immutability
- Paystack online payments + manual payments + verification workflow
- Partial payment allocation and balance calculation
- Financial dashboard (real numbers only, no placeholders)
- Email service + core templates (welcome, invoice, payment confirmation, reminder, overdue)
- Basic reminder engine (day-based rules)
- Attendance (manual marking) + attendance percentage
- Core reports (financial summary, student lists) with CSV export
- Audit logging on all financial and permission-sensitive actions
- Notification center (in-app)

**V2 (defer)**
- WhatsApp Business API integration (build the service abstraction now, wire the provider later)
- QR-code attendance
- Excel/PDF export (CSV first)
- Scheduled/targeted announcements beyond "all students"
- Full multi-tenant Organization model (keep schema tenant-ready, don't build tenant switching UI yet)
- Advanced analytics (trends, forecasting)
- SSO / advanced session management beyond standard token auth

---

**Next step per the spec's own process (§3, §51):** this document should be reviewed/approved before Phase 1 (Foundation) implementation begins — Django project, React project, Postgres connection, auth, and the base role system.
