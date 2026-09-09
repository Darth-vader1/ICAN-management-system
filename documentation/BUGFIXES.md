# Bug Fixes Log

## Bug #1: invoices.reduce is not a function (FIXED ✅)

### Error
```
Uncaught TypeError: invoices.reduce is not a function
at calculateTotals (BillingPage.tsx:67:36)
```

### Root Cause
Django REST Framework returns paginated responses with this structure:
```json
{
  "count": 10,
  "next": "url",
  "previous": null,
  "results": [...]
}
```

But the frontend services were expecting a direct array `[]`.

### Fix Applied
Updated `billingService.ts` to handle both paginated and non-paginated responses:

```typescript
async getAll(params?: InvoiceFilterParams): Promise<InvoiceListItem[]> {
  const response = await apiClient.get<{ results?: InvoiceListItem[] } | InvoiceListItem[]>(
    '/billing/invoices/',
    { params }
  );
  // Handle both paginated and non-paginated responses
  if (response.data && typeof response.data === 'object' && 'results' in response.data) {
    return response.data.results || [];
  }
  return Array.isArray(response.data) ? response.data : [];
}
```

Also added safety checks in `BillingPage.tsx`:
- Check if invoices is an array before calling reduce
- Set empty arrays on error
- Return zero values if array is empty

### Files Modified
1. ✅ `frontend/src/services/billingService.ts` - All list methods
2. ✅ `frontend/src/pages/BillingPage.tsx` - calculateTotals function
3. ✅ `frontend/src/services/academicsService.ts` - All list methods
4. ✅ `frontend/src/services/enrollmentService.ts` - getAll and getMyEnrollments

---

## Bug #2: sessions?.find is not a function (FIXED ✅)

### Error
```
Uncaught TypeError: sessions?.find is not a function
at EnrollmentWizard (EnrollmentWizard.tsx:132:41)
```

### Root Cause
Same pagination issue - `sessions` wasn't an array.

### Fix Applied
1. Fixed `academicsService.ts` to handle pagination
2. Added array checks in `EnrollmentWizard.tsx`:

```typescript
const selectedSessionData = Array.isArray(sessions) ? sessions.find((s) => s.id === selectedSession) : null;
```

### Files Modified
1. ✅ `frontend/src/services/academicsService.ts`
2. ✅ `frontend/src/pages/EnrollmentWizard.tsx`

---

## Bug #3: 403 Forbidden on /api/enrollments/my_enrollments/ (FIXED ✅)

### Error
```
Failed to load resource: the server responded with a status of 403 (Forbidden)
```

### Root Cause
Wrong permission class - used `IsStaffOrAbove` instead of `IsAuthenticated` for student endpoints.

### Fix Applied
Changed permission classes in `backend/enrollments/views.py`:

```python
# Before
@action(detail=False, methods=['get'], permission_classes=[IsStaffOrAbove])
def my_enrollments(self, request):

# After
@action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
def my_enrollments(self, request):
```

Also added missing import:
```python
from rest_framework.permissions import IsAuthenticated
```

### Files Modified
1. ✅ `backend/enrollments/views.py` - Fixed permissions and added import

---

## Bug #4: 500 Error on /api/attendance/class-sessions/ (INVESTIGATING ⏳)

### Error
```
Failed to load resource: the server responded with a status of 500 (Internal Server Error)
```

### Root Cause
Backend error when querying attendance class sessions. Likely:
- No attendance data exists yet
- Query parameters causing issues
- Database relationship errors

### Status
⏳ **Needs Investigation** - Check backend logs for specific error

### Temporary Workaround
Handle 500 errors gracefully in frontend:
- Show "No data available" instead of crashing
- Add try-catch with proper error messages

---

## React Router Future Flags (Non-Critical Warnings)

### Warnings
```
⚠️ React Router Future Flag Warning: React Router will begin wrapping state updates in `React.startTransition` in v7
⚠️ React Router Future Flag Warning: Relative route resolution within Splat routes is changing in v7
```

### Status
These are just warnings about future React Router v7 changes. Not breaking.

### Action Required
Can be addressed later by adding future flags to BrowserRouter:

```typescript
<BrowserRouter future={{
  v7_startTransition: true,
  v7_relativeSplatPath: true
}}>
```

**Priority**: Low (not affecting functionality)

---

## Summary of Fixes Applied

### Backend ✅
1. Fixed enrollment permissions for students
2. Added `IsAuthenticated` import

### Frontend ✅
1. Fixed all service pagination handling:
   - billingService.ts ✅
   - academicsService.ts ✅
   - enrollmentService.ts ✅
2. Added array safety checks in pages:
   - BillingPage.tsx ✅
   - EnrollmentWizard.tsx ✅

### Still TODO ⏳
1. ⏳ Fix attendance 500 error
2. ⏳ Apply pagination fix to remaining services:
   - attendanceService.ts (already has PaginatedResponse)
   - notificationService.ts
   - reportService.ts
   - studentService.ts

---

Last Updated: January 2025
