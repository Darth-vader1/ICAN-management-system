# ICAN Platform - Testing Guide

Complete testing guide for the ICAN Tutorial Centre Management Platform.

## 📋 Table of Contents

1. [Setup](#setup)
2. [Demo Accounts](#demo-accounts)
3. [Backend Testing](#backend-testing)
4. [Frontend Testing](#frontend-testing)
5. [Integration Testing](#integration-testing)
6. [Common Issues](#common-issues)

## 🚀 Setup

### Backend Setup

```bash
cd backend

# Activate virtual environment
# Windows
venv\Scripts\activate

# Run migrations
python manage.py migrate

# Create seed data
python create_seed_data.py

# Start server
python manage.py runserver
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Update .env with backend URL
# VITE_API_URL=http://localhost:8000

# Start dev server
npm run dev
```

## 👥 Demo Accounts

All passwords are: `[role]123456`

| Role | Email | Password | Access Level |
|------|-------|----------|--------------|
| Super Admin | admin@ican.edu | admin123456 | Full system access |
| Manager | manager@ican.edu | manager123456 | Management functions |
| Finance | finance@ican.edu | finance123456 | Billing & financial reports |
| Student Officer | officer@ican.edu | officer123456 | Student management |
| IT Admin | it@ican.edu | itadmin123456 | Technical administration |
| Student 1 | student@ican.edu | student123456 | Student portal |
| Student 2 | student2@ican.edu | student123456 | Student portal |
| Student 3 | student3@ican.edu | student123456 | Student portal |

## 🧪 Backend Testing

### 1. Authentication Tests

#### Test Login
```bash
# Using curl
curl -X POST http://localhost:8000/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@ican.edu", "password": "admin123456"}'

# Expected: 200 OK with tokens
# {
#   "access": "eyJ0eXAi...",
#   "refresh": "eyJ0eXAi...",
#   "user": {...}
# }
```

#### Test Token Refresh
```bash
curl -X POST http://localhost:8000/auth/refresh/ \
  -H "Content-Type: application/json" \
  -d '{"refresh": "YOUR_REFRESH_TOKEN"}'

# Expected: 200 OK with new access token
```

#### Test Protected Endpoint
```bash
curl -X GET http://localhost:8000/auth/me/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# Expected: 200 OK with user profile
```

### 2. Academic Management Tests

#### List Sessions
```bash
curl -X GET http://localhost:8000/academics/sessions/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# Expected: List of academic sessions
```

#### Create Course (Staff only)
```bash
curl -X POST http://localhost:8000/academics/courses/ \
  -H "Authorization: Bearer YOUR_STAFF_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "ATS101",
    "name": "Introduction to Accounting",
    "level": "foundation",
    "credits": 3
  }'

# Expected: 201 Created
```

### 3. Enrollment Tests

#### List Student Enrollments
```bash
curl -X GET http://localhost:8000/enrollments/ \
  -H "Authorization: Bearer YOUR_STUDENT_TOKEN"

# Expected: List of enrollments
```

#### Create Enrollment
```bash
curl -X POST http://localhost:8000/enrollments/ \
  -H "Authorization: Bearer YOUR_STUDENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "session": "SESSION_ID",
    "level": "LEVEL_ID",
    "courses": ["COURSE_ID_1", "COURSE_ID_2"]
  }'

# Expected: 201 Created with invoice
```

### 4. Billing Tests

#### List Invoices
```bash
curl -X GET http://localhost:8000/billing/invoices/ \
  -H "Authorization: Bearer YOUR_STUDENT_TOKEN"

# Expected: List of invoices
```

#### Get Invoice PDF
```bash
curl -X GET http://localhost:8000/billing/invoices/INVOICE_ID/pdf/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  --output invoice.pdf

# Expected: PDF file downloaded
```

### 5. Payment Tests

#### Initialize Payment
```bash
curl -X POST http://localhost:8000/payments/initialize/ \
  -H "Authorization: Bearer YOUR_STUDENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "invoice_id": "INVOICE_ID",
    "amount": 50000.00
  }'

# Expected: 200 OK with Paystack authorization URL
```

#### Verify Payment (Webhook simulation)
```bash
# Note: This endpoint is called by Paystack, not directly
curl -X POST http://localhost:8000/payments/webhook/ \
  -H "Content-Type: application/json" \
  -H "X-Paystack-Signature: SIGNATURE" \
  -d '{
    "event": "charge.success",
    "data": {
      "reference": "PAYMENT_REFERENCE"
    }
  }'
```

### 6. Notification Tests

#### List Notifications
```bash
curl -X GET http://localhost:8000/notifications/ \
  -H "Authorization: Bearer YOUR_TOKEN"

# Expected: List of notifications
```

#### Mark as Read
```bash
curl -X POST http://localhost:8000/notifications/NOTIFICATION_ID/mark-read/ \
  -H "Authorization: Bearer YOUR_TOKEN"

# Expected: 200 OK
```

### 7. Attendance Tests

#### List Attendance Sessions
```bash
curl -X GET http://localhost:8000/attendance/sessions/ \
  -H "Authorization: Bearer YOUR_TOKEN"

# Expected: List of attendance sessions
```

#### Record Attendance (Staff only)
```bash
curl -X POST http://localhost:8000/attendance/records/ \
  -H "Authorization: Bearer YOUR_STAFF_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "session": "SESSION_ID",
    "student": "STUDENT_ID",
    "status": "present"
  }'

# Expected: 201 Created
```

### 8. Reports Tests

#### Generate Financial Report
```bash
curl -X GET "http://localhost:8000/reports/financial/?start_date=2024-01-01&end_date=2024-12-31" \
  -H "Authorization: Bearer YOUR_STAFF_TOKEN"

# Expected: Financial report data
```

#### Export to Excel
```bash
curl -X GET "http://localhost:8000/reports/financial/export/?format=excel" \
  -H "Authorization: Bearer YOUR_STAFF_TOKEN" \
  --output report.xlsx

# Expected: Excel file downloaded
```

## 🖥️ Frontend Testing

### Manual Testing Checklist

#### Authentication Flow
- [ ] Login page loads correctly
- [ ] Can login with valid credentials
- [ ] Invalid credentials show error
- [ ] Register page works
- [ ] Logout clears session
- [ ] Protected routes redirect to login

#### Dashboard
- [ ] Dashboard loads with correct role-specific data
- [ ] Stats display correctly
- [ ] Recent activities show
- [ ] Quick actions work

#### Academic Management (Staff)
- [ ] Can view sessions, levels, courses
- [ ] Can create new course
- [ ] Can edit course
- [ ] Can delete course
- [ ] Search and filters work

#### Enrollment (Student)
- [ ] Can view current enrollments
- [ ] Can start new enrollment
- [ ] Course selection works
- [ ] Enrollment wizard completes
- [ ] Invoice is generated

#### Billing
- [ ] Invoices list displays
- [ ] Invoice details page loads
- [ ] Payment history shows
- [ ] Can click "Pay" button
- [ ] Paystack popup appears
- [ ] Payment updates invoice

#### Profile
- [ ] Profile page loads
- [ ] Can edit profile
- [ ] Changes save correctly
- [ ] Validation works

#### Attendance
- [ ] Attendance dashboard loads
- [ ] Stats display correctly
- [ ] Session list shows
- [ ] Can mark attendance (staff)

#### Notifications
- [ ] Notification bell shows count
- [ ] Notification center lists all
- [ ] Can mark as read
- [ ] Auto-refresh works

#### Reports (Staff)
- [ ] Reports dashboard loads
- [ ] Can generate report
- [ ] Date filters work
- [ ] Export buttons work
- [ ] Files download correctly

### Browser Testing

Test on:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile browsers

### Responsive Testing

Test on:
- [ ] Desktop (1920x1080)
- [ ] Laptop (1366x768)
- [ ] Tablet (768px)
- [ ] Mobile (375px)

## 🔗 Integration Testing

### End-to-End Workflow: Student Registration to Payment

1. **Register New Student**
   ```
   POST /auth/register/
   → Creates user account
   → Creates student profile
   ```

2. **Login**
   ```
   POST /auth/login/
   → Returns JWT tokens
   → Redirect to dashboard
   ```

3. **Create Enrollment**
   ```
   POST /enrollments/
   → Creates enrollment
   → Creates invoice
   → Sends notification
   ```

4. **View Invoice**
   ```
   GET /billing/invoices/
   → Lists invoices
   GET /billing/invoices/{id}/
   → Shows invoice details
   ```

5. **Make Payment**
   ```
   POST /payments/initialize/
   → Returns Paystack URL
   → Student redirects to Paystack
   → Student completes payment
   → Paystack webhook fires
   → Payment recorded
   → Invoice updated
   → Receipt sent
   ```

6. **Verify Payment**
   ```
   GET /billing/invoices/{id}/
   → Status shows "paid"
   GET /payments/
   → Payment appears in history
   ```

### Expected Database Changes

```sql
-- After enrollment
SELECT * FROM enrollments WHERE student_id = 'STUDENT_ID';
SELECT * FROM invoices WHERE enrollment_id = 'ENROLLMENT_ID';

-- After payment
SELECT * FROM payments WHERE invoice_id = 'INVOICE_ID';
SELECT * FROM invoices WHERE id = 'INVOICE_ID'; -- status = 'paid'

-- Check notifications
SELECT * FROM notifications WHERE user_id = 'USER_ID';
```

## 🐛 Common Issues

### Backend Issues

#### 1. CORS Errors
```python
# In settings.py, check:
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",  # Frontend dev server
]
```

#### 2. Authentication Fails
```python
# Check JWT settings
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
}
```

#### 3. Migrations Not Applied
```bash
python manage.py showmigrations
python manage.py migrate
```

#### 4. Seed Data Errors
```bash
# Delete database and recreate
rm db.sqlite3
python manage.py migrate
python create_seed_data.py
```

### Frontend Issues

#### 1. API Not Connecting
```env
# Check .env file
VITE_API_URL=http://localhost:8000  # No trailing slash
```

#### 2. Token Expired
- Logout and login again
- Check token expiry in browser DevTools → Application → Local Storage

#### 3. Routes Not Working
- Check BrowserRouter is wrapping app
- Check path names match exactly

#### 4. Build Errors
```bash
# Clear and reinstall
rm -rf node_modules package-lock.json
npm install
```

## ✅ Test Results Template

```markdown
## Test Session: [Date]

### Environment
- Backend: Running on port 8000
- Frontend: Running on port 5173
- Database: SQLite (db.sqlite3)
- Browser: Chrome 120

### Authentication ✅
- [x] Login works
- [x] Token refresh works
- [x] Logout works

### Enrollment ✅
- [x] Can create enrollment
- [x] Invoice generated
- [x] Notification sent

### Payment ⚠️
- [x] Payment initializes
- [ ] Webhook receives event (Need Paystack test mode)
- [x] Invoice updates

### Issues Found
1. Issue description
   - Steps to reproduce
   - Expected vs Actual
   - Priority: High/Medium/Low

### Notes
- Additional observations
```

## 📊 Performance Testing

### Load Testing with Apache Bench

```bash
# Test login endpoint
ab -n 100 -c 10 -p login.json -T application/json \
  http://localhost:8000/auth/login/

# Expected: < 500ms average response time
```

### Database Query Performance

```python
# In Django shell
python manage.py shell

from django.db import connection
from django.test.utils import CaptureQueriesContext

with CaptureQueriesContext(connection) as queries:
    # Your code here
    list(Invoice.objects.all())

print(f"Queries: {len(queries)}")
# Expected: Minimal N+1 queries
```

## 🔒 Security Testing

### Checklist
- [ ] SQL injection protected (parameterized queries)
- [ ] XSS protected (React escapes by default)
- [ ] CSRF protected (Django CSRF middleware)
- [ ] Authentication required on protected endpoints
- [ ] Authorization checked (role-based permissions)
- [ ] Passwords hashed (Django default)
- [ ] HTTPS in production
- [ ] Environment variables not committed

## 📝 Test Coverage Goals

- Backend: > 80% code coverage
- Frontend: > 70% code coverage
- E2E: All critical paths covered

---

**Happy Testing! 🎉**

For issues or questions, contact the development team.
