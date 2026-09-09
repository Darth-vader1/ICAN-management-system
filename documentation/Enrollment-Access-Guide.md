# Enrollment Access Guide

## User Roles and Enrollment Access

### Students
✅ **Can Do:**
- View their own enrollments at `/enrollments`
- Create new enrollments at `/enrollments/new` (Enrollment Wizard)
- See enrollment dashboard with:
  - Active enrollments
  - Enrolled courses
  - Enrollment status
  - Academic progress

✅ **How to Enroll:**
1. Click "Enrollments" in sidebar
2. Click "New Enrollment" button
3. Follow 4-step wizard:
   - Step 1: Select Academic Session
   - Step 2: Select Level (Foundation, Skills, Professional)
   - Step 3: Select Courses
   - Step 4: Review and Submit

### Staff (Admin, Manager, Finance, Student Officer)
❌ **Cannot Use Enrollment Wizard** - Staff users don't have `student_id`

✅ **Can Do (via Django Admin):**
- View all enrollments
- Create enrollments for students
- Approve/Activate draft enrollments
- Add/Drop courses for students
- Withdraw students from enrollments
- Mark enrollments as completed

✅ **How Staff Creates Enrollments:**

#### Option 1: Django Admin (Recommended)
1. Go to `http://localhost:8000/admin/`
2. Navigate to **Enrollments** > **Enrollments**
3. Click **"Add Enrollment"**
4. Fill in:
   - **Student**: Select student
   - **Session**: Select academic session
   - **Level**: Select level
   - **Status**: Draft (default) or Active
5. Save
6. Go to **Enrollment Courses** to add courses
7. Or use **Add Course** action on the enrollment

#### Option 2: API (For custom staff interfaces)
```bash
POST /api/enrollments/create_enrollment/
{
  "student_id": "uuid-here",
  "session": "session-uuid",
  "level": "level-uuid",
  "course_offerings": ["offering-uuid-1", "offering-uuid-2"],
  "notes": "Optional notes"
}
```

---

## Current Behavior

### Students
- ✅ Can access `/enrollments` (shows their enrollments)
- ✅ Can access `/enrollments/new` (enrollment wizard)
- ✅ Enrollments auto-activate when student submits
- ✅ See "Enrollments" in navigation sidebar

### Staff
- ❌ Cannot access `/enrollments/new` (would get `student_id required` error)
- ❌ "Enrollments" link hidden from sidebar for staff
- ✅ Can use Django Admin for all enrollment management
- ✅ Can view enrollment data through Reports and Admin Dashboard

---

## Error Messages

### "student_id is required for staff"
**Cause**: Staff user tried to use student enrollment wizard  
**Solution**: Use Django Admin to create enrollments for students

### "Student profile not found"
**Cause**: Student user doesn't have a StudentProfile record  
**Solution**: Create StudentProfile record in Django Admin

### "Enrollment already exists"
**Cause**: Student already has an active enrollment for that session+level  
**Solution**: Either:
1. Withdraw the existing enrollment first
2. Add courses to the existing enrollment instead

---

## Future Enhancements

### Phase 12: Staff Enrollment Interface
Create a dedicated staff page for managing student enrollments:
- `/admin/enrollments` - Staff enrollment management page
- Student search and selection
- Bulk enrollment creation
- Enrollment approval workflow
- Course management per student

### Wireframe:
```
+-----------------------------------------------+
| Staff Enrollment Management                    |
+-----------------------------------------------+
| [Search Students...] [+ New Enrollment]       |
+-----------------------------------------------+
| Student List:                                  |
| - John Doe (STU001)       [Enroll]           |
| - Jane Smith (STU002)     [View Enrollments] |
| - ...                                         |
+-----------------------------------------------+
```

---

## Technical Details

### Endpoint: `POST /api/enrollments/create_enrollment/`

**Logic:**
```python
if user.role == 'student':
    # Use authenticated user's student profile
    student_profile = user.student_profile
else:
    # Staff must provide student_id
    student_id = request.data.get('student_id')
    if not student_id:
        return 400 "student_id is required for staff"
    student_profile = StudentProfile.objects.get(id=student_id)
```

### Enrollment Status Flow:
```
DRAFT → ACTIVE → COMPLETED
  ↓
WITHDRAWN (terminal state)
```

- **DRAFT**: Created but not yet approved (staff-created enrollments)
- **ACTIVE**: Approved and student can attend classes (auto for student self-enrollment)
- **COMPLETED**: Student finished the program
- **WITHDRAWN**: Student withdrew from the program

---

## API Endpoints

### Student Endpoints
```bash
# Get my enrollments
GET /api/enrollments/my_enrollments/

# Create enrollment (student)
POST /api/enrollments/create_enrollment/
{
  "session": "uuid",
  "level": "uuid",
  "course_offerings": ["uuid1", "uuid2"]
}
```

### Staff Endpoints
```bash
# List all enrollments (with filters)
GET /api/enrollments/?session=uuid&level=uuid&status=active

# Create enrollment for student (staff)
POST /api/enrollments/create_enrollment/
{
  "student_id": "uuid",
  "session": "uuid",
  "level": "uuid",
  "course_offerings": ["uuid1", "uuid2"]
}

# Activate enrollment
POST /api/enrollments/{id}/activate/

# Complete enrollment
POST /api/enrollments/{id}/complete/

# Withdraw enrollment
POST /api/enrollments/{id}/withdraw/

# Add course to enrollment
POST /api/enrollments/{id}/add_course/
{
  "course_offering": "uuid"
}

# Drop course from enrollment
POST /api/enrollments/{id}/drop_course/
{
  "enrollment_course_id": "uuid"
}
```

---

## Permissions

| Endpoint | Students | Staff |
|----------|----------|-------|
| `my_enrollments/` | ✅ Read own | ❌ |
| `create_enrollment/` | ✅ Self only | ✅ Any student |
| `list` | ✅ Own only | ✅ All |
| `activate/` | ❌ | ✅ |
| `complete/` | ❌ | ✅ |
| `withdraw/` | ❌ | ✅ |
| `add_course/` | ❌ | ✅ |
| `drop_course/` | ❌ | ✅ |

---

## Testing

### As Student:
1. Login as `student@ican.edu`
2. Click "Enrollments" in sidebar
3. Click "New Enrollment"
4. Complete wizard
5. Verify enrollment appears in dashboard

### As Staff:
1. Login as `admin@ican.edu`
2. "Enrollments" link should NOT appear in sidebar
3. Go to Django Admin `/admin/`
4. Navigate to Enrollments
5. Create enrollment for a student
6. Verify it appears in student's account

---

## Support

### For Students:
- If you cannot enroll, check:
  1. Is there an active academic session?
  2. Are there active course offerings for your level?
  3. Do you already have an enrollment for this session+level?

### For Staff:
- Use Django Admin for all enrollment management
- Never use the `/enrollments/new` wizard as staff
- Future: Dedicated staff enrollment page coming in Phase 12

### Contact:
- Technical Support: support@ican.edu
- Phone: +234 123 456 7890
- Office Hours: Mon-Fri 8AM-5PM WAT
