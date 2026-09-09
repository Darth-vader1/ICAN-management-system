# ICAN Frontend Pages Guide

Complete reference for all frontend pages in the ICAN Tutorial Centre Management System.

## Navigation Structure

### Public Pages (No Authentication Required)
- `/login` - User login
- `/register` - Student registration
- `/payment/success` - Payment success callback
- `/payment/failure` - Payment failure callback

### Protected Pages (Authentication Required)

#### Dashboard & Profile
- `/dashboard` - Student dashboard with overview
- `/admin` - Admin dashboard with statistics (Staff only)
- `/profile` - User profile view and edit
- `/settings` - User settings and preferences
- `/help` - Help center and FAQ

#### Students Management (Staff Only)
- `/students` - List all students with search
- `/students/new` - Add new student (Future)
- `/students/:id` - View student details (Future)
- `/students/:id/edit` - Edit student (Future)

#### Academic Management
- `/academics` - Academic resources overview
- `/courses` - Course management (CRUD operations, Staff only)

#### Enrollment
- `/enrollments` - Student enrollment dashboard
- `/enrollments/new` - Enrollment wizard (multi-step form)

#### Billing & Payments
- `/billing` - Invoices and payment history
- `/billing/invoice/:id` - Invoice detail page
- Payment callbacks integrated with Paystack

#### Attendance
- `/attendance` - Attendance tracking dashboard

#### Communications
- `/notifications` - Notification center

#### Reports
- `/reports` - Reports dashboard

---

## Page Details

### 1. Admin Dashboard (`/admin`)
**Purpose**: Comprehensive overview for administrators and staff

**Features**:
- Key statistics (students, enrollments, revenue, pending payments)
- Recent enrollments list
- Recent payments list
- Quick action buttons
- Visual stats cards with icons

**Access**: Admin and Staff roles only

**Components Used**:
- Statistics grid (4 cards)
- Activity lists (2 columns)
- Quick actions grid (4 items)

---

### 2. Students Page (`/students`)
**Purpose**: Manage all student profiles

**Features**:
- Search students by name or ID
- Statistics summary (total, filtered, active)
- Student list table with:
  - Student ID
  - Name with avatar initials
  - Phone number
  - Registration date
  - Action buttons (View, Edit, Enrollments)
- Add new student button

**Access**: Staff only

**Search**: Real-time filtering on name and student_id

**Empty States**: Handled for no students or no search results

---

### 3. Courses Page (`/courses`)
**Purpose**: Full CRUD management for courses

**Features**:
- Statistics (total, active, inactive courses)
- Course cards grid display with:
  - Course code and title
  - Description preview
  - Active/Inactive status badge
  - Credit hours
  - Edit and Delete buttons
- Modal form for add/edit:
  - Course code (required)
  - Course title (required)
  - Description (optional)
  - Credit hours (1-10, default 3)
  - Active status checkbox

**Access**: Staff only

**Operations**:
- Create new course
- Edit existing course
- Delete course (with confirmation)
- Toggle active status

---

### 4. Payment Success Page (`/payment/success`)
**Purpose**: Post-payment success confirmation

**Features**:
- Success animation (bouncing checkmark)
- Payment details display:
  - Amount paid
  - Reference number
  - Transaction date
  - Invoice number
- Email receipt notification
- Action buttons:
  - View invoice
  - View all invoices
  - Back to dashboard
- Support link

**Access**: Public (callback from Paystack)

**URL Parameters**:
- `reference` - Payment reference
- `trxref` - Transaction reference (alternative)

**Flow**:
1. User redirected from Paystack
2. Frontend verifies payment with backend
3. Display success or error message
4. Provide navigation options

---

### 5. Payment Failure Page (`/payment/failure`)
**Purpose**: Post-payment failure handling

**Features**:
- Failure icon and message
- Common failure reasons list:
  - Insufficient funds
  - Incorrect card details
  - Payment cancelled
  - Network issues
  - Bank declined
- Transaction reference display
- Next steps guidance:
  - Try again
  - Check card/balance
  - Contact bank
  - Support assistance
- Action buttons:
  - Try again (to billing)
  - Contact support
  - Back to dashboard

**Access**: Public (callback from Paystack)

**URL Parameters**:
- `reference` - Payment reference (optional)
- `trxref` - Transaction reference (optional)

---

### 6. Settings Page (`/settings`)
**Purpose**: User account settings and preferences

**Features**:
- Three tabs:
  1. **Profile Tab**:
     - Email (read-only)
     - First name (editable)
     - Last name (editable)
     - Role (read-only)
     - Save changes button
  
  2. **Password Tab**:
     - Current password (required)
     - New password (required, min 8 chars)
     - Confirm password (required, must match)
     - Change password button
  
  3. **Notifications Tab**:
     - Email notifications toggle
     - SMS notifications toggle
     - Payment reminders toggle
     - Class reminders toggle
     - Marketing emails toggle
     - Save preferences button

**Access**: All authenticated users

**Validation**:
- Password length minimum 8 characters
- Password confirmation must match
- Profile update validates required fields

**Feedback**:
- Success messages (green)
- Error messages (red)
- Loading states on buttons

---

### 7. Help Page (`/help`)
**Purpose**: Self-service help center and documentation

**Features**:
- Search bar for help topics
- Category filters:
  - All Topics 📚
  - Enrollment 📝
  - Billing & Payments 💰
  - Attendance ✅
  - Account 👤
- Expandable FAQ accordion (14 FAQs)
- Contact support section:
  - Email: support@ican.edu
  - Phone: +234 123 456 7890
  - Office hours: Mon-Fri 8AM-5PM
- Quick links to main pages
- Empty state for no search results

**Access**: All authenticated users

**FAQ Categories**:
1. **Enrollment** (3 questions)
   - How to enroll
   - Changing courses
   - Enrollment deadlines

2. **Billing** (4 questions)
   - How to pay fees
   - Payment methods
   - Installment plans
   - Payment issues

3. **Attendance** (3 questions)
   - Tracking method
   - Minimum requirements
   - Reporting errors

4. **Account** (3 questions)
   - Password reset
   - Profile updates
   - Notification preferences

---

## Common Features Across Pages

### Loading States
All pages implement loading spinners:
```tsx
<div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full"></div>
```

### Error Handling
- Try-catch blocks for API calls
- User-friendly error messages
- Graceful degradation (empty states)
- Console logging for debugging

### Empty States
All list pages handle empty data:
```tsx
{items.length === 0 && (
  <div className="text-center py-12">
    <p className="text-gray-500">No items found</p>
  </div>
)}
```

### Responsive Design
- Mobile-first approach
- Tailwind responsive classes (md:, lg:)
- Grid layouts adjust on smaller screens
- Touch-friendly button sizes

### Accessibility
- Semantic HTML elements
- Form labels properly associated
- Button titles/tooltips
- Color contrast compliant
- Keyboard navigation support

---

## Styling Conventions

### Color Scheme
- **Primary**: Blue (#2563EB / blue-600)
- **Success**: Green (#059669 / green-600)
- **Warning**: Yellow (#D97706 / yellow-600)
- **Error**: Red (#DC2626 / red-600)
- **Gray Scale**: gray-50 to gray-900

### Component Patterns

#### Cards
```tsx
<div className="bg-white rounded-lg shadow p-6">
  {/* Content */}
</div>
```

#### Buttons (Primary)
```tsx
<button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
  Action
</button>
```

#### Buttons (Secondary)
```tsx
<button className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">
  Cancel
</button>
```

#### Input Fields
```tsx
<input
  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
/>
```

#### Status Badges
```tsx
<span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
  Active
</span>
```

---

## API Integration Patterns

### Handling Paginated Responses
All services check for pagination:
```typescript
const response = await api.get<{ results?: T[] } | T[]>('/endpoint/');
if (response.data && typeof response.data === 'object' && 'results' in response.data) {
  return response.data.results || [];
}
return Array.isArray(response.data) ? response.data : [];
```

### Error Handling Pattern
```typescript
try {
  const data = await service.getData();
  setData(data);
} catch (error) {
  console.error('Failed to fetch:', error);
  setError('User-friendly message');
} finally {
  setLoading(false);
}
```

---

## Navigation Structure

### Main Menu Items (Layout.tsx)
1. Dashboard
2. Academics
3. Enrollment
4. Billing
5. Attendance
6. Notifications
7. Reports
8. Settings (Secondary)
9. Help (Secondary)

### Staff-Only Routes
- `/admin` - Admin dashboard
- `/students` - Student management
- `/courses` - Course management

---

## Future Enhancements

### Planned Pages
1. `/students/:id` - Student detail view
2. `/students/:id/edit` - Student edit form
3. `/students/new` - Add student form
4. `/instructors` - Instructor management
5. `/classes` - Class management
6. `/grades` - Grade management
7. `/calendar` - Academic calendar

### Planned Features
1. Advanced search filters
2. Bulk operations (multi-select)
3. Export to CSV/PDF
4. Data visualization (charts)
5. Real-time notifications
6. Print-friendly layouts
7. Dark mode theme
8. Mobile app views

---

## Testing Checklist

### For Each Page
- [ ] Page loads without errors
- [ ] Loading state displays correctly
- [ ] Data fetches and displays
- [ ] Empty state shows when no data
- [ ] Error messages display properly
- [ ] Forms validate inputs
- [ ] Forms submit successfully
- [ ] Buttons and links work
- [ ] Responsive on mobile
- [ ] Accessible via keyboard
- [ ] Role-based access control works

### Cross-Browser Testing
- [ ] Chrome
- [ ] Firefox
- [ ] Safari
- [ ] Edge

### Performance
- [ ] Page loads < 3 seconds
- [ ] No memory leaks
- [ ] Images optimized
- [ ] API calls optimized (no duplicate requests)

---

## Support Contacts

**For Development Issues**:
- Check browser console for errors
- Review Network tab for API failures
- Check authentication token validity

**For Backend Issues**:
- Verify API endpoints are running
- Check CORS configuration
- Review Django logs

**For User Support**:
- Email: support@ican.edu
- Phone: +234 123 456 7890
- Office: Mon-Fri 8AM-5PM WAT
