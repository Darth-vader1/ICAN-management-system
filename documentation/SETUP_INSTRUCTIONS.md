# ICAN Tutorial Centre Platform - Setup Instructions

## Phase 1 Foundation Setup Complete! 🎉

This guide will help you get the application running locally.

---

## Prerequisites

- Python 3.10+ installed
- Node.js 18+ and npm installed
- PostgreSQL 12+ installed and running
- Redis installed and running (for Celery background tasks)
- Git installed

---

## Backend Setup

### 1. Navigate to Backend Directory
```bash
cd backend
```

### 2. Install Python Dependencies
```bash
pip install -r requirements.txt
```

### 3. Verify Environment Variables
The `.env` file should already exist. Verify it contains:
```env
SECRET_KEY=change-me-to-a-random-value
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

DATABASE_URL=postgresql://postgres:your_password@localhost:5432/ican_platform
# OR if you created a custom user:
# DATABASE_URL=postgresql://ican_user:your_password@localhost:5432/ican_platform

CORS_ALLOWED_ORIGINS=http://localhost:5173

REDIS_URL=redis://localhost:6379/0

PAYSTACK_PUBLIC_KEY=
PAYSTACK_SECRET_KEY=

EMAIL_PROVIDER=resend
EMAIL_API_KEY=
EMAIL_FROM=no-reply@icantutorial.example

WHATSAPP_API_KEY=
WHATSAPP_PHONE_NUMBER_ID=

TIME_ZONE=Africa/Lagos
```

### 4. Run Database Migrations
```bash
python manage.py makemigrations
python manage.py migrate
```

Expected output:
```
Migrations for 'users':
  users/migrations/0001_initial.py
    - Create model User
    - Create model StaffProfile
Migrations for 'students':
  students/migrations/0001_initial.py
    - Create model StudentProfile
Migrations for 'audit':
  audit/migrations/0001_initial.py
    - Create model AuditLog
...
```

### 5. Create Superuser
```bash
python manage.py createsuperuser
```

Enter:
- Email: `admin@example.com`
- Password: (choose a secure password)

### 6. Load Seed Data (Optional)
```bash
python manage.py loaddata seed_data.json
```

This will create demo:
- Admin user
- Manager user
- Finance staff
- Student officer
- Sample students
- Sample courses and sessions

### 7. Start Django Development Server
```bash
python manage.py runserver
```

Backend should now be running at: **http://localhost:8000**

Test it: http://localhost:8000/api/auth/login/

---

## Frontend Setup

### 1. Navigate to Frontend Directory
```bash
cd frontend/frontend
```

### 2. Install Node Dependencies
```bash
npm install
```

This will install:
- React 18
- React Router v6
- TanStack Query
- React Hook Form
- Zod (validation)
- Axios
- Tailwind CSS

### 3. Verify Environment Variables
The `.env` file should already exist with:
```env
VITE_API_URL=http://localhost:8000/api
```

### 4. Start Vite Development Server
```bash
npm run dev
```

Frontend should now be running at: **http://localhost:5173**

---

## Testing the Application

### Test Sequence

1. **Backend Health Check**
   - Visit: http://localhost:8000/admin
   - Login with superuser credentials
   - You should see Django admin interface

2. **Frontend Access**
   - Visit: http://localhost:5173
   - You should be redirected to login page

3. **Student Registration**
   - Click "Register as a student"
   - Fill in the form:
     - First Name: John
     - Last Name: Doe
     - Email: john.doe@example.com
     - Password: SecurePassword123
     - Confirm Password: SecurePassword123
   - Click "Create account"
   - You should see success message

4. **Login**
   - Email: john.doe@example.com
   - Password: SecurePassword123
   - Click "Sign in"
   - You should be redirected to dashboard

5. **Dashboard**
   - You should see:
     - Your email
     - Your student code (e.g., ICAN-123456)
     - Role: student
     - Verification status

6. **API Testing (Optional)**
   ```bash
   # Login
   curl -X POST http://localhost:8000/api/auth/login/ \
     -H "Content-Type: application/json" \
     -d '{"email":"john.doe@example.com","password":"SecurePassword123"}'
   
   # You'll get access and refresh tokens
   # Use access token for authenticated requests:
   
   curl -X GET http://localhost:8000/api/auth/me/ \
     -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
   ```

---

## Seed Data Credentials

After running `loaddata seed_data.json`, you can login with:

### Super Admin
- Email: `admin@ican.edu`
- Password: `admin123456`

### Manager
- Email: `manager@ican.edu`
- Password: `manager123456`

### Finance Staff
- Email: `finance@ican.edu`
- Password: `finance123456`

### Student Officer
- Email: `officer@ican.edu`
- Password: `officer123456`

### Demo Student
- Email: `student@ican.edu`
- Password: `student123456`

---

## Common Issues & Troubleshooting

### Issue: "ImportError: cannot import name 'StudentProfile'"
**Solution**: Run migrations first
```bash
python manage.py migrate
```

### Issue: "FATAL: database does not exist"
**Solution**: Create the database
```bash
psql -U postgres
CREATE DATABASE ican_platform;
\q
```

### Issue: "connection refused" to PostgreSQL
**Solution**: Start PostgreSQL service
```bash
# Windows
net start postgresql-x64-15

# Or use services.msc GUI
```

### Issue: Frontend shows "Network Error"
**Solution**: 
1. Ensure backend is running on port 8000
2. Check CORS settings in backend/.env
3. Verify VITE_API_URL in frontend/.env

### Issue: "Module not found" in frontend
**Solution**: Reinstall dependencies
```bash
cd frontend/frontend
rm -rf node_modules package-lock.json
npm install
```

### Issue: Migrations conflict
**Solution**: Reset migrations (development only!)
```bash
python manage.py migrate users zero
python manage.py migrate students zero
python manage.py migrate audit zero
rm -rf users/migrations/0*.py
rm -rf students/migrations/0*.py
rm -rf audit/migrations/0*.py
python manage.py makemigrations
python manage.py migrate
```

---

## Development Workflow

### Running Both Servers Simultaneously

**Terminal 1 - Backend:**
```bash
cd backend
python manage.py runserver
```

**Terminal 2 - Frontend:**
```bash
cd frontend/frontend
npm run dev
```

### Making Code Changes

- **Backend changes**: Django auto-reloads on save
- **Frontend changes**: Vite hot-reloads on save
- **Model changes**: Always run `makemigrations` and `migrate`

---

## Next Steps (Phase 2+)

After Phase 1 is working:

- ✅ Phase 1: Foundation (Complete)
- ⏭️ Phase 2: Academic Management (Sessions, Levels, Courses)
- ⏭️ Phase 3: Student Management & Enrollment
- ⏭️ Phase 4: Financial System (Invoices, Payments)
- ⏭️ Phase 5: Paystack Integration
- ⏭️ Phase 6: Communication (Email, WhatsApp, Reminders)
- ⏭️ Phase 7: Attendance
- ⏭️ Phase 8: Reporting
- ⏭️ Phase 9: Auditing & Security
- ⏭️ Phase 10: Deployment

---

## Project Structure

```
ICAN management system/
├── backend/
│   ├── config/          # Django settings
│   ├── users/           # User & Auth
│   ├── students/        # Student profiles
│   ├── audit/           # Audit logging
│   ├── academics/       # (Phase 2)
│   ├── enrollments/     # (Phase 3)
│   ├── billing/         # (Phase 4)
│   ├── payments/        # (Phase 5)
│   ├── notifications/   # (Phase 6)
│   └── manage.py
├── frontend/frontend/
│   ├── src/
│   │   ├── components/  # Reusable components
│   │   ├── contexts/    # React contexts
│   │   ├── lib/         # Utilities (API client)
│   │   ├── pages/       # Page components
│   │   ├── services/    # API services
│   │   ├── types/       # TypeScript types
│   │   └── App.tsx
│   ├── package.json
│   └── vite.config.ts
└── documentation/
    ├── PHASE_0_ARCHITECTURE.md
    └── database-setup.md
```

---

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review the architecture document: `ican-platform-phase0-architecture.md`
3. Check Django logs in terminal
4. Check browser console for frontend errors

---

## Security Notes

⚠️ **Development Mode Only**

Current settings are for development:
- `DEBUG=True`
- Default SECRET_KEY
- No HTTPS enforcement
- CORS allows localhost

**Before deploying to production:**
- Generate a strong SECRET_KEY
- Set `DEBUG=False`
- Configure proper ALLOWED_HOSTS
- Enable HTTPS/SSL
- Update CORS settings
- Use environment variables for all secrets
- Set up proper logging
- Enable rate limiting
