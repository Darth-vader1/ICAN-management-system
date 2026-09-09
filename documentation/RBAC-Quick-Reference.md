# RBAC Quick Reference

## ✅ What I Just Implemented

### Role-Based Route Protection
Every page now checks user role before allowing access!

---

## 🎭 Role Access Summary

### 👨‍💼 **Staff Roles** (Super Admin, Manager, Finance, Student Officer, IT Admin)

**Can Access**:
- ✅ Admin Dashboard (`/admin`)
- ✅ Attendance (`/attendance`)
- ✅ Notifications (`/notifications`)
- ✅ Settings (`/settings`)
- ✅ Help (`/help`)

**Additional for Academic Staff** (Super Admin, Manager, Student Officer):
- ✅ Students Management (`/students`)
- ✅ Academics (`/academics`)
- ✅ Courses (`/courses`)
- ✅ Reports (`/reports`)

**Additional for Finance** (Super Admin, Finance):
- ✅ Billing (`/billing`)
- ✅ Reports (`/reports`)

**Cannot Access**:
- ❌ Student Enrollment Wizard (`/enrollments/new`)
- ❌ Student Enrollment Dashboard (`/enrollments`)

---

### 👨‍🎓 **Student Role**

**Can Access**:
- ✅ Dashboard (`/dashboard`)
- ✅ My Profile (`/profile`)
- ✅ Enrollments (`/enrollments`)
- ✅ Enrollment Wizard (`/enrollments/new`)
- ✅ Billing (`/billing`)
- ✅ Attendance (`/attendance`)
- ✅ Notifications (`/notifications`)
- ✅ Settings (`/settings`)
- ✅ Help (`/help`)

**Cannot Access**:
- ❌ Admin Dashboard (`/admin`)
- ❌ Students Management (`/students`)
- ❌ Academics (`/academics`)
- ❌ Courses (`/courses`)
- ❌ Reports (`/reports`)

---

## 🔒 How It Works

### 1. **Navigation Menu**
Only shows links for pages user can access

### 2. **Route Protection**
```typescript
<RoleGuard allowedRoles={['student']}>
  <EnrollmentWizard />
</RoleGuard>
```

### 3. **Unauthorized Access**
- Redirects to `/dashboard`
- Or shows "Access Denied" message

---

## 🧪 Testing

### As Student:
```bash
Email: student@ican.edu
Password: student123456

Try accessing:
✅ /enrollments - Works
❌ /students - Redirects to dashboard
❌ /courses - Redirects to dashboard
```

### As Admin:
```bash
Email: admin@ican.edu
Password: admin123456

Try accessing:
✅ /students - Works
✅ /courses - Works
❌ /enrollments/new - Redirects to dashboard
```

### As Finance:
```bash
Email: finance@ican.edu
Password: finance123456

Try accessing:
✅ /billing - Works
❌ /students - Redirects to dashboard
❌ /enrollments - Redirects to dashboard
```

---

## 📁 Files Created

1. **`RoleGuard.tsx`** - Role protection component
2. **Updated `App.tsx`** - Routes with role guards
3. **Updated `Layout.tsx`** - Menu items filtered by role
4. **`Role-Based-Access-Control.md`** - Full RBAC documentation
5. **`RBAC-Quick-Reference.md`** - This file

---

## ⚡ Quick Fix Guide

### Page Shows "Access Denied"?
1. Check your role in Profile page
2. Verify you're using correct account
3. Clear cache and re-login

### Menu Item Missing?
- It's hidden because your role can't access it
- This is normal and expected

### Can't Create Enrollment as Staff?
- Use Django Admin instead: `/admin/enrollments/`
- Staff cannot use student enrollment wizard

---

## 🎯 Role Decision Tree

```
Are you a STUDENT?
├─ YES → Use /enrollments, /billing
└─ NO → Are you FINANCE?
    ├─ YES → Use /billing, /reports
    └─ NO → Are you ACADEMIC STAFF?
        ├─ YES → Use /students, /courses, /academics
        └─ NO → Basic access only
```

---

## 🔐 Security Layers

1. **Frontend**: Hide UI elements
2. **Routes**: Block unauthorized access  
3. **Backend**: Enforce permissions (final authority)

**All three work together for security!**

---

## 📞 Need Help?

- **Email**: support@ican.edu
- **Phone**: +234 123 456 7890
- **Office**: Mon-Fri 8AM-5PM
