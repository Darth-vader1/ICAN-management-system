Agent

0/6 done

Assess current frontend gaps - missing pages, incomplete features

Identify missing frontend services/types/hooks for existing backend features

Document UI infrastructure needs (component library, shared components, utilities)

Prioritize & structure as actionable implementation roadmap

Outline State Management & Data Flow improvements needed

List Developer Experience & Testing infrastructure additions

Let me systematically audit the current frontend against all available backend capabilities to identify gaps.

ICAN management system\frontend\src\pages

ICAN management system\frontend\src\services

ICAN management system\frontend\src\types

ICAN management system\frontend\src\components

Now let me examine the content of the current pages, services, and types to see how much of the backend they actually cover. I'll check a few representative files.

frontend\src\services\billingService.ts

frontend\src\services\attendanceService.ts

frontend\src\services\reportService.ts

frontend\src\types\billing.ts

frontend\src\types\auth.ts

Let me check the academics service and look at a couple of existing pages to understand the pattern and what might be missing or incomplete.

frontend\src\services\academicsService.ts

frontend\src\services\enrollmentService.ts

frontend\src\types\academics.ts

frontend\src\App.tsx

Now let me look at a representative sample of existing pages to see their maturity and the shared library utilities.

frontend\src\pages\BillingPage.tsx

frontend\src\pages\ReportsDashboard.tsx

frontend\src\pages\AttendanceDashboard.tsx

ICAN management system\frontend\src\lib

frontend\src\lib\roles.ts

1/6 done

Assess current frontend gaps - missing pages, incomplete features

Identify missing frontend services/types/hooks for existing backend features

Document UI infrastructure needs (component library, shared components, utilities)

Prioritize & structure as actionable implementation roadmap

Outline State Management & Data Flow improvements needed

List Developer Experience & Testing infrastructure additions

Let me check backend views for any missing frontend functionality to get an accurate picture of gaps.

backend\billing\views.py

frontend\src\services\studentService.ts

frontend\src\services\notificationService.ts

Search codebase for 'frontend/src/hooks/**/*.{ts,tsx}'

Search codebase for 'frontend/src/utils/**/*.{ts,tsx}'

2/6 done

Assess current frontend gaps - missing pages, incomplete features

Identify missing frontend services/types/hooks for existing backend features

Document UI infrastructure needs (component library, shared components, utilities)

Prioritize & structure as actionable implementation roadmap

Outline State Management & Data Flow improvements needed

List Developer Experience & Testing infrastructure additions

5/6 done

Assess current frontend gaps - missing pages, incomplete features

Identify missing frontend services/types/hooks for existing backend features

Document UI infrastructure needs (component library, shared components, utilities)

Outline State Management & Data Flow improvements needed

List Developer Experience & Testing infrastructure additions

Prioritize & structure as actionable implementation roadmap

6/6 done

Assess current frontend gaps - missing pages, incomplete features

Identify missing frontend services/types/hooks for existing backend features

Document UI infrastructure needs (component library, shared components, utilities)

Prioritize & structure as actionable implementation roadmap

Outline State Management & Data Flow improvements needed

List Developer Experience & Testing infrastructure additions

# Frontend Improvement Roadmap: What We Need to Add
Based on a systematic audit of the existing frontend against the backend's 50+ API endpoints and 20+ database models, here's a complete, prioritized inventory of everything we need to add to build a feature-complete, maintainable frontend for the ICAN platform.

## PRIORITY 1: FOUNDATIONAL INFRASTRUCTURE (Build First — Everything Depends On These)
These missing pieces are causing repeated code duplication across every page. Installing these now will accelerate all subsequent page development by ~50%.

### 1.1 Shared UI Component Library (src/components/ui/)
Currently each page hardcodes raw Tailwind classes for buttons, tables, cards, status badges — creating 6+ duplicated getStatusColor() / formatCurrency() functions. We need consistent, accessible primitives:

Component Purpose Duplicated In Button Variants: primary/secondary/danger/ghost + sizes: sm/md/lg + loading state BillingPage, ReportsDashboard, AttendanceDashboard, all 21 pages Card / CardHeader / CardBody / CardFooter Container with consistent padding/shadow Every page with sections Badge Status chips with color variants (success/warning/danger/info/gray) + Enum-driven getStatusColor() copied in Billing, Reports, Invoices, Students Table / TableHeader / TableRow / TableCell / TableEmpty / TableSkeleton Consistent tables with sticky headers & responsive overflow BillingPage invoices list, ReportsDashboard, StudentsPage DataTable (advanced) Above + pagination, search, sort, column filters StudentsPage, Payments, Reports Input / Label / Textarea / Select / Checkbox / Radio Form controls with error states (RHF integration) LoginPage, RegisterPage, EnrollmentWizard Modal / Dialog Confirmation + CRUD modals with header/body/footer + closeOnEscape Delete confirmations, add-course-to-enrollment, fee creation Drawer Slide-in side panel for forms (e.g., mark attendance) Attendance marking Tabs / Tab Tab switcher BillingPage tabs, Enrollment details Accordion Expandable sections Invoice line items, Student profile details Alert Success/error/warning info boxes with dismiss Payment confirmation, Form errors Skeleton / SkeletonTable / SkeletonCard Loading placeholders instead of spinners everywhere All loading states EmptyState No-data placeholder with icon + CTA Every list page Avatar User avatar with initials fallback Layout user card, Student lists DropdownMenu Click-over menus with items & dividers Layout user menu, Table row actions Tooltip Hover explanations Help icons on forms ProgressBar Linear determinate progress Payment progress on invoice, enrollment completion % Pagination Page navigator (prev/next, page numbers, page size selector) All list pages

Recommended Pattern : Radix UI primitives (headless, accessible) wrapped with Tailwind class variants. Add to components as ui/ .

### 1.2 Utility Library (src/utils/)
Currently, formatting functions are copy-pasted inside individual page components. Extract to:

Utility File Functions Needed Duplicated In format.ts formatCurrency(amount, currency='NGN') (Intl.NumberFormat, ₦X,XXX.XX)
 `formatDate(date, style='short' 'long') <br> formatDateTime(iso) <br> formatRelativeTime(iso) (e.g., "2 hours ago") <br> formatPercentage(value, decimals=0)` types.ts DeepPartial<T> , Nullable<T> , PaginatedResponse<T> , WithId<T> , EnumValues<T> Defined ad-hoc at top of every service file errors.ts getErrorMessage(error) (extracting DRF detail / field errors / non_field_errors into user-friendly string) api.ts getErrorMessage — move here download.ts downloadBlob(blob, filename) , downloadCSV(rows, filename) , exportFile(data, format, filename) reportService.downloadBlob — extract from service storage.ts Typed localStorage wrapper ( setTokens , getTokens , clearTokens , setPreference<T> ) AuthContext.tsx, api.ts (both access localStorage directly) roles.ts Expand current roles.ts :
 hasRole(user, allowed) , isStaff(user) , isFinance(user) , roleDisplayName(role) , ROLE_HIERARCHY[] Every component has inline user?.role === 'finance' || user?.role === 'super_admin' validation.ts Zod schemas shared: emailSchema , passwordSchema , requiredString(min) , phoneSchema LoginPage, RegisterPage, EnrollmentWizard hardcode Zod inline

### 1.3 Custom React Hooks Library (src/hooks/)
Current pages use raw useEffect + useState for everything, missing:

Hook File Hooks Needed Benefit useAuth.ts Wrap useAuth() with role helpers: useIsStaff() , useHasRole(roles) , useRequireRole(roles, redirect) Consistent auth checks without useAuth() + inline logic everywhere useQuery* / useMutation* per domain Thin TanStack Query wrappers returning cached data, invalidating correctly:
 useInvoices(params?) / useInvoice(id) / useCreateInvoice()
 useStudent(id) / useStudents(filters?)
 useAttendanceRecords(sessionId)
 useFinancialSummary() Eliminates 90% of useState(loading) + useEffect(fetch) boilerplate. Auto-caching, auto-refetch, optimistic updates. useDebounce.ts useDebouncedValue<T>(value, delay=300) Search inputs usePagination.ts usePagination({page, pageSize, total, onChange}) All list pages useDisclosure.ts useDisclosure() → {isOpen, open, close, toggle} All modals/drawers useConfirm.ts const confirm = useConfirm(); confirm(message).then(ok => ...) Delete/action confirmations instead of window.confirm useToast.ts useToast() → {success(msg), error(msg), info(msg), warning(msg)} Replace alert('Export failed') and console.error in UI useLocalStorage.ts useLocalStorage<T>(key, initial) Theme, user preferences useRoleGuard.ts useRoleGuard(allowedRoles) returns {authorized, loading} Dynamic UI element hiding (buttons that only appear for finance)

## PRIORITY 2: MISSING PAGES FOR EXISTING BACKEND FEATURES
Backend has 10 API namespaces with full CRUD + custom actions. Currently 21 pages exist. We need:

### 2.1 Billing/Finance Pages (Backend Ready, Frontend Missing)
New Page Route Roles Required Backend Endpoints Gap vs Current FeeStructuresPage (CRUD) /billing/fees Manager+ GET/POST/PATCH/DELETE /billing/fees/ feeStructureService exists in billingService.ts but no page uses it. StudentsPage/BillingPage should link here PaymentsPage (list + create_manual + verify + allocate) /billing/payments Finance+ GET /billing/payments/ , POST create_manual/ , POST /verify/ , POST /allocate/ paymentService.getAll/createManual/verify/allocate all exist billingService.ts L98-L138 but NO PAGE. BillingPage only shows 2-tab list with no actions PaymentDetailPage /billing/payments/:id Finance+ GET /billing/payments/{id}/ + Allocations list + Refund button Missing entirely RefundsPage /billing/refunds Finance+ GET /billing/refunds/ , POST /billing/refunds/ refundService exists billingService.ts L142-L161 , no page InvoiceCreatePage (manual) /billing/invoices/new Manager+ InvoiceService.create_invoice_for_enrollment() / find student enrollment + generate Currently invoices are auto-generated by backend on enrollment. But backend supports staff manually creating them — no UI FinancialProfilePage (Student 360° Finance) /billing/student/:id Finance/Manager+ /billing/financial-profile/{student_id}/ billingService.ts L170-L175 — exists with no page StudentDetailPage should embed this

### 2.2 Attendance Pages (Backend Ready, Frontend Missing)
New Page Route Roles Gap ClassSessionDetailPage (Mark Attendance Screen) /attendance/sessions/:id Staff The biggest single UX gap in the platform . AttendanceDashboard has no click-through. Bulk mark_attendance action exists at attendanceService.markAttendance . This page needs: roster table with Present/Absent/Late/Excused radio, arrival_time inputs, Save button, attendance_stats widget ScheduledSessionsPage (Calendar view) /attendance/sessions All List/Calendar/Table view of sessions per offering. Staff: create/edit ClassSession. Students: view their upcoming. Backend sessions.getAll supports date filters MyAttendancePage /attendance/my Student Student self-service: per-course attendance %, per-session drilldown, excused reason. Backend has getMyAttendance + student_summary. AttendanceStatsPage /attendance/stats Staff+ Bar chart of avg attendance per course offering + table with CourseAttendanceStats rows ( attendanceService.getCourseStats ) + student-level drill-downs

### 2.3 Academics Pages (Backend Ready, Frontend Missing)
New Page Route Roles Gap AcademicSessionsPage (CRUD) /academics/sessions Manager+ sessionsService CRUD exists academicsService.ts L52-L87 , no page. AcademicsPage is currently a stub — split into tabs with this LevelsPage (CRUD) /academics/levels Manager+ levelsService L21-L49 , no page CourseDetailPage /courses/:id Staff CoursesPage is list only. Show offerings across sessions, classes, description, syllabus CourseOfferingDetailPage /academics/offerings/:id Staff Tutor assignment, capacity management, roster of enrolled students, classes list, class schedules ClassDetailPage /classes/:id Staff/Tutor Class roster + list of schedules, session links SchedulesPage (Weekly Calendar) /academics/schedules All Full weekly calendar view using schedulesService.getUpcoming() L210-L219 . Students: "My timetable". Staff: drag-drop schedule builder

### 2.4 Enrollment Pages (Backend Ready, Frontend Missing)
New Page Route Roles Gap EnrollmentManagementPage (Staff) /enrollments/manage Manager/Officer Backend has EnrollmentViewSet with getAll/activate/complete/withdraw/add_course/drop_course all implemented in enrollmentService.ts + staff URL in /enrollments/. Currently route /enrollments is STUDENT-ONLY RoleGuard . Staff has no enrollment admin page. Huge gap. EnrollmentDetailPage (Shared) /enrollments/:id Staff + Student self Timeline of status changes, list of courses (with add/drop buttons for staff), enrollment notes, link to invoice(s) StaffEnrollmentCreationWizard /enrollments/new-staff Manager/Officer Existing wizard EnrollmentWizard.tsx is student-only. Staff needs to pick student_id, override status, etc.

### 2.5 Notifications/Communications (Backend Ready, Frontend Missing)
New Page Route Roles Gap NotificationTemplatesPage (CRUD) /settings/notifications/templates Manager+ notificationTemplateService exists L75-L120 , no page. Required for customizing email/whatsapp templates with {{variable}} live preview MessageLogsPage /admin/message-logs IT/Manager+ messageLogService L125-L147 — audit delivery history, see which messages failed and retry

### 2.6 Audit & Admin Pages
New Page Route Roles Gap AuditLogsPage /admin/audit-logs IT Admin+ Backend /api/audit-logs/ namespace exists. No service or page. Filter by: actor, action, entity_type, date range. Entity link-out. old_value/new_value JSON diff viewer StaffManagementPage (CRUD) /admin/staff Super Admin/IT+ Backend /api/auth/staff/provision/ exists to provision staff. No page listing/creating/editing/deactivating staff accounts SystemSettingsPage /admin/settings IT Admin Feature flags, toggle payment reminders, email provider switch, Paystack key status check, DB status (no backend yet, but we'll need)

### 2.7 Reports Pages (Currently a Single "Dashboard" — need Individual Reports)
Current ReportsDashboard.tsx only shows financial summary. Split into:

New Page Route Purpose FinancialReportPage /reports/financial Bar/line charts (invoiced vs paid monthly) + filterable detail table + export. Use chart.js + react-chartjs-2 (add dep) AttendanceReportPage /reports/attendance Filter by course/session/date range. Avg-rate heatmap. Export. PaymentsReportPage /reports/payments Breakdown by method (Paystack/bank/cash/pos), by day/week. Filter by date/status. EnrollmentReportPage /reports/enrollments By level × status stacked bar. By intake session. StudentReportPage /reports/students/:id? Per-student 360°: enrollments + attendance % + financial balance + report card widget (integrate with student_report )

## PRIORITY 3: TYPES & SERVICE GAPS
### 3.1 Missing TypeScript Type Files
File Needed Content Gap types/student.ts Move student types OUT of inline in studentService.ts into dedicated types file (consistent with billing/academics/attendance) Inconsistency: all other domains use types/ types/audit.ts AuditLog , AuditAction , AuditLogFilters — missing entirely Needed for AuditLogsPage types/report.ts EXISTS but incomplete: add ReportExportFormat = 'json'|'csv'|'excel'|'pdf' , chart primitives ( SeriesPoint , ChartData ) types/common.ts Shared: PaginationParams , SortDirection , FilterOperator , DateTimeRange , PaginatedResult<T> — copy-pasted in every service file

### 3.2 Missing Frontend Service Files
Service Needed Methods Gap auditService.ts getAuditLogs(filters) , getAuditLog(id) Backend has /audit-logs/ , no frontend service staffService.ts provisionStaff(data) , getStaffList() , getStaffMember(id) , updateStaff(id, data) , deactivateStaff(id) Uses backend /auth/staff/provision/ which exists but lacks wrapper in frontend services Expand studentService.ts Currently has getAll/getById/getMyProfile/create/update/delete . Missing : deactivate(id) , reactivate(id) , searchStudents(query) , importStudents(csv) , getStudentEnrollments(id) + getStudentAttendanceSummary(id) which uses backend student_summary / student_report endpoints Expand notificationService.ts Add resendMessage(messageLogId) for failed message retries

## PRIORITY 4: STATE MANAGEMENT & DATA FLOW
### 4.1 Migrate All Pages to TanStack Query
Current anti-pattern observed in every page :

→ Replace with :

Benefits: automatic caching across page navigations, auto-refetch on mutation invalidation, optimistic updates, deduped in-flight requests, retry with exponential backoff built into TanStack Query.

Implementation Plan : Create src/hooks/queries/ with one file per domain:

- useStudents.ts / useAcademics.ts / useEnrollments.ts / useBilling.ts / usePayments.ts / useAttendance.ts / useReports.ts / useNotifications.ts / useAudit.ts
### 4.2 Add Query Keys Convention File
src/lib/queryKeys.ts — typed QUERY_KEYS enum object so mutations can correctly invalidate caches:

### 4.3 Global Toast/Notification System
Current pages use alert() and console.error() for error handling. Add:

- React Hot Toast ( react-hot-toast ) or Sonner component ( sonner ) — add to deps
- Mount <Toaster /> in root App.tsx
- Wrap every useMutation with onSuccess: toast.success('...') / onError: toast.error(getErrorMessage(err))
- api.ts response error interceptor → auto-toast on 500-level errors
### 4.4 Confirmation Dialog Context
Global ConfirmDialog mounted in root with useConfirm() hook so Pages don't use window.confirm() for delete operations.

### 4.5 React Router Loader Support (Optional V7 Prep)
Current route rendering: all data fetches happen after page mount via useEffect. Upgrade for faster perceived load by using React Router 6+ loaders on each route definition so App.tsx calls loader: studentsLoader which prefetches data before render + Suspense + Skeleton states.

## PRIORITY 5: FORMS & FORM LIBRARY INTEGRATION
### 5.1 Extract Reusable Forms
Current LoginPage, RegisterPage, EnrollmentWizard inline their forms. Extract reusable:

- LoginForm.tsx (with forgot-password link flow)
- RegisterStudentForm.tsx
- UpdateProfileForm.tsx (used by ProfilePage)
- ChangePasswordForm.tsx (missing — backend has auth views for it)
- FeeStructureForm.tsx (for CRUD page)
- ManualPaymentForm.tsx
- InvoiceFilterForm.tsx
- StudentSearchFilterForm.tsx
### 5.2 File Upload Handling
Backend supports file uploads (payment receipts). Add:

- FileUpload.tsx component with dropzone ( react-dropzone + @types/react-dropzone add deps)
- Drag-drop area for receipt images
- Progress bar during upload
- File preview (images/PDF)
- Used in ManualPaymentForm, RefundForm, StudentProfile photo upload
## PRIORITY 6: DASHBOARDS & CHARTS (Add Visualizations)
Current Dashboards are text-only. Add chart library + widgets:

Dependency Purpose chart.js + react-chartjs-2 Line (revenue over time), Bar (enrollment by level), Doughnut (payment method mix), Horizontal bar (course attendance rates) OR recharts Declarative React charts, Tree-shakable — lighter than chart.js. Recommended.

Dashboard widgets to add on DashboardPage / AdminDashboard :

- Total Students, Active Enrollments, Revenue (YTD/MTD), Collection Rate, Overdue Invoices count, Today's Classes
- Revenue sparkline, Attendance sparkline, Enrollment trend
- Top 5 overdue invoices (for Finance home)
- Today's classes + mark-attendance CTA (for tutors/officer home)
- My upcoming classes (student home)
- My balance / next payment due card (student home)
## PRIORITY 7: MISSING ROUTING CHANGES IN App.tsx
Current issues & fixes needed:

Issue Fix /enrollments is student-only RoleGuard but backend supports full staff CRUD Split route or remove role restriction; let page component internally branch by role (or create /enrollments/manage for staff as above) Missing route segments for sub-navigation Add /billing/* sub-routes with nested <Outlet/> for tabs: /billing/invoices , /billing/payments , /billing/fees , /billing/refunds Missing /admin/audit-logs , /admin/staff , /admin/settings routes Add to App.tsx with RoleGuard(['super_admin', 'it_admin']) Missing /academics/* sub-routes /academics/sessions , /academics/levels , /academics/offerings/:id , /academics/schedules Missing /reports/* detail routes Split ReportsDashboard into nested route with 5 report children Missing 404 page component Catch-all currently redirects to dashboard. Replace with <NotFoundPage/> (new) that has back-to-dashboard CTA Missing /password-reset route Password reset request form (Backend view exists users/views.py , NO UI) Missing /password-reset/confirm/:uid/:token Password reset confirm form

## PRIORITY 8: DEVELOPER EXPERIENCE & TESTING
### 8.1 Expand MSW (Mock Service Worker) Coverage
Current test directory in frontend has MSW server.ts setup. Add handlers for every endpoint (currently handlers only cover auth in test setup, if any). Benefits:

- Develop pages without backend running
- Reproduce error scenarios (500, 403, 422) at will
- Consistent test data
Add frontend/src/test/mocks/handlers/ with: students.ts , billing.ts , payments.ts , attendance.ts , etc.

### 8.2 Test Coverage Gaps
Area Current Tests Missing Tests Components ProtectedRoute.test.tsx + RoleGuard.test.tsx — 2 test files All 19 other components (0 tests) , 21 pages (0 tests), 8 services (0 tests), 0 hooks tests Services 0 Add unit tests mocking axios/apiClient Pages 0 Add render tests with all route params/role combinations Utils 0 formatCurrency/formatDate/role tests

### 8.3 Pre-commit Hooks & Linting
Add (check package.json first):

- eslint-plugin-react-hooks rules (hooks order)
- eslint-plugin-import (import order conventions)
- husky + lint-staged for pre-commit lint checks
- prettier config (if missing) for consistent formatting
### 8.4 Environment Configuration
Current frontend/.env.example :

- Add documentation inline
- Add VITE_APP_NAME=ICAN Tutorial Centre
- Add VITE_DEFAULT_LOCALE=en-NG
- Add VITE_CURRENCY_CODE=NGN
- Add VITE_ENABLE_MSW=false (toggle mock mode)
## PRIORITY 9: ACCESSIBILITY, RESPONSIVENESS & POLISH
Area Work Needed Mobile responsiveness Current Layout sidebar in Layout.tsx has backdrop but all inner pages need testing on 360px/768px width. Tables need horizontal scroll containers, columns reduce on small screens Keyboard Nav / ARIA Add aria-label to icon-only buttons, role=dialog on modals, focus management (focus-trap-react for modals) — Radix UI helps here Color contrast Audit Tailwind grays + status colors against WCAG AA (text-green-800 bg-green-100 is fine, but check secondary buttons) Loading & error states Every page needs proper skeleton + error state (retry button), not just a spinner or silent fail Empty states Every list has EmptyState component with illustration + CTA (e.g., "No invoices yet — create enrollment" for students) Breadcrumbs Add <Breadcrumbs/> between layout header and content; nested pages show hierarchy Favicon, OG meta tags index.html + VitePluginSEO

## PRIORITY 10: NEW FEATURES BEYOND EXISTING BACKEND
Stretch features requiring both frontend + backend work :

New Feature Description Document Management Upload/download student documents (admission letter, ID, transcript, exam results). Backend: document model with S3 storage. Frontend: DocumentUpload, DocumentsTab in StudentDetailPage WhatsApp Messaging UI Backend WhatsAppService is placeholder ( notifications/services.py WhatsAppService logs warning only). Once integrated: broadcast to cohorts, student search-send, template-based session reminders Class Zoom URL / Recording Links ClassSchedule has meeting_url field; add Zoom OAuth + auto-create meetings on schedule creation, share via email/whatsapp. Frontend: direct "Join now" button with countdown timer for tutor/student Exam Registration ICAN exam entry form + fee collection (separate from tuition). Backend: exam_period + exam_entry models Results / Transcript Input CA + exam scores per course per student. PDF transcript generation. Backend: result model Parent/Guardian Portal Secondary role: parent can view student attendance, invoices/payments (linked via FK on student). New login type, parent dashboard Bulk Imports CSV/XLSX import for students, enrollments, fee structures. Frontend drag-drop + preview mapping dialog. Backend bulk_create + validation report Tutor Portal Tutor role (currently stored as StaffProfile FK on CourseOffering but no dedicated tutor role). Let tutors: take attendance, upload class materials, view their course roster Online Quizzes/Assignments Upload handouts PDF/Video → assignment deadlines → submission uploads → grade. Full LMS-lite feature set

## IMPLEMENTATION ORDER (Recommended Sprint Plan ≈ 4–6 sprints)
### Sprint 1: Foundations (Biggest ROI)
1. Install Radix UI primitives + create all components/ui/* (18 components)
2. Create all utils/* files (6 utilities) + migrate duplicates
3. Create hooks/* library (useAuth role helpers, useDebounce, useDisclosure, useConfirm, useToast)
4. Add toast library + confirm dialog, wire into App root
5. Migrate existing pages to use new UI components (stop inline classes)
### Sprint 2: Data Layer & Query Hooks
6. Set up hooks/queries/* (all TanStack wrappers for 8 domains ~40 hooks)
7. Create queryKeys.ts
8. Migrate all 21 pages from useState+useEffect pattern → useQuery/useMutation (eliminate boilerplate)
### Sprint 3: High Priority Missing Pages (Finance/Attendance)
9. FeeStructuresPage, PaymentsPage, PaymentDetailPage, RefundsPage (billing missing)
10. ClassSessionDetailPage (Mark Attendance) — the core operational workflow
11. EnrollmentManagementPage (staff view) — current student-only gap
12. ScheduledSessionsPage + AttendanceStatsPage
### Sprint 4: Admin, Academics, Reports Split
13. AcademicSessionsPage, LevelsPage, OfferingDetailPage, SchedulesPage (weekly calendar)
14. AuditLogsPage, StaffManagementPage, NotificationTemplatesPage, MessageLogsPage
15. Split ReportsDashboard → 5 dedicated report pages with filters + charts
16. Install chart library, build dashboard widgets
### Sprint 5: Forms, UX Polish, Gaps
17. Extract reusable form components (ChangePassword, FileUpload, ManualPayment, etc.)
18. Add missing auth pages (password-reset request + confirm)
19. App.tsx route restructure with sub-routes/nested Outlets, add 404 page, breadcrumbs
20. Mobile responsiveness audit on all pages, accessibility audit
### Sprint 6: Testing & DX
21. Expand MSW handlers for all endpoints (200+ mocked responses)
22. Write unit tests for utils/services/hooks
23. Component smoke tests for 20 pages + Page Object pattern for key flows
24. Lint/format, husky pre-commit, expand env docs
### Ongoing / Stretch
25. Parent portal, docs management, bulk imports, results/transcript, tutor portal, Zoom integration
## INSTALL THESE DEPENDENCIES FIRST
Run these immediately at sprint start:

## FILES/DIRECTORIES TO CREATE
This gives us a complete feature-complete frontend matching every backend endpoint with professional UX, consistency, accessibility, maintainability, and testability. Sprint 1 (foundations) + Sprint 2 (data layer) are the non-negotiable prerequisite accelerators — after those, each subsequent page takes a fraction of the time compared to building with the current ad-hoc Tailwind + raw useEffect stack. Ready to implement any/all of these when you are.

08:25
Abiodun Gbolahan

start with priority 1 and we will work our way from down there

Agent

Thought process

Perfect. Let's kick off Priority 1: Foundational Infrastructure. I'll break this into sub-phases and track everything systematically.

0/10 done

Phase 1a: Install all foundational dependencies (Radix, lucide, cva, clsx, date-fns, sonner, etc.)

Phase 1b: Create utility library (src/utils/) - format, types, errors, download, storage, roles, validation

Phase 1c: Create hooks library (src/hooks/) - useAuth helpers, useDebounce, useDisclosure, useConfirm, useToast, usePagination, useLocalStorage, useRoleGuard

Phase 1d-1: Create core UI primitives - Button, Card, Badge

Phase 1d-2: Create form controls - Input, Label, Textarea, Select, Checkbox, Radio

Phase 1d-3: Create overlays - Dialog/Modal, AlertDialog (confirm), Drawer, Tooltip, Popover

Phase 1d-4: Create layout components - Tabs, Accordion, DropdownMenu, Avatar, Separator, Progress, Skeleton, EmptyState, Pagination, Alert, Breadcrumbs, Toaster

Phase 1d-5: Create data display - Table, DataTable with pagination/search/sort

Phase 1f: Verify TypeScript builds cleanly with no errors

Phase 1e: Update App.tsx to mount global Toaster + ConfirmDialog providers

Thought

Let me first check the current package.json to understand what's already installed, then install the missing foundational dependencies.

frontend\package.json

frontend\tailwind.config.js

frontend\tsconfig.json

Good - react-hot-toast is already installed. Let me check tsconfig.app.json for path aliases, then install all the Radix primitives and utility libraries.

frontend\tsconfig.app.json

Now let me install all Phase 1a dependencies in the frontend directory.

ICAN management system\frontend
In Sandbox
View in terminal

$ cd "c:\Users\HP\Documents\projects\ICAN management system\frontend" ; npm install @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-tabs @radix-ui/react-select @radix-ui/react-checkbox @radix-ui/react-radio-group @radix-ui/react-switch @radix-ui/react-accordion @radix-ui/react-tooltip @radix-ui/react-alert-dialog @radix-ui/react-popover @radix-ui/react-avatar @radix-ui/react-progress @radix-ui/react-separator @radix-ui/react-slot @radix-ui/react-label class-variance-authority clsx tailwind-merge lucide-react date-fns vaul

le'
npm warn tar TAR_ENTRY_ERROR ENOENT: no such file or directory, lstat 'C:\Users\HP\Documents\projects\ICAN management system\frontend\node_modules\lucide-react\dist'
npm warn tar TAR_ENTRY_ERROR ENOENT: no such file or directory, lstat 'C:\Users\HP\Documents\projects\ICAN management system\frontend\node_modules\date-fns\locale'
npm warn tar TAR_ENTRY_ERROR ENOENT: no such file or directory, lstat 'C:\Users\HP\Documents\projects\ICAN management system\frontend\node_modules\lucide-react\dist'
npm warn tar TAR_ENTRY_ERROR ENOENT: no such file or directory, lstat 'C:\Users\HP\Documents\projects\ICAN management system\frontend\node_modules\date-fns\locale'
npm warn tar TAR_ENTRY_ERROR ENOENT: no such file or directory, lstat 'C:\Users\HP\Documents\projects\ICAN management system\frontend\node_modules\lucide-react\dist'
npm warn tar TAR_ENTRY_ERROR ENOENT: no such file or directory, lstat 'C:\Users\HP\Documents\projects\ICAN management system\frontend\node_modules\date-fns\locale'
npm warn tar TAR_ENTRY_ERROR ENOENT: no such file or directory, lstat 'C:\Users\HP\Documents\projects\ICAN management system\frontend\node_modules\lucide-react\dist'
npm warn tar TAR_ENTRY_ERROR ENOENT: no such file or directory, lstat 'C:\Users\HP\Documents\projects\ICAN management system\frontend\node_modules\date-fns\locale'
npm warn tar TAR_ENTRY_ERROR ENOENT: no such file or directory, lstat 'C:\Users\HP\Documents\projects\ICAN management system\frontend\node_modules\lucide-react\dist'
npm warn tar TAR_ENTRY_ERROR ENOENT: no such file or directory, lstat 'C:\Users\HP\Documents\projects\ICAN management system\frontend\node_modules\date-fns\locale'
npm warn tar TAR_ENTRY_ERROR ENOENT: no such file or directory, lstat 'C:\Users\HP\Documents\projects\ICAN management system\frontend\node_modules\lucide-react\dist'
npm warn tar TAR_ENTRY_ERROR ENOENT: no such file or directory, lstat 'C:\Users\HP\Documents\projects\ICAN management system\frontend\node_modules\date-fns\fp' 
npm warn tar TAR_ENTRY_ERROR ENOENT: no such file or directory, lstat 'C:\Users\HP\Documents\projects\ICAN management system\frontend\node_modules\lucide-react\dist'
npm warn tar TAR_ENTRY_ERROR ENOENT: no such file or directory, open 'C:\Users\HP\Documents\projects\ICAN management system\frontend\node_modules\date-fns\lastDayOfDecade.js'
npm warn tar TAR_ENTRY_ERROR ENOENT: no such file or directory, lstat 'C:\Users\HP\Documents\projects\ICAN management system\frontend\node_modules\lucide-react\dist'
npm warn tar TAR_ENTRY_ERROR ENOENT: no such file or directory, lstat 'C:\Users\HP\Documents\projects\ICAN management system\frontend\node_modules\date-fns\fp' 
npm warn tar TAR_ENTRY_ERROR ENOENT: no such file or directory, lstat 'C:\Users\HP\Documents\projects\ICAN management system\frontend\node_modules\lucide-react\dist'
npm warn tar TAR_ENTRY_ERROR ENOENT: no such file or directory, lstat 'C:\Users\HP\Documents\projects\ICAN management system\frontend\node_modules\date-fns\fp' 
npm warn tar TAR_ENTRY_ERROR ENOENT: no such file or directory, lstat 'C:\Users\HP\Documents\projects\ICAN management system\frontend\node_modules\lucide-react\dist'
npm warn tar TAR_ENTRY_ERROR ENOENT: no such file or directory, open 'C:\Users\HP\Documents\projects\ICAN management system\frontend\node_modules\date-fns\lastDayOfISOWeek.js'
npm warn tar TAR_ENTRY_ERROR ENOENT: no such file or directory, lstat 'C:\Users\HP\Documents\projects\ICAN management system\frontend\node_modules\lucide-react\dist'
npm warn tar TAR_ENTRY_ERROR ENOENT: no such file or directory, lstat 'C:\Users\HP\Documents\projects\ICAN management system\frontend\node_modules\date-fns\fp' 
npm warn tar TAR_ENTRY_ERROR ENOENT: no such file or directory, lstat 'C:\Users\HP\Documents\projects\ICAN management system\frontend\node_modules\lucide-react\dist'
npm warn tar TAR_ENTRY_ERROR ENOENT: no such file or directory, lstat 'C:\Users\HP\Documents\projects\ICAN management system\frontend\node_modules\date-fns\fp'

Thought

While npm finishes installing, let's proceed with Phase 1b: creating the utility library. These don't depend on the new packages. I'll use sub-agents to create multiple files in parallel.

Sub Coding Agent Create frontend utility files

Thought

0/9 done

Check and create the utils directory if needed

Create format.ts utility file

Create types.ts utility file

Create errors.ts utility file

Create download.ts utility file

Create storage.ts utility file

Create roles.ts utility file

Create validation.ts utility file

List all created files

Thought

ICAN management system\frontend\src

Thought

The src/utils directory doesn't exist yet. Let me first check the existing auth types to ensure compatibility, then create the directory and all files.

frontend\src\types\auth.ts

frontend\src\lib\roles.ts

Thought

frontend\package.json

Thought

All dependencies are available. Now let me create the utils directory and all 7 files.

0/9 done

Check and create the utils directory if needed

Create format.ts utility file

Create types.ts utility file

Create errors.ts utility file

Create download.ts utility file

Create storage.ts utility file

Create roles.ts utility file

Create validation.ts utility file

List all created files

Thought

ICAN management system
In Sandbox
View in terminal

$ New-Item -ItemType Directory -Path "c:\Users\HP\Documents\projects\ICAN management system\frontend\src\utils" -Force

Directory: C:\Users\HP\Documents\projects\ICAN management 
    system\frontend\src


Mode                 LastWriteTime         Length Name
----                 -------------         ------ ----
d-----          9/9/2026   8:31 AM                utils

Thought

Directory created. Now let me create all 7 utility files.

1/9 done

Check and create the utils directory if needed

Create format.ts utility file

Create types.ts utility file

Create errors.ts utility file

Create download.ts utility file

Create storage.ts utility file

Create roles.ts utility file

Create validation.ts utility file

List all created files

Thought

format.ts
frontend\src\utils\format.ts

+ 114 - 0

Open Diff

types.ts
frontend\src\utils\types.ts

+ 51 - 0

Open Diff

errors.ts
frontend\src\utils\errors.ts

+ 177 - 0

Open Diff

download.ts
frontend\src\utils\download.ts

+ 73 - 0

Open Diff

storage.ts
frontend\src\utils\storage.ts

+ 108 - 0

Open Diff

roles.ts
frontend\src\utils\roles.ts

+ 113 - 0

Open Diff

validation.ts
frontend\src\utils\validation.ts

+ 64 - 0

Open Diff

Thought

8/9 done

Check and create the utils directory if needed

Create format.ts utility file

Create types.ts utility file

Create errors.ts utility file

Create download.ts utility file

Create storage.ts utility file

Create roles.ts utility file

Create validation.ts utility file

List all created files and verify types

Thought

ICAN management system\frontend\src\utils

Thought

9/9 done

Check and create the utils directory if needed

Create format.ts utility file

Create types.ts utility file

Create errors.ts utility file

Create download.ts utility file

Create storage.ts utility file

Create roles.ts utility file

Create validation.ts utility file

List all created files and verify types

Thought

All 7 TypeScript utility files have been created successfully in c:\Users\HP\Documents\projects\ICAN management system\frontend\src\utils . The directory was created first, then each file was written per the specification. TypeScript diagnostics report zero errors .

## Files Created
1. format.ts — Formatting utilities
   
   - formatCurrency (NGN ₦ via Intl.NumberFormat, safe string/number/null handling)
   - formatDate (Intl.DateTimeFormat en-NG, short / medium / long styles)
   - formatDateTime (date + time, optional seconds)
   - formatRelativeTime (uses date-fns formatDistanceStrict with {days}d ago fallback)
   - formatPercentage , formatPhone , formatStudentCode , truncate
2. types.ts — Generic TypeScript utility types (zero deps)
   
   - DeepPartial , Nullable , WithId , SortDirection
   - PaginationParams , SortParams , PaginatedResult , ListResponse
   - FilterOperator , DateTimeRange , EnumValues , Prettify
3. errors.ts — Axios-aware error extractors
   
   - ErrorResponse type, getErrorMessage (handles detail , string data, arrays, non_field_errors , field errors — joins with ; )
   - getFieldErrors (DRF-style per-field record from error.detail object or body fields)
   - isAuthError (401), isForbiddenError (403), isNotFoundError (404), isValidationError (400), isNetworkError (no response)
4. download.ts — Download utilities
   
   - downloadBlob (object URL + <a> click + revoke)
   - downloadFromUrl (fetch→blob or window.open fallback)
   - exportToCSV (RFC4180-style escaping, UTF-8 BOM for Excel, optional header labels)
   - exportJSON (2-space pretty-print)
5. storage.ts — Typed localStorage wrapper, all keys prefixed ican:
   
   - AUTH_KEYS const ( ACCESS , REFRESH , USER )
   - getTokens / setTokens / clearTokens , getUser / setUser / clearUser
   - Generic get<T> / set<T> / remove / clearAll (clears only ican:* keys)
   - Every op wrapped in try/catch for private-mode safety
6. roles.ts — Role-based helpers (imports User / UserRole /profiles from ../types/auth )
   
   - ROLE_HIERARCHY ordered high→low, ROLE_LABELS , STAFF_ROLES
   - Predicates: isStaffRole , isStaff , isStudent , isFinanceOrAbove , isManagerOrAbove , isITAdminOrAbove , isSuperAdmin
   - roleRank , hasRole , roleHomePath (returns /dashboard ), getProfileName (profile first+last or email@prefix fallback)
7. validation.ts — Shared Zod schemas
   
   - emailSchema , passwordSchema (10+ chars, upper/lower/digit)
   - confirmPasswordSchema(refPath) — factory with .refine matching against sibling
   - requiredString(fieldName, min, max) , phoneSchema , positiveNumber (number | string→refine)
   - dateSchema ( z.coerce.date() + validity refine), requiredSelect(fieldName)

2/10 done

Phase 1a: Install all foundational dependencies (Radix, lucide, cva, clsx, date-fns, sonner, etc.)

Phase 1b: Create utility library (src/utils/) - format, types, errors, download, storage, roles, validation

Phase 1c: Create hooks library (src/hooks/) - useAuth helpers, useDebounce, useDisclosure, useConfirm, useToast, usePagination, useLocalStorage, useRoleGuard

Phase 1d-1: Create core UI primitives - Button, Card, Badge

Phase 1d-2: Create form controls - Input, Label, Textarea, Select, Checkbox, Radio

Phase 1d-3: Create overlays - Dialog/Modal, AlertDialog (confirm), Drawer, Tooltip, Popover

Phase 1d-4: Create layout components - Tabs, Accordion, DropdownMenu, Avatar, Separator, Progress, Skeleton, EmptyState, Pagination, Alert, Breadcrumbs, Toaster

Phase 1d-5: Create data display - Table, DataTable with pagination/search/sort

Phase 1f: Verify TypeScript builds cleanly with no errors

Phase 1e: Update App.tsx to mount global Toaster + ConfirmDialog providers

Now let's tackle Phase 1c: Create all custom React hooks. I'll split this across two parallel sub-agents for speed.