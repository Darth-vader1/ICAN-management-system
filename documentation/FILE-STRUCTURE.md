# ICAN Platform - Complete File Structure

## 📂 Project Directory Tree

```
ICAN management system/
│
├── 📄 README.md                              # Main documentation
├── 📄 QUICK-START.md                         # Quick setup guide
├── 📄 FINAL-SUMMARY.md                       # Project completion summary
├── 📄 PROJECT-STATUS.md                      # Current status tracking
├── 📄 FRONTEND-COMPLETION-SUMMARY.md         # Frontend details
├── 📄 FILE-STRUCTURE.md                      # This file
├── 📄 .gitignore                             # Git ignore rules
├── 📄 setup-database.sql                     # PostgreSQL setup
├── 📄 docker-compose.yml                     # Docker configuration (optional)
│
├── 📁 documentation/                         # All documentation
│   ├── 📄 plan.md                           # Complete project plan
│   ├── 📄 TESTING-GUIDE.md                  # Testing procedures
│   ├── 📄 DEPLOYMENT-GUIDE.md               # Deployment instructions
│   ├── 📄 database-setup.md                 # Database schema
│   ├── 📄 Phase-0-Foundation.md             # Phase summaries
│   ├── 📄 Phase-1-User-Management.md
│   ├── 📄 Phase-2-Academic-Management.md
│   ├── 📄 Phase-3-Student-Enrollment.md
│   ├── 📄 Phase-4-Billing.md
│   ├── 📄 Phase-5-Paystack.md
│   ├── 📄 Phase-6-Communication.md
│   ├── 📄 Phase-7-Attendance.md
│   └── 📄 Phase-8-Reporting.md
│
├── 📁 backend/                               # Django backend
│   ├── 📄 manage.py                         # Django management
│   ├── 📄 requirements.txt                   # Python dependencies
│   ├── 📄 create_seed_data.py               # Seed data script
│   ├── 📄 db.sqlite3                        # SQLite database
│   ├── 📄 .env                              # Environment variables
│   ├── 📄 .env.example                      # Env template
│   │
│   ├── 📁 config/                           # Django configuration
│   │   ├── 📄 __init__.py                  # Celery init
│   │   ├── 📄 settings.py                  # Django settings
│   │   ├── 📄 urls.py                      # Main URL config
│   │   ├── 📄 wsgi.py                      # WSGI config
│   │   ├── 📄 asgi.py                      # ASGI config
│   │   └── 📄 celery.py                    # Celery config
│   │
│   ├── 📁 users/                            # User management
│   │   ├── 📄 __init__.py
│   │   ├── 📄 models.py                    # User model
│   │   ├── 📄 views.py                     # Auth endpoints
│   │   ├── 📄 serializers.py               # User serializers
│   │   ├── 📄 permissions.py               # Custom permissions
│   │   ├── 📄 urls.py                      # Auth URLs
│   │   ├── 📄 admin.py                     # Admin config
│   │   ├── 📄 apps.py                      # App config
│   │   ├── 📄 tests.py                     # Tests (to add)
│   │   ├── 📄 exceptions.py                # Custom exceptions
│   │   └── 📁 migrations/                   # DB migrations
│   │
│   ├── 📁 students/                         # Student profiles
│   │   ├── 📄 __init__.py
│   │   ├── 📄 models.py                    # StudentProfile model
│   │   ├── 📄 views.py                     # Student endpoints
│   │   ├── 📄 serializers.py
│   │   ├── 📄 urls.py
│   │   ├── 📄 admin.py
│   │   ├── 📄 apps.py
│   │   ├── 📄 tests.py
│   │   └── 📁 migrations/
│   │
│   ├── 📁 academics/                        # Academic management
│   │   ├── 📄 __init__.py
│   │   ├── 📄 models.py                    # Session, Level, Course
│   │   ├── 📄 views.py                     # Academic endpoints
│   │   ├── 📄 serializers.py
│   │   ├── 📄 urls.py
│   │   ├── 📄 admin.py
│   │   ├── 📄 apps.py
│   │   ├── 📄 tests.py
│   │   └── 📁 migrations/
│   │
│   ├── 📁 enrollments/                      # Student enrollments
│   │   ├── 📄 __init__.py
│   │   ├── 📄 models.py                    # Enrollment model
│   │   ├── 📄 views.py                     # Enrollment endpoints
│   │   ├── 📄 serializers.py
│   │   ├── 📄 urls.py
│   │   ├── 📄 admin.py
│   │   ├── 📄 apps.py
│   │   ├── 📄 tests.py
│   │   └── 📁 migrations/
│   │
│   ├── 📁 billing/                          # Invoicing
│   │   ├── 📄 __init__.py
│   │   ├── 📄 models.py                    # Invoice, FeeStructure
│   │   ├── 📄 views.py                     # Billing endpoints
│   │   ├── 📄 serializers.py
│   │   ├── 📄 urls.py
│   │   ├── 📄 admin.py
│   │   ├── 📄 apps.py
│   │   ├── 📄 tests.py
│   │   ├── 📄 utils.py                     # PDF generation
│   │   └── 📁 migrations/
│   │
│   ├── 📁 payments/                         # Payment processing
│   │   ├── 📄 __init__.py
│   │   ├── 📄 models.py                    # Payment model
│   │   ├── 📄 views.py                     # Payment endpoints
│   │   ├── 📄 serializers.py
│   │   ├── 📄 urls.py
│   │   ├── 📄 admin.py
│   │   ├── 📄 apps.py
│   │   ├── 📄 tests.py
│   │   ├── 📄 services.py                  # Paystack integration
│   │   ├── 📄 utils.py                     # Payment utilities
│   │   └── 📁 migrations/
│   │
│   ├── 📁 attendance/                       # Attendance tracking
│   │   ├── 📄 __init__.py
│   │   ├── 📄 models.py                    # AttendanceSession, Record
│   │   ├── 📄 views.py                     # Attendance endpoints
│   │   ├── 📄 serializers.py
│   │   ├── 📄 urls.py
│   │   ├── 📄 admin.py
│   │   ├── 📄 apps.py
│   │   ├── 📄 tests.py
│   │   └── 📁 migrations/
│   │
│   ├── 📁 notifications/                    # Notification system
│   │   ├── 📄 __init__.py
│   │   ├── 📄 models.py                    # Notification, Template
│   │   ├── 📄 views.py                     # Notification endpoints
│   │   ├── 📄 serializers.py
│   │   ├── 📄 urls.py
│   │   ├── 📄 admin.py
│   │   ├── 📄 apps.py
│   │   ├── 📄 tests.py
│   │   ├── 📄 services.py                  # Email service
│   │   ├── 📄 tasks.py                     # Celery tasks
│   │   └── 📁 migrations/
│   │
│   ├── 📁 reports/                          # Report generation
│   │   ├── 📄 __init__.py
│   │   ├── 📄 views.py                     # Report endpoints
│   │   ├── 📄 serializers.py
│   │   ├── 📄 urls.py
│   │   ├── 📄 admin.py
│   │   ├── 📄 apps.py
│   │   ├── 📄 tests.py
│   │   ├── 📄 utils.py                     # Export utilities
│   │   └── 📁 migrations/
│   │
│   ├── 📁 audit/                            # Audit logging
│   │   ├── 📄 __init__.py
│   │   ├── 📄 models.py                    # AuditLog model
│   │   ├── 📄 views.py                     # Audit endpoints
│   │   ├── 📄 serializers.py
│   │   ├── 📄 urls.py
│   │   ├── 📄 admin.py
│   │   ├── 📄 apps.py
│   │   ├── 📄 tests.py
│   │   ├── 📄 middleware.py                # Audit middleware
│   │   ├── 📄 utils.py                     # Audit utilities
│   │   └── 📁 migrations/
│   │
│   ├── 📁 venv/                             # Virtual environment
│   │   └── ...
│   │
│   └── 📁 staticfiles/                      # Collected static files
│       └── ...
│
├── 📁 frontend/                              # React frontend
│   ├── 📄 package.json                      # Node dependencies
│   ├── 📄 package-lock.json
│   ├── 📄 tsconfig.json                     # TypeScript config
│   ├── 📄 vite.config.ts                    # Vite config
│   ├── 📄 tailwind.config.js                # Tailwind config
│   ├── 📄 postcss.config.js                 # PostCSS config
│   ├── 📄 eslint.config.js                  # ESLint config
│   ├── 📄 .env                              # Environment variables
│   ├── 📄 .env.example                      # Env template
│   ├── 📄 index.html                        # HTML entry point
│   ├── 📄 README.md                         # Frontend documentation
│   │
│   ├── 📁 src/                              # Source code
│   │   ├── 📄 main.tsx                     # Application entry
│   │   ├── 📄 App.tsx                      # Main app component
│   │   ├── 📄 App.css                      # App styles
│   │   ├── 📄 index.css                    # Global styles
│   │   │
│   │   ├── 📁 components/                   # Reusable components
│   │   │   ├── 📄 Layout.tsx               # Main layout with sidebar
│   │   │   ├── 📄 ProtectedRoute.tsx       # Route protection
│   │   │   ├── 📄 NotificationBell.tsx     # Notification bell
│   │   │   └── 📄 PaystackButton.tsx       # Payment button
│   │   │
│   │   ├── 📁 pages/                        # Page components
│   │   │   ├── 📄 LoginPage.tsx            # Login page
│   │   │   ├── 📄 RegisterPage.tsx         # Registration page
│   │   │   ├── 📄 DashboardPage.tsx        # Main dashboard
│   │   │   ├── 📄 ProfilePage.tsx          # User profile
│   │   │   ├── 📄 AcademicsPage.tsx        # Academic management
│   │   │   ├── 📄 StudentEnrollmentDashboard.tsx
│   │   │   ├── 📄 EnrollmentWizard.tsx     # Enrollment wizard
│   │   │   ├── 📄 BillingPage.tsx          # Billing overview
│   │   │   ├── 📄 InvoiceDetailPage.tsx    # Invoice details
│   │   │   ├── 📄 AttendanceDashboard.tsx  # Attendance tracking
│   │   │   ├── 📄 NotificationCenter.tsx   # Notification center
│   │   │   └── 📄 ReportsDashboard.tsx     # Reports
│   │   │
│   │   ├── 📁 services/                     # API clients
│   │   │   ├── 📄 authService.ts           # Authentication API
│   │   │   ├── 📄 academicsService.ts      # Academic API
│   │   │   ├── 📄 studentService.ts        # Student API
│   │   │   ├── 📄 enrollmentService.ts     # Enrollment API
│   │   │   ├── 📄 billingService.ts        # Billing API
│   │   │   ├── 📄 attendanceService.ts     # Attendance API
│   │   │   ├── 📄 notificationService.ts   # Notification API
│   │   │   └── 📄 reportService.ts         # Report API
│   │   │
│   │   ├── 📁 types/                        # TypeScript types
│   │   │   ├── 📄 auth.ts                  # Auth types
│   │   │   ├── 📄 academics.ts             # Academic types
│   │   │   ├── 📄 enrollment.ts            # Enrollment types
│   │   │   ├── 📄 billing.ts               # Billing types
│   │   │   ├── 📄 attendance.ts            # Attendance types
│   │   │   ├── 📄 notification.ts          # Notification types
│   │   │   └── 📄 report.ts                # Report types
│   │   │
│   │   ├── 📁 contexts/                     # React contexts
│   │   │   └── 📄 AuthContext.tsx          # Auth context
│   │   │
│   │   ├── 📁 lib/                          # Utilities
│   │   │   ├── 📄 api.ts                   # Axios instance
│   │   │   └── 📄 roles.ts                 # Role utilities
│   │   │
│   │   └── 📁 assets/                       # Static assets
│   │       └── react.svg
│   │
│   ├── 📁 node_modules/                     # Node dependencies
│   │   └── ...
│   │
│   ├── 📁 dist/                             # Production build
│   │   └── ... (created after `npm run build`)
│   │
│   └── 📁 public/                           # Public assets
│       └── ...
│
└── 📁 .git/                                  # Git repository
    └── ...
```

---

## 📊 File Count Summary

### Backend
```
Django Apps:          10
Python Files:         80+
Models:               20+
API Views:            40+
Migrations:           30+
Lines of Code:        ~8,000
```

### Frontend
```
Components:           4
Pages:                12
Services:             8
Type Files:           7
Context Providers:    1
Lines of Code:        ~5,000
```

### Documentation
```
Markdown Files:       15+
Code Examples:        50+
Diagrams:             5+
```

### Configuration
```
Backend Config:       5 files
Frontend Config:      6 files
Docker:               2 files
Environment:          4 files
```

---

## 🔑 Key Files to Know

### Backend Entry Points
- `backend/manage.py` - Django CLI
- `backend/config/settings.py` - All settings
- `backend/config/urls.py` - URL routing
- `backend/create_seed_data.py` - Demo data

### Frontend Entry Points
- `frontend/src/main.tsx` - App entry
- `frontend/src/App.tsx` - Route config
- `frontend/src/lib/api.ts` - API client
- `frontend/src/contexts/AuthContext.tsx` - Auth state

### Configuration Files
- `backend/.env` - Backend env vars
- `frontend/.env` - Frontend env vars
- `backend/requirements.txt` - Python deps
- `frontend/package.json` - Node deps

### Documentation
- `README.md` - Main docs
- `QUICK-START.md` - Setup guide
- `documentation/TESTING-GUIDE.md` - Testing
- `documentation/DEPLOYMENT-GUIDE.md` - Deploy

---

## 📱 Pages by Route

### Public Routes
```
/login              → LoginPage.tsx
/register           → RegisterPage.tsx
```

### Protected Routes (Layout)
```
/dashboard          → DashboardPage.tsx
/profile            → ProfilePage.tsx
/academics          → AcademicsPage.tsx
/enrollments        → StudentEnrollmentDashboard.tsx
/enrollments/new    → EnrollmentWizard.tsx
/billing            → BillingPage.tsx
/billing/invoice/:id → InvoiceDetailPage.tsx
/attendance         → AttendanceDashboard.tsx
/notifications      → NotificationCenter.tsx
/reports            → ReportsDashboard.tsx
```

---

## 🛠️ Important Commands

### Backend
```bash
# Activate virtual environment
cd backend && venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run migrations
python manage.py migrate

# Create seed data
python create_seed_data.py

# Start server
python manage.py runserver

# Create superuser
python manage.py createsuperuser

# Access Django shell
python manage.py shell
```

### Frontend
```bash
# Install dependencies
cd frontend && npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

---

## 🎯 File Navigation Tips

### Finding Backend Files
- Models: Look in `*/models.py`
- API endpoints: Look in `*/views.py`
- Permissions: Look in `*/permissions.py`
- Serializers: Look in `*/serializers.py`
- URLs: Look in `*/urls.py`

### Finding Frontend Files
- Pages: Look in `src/pages/`
- Components: Look in `src/components/`
- API calls: Look in `src/services/`
- Types: Look in `src/types/`
- Utilities: Look in `src/lib/`

### Finding Documentation
- Setup: `QUICK-START.md`
- Testing: `documentation/TESTING-GUIDE.md`
- Deployment: `documentation/DEPLOYMENT-GUIDE.md`
- Project plan: `documentation/plan.md`
- Phase details: `documentation/Phase-*.md`

---

## 📋 Quick Reference

### Most Important Files

**Backend (Top 10)**
1. `backend/config/settings.py` - Configuration
2. `backend/config/urls.py` - Routing
3. `backend/users/models.py` - User model
4. `backend/users/views.py` - Auth endpoints
5. `backend/enrollments/views.py` - Enrollment logic
6. `backend/billing/models.py` - Invoice model
7. `backend/payments/services.py` - Paystack
8. `backend/notifications/services.py` - Email
9. `backend/reports/views.py` - Reports
10. `backend/create_seed_data.py` - Demo data

**Frontend (Top 10)**
1. `frontend/src/App.tsx` - Routes
2. `frontend/src/components/Layout.tsx` - Navigation
3. `frontend/src/contexts/AuthContext.tsx` - Auth state
4. `frontend/src/lib/api.ts` - API client
5. `frontend/src/pages/DashboardPage.tsx` - Dashboard
6. `frontend/src/pages/BillingPage.tsx` - Billing
7. `frontend/src/pages/EnrollmentWizard.tsx` - Enrollment
8. `frontend/src/services/authService.ts` - Auth API
9. `frontend/src/components/PaystackButton.tsx` - Payments
10. `frontend/src/types/auth.ts` - Auth types

---

**Total Project Files**: 200+
**Total Lines of Code**: 15,000+
**Documentation Pages**: 15+

---

Last Updated: January 2025
