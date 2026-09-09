# Role-Based Access Control (RBAC) Matrix

## User Roles in ICAN Platform

### 1. **Super Admin** (`super_admin`)
- Full system access
- User management
- System configuration
- All CRUD operations

### 2. **Manager** (`manager`)
- Academic management
- Student management
- Enrollment oversight
- Reports and analytics

### 3. **Finance** (`finance`)
- Billing and invoicing
- Payment processing
- Financial reports
- Student accounts

### 4. **Student Officer** (`student_officer`)
- Student registration
- Enrollment management
- Academic records
- Student support

### 5. **IT Admin** (`it_admin`)
- Technical support
- System monitoring
- Data backups
- User support

### 6. **Student** (`student`)
- Personal dashboard
- Course enrollment
- Payment management
- View grades and attendance

---

## Frontend Page Access Matrix

| Page | Route | Super Admin | Manager | Finance | Student Officer | IT Admin | Student |
|------|-------|-------------|---------|---------|----------------|----------|---------|
| **Login** | `/login` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Register** | `/register` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Dashboard** | `/dashboard` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Admin Dashboard** | `/admin` | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| **Profile** | `/profile` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Settings** | `/settings` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Help** | `/help` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Students** | `/students` | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| **Academics** | `/academics` | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| **Courses** | `/courses` | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| **Enrollments Dashboard** | `/enrollments` | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Enrollment Wizard** | `/enrollments/new` | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Billing** | `/billing` | ✅ | ❌ | ✅ | ❌ | ❌ | ✅ |
| **Invoice Detail** | `/billing/invoice/:id` | ✅ | ❌ | ✅ | ❌ | ❌ | ✅ |
| **Attendance** | `/attendance` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Notifications** | `/notifications` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Reports** | `/reports` | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Payment Success** | `/payment/success` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Payment Failure** | `/payment/failure` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

---

## Navigation Menu Visibility

### Super Admin Menu
```
📊 Dashboard
⚙️ Admin Dashboard
👥 Students
📚 Academics
📖 Courses
💰 Billing
✓ Attendance
📈 Reports
🔔 Notifications
───────────
⚙️ Settings
❓ Help
```

### Manager Menu
```
📊 Dashboard
⚙️ Admin Dashboard
👥 Students
📚 Academics
📖 Courses
✓ Attendance
📈 Reports
🔔 Notifications
───────────
⚙️ Settings
❓ Help
```

### Finance Menu
```
📊 Dashboard
⚙️ Admin Dashboard
💰 Billing
✓ Attendance
📈 Reports
🔔 Notifications
───────────
⚙️ Settings
❓ Help
```

### Student Officer Menu
```
📊 Dashboard
⚙️ Admin Dashboard
👥 Students
📚 Academics
📖 Courses
✓ Attendance
📈 Reports
🔔 Notifications
───────────
⚙️ Settings
❓ Help
```

### IT Admin Menu
```
📊 Dashboard
⚙️ Admin Dashboard
✓ Attendance
🔔 Notifications
───────────
⚙️ Settings
❓ Help
```

### Student Menu
```
📊 Dashboard
👤 My Profile
📝 Enrollments
💰 Billing
✓ Attendance
🔔 Notifications
───────────
⚙️ Settings
❓ Help
```

---

## Permission Groups

### Academic Staff
**Roles**: Super Admin, Manager, Student Officer

**Can Access**:
- Student management
- Academic resources
- Course management
- Enrollment oversight (via admin)
- Reports

**Cannot Access**:
- Student enrollment wizard
- Student billing (except Finance)

### Financial Staff
**Roles**: Super Admin, Finance

**Can Access**:
- Billing and invoicing
- Payment records
- Financial reports
- Student accounts

**Cannot Access**:
- Academic management
- Course management
- Student enrollment wizard

### Students
**Role**: Student

**Can Access**:
- Personal dashboard
- Enrollment wizard
- Personal billing
- Attendance records
- Notifications

**Cannot Access**:
- Staff dashboards
- Other students' data
- System administration
- Academic management

### Technical Staff
**Roles**: IT Admin

**Can Access**:
- Admin dashboard (limited)
- System monitoring
- Attendance (view only)

**Cannot Access**:
- Academic management
- Financial data
- Student enrollment
- Reports

---

## Access Control Implementation

### Frontend Protection

```typescript
// RoleGuard Component
<RoleGuard allowedRoles={['super_admin', 'manager']}>
  <AdminDashboard />
</RoleGuard>
```

### Behavior on Unauthorized Access

1. **Redirect to Dashboard**: User is redirected to `/dashboard`
2. **Show Error Message**: Optional unauthorized access message
3. **Hide Menu Items**: Unauthorized pages don't appear in navigation

### Example Routes

```typescript
// Staff-only route
<Route 
  path="/students" 
  element={
    <RoleGuard allowedRoles={['super_admin', 'manager', 'student_officer']}>
      <StudentsPage />
    </RoleGuard>
  } 
/>

// Student-only route
<Route 
  path="/enrollments" 
  element={
    <RoleGuard allowedRoles={['student']}>
      <StudentEnrollmentDashboard />
    </RoleGuard>
  } 
/>

// Finance & Students
<Route 
  path="/billing" 
  element={
    <RoleGuard allowedRoles={['super_admin', 'finance', 'student']}>
      <BillingPage />
    </RoleGuard>
  } 
/>
```

---

## Backend API Permissions

### DRF Permission Classes

```python
# Staff-only endpoints
permission_classes = [IsStaffOrAbove]

# Self or Staff (student can access own data, staff can access all)
permission_classes = [IsSelfOrStaff]

# Authenticated users only
permission_classes = [IsAuthenticated]

# Finance-only
permission_classes = [IsFinanceStaff]
```

### Permission Hierarchy

```
IsAuthenticated
    ↓
IsStaffOrAbove (any staff role)
    ↓
IsManagerOrAbove (manager, super_admin)
    ↓
IsSuperAdmin (super_admin only)
```

---

## Testing Role-Based Access

### Test Cases

#### 1. Student Access
```
✅ Can access /dashboard
✅ Can access /enrollments
✅ Can access /billing
❌ Cannot access /students
❌ Cannot access /courses
❌ Cannot access /reports
```

#### 2. Manager Access
```
✅ Can access /dashboard
✅ Can access /students
✅ Can access /courses
✅ Can access /reports
❌ Cannot access /enrollments (student wizard)
❌ Cannot access /billing (unless finance)
```

#### 3. Finance Access
```
✅ Can access /dashboard
✅ Can access /billing
✅ Can access /reports
❌ Cannot access /students
❌ Cannot access /courses
❌ Cannot access /enrollments
```

### Manual Testing Steps

1. **Login as each role**:
   - student@ican.edu / student123456
   - admin@ican.edu / admin123456
   - finance@ican.edu / finance123456

2. **Check navigation menu**:
   - Verify only appropriate items appear

3. **Try accessing restricted routes**:
   - Type URL directly in browser
   - Should redirect to dashboard

4. **Verify API calls**:
   - Check Network tab for 403 Forbidden errors
   - Ensure frontend handles gracefully

---

## Error Handling

### Frontend Errors

```typescript
// Unauthorized Access
{
  status: 403,
  message: "You don't have permission to access this page"
}

// Not Found (Wrong Role)
- Redirects to /dashboard
- Shows error toast (optional)
```

### Backend Errors

```json
{
  "detail": "You do not have permission to perform this action.",
  "status": 403
}
```

---

## Security Best Practices

### 1. **Defense in Depth**
- Frontend: Hide UI elements
- Frontend: Block route access
- Backend: Enforce permissions

### 2. **Never Trust the Client**
- Always validate on backend
- Frontend is for UX only
- Backend is source of truth

### 3. **Principle of Least Privilege**
- Users only get minimum required access
- Elevate permissions only when needed
- Audit permission changes

### 4. **Regular Audits**
- Review role assignments quarterly
- Check for permission creep
- Verify inactive accounts

---

## Future Enhancements

### Phase 14: Advanced RBAC

1. **Custom Permissions**:
   - Granular permissions (e.g., `can_approve_enrollments`)
   - Permission groups
   - Role hierarchies

2. **Dynamic Roles**:
   - Create roles via admin panel
   - Assign permissions to roles
   - Flexible role definitions

3. **Audit Logging**:
   - Log all permission checks
   - Track access attempts
   - Alert on suspicious activity

4. **Multi-Factor for Sensitive Actions**:
   - Require 2FA for financial operations
   - Confirm sensitive actions
   - Session timeouts for idle users

---

## Demo Accounts

```bash
# Super Admin
Email: admin@ican.edu
Password: admin123456
Access: Full system access

# Finance Staff
Email: finance@ican.edu
Password: finance123456
Access: Billing, payments, financial reports

# Student
Email: student@ican.edu
Password: student123456
Access: Personal dashboard, enrollment, billing
```

---

## Support

### Access Denied Issues?
1. Verify your role: Check Profile page
2. Contact admin if role is incorrect
3. Clear browser cache and re-login
4. Check if you're using the correct account

### Contact
- Technical Support: support@ican.edu
- Phone: +234 123 456 7890
- Office: Mon-Fri 8AM-5PM WAT
