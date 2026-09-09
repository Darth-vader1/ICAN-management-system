# ICAN Platform - Quick Start Guide

Get the ICAN Tutorial Centre Management Platform running locally in under 10 minutes!

## 🚀 Prerequisites

- Python 3.11+ 
- Node.js 18+
- Git
- Code editor (VS Code recommended)

## ⚡ Quick Setup (3 Steps)

### Step 1: Clone & Backend Setup (3 minutes)

```bash
# Navigate to project (if not already there)
cd "c:\Users\HP\Documents\projects\ICAN management system"

# Create virtual environment
cd backend
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run migrations
python manage.py migrate

# Create seed data (demo accounts & data)
python create_seed_data.py

# Start backend server
python manage.py runserver
```

✅ Backend running at `http://localhost:8000`

### Step 2: Frontend Setup (2 minutes)

Open a **NEW terminal window**:

```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Create environment file
copy .env.example .env
# (Or manually create .env with: VITE_API_URL=http://localhost:8000)

# Start frontend
npm run dev
```

✅ Frontend running at `http://localhost:5173`

### Step 3: Login & Explore (1 minute)

1. Open browser: `http://localhost:5173`
2. Click "Login"
3. Use demo account:
   - **Email**: `admin@ican.edu`
   - **Password**: `admin123456`
4. Explore the dashboard!

## 🎯 Demo Accounts

All passwords follow pattern: `[role]123456`

| Role | Email | Password | What You Can Do |
|------|-------|----------|----------------|
| Admin | admin@ican.edu | admin123456 | Everything |
| Finance | finance@ican.edu | finance123456 | Billing, Reports |
| Student | student@ican.edu | student123456 | Enroll, Pay, View Grades |

## 📱 What to Try

### As Admin
1. Dashboard → View all stats
2. Academics → Manage courses
3. Reports → Generate financial report
4. Notifications → View system alerts

### As Student
1. Dashboard → See your overview
2. My Profile → Update information
3. Enrollments → Enroll in courses
4. Billing → View invoices
5. Click "Pay" to test payment (test mode)

## 🛠️ Useful Commands

### Backend
```bash
# Create superuser
python manage.py createsuperuser

# Access admin panel
# http://localhost:8000/admin

# Run tests (when added)
python manage.py test

# View all routes
python manage.py show_urls

# Shell (interactive)
python manage.py shell
```

### Frontend
```bash
# Development server
npm run dev

# Production build
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

## 📂 Project Structure

```
ICAN management system/
├── backend/                 # Django backend
│   ├── config/             # Settings, URLs
│   ├── users/              # Authentication
│   ├── academics/          # Courses, Sessions
│   ├── enrollments/        # Student enrollment
│   ├── billing/            # Invoices
│   ├── payments/           # Paystack integration
│   ├── attendance/         # Attendance tracking
│   ├── notifications/      # Notification system
│   ├── reports/            # Report generation
│   └── manage.py           # Django CLI
│
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── pages/         # Page views
│   │   ├── services/      # API clients
│   │   ├── types/         # TypeScript types
│   │   └── App.tsx        # Main app
│   └── package.json       # Dependencies
│
└── documentation/         # All documentation
```

## 🔧 Configuration Files

### Backend `.env`
```env
SECRET_KEY=your-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
DATABASE_URL=sqlite:///db.sqlite3

# Email (optional for local dev)
EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend

# Paystack (use test keys)
PAYSTACK_SECRET_KEY=sk_test_xxxxx
PAYSTACK_PUBLIC_KEY=pk_test_xxxxx
```

### Frontend `.env`
```env
VITE_API_URL=http://localhost:8000
VITE_PAYSTACK_PUBLIC_KEY=pk_test_xxxxx
```

## 🐛 Common Issues & Fixes

### Backend won't start
```bash
# Error: "Module not found"
pip install -r requirements.txt

# Error: "No such table"
python manage.py migrate

# Error: "Port already in use"
# Kill process on port 8000 or use different port:
python manage.py runserver 8001
```

### Frontend won't start
```bash
# Error: "Cannot find module"
npm install

# Error: "EADDRINUSE"
# Port 5173 in use, Vite will auto-assign new port

# Error: "Failed to fetch"
# Check VITE_API_URL in .env points to backend
```

### Login not working
```bash
# Re-create seed data
cd backend
python create_seed_data.py

# Or create user manually
python manage.py createsuperuser
```

### CORS errors
```python
# In backend/config/settings.py, add:
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]
```

## 📚 Next Steps

1. **Read Documentation**
   - `frontend/README.md` - Frontend guide
   - `documentation/TESTING-GUIDE.md` - How to test
   - `documentation/DEPLOYMENT-GUIDE.md` - Deploy to production

2. **Explore Code**
   - Check out `backend/users/views.py` for auth
   - Look at `frontend/src/pages/` for UI components
   - Review `backend/billing/models.py` for data models

3. **Make Changes**
   - Try adding a new field to a model
   - Create a new page in frontend
   - Customize the dashboard

4. **Run Tests**
   - Backend: Add tests in `*/tests.py`
   - Frontend: Add tests with Vitest

## 🎓 Learning Path

### Week 1: Understand the Codebase
- [ ] Run the application
- [ ] Login with different roles
- [ ] Try all features
- [ ] Read the documentation
- [ ] Understand the database schema

### Week 2: Backend Development
- [ ] Django models and migrations
- [ ] Django REST Framework
- [ ] Authentication & permissions
- [ ] Celery background tasks
- [ ] Writing tests

### Week 3: Frontend Development
- [ ] React components
- [ ] React Router
- [ ] State management
- [ ] API integration
- [ ] TypeScript types

### Week 4: Integration & Deployment
- [ ] End-to-end testing
- [ ] Payment integration
- [ ] Email notifications
- [ ] Production deployment
- [ ] Monitoring

## 🆘 Getting Help

### Resources
- **Django**: https://docs.djangoproject.com
- **DRF**: https://www.django-rest-framework.org
- **React**: https://react.dev
- **TypeScript**: https://www.typescriptlang.org
- **Tailwind**: https://tailwindcss.com

### Debugging Tips
1. Check browser console for frontend errors
2. Check terminal output for backend errors
3. Use Django shell to inspect data
4. Use React DevTools to inspect components
5. Check Network tab for API calls

### Common Commands for Debugging
```bash
# Backend logs
python manage.py runserver --verbosity 3

# Check migrations
python manage.py showmigrations

# Django shell
python manage.py shell
>>> from users.models import User
>>> User.objects.all()

# Frontend build errors
npm run build -- --debug
```

## ✅ Verification Checklist

After setup, verify everything works:

- [ ] Backend server starts without errors
- [ ] Frontend dev server starts without errors
- [ ] Can access http://localhost:8000 (backend)
- [ ] Can access http://localhost:5173 (frontend)
- [ ] Can login with demo accounts
- [ ] Dashboard loads with data
- [ ] Can navigate between pages
- [ ] API calls work (check Network tab)
- [ ] No console errors

## 🎉 Success!

If you've completed all steps:
- ✅ Backend is running
- ✅ Frontend is running
- ✅ Can login and explore
- ✅ Ready to develop!

## 🚀 What's Next?

Choose your adventure:

**For Developers:**
- Start building new features
- Fix bugs or improve UI
- Write tests
- Optimize performance

**For Testers:**
- Follow TESTING-GUIDE.md
- Test all workflows
- Report issues
- Verify fixes

**For Deployers:**
- Follow DEPLOYMENT-GUIDE.md
- Set up production environment
- Configure domains
- Enable monitoring

---

## 💡 Pro Tips

1. **Keep terminals organized**: One for backend, one for frontend
2. **Use VS Code**: Has excellent Python and TypeScript support
3. **Install extensions**:
   - Python (Microsoft)
   - ESLint
   - Tailwind CSS IntelliSense
   - GitLens
4. **Learn keyboard shortcuts** for faster development
5. **Use Git branches** for new features
6. **Commit often** with clear messages
7. **Read error messages carefully** - they usually tell you what's wrong!

---

**Happy Coding! 🎊**

Need help? Check the documentation or explore the codebase!
