# Quick Start Guide - ICAN Platform

## ⚡ Get Running in 5 Minutes

### Prerequisites Check
- ✅ PostgreSQL database created (`ican_platform`)
- ✅ PostgreSQL running
- ✅ Python 3.10+ installed
- ✅ Node.js 18+ installed

---

## Backend (Terminal 1)

```bash
# 1. Go to backend
cd backend

# 2. Install dependencies (if not done)
pip install -r requirements.txt

# 3. Run migrations
python manage.py makemigrations
python manage.py migrate

# 4. Create seed data
python create_seed_data.py

# 5. Start server
python manage.py runserver
```

**Backend Ready:** http://localhost:8000

---

## Frontend (Terminal 2)

```bash
# 1. Go to frontend
cd frontend/frontend

# 2. Install dependencies (if not done)
npm install

# 3. Start dev server
npm run dev
```

**Frontend Ready:** http://localhost:5173

---

## Test It

1. Open browser: http://localhost:5173
2. Click "Register as a student"
3. Fill form and create account
4. Login with your new account
5. See your dashboard!

**OR** use demo accounts:

- **Student**: student@ican.edu / student123456
- **Manager**: manager@ican.edu / manager123456
- **Admin**: admin@ican.edu / admin123456

---

## Troubleshooting

### "Connection refused"
→ Make sure PostgreSQL is running

### "Module not found" (Python)
→ Run: `pip install -r requirements.txt`

### "Module not found" (React)
→ Run: `cd frontend/frontend && npm install`

### "Database does not exist"
→ Create database first (see `database-setup.md`)

---

## What's Working (Phase 1)

✅ User authentication (JWT)  
✅ Student registration  
✅ Login/logout  
✅ Role-based access control  
✅ Protected routes  
✅ User dashboard  
✅ Audit logging  

## Coming Next (Phase 2+)

⏭️ Academic sessions & courses  
⏭️ Student enrollment  
⏭️ Fee management  
⏭️ Payment processing (Paystack)  
⏭️ Invoicing system  
⏭️ Email notifications  
⏭️ WhatsApp integration  
⏭️ Attendance tracking  
⏭️ Financial reports  

---

For detailed instructions, see `SETUP_INSTRUCTIONS.md`
