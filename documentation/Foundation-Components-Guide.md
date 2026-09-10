# Foundation Components Guide - ICAN Platform

**Created**: September 9, 2026  
**Status**: Ready to Use

---

## Overview

This guide documents the foundation components created for production readiness. All components follow professional design standards and are ready for immediate use across all pages.

---

## 🎯 Components Available

### 1. ErrorBoundary
**Location**: `src/components/ErrorBoundary.tsx`

**Purpose**: Catches React errors and displays a user-friendly fallback UI instead of crashing the app.

**Usage**:
```tsx
// Already wrapped around entire app in App.tsx
// For specific sections:
import { ErrorBoundary } from './components/ErrorBoundary';

<ErrorBoundary>
  <YourComponent />
</ErrorBoundary>
```

**Features**:
- Friendly error message
- Reload page button
- Go home button
- Technical details (expandable)
- Automatic error logging to console

---

### 2. Toast Notifications
**Library**: `react-hot-toast`  
**Utility**: `src/lib/toast.ts`

**Purpose**: Provide instant feedback for user actions (success, error, loading).

**Usage**:
```tsx
import { showToast } from '../lib/toast';

// Success message
showToast.success('Student added successfully!');

// Error message
showToast.error('Failed to save data');

// Loading toast
const toastId = showToast.loading('Saving...');
// Later dismiss it
showToast.dismiss(toastId);

// Promise-based (auto-manages loading/success/error)
showToast.promise(
  saveStudentAPI(data),
  {
    loading: 'Saving student...',
    success: 'Student saved!',
    error: 'Failed to save student'
  }
);

// API error handler (auto-extracts error message)
try {
  await api.call();
} catch (error) {
  showToast.apiError(error);
}
```

**Already Configured**:
- Position: top-right
- Duration: 4s (success: 3s, error: 5s)
- Dark theme
- Icons for success/error

---

### 3. LoadingSpinner
**Location**: `src/components/LoadingSpinner.tsx`

**Components**:
- `LoadingSpinner` - Basic spinner
- `LoadingOverlay` - Full-screen overlay
- `PageLoading` - Centered page loader
- `ButtonWithLoading` - Button with loading state

**Usage**:
```tsx
import { 
  LoadingSpinner, 
  LoadingOverlay, 
  PageLoading,
  ButtonWithLoading 
} from '../components/LoadingSpinner';

// Basic spinner
<LoadingSpinner size="md" color="blue" />

// Full-screen overlay
{isLoading && <LoadingOverlay message="Processing payment..." />}

// Page loading
if (isLoading) return <PageLoading message="Loading students..." />;

// Button with loading
<ButtonWithLoading
  loading={isSubmitting}
  onClick={handleSubmit}
  className="bg-blue-600 text-white px-4 py-2 rounded"
>
  Save Student
</ButtonWithLoading>
```

**Sizes**: `sm`, `md`, `lg`, `xl`  
**Colors**: `blue`, `white`, `gray`

---

### 4. LoadingSkeleton
**Location**: `src/components/LoadingSkeleton.tsx`

**Components**:
- `Skeleton` - Basic skeleton block
- `CardSkeleton` - Loading card
- `TableSkeleton` - Loading table
- `ListSkeleton` - Loading list
- `StatCardSkeleton` - Loading stat card
- `FormSkeleton` - Loading form
- `DashboardSkeleton` - Complete dashboard loading

**Usage**:
```tsx
import { 
  TableSkeleton, 
  DashboardSkeleton,
  CardSkeleton 
} from '../components/LoadingSkeleton';

// While loading data
if (isLoading) {
  return <TableSkeleton rows={5} columns={4} />;
}

// Dashboard loading
if (isLoading) {
  return <DashboardSkeleton />;
}

// Card loading
{isLoading ? (
  <CardSkeleton />
) : (
  <StudentCard data={student} />
)}
```

**Best Practice**: Show skeletons that match the actual content layout for smooth transitions.

---

### 5. ConfirmDialog
**Location**: `src/components/ConfirmDialog.tsx`  
**Hook**: `src/hooks/useConfirm.tsx`

**Purpose**: Get user confirmation before destructive actions (delete, cancel, etc.).

**Usage with Hook (Recommended)**:
```tsx
import { useConfirm } from '../hooks/useConfirm';
import { ConfirmDialog } from '../components/ConfirmDialog';

function MyComponent() {
  const { confirm, confirmState, handleConfirm, handleCancel } = useConfirm();
  
  const handleDelete = async () => {
    const confirmed = await confirm({
      title: 'Delete Student?',
      message: 'This action cannot be undone. Are you sure you want to delete this student?',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      variant: 'danger'
    });
    
    if (confirmed) {
      // Proceed with deletion
      await deleteStudent();
      showToast.success('Student deleted');
    }
  };
  
  return (
    <>
      <button onClick={handleDelete}>Delete</button>
      
      <ConfirmDialog
        isOpen={confirmState.isOpen}
        onClose={handleCancel}
        onConfirm={handleConfirm}
        title={confirmState.title}
        message={confirmState.message}
        confirmText={confirmState.confirmText}
        cancelText={confirmState.cancelText}
        variant={confirmState.variant}
      />
    </>
  );
}
```

**Variants**:
- `danger` - Red (for delete, remove)
- `warning` - Yellow (for caution actions)
- `info` - Blue (for informational confirmations)

---

### 6. EmptyState
**Location**: `src/components/EmptyState.tsx`

**Components**:
- `EmptyState` - Generic empty state
- `NoStudentsFound` - Preset for students
- `NoCoursesFound` - Preset for courses
- `NoEnrollmentsFound` - Preset for enrollments
- `NoInvoicesFound` - Preset for invoices
- `NoNotificationsFound` - Preset for notifications

**Usage**:
```tsx
import { NoStudentsFound, NoCoursesFound } from '../components/EmptyState';

// Using preset
{students.length === 0 && (
  <NoStudentsFound onAdd={() => setShowAddModal(true)} />
)}

// Custom empty state
import { EmptyState } from '../components/EmptyState';

<EmptyState
  icon={<MyIcon />}
  title="No data found"
  description="Try adjusting your filters or search terms."
  action={{
    label: 'Clear Filters',
    onClick: handleClearFilters
  }}
/>
```

**Features**:
- Icon display
- Title and description
- Optional action button
- Responsive layout

---

## 🚀 Quick Implementation Guide

### Step 1: Install Dependencies
```bash
cd frontend
npm install
```

This installs `react-hot-toast` added to package.json.

### Step 2: Import Foundation Components
All components are ready to use. No additional setup needed (already configured in App.tsx).

### Step 3: Update Existing Pages

**Example: StudentsPage.tsx**

**Before**:
```tsx
function StudentsPage() {
  const { data, isLoading } = useQuery(['students'], fetchStudents);
  
  if (isLoading) return <div>Loading...</div>;
  
  return (
    <div>
      {data.map(student => <StudentCard key={student.id} student={student} />)}
    </div>
  );
}
```

**After**:
```tsx
import { TableSkeleton } from '../components/LoadingSkeleton';
import { NoStudentsFound } from '../components/EmptyState';
import { showToast } from '../lib/toast';

function StudentsPage() {
  const { data, isLoading, error } = useQuery(['students'], fetchStudents);
  
  if (isLoading) return <TableSkeleton rows={10} columns={5} />;
  
  if (error) {
    showToast.apiError(error);
    return <div>Error loading students</div>;
  }
  
  if (data.length === 0) {
    return <NoStudentsFound onAdd={() => navigate('/students/new')} />;
  }
  
  return (
    <div>
      {data.map(student => <StudentCard key={student.id} student={student} />)}
    </div>
  );
}
```

---

## 📋 Implementation Checklist for Each Page

Use this checklist when updating pages:

### Loading States
- [ ] Replace `<div>Loading...</div>` with appropriate skeleton
- [ ] Use `PageLoading` for full page loads
- [ ] Use `LoadingSpinner` for inline/small loads
- [ ] Use `ButtonWithLoading` for submit buttons

### Empty States
- [ ] Add empty state when list/table is empty
- [ ] Include action button if user can add items
- [ ] Use preset components when available

### Error Handling
- [ ] Wrap API calls in try-catch
- [ ] Use `showToast.apiError(error)` for API errors
- [ ] Use `showToast.error()` for validation errors
- [ ] Display user-friendly error messages

### Success Feedback
- [ ] Show toast on successful save/update/delete
- [ ] Use descriptive messages ("Student added successfully")
- [ ] Consider using `showToast.promise()` for async operations

### Confirmations
- [ ] Add confirm dialog for delete actions
- [ ] Add confirm dialog for other destructive actions
- [ ] Use appropriate variant (danger/warning/info)
- [ ] Include clear message about consequences

---

## 🎨 Design Consistency

### Colors
- **Primary**: Blue (#2563eb / blue-600)
- **Success**: Green (#10b981 / green-500)
- **Error**: Red (#ef4444 / red-500)
- **Warning**: Yellow (#f59e0b / yellow-500)
- **Gray**: Various shades for text/backgrounds

### Spacing
- Small: 0.5rem (8px)
- Medium: 1rem (16px)
- Large: 1.5rem (24px)
- Extra Large: 2rem (32px)

### Border Radius
- Small: 0.375rem (rounded-md)
- Medium: 0.5rem (rounded-lg)
- Large: 0.75rem (rounded-xl)

### Shadows
- Small: shadow-sm
- Medium: shadow
- Large: shadow-lg
- Extra Large: shadow-xl

---

## 🔧 Customization

### Toast Options
Edit `App.tsx` to customize toast appearance:
```tsx
<Toaster
  position="top-right" // or "top-center", "bottom-right", etc.
  toastOptions={{
    duration: 4000, // milliseconds
    style: {
      background: '#363636',
      color: '#fff',
    },
  }}
/>
```

### Loading Spinner Colors
Add custom colors in `LoadingSpinner.tsx`:
```tsx
const colorClasses = {
  blue: 'border-blue-600',
  green: 'border-green-600',
  red: 'border-red-600',
  // Add more...
};
```

---

## 📊 Priority Pages to Update

### Week 1 (Critical)
1. **AdminDashboard** - Add DashboardSkeleton, stat cards
2. **StudentsPage** - Add TableSkeleton, empty state, confirmations
3. **EnrollmentWizard** - Add loading states, error handling
4. **CoursesPage** - Add CRUD modals, confirmations
5. **BillingPage** - Add loading, empty state

### Week 2 (Important)
6. **StudentEnrollmentDashboard** - Add loading, empty state
7. **ClassManagementPage** - Add CRUD, confirmations
8. **ProfilePage** - Add edit mode, loading states
9. **AcademicsPage** - Add CRUD operations
10. **InvoiceDetailPage** - Add loading, actions

### Week 3 (Polish)
11-21. All remaining pages - Add loading, empty states, polish

---

## 🐛 Common Pitfalls to Avoid

### 1. Forgetting to Handle Loading States
❌ **Bad**:
```tsx
const { data } = useQuery(['students'], fetchStudents);
return <div>{data.map(...)}</div>; // Crashes if data is undefined
```

✅ **Good**:
```tsx
const { data, isLoading } = useQuery(['students'], fetchStudents);
if (isLoading) return <TableSkeleton />;
return <div>{data.map(...)}</div>;
```

### 2. No User Feedback on Actions
❌ **Bad**:
```tsx
const handleSave = async () => {
  await saveStudent(data);
  // User doesn't know if it worked
};
```

✅ **Good**:
```tsx
const handleSave = async () => {
  try {
    await saveStudent(data);
    showToast.success('Student saved successfully!');
  } catch (error) {
    showToast.apiError(error);
  }
};
```

### 3. Deleting Without Confirmation
❌ **Bad**:
```tsx
<button onClick={() => deleteStudent(id)}>Delete</button>
```

✅ **Good**:
```tsx
const handleDelete = async () => {
  const confirmed = await confirm({
    title: 'Delete Student?',
    message: 'This cannot be undone.',
    variant: 'danger'
  });
  if (confirmed) await deleteStudent(id);
};
```

### 4. Empty Lists Without Guidance
❌ **Bad**:
```tsx
{students.length === 0 && <div>No students</div>}
```

✅ **Good**:
```tsx
{students.length === 0 && (
  <NoStudentsFound onAdd={() => setShowModal(true)} />
)}
```

---

## 📚 Next Steps

1. **Install dependencies**: `cd frontend && npm install`
2. **Test components**: Verify ErrorBoundary and Toast work
3. **Update AdminDashboard**: Priority #1 page
4. **Update StudentsPage**: Add all features
5. **Update EnrollmentWizard**: Fix critical flow
6. **Systematically update all pages**: Use checklist above

---

## 🎯 Success Metrics

After implementing these components across all pages:

✅ **User Experience**
- Users get instant feedback on all actions
- Loading states prevent confusion
- Errors are clearly communicated
- Empty states guide next actions
- Confirmations prevent accidents

✅ **Developer Experience**
- Consistent patterns across codebase
- Reusable components reduce duplication
- Easy to add new features
- Better error handling

✅ **Production Ready**
- App doesn't crash on errors
- Professional appearance
- Meets UX best practices
- Ready for real users

---

**Created by**: Development Team  
**Last Updated**: September 9, 2026  
**Status**: ✅ Ready for Production Use
