import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { ConfirmDialogProvider } from './hooks/confirm-context';
import { ErrorBoundary } from './components/ErrorBoundary';
import ProtectedRoute from './components/ProtectedRoute';
import RoleGuard from './components/RoleGuard';
import Layout from './components/Layout';
import { HomeRedirect } from './components/HomeRedirect';

// Pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import PasswordResetRequestPage from './pages/PasswordResetRequestPage';
import PasswordResetConfirmPage from './pages/PasswordResetConfirmPage';
import DashboardPage from './pages/DashboardPage';
import AcademicsPage from './pages/AcademicsPage';
import StudentEnrollmentDashboard from './pages/StudentEnrollmentDashboard';
import EnrollmentWizard from './pages/EnrollmentWizard';
import BillingPage from './pages/BillingPage';
import InvoiceDetailPage from './pages/InvoiceDetailPage';
import ProfilePage from './pages/ProfilePage';
import AttendanceDashboard from './pages/AttendanceDashboard';
import AnnouncementsPage from './pages/AnnouncementsPage';
import ReportsDashboard from './pages/ReportsDashboard';
import InvoicesPage from './pages/InvoicesPage';
import PaymentsPage from './pages/PaymentsPage';
import AdminDashboard from './pages/AdminDashboard';
import StudentsPage from './pages/StudentsPage';
import CreateStudentPage from './pages/CreateStudentPage';
import StudentDetailPage from './pages/StudentDetailPage';
import CoursesPage from './pages/CoursesPage';
import ClassManagementPage from './pages/ClassManagementPage';
import SchedulesPage from './pages/SchedulesPage';
import PaymentSuccessPage from './pages/PaymentSuccessPage';
import PaymentFailurePage from './pages/PaymentFailurePage';
import SettingsPage from './pages/SettingsPage';
import HelpPage from './pages/HelpPage';
import AuditLogsPage from './pages/AuditLogsPage';
import NotFoundPage from './pages/NotFoundPage';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <Router
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true,
          }}
        >
          <AuthProvider>
            <ConfirmDialogProvider>
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#363636',
                  color: '#fff',
                },
                success: {
                  duration: 3000,
                  iconTheme: {
                    primary: '#10b981',
                    secondary: '#fff',
                  },
                },
                error: {
                  duration: 5000,
                  iconTheme: {
                    primary: '#ef4444',
                    secondary: '#fff',
                  },
                },
              }}
            />
            <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/password-reset" element={<PasswordResetRequestPage />} />
            <Route path="/password-reset/confirm/:uid/:token" element={<PasswordResetConfirmPage />} />
            
            {/* Payment Callback Routes (No Layout) */}
            <Route path="/payment/success" element={<PaymentSuccessPage />} />
            <Route path="/payment/failure" element={<PaymentFailurePage />} />

            {/* Protected Routes with Layout */}
            <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
              {/* Dashboard - All Users */}
              <Route path="/dashboard" element={<DashboardPage />} />
              
              {/* Admin Dashboard - Staff Only */}
              <Route 
                path="/admin" 
                element={
                  <RoleGuard allowedRoles={['super_admin', 'manager', 'finance', 'student_officer', 'it_admin']}>
                    <AdminDashboard />
                  </RoleGuard>
                } 
              />
              
              {/* Profile - All Users */}
              <Route path="/profile" element={<ProfilePage />} />
              
              {/* Settings - All Users */}
              <Route path="/settings" element={<SettingsPage />} />
              
              {/* Help - All Users */}
              <Route path="/help" element={<HelpPage />} />
              
              {/* Students Management - Staff Only */}
              <Route 
                path="/students" 
                element={
                  <RoleGuard allowedRoles={['super_admin', 'manager', 'student_officer']}>
                    <StudentsPage />
                  </RoleGuard>
                } 
              />
              <Route 
                path="/students/new" 
                element={
                  <RoleGuard allowedRoles={['super_admin', 'manager', 'student_officer']}>
                    <CreateStudentPage />
                  </RoleGuard>
                } 
              />
              <Route 
                path="/students/:id" 
                element={
                  <RoleGuard allowedRoles={['super_admin', 'manager', 'student_officer']}>
                    <StudentDetailPage />
                  </RoleGuard>
                } 
              />
              
              {/* Academics - Staff Only */}
              <Route 
                path="/academics" 
                element={
                  <RoleGuard allowedRoles={['super_admin', 'manager', 'student_officer']}>
                    <AcademicsPage />
                  </RoleGuard>
                } 
              />
              
              {/* Courses - Staff Only */}
              <Route 
                path="/courses" 
                element={
                  <RoleGuard allowedRoles={['super_admin', 'manager', 'student_officer']}>
                    <CoursesPage />
                  </RoleGuard>
                } 
              />
              
              {/* Schedules & Timetable */}
              <Route 
                path="/schedules" 
                element={
                  <RoleGuard allowedRoles={['super_admin', 'manager', 'student_officer', 'finance', 'it_admin', 'student']}>
                    <SchedulesPage />
                  </RoleGuard>
                } 
              />
              
              {/* Classes - Staff Only */}
              <Route 
                path="/classes" 
                element={
                  <RoleGuard allowedRoles={['super_admin', 'manager', 'student_officer']}>
                    <SchedulesPage />
                  </RoleGuard>
                } 
              />
              
              {/* Enrollments - Student View */}
              <Route 
                path="/enrollments" 
                element={
                  <RoleGuard allowedRoles={['student']}>
                    <StudentEnrollmentDashboard />
                  </RoleGuard>
                } 
              />
              <Route 
                path="/enrollments/new" 
                element={
                  <RoleGuard allowedRoles={['student']}>
                    <EnrollmentWizard />
                  </RoleGuard>
                } 
              />
              
              {/* TODO: Add staff enrollment management route 
                  /enrollments/manage for manager/student_officer
                  This will be a separate page from student view
              */}
              
              {/* Billing - Finance Staff & Students */}
              <Route 
                path="/billing" 
                element={
                  <RoleGuard allowedRoles={['super_admin', 'manager', 'finance', 'student']}>
                    <BillingPage />
                  </RoleGuard>
                } 
              />
              <Route 
                path="/billing/invoice/:id" 
                element={
                  <RoleGuard allowedRoles={['super_admin', 'manager', 'finance', 'student']}>
                    <InvoiceDetailPage />
                  </RoleGuard>
                } 
              />
              <Route 
                path="/billing/invoices/:id" 
                element={
                  <RoleGuard allowedRoles={['super_admin', 'manager', 'finance', 'student']}>
                    <InvoiceDetailPage />
                  </RoleGuard>
                } 
              />
              <Route 
                path="/invoices/:id" 
                element={
                  <RoleGuard allowedRoles={['super_admin', 'manager', 'finance', 'student']}>
                    <InvoiceDetailPage />
                  </RoleGuard>
                } 
              />
              <Route 
                path="/invoice/:id" 
                element={
                  <RoleGuard allowedRoles={['super_admin', 'manager', 'finance', 'student']}>
                    <InvoiceDetailPage />
                  </RoleGuard>
                } 
              />
              
              {/* Invoices - Finance Staff & Students */}
              <Route 
                path="/invoices" 
                element={
                  <RoleGuard allowedRoles={['super_admin', 'manager', 'finance', 'student']}>
                    <InvoicesPage />
                  </RoleGuard>
                } 
              />

              {/* Payments - Finance Staff & Students */}
              <Route 
                path="/payments" 
                element={
                  <RoleGuard allowedRoles={['super_admin', 'manager', 'finance', 'student']}>
                    <PaymentsPage />
                  </RoleGuard>
                } 
              />
              
              {/* TODO: Add billing sub-routes 
                  /billing/invoices - Invoice list page
                  /billing/payments - Payments page with manual payment recording
                  /billing/fees - Fee structures CRUD
                  /billing/refunds - Refunds management
              */}
              
              {/* Attendance - All Authenticated Users */}
              <Route path="/attendance" element={<AttendanceDashboard />} />
              
              {/* TODO: Add attendance sub-routes 
                  /attendance/sessions/:id - Mark attendance page
                  /attendance/my - Student self-service attendance
                  /attendance/stats - Attendance statistics
              */}
              
              {/* Communications - All Authenticated Users */}
              <Route path="/notifications" element={<AnnouncementsPage />} />
              
              {/* Reports - Staff Only */}
              <Route 
                path="/reports" 
                element={
                  <RoleGuard allowedRoles={['super_admin', 'manager', 'finance', 'student_officer']}>
                    <ReportsDashboard />
                  </RoleGuard>
                } 
              />
              
              {/* TODO: Add reports sub-routes 
                  /reports/financial - Financial reports with charts
                  /reports/attendance - Attendance reports
                  /reports/enrollments - Enrollment reports
                  /reports/payments - Payment reports
                  /reports/students/:id? - Per-student reports
              */}
              
              {/* Audit Logs - Staff & Admin */}
              <Route 
                path="/audit" 
                element={
                  <RoleGuard allowedRoles={['super_admin', 'manager', 'it_admin', 'finance', 'student_officer']}>
                    <AuditLogsPage />
                  </RoleGuard>
                } 
              />
              <Route 
                path="/audit-logs" 
                element={
                  <RoleGuard allowedRoles={['super_admin', 'manager', 'it_admin', 'finance', 'student_officer']}>
                    <AuditLogsPage />
                  </RoleGuard>
                } 
              />
              <Route 
                path="/admin/audit" 
                element={
                  <RoleGuard allowedRoles={['super_admin', 'manager', 'it_admin', 'finance', 'student_officer']}>
                    <AuditLogsPage />
                  </RoleGuard>
                } 
              />
              <Route 
                path="/admin/audit-logs" 
                element={
                  <RoleGuard allowedRoles={['super_admin', 'manager', 'it_admin', 'finance', 'student_officer']}>
                    <AuditLogsPage />
                  </RoleGuard>
                } 
              />

              {/* TODO: Add admin sub-routes 
                  /admin/staff - Staff management (Super Admin+)
                  /admin/settings - System settings (IT Admin+)
              */}
            </Route>

            {/* Redirects */}
            <Route path="/" element={<HomeRedirect />} />
            
            {/* 404 - Must be last */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
            </ConfirmDialogProvider>
        </AuthProvider>
      </Router>
    </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
