import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { ConfirmDialogProvider } from './hooks/confirm-context';
import { ErrorBoundary } from './components/ErrorBoundary';
import ProtectedRoute from './components/ProtectedRoute';
import RoleGuard from './components/RoleGuard';
import Layout from './components/Layout';

// Pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import AcademicsPage from './pages/AcademicsPage';
import StudentEnrollmentDashboard from './pages/StudentEnrollmentDashboard';
import EnrollmentWizard from './pages/EnrollmentWizard';
import BillingPage from './pages/BillingPage';
import InvoiceDetailPage from './pages/InvoiceDetailPage';
import ProfilePage from './pages/ProfilePage';
import AttendanceDashboard from './pages/AttendanceDashboard';
import NotificationCenter from './pages/NotificationCenter';
import ReportsDashboard from './pages/ReportsDashboard';
import AdminDashboard from './pages/AdminDashboard';
import StudentsPage from './pages/StudentsPage';
import StudentDetailPage from './pages/StudentDetailPage';
import CoursesPage from './pages/CoursesPage';
import ClassManagementPage from './pages/ClassManagementPage';
import PaymentSuccessPage from './pages/PaymentSuccessPage';
import PaymentFailurePage from './pages/PaymentFailurePage';
import SettingsPage from './pages/SettingsPage';
import HelpPage from './pages/HelpPage';

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
              
              {/* Classes - Staff Only */}
              <Route 
                path="/classes" 
                element={
                  <RoleGuard allowedRoles={['super_admin', 'manager', 'student_officer']}>
                    <ClassManagementPage />
                  </RoleGuard>
                } 
              />
              
              {/* Enrollments - Students Only */}
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
              
              {/* Billing - Finance Staff & Students */}
              <Route 
                path="/billing" 
                element={
                  <RoleGuard allowedRoles={['super_admin', 'finance', 'student']}>
                    <BillingPage />
                  </RoleGuard>
                } 
              />
              <Route 
                path="/billing/invoice/:id" 
                element={
                  <RoleGuard allowedRoles={['super_admin', 'finance', 'student']}>
                    <InvoiceDetailPage />
                  </RoleGuard>
                } 
              />
              
              {/* Attendance - All Authenticated Users */}
              <Route path="/attendance" element={<AttendanceDashboard />} />
              
              {/* Communications - All Authenticated Users */}
              <Route path="/notifications" element={<NotificationCenter />} />
              
              {/* Reports - Staff Only */}
              <Route 
                path="/reports" 
                element={
                  <RoleGuard allowedRoles={['super_admin', 'manager', 'finance', 'student_officer']}>
                    <ReportsDashboard />
                  </RoleGuard>
                } 
              />
            </Route>

            {/* Redirects */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
            </ConfirmDialogProvider>
        </AuthProvider>
      </Router>
    </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
