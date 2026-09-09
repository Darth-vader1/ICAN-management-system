# ICAN Tutorial Centre Management Platform

A comprehensive web-based management system for tutorial centres, built with Django REST Framework and React TypeScript.

## 🎯 Overview

This platform provides complete management capabilities for tutorial centres including student enrollment, course management, billing, payments, attendance tracking, and reporting.

## ✨ Features

### Core Modules
- 🔐 **Authentication & Authorization** - Role-based access control with JWT
- 📚 **Academic Management** - Sessions, levels, courses, and offerings
- 📝 **Enrollment System** - Student course enrollment with invoice generation
- 💰 **Billing & Invoicing** - Automated invoice generation and tracking
- 💳 **Payment Processing** - Paystack integration for online payments
- 📧 **Communication** - Email notifications and in-app messaging
- ✅ **Attendance Tracking** - Class attendance management
- 📊 **Reporting** - Financial, student, and attendance reports
- 🔍 **Audit Logging** - Complete activity tracking

### User Roles
1. **Super Admin** - Full system access
2. **IT Admin** - Technical administration
3. **Manager** - Management functions
4. **Finance** - Billing and financial operations
5. **Student Officer** - Student management
6. **Student** - Student portal access

## 🚀 Quick Start

**Get running in 5 minutes!** See [QUICK-START.md](./QUICK-START.md)

```bash
# Backend
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python create_seed_data.py
python manage.py runserver

# Frontend (new terminal)
cd frontend
npm install
npm run dev
```

**Login**: admin@ican.edu / admin123456

## 🏗️ Architecture

### Backend
- **Framework**: Django 5.0 + Django REST Framework
- **Database**: PostgreSQL (production) / SQLite (dev)
- **Cache**: Redis
- **Task Queue**: Celery + Celery Beat
- **Authentication**: JWT (Simple JWT)
- **Payments**: Paystack
- **Email**: SMTP / SendGrid

### Frontend
- **Framework**: React 18.3 + TypeScript
- **Build**: Vite
- **Routing**: React Router 6
- **State**: Context API + TanStack Query
- **Styling**: Tailwind CSS
- **HTTP**: Axios

## 📁 Project Structure

```
├── backend/
│   ├── config/              # Django settings
│   ├── users/               # Authentication & users
│   ├── students/            # Student profiles
│   ├── academics/           # Sessions, courses
│   ├── enrollments/         # Student enrollments
│   ├── billing/             # Invoices & billing
│   ├── payments/            # Payment processing
│   ├── attendance/          # Attendance tracking
│   ├── notifications/       # Notifications
│   ├── reports/             # Report generation
│   └── audit/               # Audit logging
│
├── frontend/
│   └── src/
│       ├── components/      # UI components
│       ├── pages/           # Page views
│       ├── services/        # API clients
│       ├── types/           # TypeScript types
│       └── contexts/        # React contexts
│
└── documentation/
    ├── plan.md              # Project plan
    ├── TESTING-GUIDE.md     # Testing documentation
    ├── DEPLOYMENT-GUIDE.md  # Deployment instructions
    └── *.md                 # Phase summaries
```

## 📚 Documentation

- 📖 [Quick Start Guide](./QUICK-START.md) - Get started in minutes
- 🧪 [Testing Guide](./documentation/TESTING-GUIDE.md) - How to test
- 🚀 [Deployment Guide](./documentation/DEPLOYMENT-GUIDE.md) - Deploy to production
- 📝 [Project Plan](./documentation/plan.md) - Complete project plan
- 🎨 [Frontend README](./frontend/README.md) - Frontend documentation
- ✅ [Frontend Completion Summary](./FRONTEND-COMPLETION-SUMMARY.md) - What was built
- 📊 [Database Schema](./documentation/database-setup.md) - Database structure

## 🔑 Demo Accounts

Created by `create_seed_data.py`:

| Role | Email | Password |
|------|-------|----------|
| Super Admin | admin@ican.edu | admin123456 |
| Manager | manager@ican.edu | manager123456 |
| Finance | finance@ican.edu | finance123456 |
| Student Officer | officer@ican.edu | officer123456 |
| IT Admin | it@ican.edu | itadmin123456 |
| Student | student@ican.edu | student123456 |

## 🛠️ Tech Stack

### Backend Dependencies
```
Django==5.0
djangorestframework==3.14.0
djangorestframework-simplejwt==5.3.1
django-cors-headers==4.3.1
celery==5.3.4
redis==5.0.1
psycopg2-binary==2.9.9
requests==2.31.0
openpyxl==3.1.2
reportlab==4.2.5
pandas==2.2.3
```

### Frontend Dependencies
```
react==18.3.1
react-router-dom==6.26.0
@tanstack/react-query==5.51.1
axios==1.7.2
tailwindcss==3.4.6
typescript==5.5.3
vite==5.3.4
```

## 📊 Database Schema

### Key Models
- **User** - Authentication and base user info
- **StudentProfile** - Student-specific information
- **Session** - Academic sessions (terms/semesters)
- **Level** - Academic levels (Foundation, Skills, Professional)
- **Course** - Available courses
- **CourseOffering** - Courses offered in a session
- **Enrollment** - Student course enrollments
- **Invoice** - Billing invoices
- **Payment** - Payment records
- **AttendanceSession** - Class sessions
- **AttendanceRecord** - Student attendance
- **Notification** - System notifications
- **AuditLog** - Activity tracking

## 🔒 Security Features

- JWT authentication with refresh tokens
- Role-based access control (RBAC)
- Password hashing with Django's default (PBKDF2)
- CORS protection
- CSRF protection
- SQL injection protection (ORM)
- XSS protection (React escaping)
- Secure headers (production)
- HTTPS enforcement (production)
- Rate limiting (production)
- Audit logging

## 🧪 Testing

```bash
# Backend tests
cd backend
python manage.py test

# Frontend tests (to be added)
cd frontend
npm test

# E2E tests (to be added)
npm run test:e2e
```

See [TESTING-GUIDE.md](./documentation/TESTING-GUIDE.md) for details.

## 🚀 Deployment

### Docker (Recommended)

```bash
docker-compose up -d --build
```

### Manual Deployment

See [DEPLOYMENT-GUIDE.md](./documentation/DEPLOYMENT-GUIDE.md) for:
- AWS deployment
- Heroku deployment
- DigitalOcean deployment
- Manual server setup

### Environment Variables

**Backend** (`.env`):
```env
SECRET_KEY=your-secret-key
DEBUG=False
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
PAYSTACK_SECRET_KEY=sk_live_...
EMAIL_HOST=smtp.gmail.com
```

**Frontend** (`.env`):
```env
VITE_API_URL=https://api.yourdomain.com
VITE_PAYSTACK_PUBLIC_KEY=pk_live_...
```

## 📈 Performance

### Targets
- API response time: < 500ms
- Page load time: < 2s
- Time to interactive: < 3s
- Lighthouse score: > 90

### Optimizations
- Database query optimization (select_related, prefetch_related)
- Redis caching
- CDN for static files
- Code splitting (frontend)
- Lazy loading
- API pagination

## 🔄 API Endpoints

### Authentication
```
POST   /auth/register/           # Register new user
POST   /auth/login/              # Login
POST   /auth/refresh/            # Refresh token
GET    /auth/me/                 # Current user
POST   /auth/logout/             # Logout
```

### Academics
```
GET    /academics/sessions/      # List sessions
GET    /academics/levels/        # List levels
GET    /academics/courses/       # List courses
GET    /academics/offerings/     # List offerings
```

### Enrollments
```
GET    /enrollments/             # List enrollments
POST   /enrollments/             # Create enrollment
GET    /enrollments/{id}/        # Get enrollment
PATCH  /enrollments/{id}/        # Update enrollment
DELETE /enrollments/{id}/        # Delete enrollment
```

### Billing
```
GET    /billing/invoices/        # List invoices
GET    /billing/invoices/{id}/   # Get invoice
GET    /billing/invoices/{id}/pdf/ # Download PDF
```

### Payments
```
POST   /payments/initialize/     # Initialize payment
POST   /payments/webhook/        # Paystack webhook
GET    /payments/                # List payments
GET    /payments/{id}/receipt/   # Download receipt
```

See full API documentation at `/api/docs/` (when running)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Development Workflow
1. Create issue for feature/bug
2. Create branch from `main`
3. Implement changes
4. Write tests
5. Update documentation
6. Submit PR
7. Code review
8. Merge to main

## 🐛 Known Issues

See [GitHub Issues](../../issues) for current bugs and feature requests.

Common issues:
- Payment webhook testing requires ngrok or public URL
- Email sending requires SMTP configuration
- WhatsApp integration requires Twilio account

## 📝 License

This project is proprietary software. All rights reserved.

## 👥 Team

- **Backend Developer**: Django REST Framework, PostgreSQL, Celery
- **Frontend Developer**: React, TypeScript, Tailwind CSS
- **DevOps**: Docker, AWS, CI/CD

## 📞 Support

For issues, questions, or contributions:
- Create an issue on GitHub
- Email: support@icantutorial.com
- Documentation: See `/documentation/` folder

## 🎉 Acknowledgments

- Django & Django REST Framework communities
- React & TypeScript communities
- Paystack for payment processing
- All open-source contributors

## 📅 Roadmap

### Phase 9: Security Hardening (Optional)
- [ ] Security audit
- [ ] Penetration testing
- [ ] Rate limiting
- [ ] Advanced logging
- [ ] Backup automation

### Phase 10: Additional Features (Optional)
- [ ] Mobile app (React Native)
- [ ] WhatsApp notifications
- [ ] SMS integration
- [ ] Advanced analytics
- [ ] Student portal enhancements
- [ ] Parent portal
- [ ] Instructor portal

## 📊 Project Stats

- **Total Files**: 100+
- **Lines of Code**: ~15,000+
- **Backend Endpoints**: 50+
- **Frontend Pages**: 12
- **Database Models**: 20+
- **Development Time**: 8 Phases
- **Status**: ✅ Complete

## 🌟 Features Highlights

### For Students
- ✅ Easy course enrollment
- ✅ View invoices online
- ✅ Pay with Paystack
- ✅ Track attendance
- ✅ Receive notifications
- ✅ Manage profile

### For Staff
- ✅ Manage courses and sessions
- ✅ Track enrollments
- ✅ Generate reports
- ✅ Monitor payments
- ✅ Record attendance
- ✅ Send notifications

### For Administrators
- ✅ Complete system control
- ✅ User management
- ✅ Financial reporting
- ✅ Audit logs
- ✅ System configuration
- ✅ Data export

---

## 🚀 Ready to Start?

1. Read [QUICK-START.md](./QUICK-START.md)
2. Follow setup instructions
3. Login with demo accounts
4. Explore the features!

---

**Built with ❤️ for ICAN Tutorial Centre**

Last Updated: January 2025
Version: 1.0.0
