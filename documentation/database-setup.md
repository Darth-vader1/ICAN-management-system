# PostgreSQL Database Setup Guide

## Prerequisites
- PostgreSQL installed on your system (version 12 or higher recommended)
- PostgreSQL service running

## Option 1: Using psql Command Line

### Step 1: Open Command Prompt or PowerShell as Administrator

### Step 2: Connect to PostgreSQL
```bash
psql -U postgres
```
(Enter your PostgreSQL password when prompted)

### Step 3: Create the Database
```sql
CREATE DATABASE ican_platform;
```

### Step 4: Create a Database User (Optional but Recommended)
```sql
CREATE USER ican_user WITH PASSWORD 'your_secure_password_here';
```

### Step 5: Grant Privileges
```sql
GRANT ALL PRIVILEGES ON DATABASE ican_platform TO ican_user;
```

### Step 6: Connect to the New Database
```sql
\c ican_platform
```

### Step 7: Grant Schema Privileges (PostgreSQL 15+)
```sql
GRANT ALL ON SCHEMA public TO ican_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO ican_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO ican_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO ican_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO ican_user;
```

### Step 8: Exit psql
```sql
\q
```

---

## Option 2: Using pgAdmin (GUI)

### Step 1: Open pgAdmin
- Launch pgAdmin from your start menu
- Connect to your PostgreSQL server

### Step 2: Create Database
1. Right-click on "Databases"
2. Select "Create" → "Database"
3. Enter database name: `ican_platform`
4. Click "Save"

### Step 3: Create User (Optional)
1. Right-click on "Login/Group Roles"
2. Select "Create" → "Login/Group Role"
3. In "General" tab: name = `ican_user`
4. In "Definition" tab: password = `your_secure_password_here`
5. In "Privileges" tab: enable "Can login?"
6. Click "Save"

### Step 4: Grant Privileges
1. Right-click on `ican_platform` database
2. Select "Properties"
3. Go to "Security" tab
4. Click "+" to add
5. Select `ican_user`
6. Grant all privileges
7. Click "Save"

---

## Option 3: Using Docker (if you prefer)

```bash
docker run --name ican-postgres \
  -e POSTGRES_DB=ican_platform \
  -e POSTGRES_USER=ican_user \
  -e POSTGRES_PASSWORD=your_secure_password_here \
  -p 5432:5432 \
  -d postgres:15
```

---

## Update Your .env File

After creating the database, update your backend/.env file:

### If using default postgres user:
```env
DATABASE_URL=postgresql://postgres:your_postgres_password@localhost:5432/ican_platform
```

### If you created a custom user (recommended):
```env
DATABASE_URL=postgresql://ican_user:your_secure_password_here@localhost:5432/ican_platform
```

---

## Verify Connection

Test the connection:

```bash
cd backend
python manage.py check --database default
```

---

## Run Migrations

Once the database is set up and connection verified:

```bash
python manage.py makemigrations
python manage.py migrate
```

---

## Create Superuser

Create an admin account to access Django admin:

```bash
python manage.py createsuperuser
```

Follow the prompts:
- Email: your_email@example.com
- Password: (enter a secure password)
- Password (again): (confirm password)

---

## Troubleshooting

### Issue: "role does not exist" error
**Solution**: Make sure you created the user and granted privileges

### Issue: "FATAL: password authentication failed"
**Solution**: Check your DATABASE_URL credentials match what you set

### Issue: "could not connect to server"
**Solution**: Ensure PostgreSQL service is running
```bash
# Windows (Command Prompt as Admin)
net start postgresql-x64-15

# Or check services
services.msc
# Look for "postgresql" service and start it
```

### Issue: "permission denied for schema public" (PostgreSQL 15+)
**Solution**: Run the GRANT SCHEMA commands from Step 7 above

---

## Quick Reference

### Common PostgreSQL Commands (in psql)

```sql
\l                          -- List all databases
\c ican_platform           -- Connect to database
\dt                        -- List all tables
\du                        -- List all users
\q                         -- Quit psql

DROP DATABASE ican_platform;  -- Delete database (careful!)
```

---

## Next Steps

After database setup:
1. ✅ Create database
2. ✅ Update .env file
3. Run migrations: `python manage.py migrate`
4. Create superuser: `python manage.py createsuperuser`
5. Start server: `python manage.py runserver`
