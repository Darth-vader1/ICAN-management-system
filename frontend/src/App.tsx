import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { ConfirmDialogProvider } from './hooks/confirm-context';
import { ErrorBoundary } from './components/ErrorBoundary';
import ProtectedRoute from './components/ProtectedRoute';
import RoleGuard from './components/RoleGuard';
import Layout from './components/Layout';
import { HomeRedirect } from './components/HomeRedirect';
import { analytics } from './lib/analytics';
import CookieConsent from './components/CookieConsent';

// Pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import PasswordResetRequestPage from './pages/PasswordResetRequestPage';
import PasswordResetConfirmPage from './pages/PasswordResetConfirmPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import TermsPage from './pages/TermsPage';
import DashboardPage from './pages/DashboardPage';
import AcademicsPage from './pages/AcademicsPage';
import EnrollmentsPage from './pages/EnrollmentsPage';
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
import UsersAndRolesPage from './pages/UsersAndRolesPage';
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
import ClassroomsPage from './pages/ClassroomsPage';
import ClassroomLobbyPage from './pages/ClassroomLobbyPage';
import LiveClassroomPage from './pages/LiveClassroomPage';
import ClassRecordingPage from './pages/ClassRecordingPage';
import ClassroomAttendancePage from './pages/ClassroomAttendancePage';
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

function RouteAnalyticsTracker() {
  const location = useLocation();

  useEffect(() => {
    analytics.trackPageView(location.pathname);
  }, [location]);

  return null;
}

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
          <RouteAnalyticsTracker />
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
            <Route path="/privacy" element={<PrivacyPolicyPage />} />
            <Route path="/terms" element={<TermsPage />} />
            
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
                  <RoleGuard requiredPermission="dashboard.view">
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
              
              {/* Students Management */}
              <Route 
                path="/students" 
                element={
                  <RoleGuard requiredPermission="students.view">
                    <StudentsPage />
                  </RoleGuard>
                } 
              />
              <Route 
                path="/students/new" 
                element={
                  <RoleGuard requiredPermission="students.create">
                    <CreateStudentPage />
                  </RoleGuard>
                } 
              />
              <Route 
                path="/students/:id" 
                element={
                  <RoleGuard requiredPermission="students.view">
                    <StudentDetailPage />
                  </RoleGuard>
                } 
              />
              
              {/* Academics */}
              <Route 
                path="/academics" 
                element={
                  <RoleGuard requiredPermission="academics.view">
                    <AcademicsPage />
                  </RoleGuard>
                } 
              />
              
              {/* Courses */}
              <Route 
                path="/courses" 
                element={
                  <RoleGuard requiredPermission="academics.view">
                    <CoursesPage />
                  </RoleGuard>
                } 
              />
              
              {/* Schedules & Timetable */}
              <Route 
                path="/schedules" 
                element={
                  <RoleGuard requiredPermission="academics.view">
                    <SchedulesPage />
                  </RoleGuard>
                } 
              />
              
              {/* Classes */}
              <Route 
                path="/classes" 
                element={
                  <RoleGuard requiredPermission="academics.view">
                    <SchedulesPage />
                  </RoleGuard>
                } 
              />
              
              {/* Enrollments */}
              <Route 
                path="/enrollments" 
                element={
                  <RoleGuard requiredPermission="enrollments.view">
                    <EnrollmentsPage />
                  </RoleGuard>
                } 
              />
              <Route 
                path="/enrollments/new" 
                element={
                  <RoleGuard requiredPermission="enrollments.manage">
                    <EnrollmentWizard />
                  </RoleGuard>
                } 
              />
              
              {/* Billing */}
              <Route 
                path="/billing" 
                element={
                  <RoleGuard requiredPermission="billing.view">
                    <BillingPage />
                  </RoleGuard>
                } 
              />
              <Route 
                path="/billing/invoice/:id" 
                element={
                  <RoleGuard requiredPermission="billing.view">
                    <InvoiceDetailPage />
                  </RoleGuard>
                } 
              />
              <Route 
                path="/billing/invoices/:id" 
                element={
                  <RoleGuard requiredPermission="billing.view">
                    <InvoiceDetailPage />
                  </RoleGuard>
                } 
              />
              <Route 
                path="/invoices/:id" 
                element={
                  <RoleGuard requiredPermission="billing.view">
                    <InvoiceDetailPage />
                  </RoleGuard>
                } 
              />
              <Route 
                path="/invoice/:id" 
                element={
                  <RoleGuard requiredPermission="billing.view">
                    <InvoiceDetailPage />
                  </RoleGuard>
                } 
              />
              
              {/* Invoices */}
              <Route 
                path="/invoices" 
                element={
                  <RoleGuard requiredPermission="billing.view">
                    <InvoicesPage />
                  </RoleGuard>
                } 
              />

              {/* Payments */}
              <Route 
                path="/payments" 
                element={
                  <RoleGuard requiredPermission="payments.view">
                    <PaymentsPage />
                  </RoleGuard>
                } 
              />
              
              {/* Attendance - All Authenticated Users */}
              <Route path="/attendance" element={<AttendanceDashboard />} />
              
              {/* Virtual Classroom - All Authenticated Users */}
              <Route path="/classrooms" element={<ClassroomsPage />} />
              <Route path="/classrooms/:id" element={<ClassroomsPage />} />
              <Route path="/classrooms/:id/lobby" element={<ClassroomLobbyPage />} />
              <Route path="/classrooms/:id/live" element={<LiveClassroomPage />} />
              <Route path="/classrooms/:id/recording" element={<ClassRecordingPage />} />
              <Route path="/classrooms/:id/attendance" element={<ClassroomAttendancePage />} />
              
              {/* Communications - All Authenticated Users */}
              <Route path="/notifications" element={<AnnouncementsPage />} />
              
              {/* Reports */}
              <Route 
                path="/reports" 
                element={
                  <RoleGuard requiredPermission="reports.view">
                    <ReportsDashboard />
                  </RoleGuard>
                } 
              />
              
              {/* Audit Logs */}
              <Route 
                path="/audit" 
                element={
                  <RoleGuard requiredPermission="audit.view">
                    <AuditLogsPage />
                  </RoleGuard>
                } 
              />
              <Route 
                path="/audit-logs" 
                element={
                  <RoleGuard requiredPermission="audit.view">
                    <AuditLogsPage />
                  </RoleGuard>
                } 
              />
              <Route 
                path="/admin/audit" 
                element={
                  <RoleGuard requiredPermission="audit.view">
                    <AuditLogsPage />
                  </RoleGuard>
                } 
              />
              <Route 
                path="/admin/audit-logs" 
                element={
                  <RoleGuard requiredPermission="audit.view">
                    <AuditLogsPage />
                  </RoleGuard>
                } 
              />

              {/* Users & Roles Dashboard */}
              <Route 
                path="/admin/users" 
                element={
                  <RoleGuard requiredPermission="users.view">
                    <UsersAndRolesPage />
                  </RoleGuard>
                } 
              />
              <Route 
                path="/admin/roles" 
                element={
                  <RoleGuard requiredPermission="roles.view">
                    <UsersAndRolesPage />
                  </RoleGuard>
                } 
              />
              <Route 
                path="/users" 
                element={
                  <RoleGuard requiredPermission="users.view">
                    <UsersAndRolesPage />
                  </RoleGuard>
                } 
              />
            </Route>

            {/* Redirects */}
            <Route path="/" element={<HomeRedirect />} />
            
            {/* 404 - Must be last */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
          <CookieConsent />
            </ConfirmDialogProvider>
        </AuthProvider>
      </Router>
    </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
