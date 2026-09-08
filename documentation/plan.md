# MASTER BUILD PROMPT

## ICAN Tutorial Centre Management & Payment Management Platform

You are a senior software architect, backend engineer, frontend engineer, database designer, DevOps engineer, security engineer, and product designer.

Your task is to design and build a production-ready web application for an accounting firm that runs ICAN tutorial classes.

This is NOT a simple school website.

The system is a **Student Management, Enrollment, Fee Management, Payment Tracking, Financial Reporting, Communication Automation, Attendance, and Administration platform**.

The application must be designed so that it can initially serve one accounting firm's tutorial centre but can later be converted into a multi-tenant SaaS platform for other professional training centres.

---

# 1. PRODUCT OBJECTIVE

Build a centralized platform that allows the accounting firm to manage:

* Students
* Staff
* Managers
* IT administrators
* ICAN levels
* Courses
* Academic sessions
* Enrollments
* Fees
* Invoices
* Payments
* Outstanding balances
* Payment verification
* Email communication
* WhatsApp communication
* Automated payment reminders
* Class schedules
* Attendance
* Reports
* Audit logs
* System settings

The system must provide a single source of truth for student and financial information.

The system should eliminate dependence on spreadsheets, paper records, manually calculated balances, and manually tracking students who owe money.

---

# 2. RECOMMENDED TECHNOLOGY STACK

Use this stack unless there is a compelling technical reason to change it.

## Frontend

* React
* TypeScript
* Tailwind CSS
* React Router
* TanStack Query
* React Hook Form
* Zod
* Reusable component architecture

## Backend

* Python
* Django
* Django REST Framework

## Database

* PostgreSQL

## Authentication

Use secure token/session-based authentication appropriate for a React + Django architecture.

Implement:

* Login
* Logout
* Password reset
* Email verification where appropriate
* Role-based permissions
* Session/token expiration
* Secure password handling

## Payments

Integrate Paystack.

Payment architecture MUST use server-side verification and webhooks.

Never trust a frontend payment-success response as proof of payment.

## Email

Design the application around a transactional email provider such as Resend, SendGrid, or Amazon SES.

Keep the email provider behind a service abstraction so it can be changed later.

## WhatsApp

Design the application to support the official WhatsApp Business Platform/API.

Do not implement WhatsApp automation by scraping WhatsApp Web or using unofficial automation methods.

Keep WhatsApp functionality behind a service abstraction.

## Background jobs

Use:

* Celery
* Redis

Background jobs should handle:

* Email
* WhatsApp
* Scheduled reminders
* Payment reconciliation
* Other long-running operations

## Deployment

The architecture should be deployment-ready for:

* Frontend hosting
* Django backend hosting
* PostgreSQL
* Redis
* Celery workers

Use environment variables for secrets and configuration.

---

# 3. DEVELOPMENT PHILOSOPHY

DO NOT immediately start generating hundreds of files.

First:

1. Understand the requirements.
2. Define the architecture.
3. Define the domain model.
4. Define the database relationships.
5. Define the API.
6. Define permissions.
7. Define the major workflows.
8. Define the UI structure.
9. Then begin implementation incrementally.

Do not build fake functionality.

Do not create buttons that do nothing.

Do not hard-code financial calculations.

Do not hard-code ICAN courses into frontend components.

Do not store derived financial information unnecessarily.

Do not duplicate business logic between frontend and backend.

The backend must be the source of truth.

---

# 4. IMPORTANT DOMAIN RULE

Financial records must be treated as immutable or auditable wherever practical.

Never simply create:

```text
student.paid = true
```

Instead, model actual financial transactions.

A student's financial state should be derived from:

* Applicable fees/invoices
* Recorded payments
* Verified payment transactions
* Refunds/adjustments where applicable

Example:

Total fees:

₦150,000

Payments:

₦50,000
₦50,000

Outstanding:

₦50,000

The system must calculate this reliably.

---

# 5. USER ROLES

Implement role-based access control.

Initial roles:

## SUPER ADMIN

Full system access.

Can:

* Manage users
* Manage roles
* Manage levels
* Manage courses
* Manage sessions
* Manage fees
* View financial information
* Manage system settings
* Manage integrations
* View audit logs

## MANAGER

Can:

* View dashboard
* Manage students
* View enrollments
* View payments
* View financial reports
* Manage courses
* Manage classes
* View staff activity
* Send announcements

Manager permissions must not automatically include dangerous system-level configuration.

## FINANCE STAFF

Can:

* View students
* View enrollments
* Record payments
* Verify payments
* View invoices
* View outstanding balances
* Generate financial reports

Should NOT automatically have system administration permissions.

## STUDENT OFFICER / STAFF

Can:

* Register students
* Update student information
* Manage enrollments
* View assigned student information
* Manage class-related information

Should not automatically have access to all financial reports.

## IT ADMIN

Can:

* Manage system configuration
* Manage integrations
* Manage user accounts
* Monitor system health
* View technical audit information

Do not assume IT administrators should automatically have unrestricted financial access.

## STUDENT

Can:

* Register/login
* Manage profile
* View enrollment
* View courses
* View fees
* View invoices
* Make payments
* View payment history
* View outstanding balance
* View class schedule
* View attendance
* Receive announcements
* Receive notifications

---

# 6. CORE DOMAIN MODEL

Design the database around these entities.

At minimum:

* User
* StudentProfile
* StaffProfile
* AcademicSession
* Level
* Course
* CourseOffering
* Enrollment
* EnrollmentCourse
* FeeStructure
* Invoice
* InvoiceItem
* Payment
* PaymentAllocation
* Refund
* Class
* ClassSchedule
* Attendance
* Notification
* NotificationTemplate
* Announcement
* AuditLog
* PaymentReminder
* SystemSetting

Do not blindly implement these names if a better normalized architecture exists, but preserve the domain concepts.

---

# 7. ACADEMIC STRUCTURE

The system must support:

Foundation

Skills

Professional

Each level can have multiple courses.

Do NOT hard-code these courses.

Managers must be able to create/edit/deactivate:

* Levels
* Courses
* Sessions
* Course offerings
* Fees

Example:

```text
2026/2027
    |
    +-- Foundation
    |      +-- Course A
    |      +-- Course B
    |
    +-- Skills
    |      +-- Course C
    |      +-- Course D
    |
    +-- Professional
           +-- Course E
           +-- Course F
```

A course should be reusable across academic sessions.

---

# 8. ACADEMIC SESSIONS

Do not hard-code 2026/2027.

Create an AcademicSession model.

Example:

```text
2026/2027
2027/2028
2028/2029
```

Students enroll into a specific session.

A student may have multiple enrollments across different sessions.

---

# 9. STUDENT REGISTRATION

Student registration should collect configurable information.

Possible fields:

* First name
* Last name
* Other name
* Email
* Phone
* WhatsApp number
* Date of birth where required
* Gender where required
* Address
* ICAN student/exam identifier where applicable
* Emergency contact where required
* Profile photo where required

Do not collect unnecessary sensitive information.

Allow administrators to configure which fields are required.

Registration flow:

```text
Student
↓
Create account
↓
Verify account if enabled
↓
Complete profile
↓
Select academic session
↓
Select level
↓
Select courses
↓
System calculates applicable fees
↓
Invoice generated
↓
Student can pay
```

---

# 10. ENROLLMENT

An enrollment connects:

Student

to

Academic Session

and

Level

and

Selected Courses

The system must prevent invalid enrollment combinations.

Examples:

* Student cannot enroll in a Professional course under Foundation.
* Inactive courses cannot be selected.
* A student cannot accidentally create duplicate active enrollment for the same session/level.

---

# 11. COURSE MANAGEMENT

Managers should be able to:

* Create courses
* Edit courses
* Activate/deactivate courses
* Assign courses to levels
* Assign tutors
* Create course offerings
* Set schedules

Course information can include:

* Name
* Code
* Description
* Level
* Tutor
* Duration
* Status

---

# 12. FEES

Fees must NOT be hard-coded.

Create configurable fee structures.

Possible pricing models:

* Full level fee
* Individual course fee
* Registration fee
* Materials fee
* Examination-related fee
* Other configurable charges

The system should support future changes to pricing without changing code.

When an invoice is created, preserve the applicable amount at that point in time.

Do not allow future fee changes to silently alter historical invoices.

---

# 13. INVOICING

When a student enrolls, generate an invoice based on applicable fees.

Invoice should contain:

* Invoice number
* Student
* Enrollment
* Session
* Items
* Quantity
* Unit price
* Total
* Amount paid
* Outstanding balance
* Due date
* Status
* Creation date

Statuses may include:

* Draft
* Pending
* Partially Paid
* Paid
* Overdue
* Cancelled

The exact state machine should be designed carefully.

---

# 14. PAYMENTS

Support:

* Online payment
* Bank transfer
* Cash
* POS
* Manual payment entry

Online payments should use Paystack.

Payment records should contain:

* Payment ID
* Student
* Enrollment/invoice
* Amount
* Currency
* Payment method
* Provider
* Provider reference
* Status
* Transaction date
* Verification timestamp
* Verified by
* Metadata

Possible statuses:

* Pending
* Successful
* Failed
* Reversed
* Refunded

Prevent duplicate transactions using provider references/idempotency.

---

# 15. PAYSTACK FLOW

Implement:

```text
Student
↓
Creates payment request
↓
Backend creates/initializes transaction
↓
Student completes Paystack checkout
↓
Paystack sends webhook
↓
Backend verifies webhook
↓
Backend verifies transaction with Paystack
↓
Payment record created/updated
↓
Payment allocated to invoice
↓
Invoice balance recalculated
↓
Student balance updated
↓
Receipt generated
↓
Confirmation email/WhatsApp queued
```

Never mark a payment successful solely because the frontend says payment succeeded.

Webhook handling must be idempotent.

---

# 16. PAYMENT ALLOCATION

Support partial payments.

Example:

Invoice:

₦200,000

Payment:

₦50,000

Remaining:

₦150,000

Later:

₦100,000

Remaining:

₦50,000

Final:

₦50,000

The system should maintain the transaction history.

Do not overwrite previous payments.

---

# 17. MANUAL PAYMENTS

Staff may record:

* Bank transfer
* Cash
* POS

Manual payments should have a verification workflow.

Example:

```text
Staff records payment
↓
Payment = Pending Verification
↓
Finance staff/authorized manager verifies
↓
Payment = Verified
↓
Invoice balance updates
```

For bank transfer evidence, optionally allow:

* Receipt upload
* Transaction reference
* Bank name
* Payment date

---

# 18. FINANCIAL DASHBOARD

Management dashboard should show:

* Total students
* Active students
* Students by level
* Total invoiced
* Total collected
* Outstanding amount
* Overdue amount
* Payments today
* Payments this week
* Payments this month
* Recent transactions
* Outstanding students
* Collection rate

Example:

```text
Expected Revenue     ₦45,000,000
Collected            ₦32,500,000
Outstanding          ₦12,500,000
Collection Rate      72.2%
```

All financial figures must be calculated from database records.

---

# 19. STUDENT FINANCIAL PROFILE

Staff should be able to open a student and see:

```text
Student
├── Personal information
├── Enrollment
├── Courses
├── Invoice
├── Payments
├── Balance
├── Attendance
├── Communications
└── Audit history
```

Example:

```text
John Doe

Level:
Professional

Total Fees:
₦150,000

Paid:
₦100,000

Outstanding:
₦50,000

Payment History:

Sept 1     ₦50,000     Verified
Sept 5     ₦50,000     Verified
```

---

# 20. PAYMENT REMINDER ENGINE

Build a configurable reminder system.

Managers should be able to configure:

* Reminder timing
* Email template
* WhatsApp template
* Whether reminders are enabled
* Maximum reminders
* Quiet hours where appropriate

Example rules:

```text
7 days before due date
↓
Send reminder

3 days before
↓
Send reminder

1 day before
↓
Send reminder

Due date
↓
Send reminder

3 days overdue
↓
Send overdue reminder
```

Do not spam students.

Maintain a reminder history.

The system must know:

* Which reminder was sent
* When
* Through which channel
* Delivery status
* Template used

---

# 21. EMAIL SYSTEM

Create reusable templates.

Examples:

* Welcome email
* Registration confirmation
* Payment confirmation
* Invoice created
* Payment reminder
* Overdue payment
* Class reminder
* Announcement
* Password reset

Templates should support variables such as:

```text
{{student_name}}
{{level}}
{{amount_due}}
{{balance}}
{{due_date}}
{{invoice_number}}
```

Do not hard-code email content throughout the application.

---

# 22. WHATSAPP SYSTEM

Create a WhatsApp service abstraction.

Example:

```python
WhatsAppService.send_template(...)
```

Do not couple business logic directly to one WhatsApp provider.

Support:

* Payment confirmation
* Payment reminders
* Overdue reminders
* Class reminders
* Announcements

Use approved WhatsApp templates where required by the WhatsApp Business Platform.

Track:

* Message
* Recipient
* Template
* Sent timestamp
* Provider ID
* Delivery status
* Failure reason

---

# 23. NOTIFICATION CENTER

Students should have an in-app notification center.

Notifications can include:

* Payment confirmation
* Outstanding payment
* New announcement
* Class reminder
* Schedule change
* Account notification

Show:

* Read/unread
* Date
* Type
* Message

---

# 24. CLASS SCHEDULE

Support:

* Course
* Tutor
* Date
* Start time
* End time
* Location
* Online meeting URL where applicable

Students should see their personalized schedule based on their enrollment.

---

# 25. ATTENDANCE

Build attendance support.

Staff can mark:

* Present
* Absent
* Late
* Excused

Attendance should connect:

Student

to

Class

to

Course

to

Session

Provide student attendance percentage.

Example:

```text
Financial Reporting
Attendance: 85%

17 Present
2 Absent
1 Late
```

---

# 26. QR ATTENDANCE — FUTURE-READY

Structure the attendance architecture so QR attendance can be added.

Potential flow:

```text
Tutor starts attendance session
↓
System generates temporary QR code
↓
Students scan
↓
System validates enrollment
↓
Attendance recorded
```

Do not implement this before the core attendance system is stable.

---

# 27. ANNOUNCEMENTS

Managers can create announcements.

Target audience:

* All students
* Foundation
* Skills
* Professional
* Specific course
* Specific session

Channels:

* In-app
* Email
* WhatsApp

Allow scheduled announcements.

---

# 28. SEARCH

Global search should support:

* Student name
* Email
* Phone
* Student ID
* Invoice number
* Payment reference

Add filters:

* Level
* Course
* Session
* Payment status
* Enrollment status
* Date

---

# 29. REPORTING

Build reports for:

## Student reports

* Students by level
* Students by course
* New registrations
* Active/inactive students

## Financial reports

* Revenue
* Payments
* Outstanding balances
* Overdue invoices
* Payments by method
* Payments by date
* Revenue by level
* Revenue by course

## Attendance reports

* Attendance by student
* Attendance by course
* Attendance by session

Reports should support:

* Date filtering
* CSV export
* Excel export where appropriate
* PDF export where appropriate

---

# 30. AUDIT LOGGING

This is mandatory.

Record sensitive actions.

Examples:

```text
User created student
User edited student
User created invoice
User recorded payment
User verified payment
User cancelled payment
User changed fee
User changed course
User changed permissions
User sent announcement
```

Audit log:

```text
User
Action
Entity
Entity ID
Old value where appropriate
New value where appropriate
Timestamp
IP address where appropriate
```

Financial changes must be traceable.

---

# 31. SECURITY REQUIREMENTS

Implement:

* Password hashing
* CSRF protection where applicable
* Secure authentication
* Authorization checks
* Rate limiting where appropriate
* Input validation
* Output escaping
* SQL injection protection through ORM
* Secure file uploads
* File type validation
* Maximum upload sizes
* Secrets stored in environment variables
* HTTPS in production
* Secure cookies where applicable
* Audit logs
* Principle of least privilege

Never expose:

* API keys
* Paystack secret key
* Email credentials
* WhatsApp credentials
* Database credentials

to the frontend.

---

# 32. FILE UPLOAD SECURITY

For payment receipts and profile images:

Validate:

* MIME type
* File extension
* File size

Do not blindly trust the filename or MIME type.

Store uploaded files securely.

Do not allow uploaded files to execute as server-side code.

---

# 33. DATABASE DESIGN PRINCIPLES

Use proper normalization.

Use:

* Foreign keys
* Unique constraints
* Database indexes
* Check constraints where appropriate
* Transactions
* Referential integrity

Add indexes for frequently queried fields such as:

* email
* phone
* student ID
* invoice number
* payment reference
* session
* level
* payment status

Use database transactions around financial operations.

---

# 34. MULTI-TENANCY PREPARATION

The first deployment may serve one organization.

However, architect the domain so a future Organization/Tenant model can be introduced.

Future structure:

```text
Organization
    |
    ├── Users
    ├── Students
    ├── Courses
    ├── Sessions
    ├── Invoices
    └── Payments
```

Do not over-engineer full multi-tenancy in V1 unless necessary.

But avoid architectural decisions that make multi-tenancy impossible later.

---

# 35. FRONTEND DESIGN

Design a professional SaaS-style interface.

Avoid:

* Excessive gradients
* Huge unnecessary animations
* Random colors
* Cluttered dashboards
* Poor spacing
* Inconsistent buttons
* Giant cards everywhere

Use:

* Clean typography
* Strong visual hierarchy
* Responsive layout
* Consistent spacing
* Accessible forms
* Tables with filters
* Search
* Pagination
* Status badges
* Confirmation dialogs
* Toast notifications
* Empty states
* Loading states
* Error states

The design should feel appropriate for a professional accounting organization.

---

# 36. RESPONSIVE DESIGN

The application must work on:

* Desktop
* Laptop
* Tablet
* Mobile

Students are likely to access the portal heavily through mobile devices.

The staff/management dashboard may be desktop-first but must still be usable on tablets.

---

# 37. DASHBOARDS

Create separate dashboards.

## Student Dashboard

Show:

* Current level
* Current session
* Courses
* Total fees
* Amount paid
* Outstanding balance
* Next class
* Recent notifications

## Staff Dashboard

Show:

* Student registrations
* Pending payment verifications
* Recent students
* Upcoming classes

## Finance Dashboard

Show:

* Revenue
* Outstanding balances
* Pending payments
* Recent transactions
* Payment trends

## Manager Dashboard

Show:

* Student statistics
* Financial statistics
* Registration trends
* Outstanding payments
* Course distribution
* Recent activity

## IT Dashboard

Show:

* System health
* Users
* Integrations
* Background jobs
* Error monitoring where available
* Audit activity

---

# 38. API DESIGN

Build clean REST APIs.

Use consistent patterns.

Example:

```text
/api/auth/
/api/students/
/api/staff/
/api/sessions/
/api/levels/
/api/courses/
/api/enrollments/
/api/invoices/
/api/payments/
/api/attendance/
/api/notifications/
/api/announcements/
/api/reports/
/api/audit-logs/
```

Use:

* Pagination
* Filtering
* Sorting
* Validation
* Proper HTTP status codes
* Consistent error responses

Never expose fields that the current user should not see.

---

# 39. ERROR HANDLING

Build useful error handling.

Backend errors should return structured responses.

Frontend should display human-readable messages.

Never expose stack traces or secrets to users in production.

Implement proper logging.

---

# 40. TESTING

Testing is mandatory.

Create tests for:

## Authentication

* Login
* Logout
* Password reset
* Permissions

## Enrollment

* Valid enrollment
* Duplicate enrollment
* Invalid course/level combination

## Payments

* Successful payment
* Failed payment
* Partial payment
* Duplicate webhook
* Refund
* Manual payment
* Payment verification

## Financial calculations

Test extensively.

Example:

```text
Invoice = ₦100,000
Payment 1 = ₦30,000
Payment 2 = ₦20,000

Balance must equal ₦50,000
```

Test edge cases.

## Reminders

Test:

* Due soon
* Due today
* Overdue
* Already reminded
* Reminder disabled

## Permissions

Verify users cannot access unauthorized resources.

---

# 41. SEED DATA

Create development seed data.

Include:

* Demo organization
* Demo admin
* Demo manager
* Demo finance staff
* Demo student officer
* Demo students
* Foundation
* Skills
* Professional
* Example courses
* Example session
* Example invoices
* Example payments

Clearly mark this as development/demo data.

---

# 42. ENVIRONMENT CONFIGURATION

Create:

```text
.env.example
```

Include placeholders for:

```text
DATABASE_URL
SECRET_KEY
DEBUG
ALLOWED_HOSTS

PAYSTACK_PUBLIC_KEY
PAYSTACK_SECRET_KEY

EMAIL_API_KEY
EMAIL_FROM

WHATSAPP_API_KEY
WHATSAPP_PHONE_NUMBER_ID

REDIS_URL
```

Never commit actual secrets.

---

# 43. DOCUMENTATION

Create documentation covering:

* Project setup
* Environment variables
* Database setup
* Migrations
* Seed data
* Running backend
* Running frontend
* Running Celery
* Running Redis
* Testing
* Deployment
* Payment configuration
* Webhook configuration
* Email configuration
* WhatsApp configuration

---

# 44. DEVELOPMENT PHASES

Do NOT build everything simultaneously.

Build in phases.

## PHASE 0 — ARCHITECTURE

Before writing implementation code, produce:

1. System architecture
2. ERD
3. Database model explanation
4. Role/permission matrix
5. API architecture
6. Application folder structure
7. Main workflows
8. Security model
9. Development roadmap

Then wait for approval before moving to implementation if operating interactively.

---

# PHASE 1 — FOUNDATION

Build:

* Django project
* React project
* PostgreSQL connection
* Authentication
* User model
* Role system
* Base UI
* API structure
* Environment configuration

---

# PHASE 2 — ACADEMIC MANAGEMENT

Build:

* Sessions
* Levels
* Courses
* Course offerings
* Classes
* Schedules

Admin/manager CRUD.

---

# PHASE 3 — STUDENT MANAGEMENT

Build:

* Student registration
* Student profiles
* Student portal
* Student search
* Enrollment
* Course selection

---

# PHASE 4 — FINANCIAL SYSTEM

Build:

* Fee structures
* Invoices
* Invoice items
* Payments
* Partial payments
* Payment allocation
* Manual payments
* Payment verification
* Balance calculations
* Financial dashboard

This phase must be heavily tested.

---

# PHASE 5 — PAYSTACK

Build:

* Payment initialization
* Checkout
* Webhook
* Server-side verification
* Idempotency
* Transaction history
* Payment receipt

---

# PHASE 6 — COMMUNICATION

Build:

* Email service
* Email templates
* Notification center
* WhatsApp service abstraction
* Message logs
* Payment reminders

---

# PHASE 7 — ATTENDANCE

Build:

* Classes
* Attendance
* Attendance dashboard
* Attendance reports

---

# PHASE 8 — REPORTING

Build:

* Financial reports
* Student reports
* Attendance reports
* CSV export
* Excel export
* PDF export

---

# PHASE 9 — AUDITING & SECURITY HARDENING

Build:

* Audit logs
* Permission review
* Rate limiting
* Secure file uploads
* Security testing
* Error handling
* Logging

---

# PHASE 10 — DEPLOYMENT

Prepare:

* Production environment
* PostgreSQL
* Redis
* Celery
* Frontend deployment
* Backend deployment
* HTTPS
* Domain
* Paystack webhook
* Email
* WhatsApp

---

# 45. IMPORTANT BUSINESS WORKFLOWS

Implement and document these workflows.

## Registration

```text
Student registers
→ Profile created
→ Enrollment created
→ Courses selected
→ Fees calculated
→ Invoice generated
→ Student receives confirmation
```

## Online Payment

```text
Student opens invoice
→ Clicks Pay
→ Paystack
→ Payment completed
→ Webhook
→ Backend verifies
→ Payment recorded
→ Invoice updated
→ Receipt
→ Notification
```

## Manual Payment

```text
Staff records payment
→ Pending verification
→ Authorized staff verifies
→ Payment becomes verified
→ Balance updates
→ Receipt
```

## Reminder

```text
Scheduled job
→ Find unpaid/partially-paid invoices
→ Check reminder rules
→ Generate message
→ Queue email/WhatsApp
→ Send
→ Log result
```

---

# 46. BUSINESS RULES

Implement business rules centrally in the backend.

Examples:

* Inactive courses cannot be enrolled in.
* Inactive sessions cannot receive new enrollments.
* Payments cannot be negative.
* Refunds cannot exceed the amount paid.
* Successful payment references must be unique.
* Students cannot access another student's invoice.
* Staff cannot perform actions outside their permissions.
* Historical invoices must not change when fee structures change.
* Payment records should not be silently deleted.
* Financial adjustments should be auditable.

---

# 47. UX PRINCIPLES

Every important operation must provide:

* Loading state
* Success state
* Error state
* Empty state
* Confirmation where destructive
* Clear feedback

Example:

When verifying payment:

```text
Verify payment?

Student: John Doe
Amount: ₦50,000
Reference: PSK_123456

[Cancel] [Verify Payment]
```

After success:

```text
Payment verified successfully.
Student balance updated.
Receipt generated.
```

---

# 48. DO NOT MAKE THESE MISTAKES

Never:

1. Store passwords in plain text.
2. Trust frontend payment confirmation.
3. Hard-code course names.
4. Hard-code fees.
5. Use a single boolean for payment status.
6. Delete financial transactions without an audit trail.
7. Put secret API keys in React.
8. Give every staff member admin access.
9. Send WhatsApp messages through unofficial scraping.
10. Put business logic only in the frontend.
11. Build a fake dashboard with hard-coded numbers.
12. Build everything into one giant component.
13. Ignore mobile UX.
14. Skip database constraints.
15. Skip tests for financial calculations.

---

# 49. CODE QUALITY

Use:

* Clear naming
* Small reusable components
* Service layers where appropriate
* Serializers
* Validators
* Permission classes
* Database transactions
* TypeScript types
* Proper error handling
* Reusable UI components

Avoid:

* Massive files
* Duplicate logic
* Magic numbers
* Hard-coded business rules
* Unused dependencies
* Dead code

---

# 50. AI DEVELOPMENT RULES

If you are an AI coding agent, follow these rules:

### Rule 1

Never assume a requirement that affects financial data.

If something is ambiguous, identify the ambiguity before implementation.

### Rule 2

Before modifying an existing feature, inspect the existing implementation.

Do not overwrite working functionality blindly.

### Rule 3

After implementing a feature:

1. Run tests.
2. Check migrations.
3. Check API behavior.
4. Check frontend behavior.
5. Check permissions.
6. Check edge cases.

### Rule 4

Do not mark a task complete simply because code was generated.

A feature is complete only when it works end-to-end.

### Rule 5

When you encounter an error, diagnose the root cause rather than applying random fixes.

### Rule 6

Do not introduce a dependency unless it is necessary.

### Rule 7

Keep the application maintainable.

---

# 51. FIRST TASK

Before writing implementation code, produce the following:

## A. System architecture

Explain:

* Frontend
* Backend
* Database
* Redis
* Celery
* Paystack
* Email
* WhatsApp

## B. ERD

Show all core entities and relationships.

## C. Role permission matrix

Example:

| Feature | Student | Staff | Finance | Manager | IT | Super Admin |
| ------- | ------- | ----- | ------- | ------- | -- | ----------- |

## D. Database schema

Define the important fields and relationships.

## E. API specification

Define major endpoints.

## F. Frontend route structure

Example:

```text
/login
/register
/student/dashboard
/student/profile
/student/enrollment
/student/invoices
/student/payments
/student/schedule

/admin/dashboard
/admin/students
/admin/enrollments
/admin/payments
/admin/invoices
/admin/courses
/admin/sessions
/admin/reports
/admin/users
/admin/audit-logs
/admin/settings
```

## G. Application folder structure

Define the recommended Django and React architecture.

## H. Core workflows

Document:

* Registration
* Enrollment
* Invoice creation
* Payment
* Payment verification
* Reminder
* Attendance

## I. MVP boundary

Clearly identify what belongs in V1 and what should wait for V2.

DO NOT start building random UI screens before completing this architecture.

After presenting the architecture, begin implementation in small, verifiable phases.

---

# 52. FINAL PRODUCT STANDARD

The finished product should feel like a serious internal business platform, not a student project.

It should be:

* Secure
* Maintainable
* Responsive
* Auditable
* Financially reliable
* Scalable
* Easy for staff to use
* Easy for students to use
* Ready for real-world deployment

The most important principle is:

**The system must always be able to answer:**

> Who is this student?

> What are they enrolled in?

> What do they owe?

> What have they paid?

> When did they pay?

> Who verified the payment?

> What communication have they received?

> What classes have they attended?

> Who changed their records?

> And what is the firm's financial position right now?

Build the system so those questions can be answered accurately from the database at any time.
