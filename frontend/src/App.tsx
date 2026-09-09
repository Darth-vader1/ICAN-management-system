import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
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
    <QueryClientProvider client={queryClient}>
      <Router>
        <AuthProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Protected Routes with Layout */}
            <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/academics" element={<AcademicsPage />} />
              <Route path="/enrollments" element={<StudentEnrollmentDashboard />} />
              <Route path="/enrollments/new" element={<EnrollmentWizard />} />
              <Route path="/billing" element={<BillingPage />} />
              <Route path="/billing/invoice/:id" element={<InvoiceDetailPage />} />
              <Route path="/attendance" element={<AttendanceDashboard />} />
              <Route path="/notifications" element={<NotificationCenter />} />
              <Route path="/reports" element={<ReportsDashboard />} />
            </Route>

            {/* Redirects */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </AuthProvider>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
