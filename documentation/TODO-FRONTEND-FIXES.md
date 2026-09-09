# Frontend Fixes TODO

## Critical: Apply Pagination Fix to All Services

All Django REST Framework endpoints return paginated responses, so ALL services need the same fix.

### ✅ Fixed
- [x] `billingService.ts` - All list methods

### ⚠️ Needs Fixing

#### 1. academicsService.ts
- [ ] `sessionService.getAll()`
- [ ] `levelService.getAll()`
- [ ] `courseService.getAll()`
- [ ] `courseOfferingService.getAll()`

#### 2. enrollmentService.ts
- [ ] `enrollmentService.getAll()`
- [ ] `enrollmentService.getMy()`

#### 3. attendanceService.ts
- [ ] `attendanceSessionService.getAll()`
- [ ] `attendanceRecordService.getAll()`

#### 4. notificationService.ts
- [ ] `notificationService.getAll()`
- [ ] `notificationService.getUnread()`

#### 5. reportService.ts
- [ ] Check if list methods exist

#### 6. studentService.ts
- [ ] `studentService.getAll()`

### Fix Template

Replace this pattern:
```typescript
async getAll(params?: FilterParams): Promise<Item[]> {
  const response = await apiClient.get<Item[]>('/endpoint/', { params });
  return response.data;
}
```

With this:
```typescript
async getAll(params?: FilterParams): Promise<Item[]> {
  const response = await apiClient.get<{ results?: Item[] } | Item[]>(
    '/endpoint/',
    { params }
  );
  // Handle both paginated and non-paginated responses
  if (response.data && typeof response.data === 'object' && 'results' in response.data) {
    return response.data.results || [];
  }
  return Array.isArray(response.data) ? response.data : [];
}
```

---

## Optional Enhancements

### React Router Future Flags
Add to `App.tsx` BrowserRouter:
```typescript
<BrowserRouter future={{
  v7_startTransition: true,
  v7_relativeSplatPath: true
}}>
```

### Error Boundaries
Add error boundary component to catch React errors:

```typescript
// components/ErrorBoundary.tsx
import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">
            Something went wrong
          </h1>
          <p className="text-gray-600 mb-4">
            {this.state.error?.message}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded"
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
```

Then wrap App in `main.tsx`:
```typescript
<ErrorBoundary>
  <App />
</ErrorBoundary>
```

### Loading States
Add skeleton loaders instead of spinner:

```typescript
// components/SkeletonLoader.tsx
export default function SkeletonLoader() {
  return (
    <div className="animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
    </div>
  );
}
```

### Toast Notifications
Add react-toastify for better UX:

```bash
npm install react-toastify
```

```typescript
// In App.tsx
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// In JSX
<ToastContainer position="top-right" autoClose={3000} />
```

Usage:
```typescript
import { toast } from 'react-toastify';

toast.success('Payment successful!');
toast.error('Failed to load data');
```

---

## Testing Checklist

After applying fixes, test these pages:

### Billing Page
- [ ] Loads without errors
- [ ] Shows invoices if available
- [ ] Shows "No invoices" if empty
- [ ] Totals calculate correctly
- [ ] Can switch to payments tab

### Academics Page
- [ ] Sessions list loads
- [ ] Levels list loads
- [ ] Courses list loads
- [ ] Can create/edit/delete (staff)

### Enrollment Page
- [ ] Enrollments list loads
- [ ] Shows empty state if no enrollments
- [ ] Can start new enrollment

### Attendance Page
- [ ] Sessions list loads
- [ ] Records load correctly
- [ ] Stats display properly

### Notifications Page
- [ ] Notifications list loads
- [ ] Badge count is correct
- [ ] Can mark as read

### Dashboard
- [ ] All widgets load
- [ ] No console errors
- [ ] Stats are correct

---

## Priority

**High Priority** (Do Now):
1. Fix all service pagination handling
2. Test all pages load without errors
3. Verify empty states work

**Medium Priority** (This Week):
1. Add error boundaries
2. Add loading skeletons
3. Handle network errors gracefully

**Low Priority** (Nice to Have):
1. Add toast notifications
2. Add React Router future flags
3. Add form validation feedback
4. Add accessibility features

---

Last Updated: January 2025
