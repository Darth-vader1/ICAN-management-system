import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

/**
 * Smart redirect component that sends users to the appropriate dashboard
 * based on their role
 */
export const HomeRedirect = () => {
  const { user, isLoading } = useAuth();

  // Wait for auth to load
  if (isLoading) {
    return null;
  }

  // Not logged in - go to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Staff users go to admin dashboard
  const staffRoles = ['super_admin', 'manager', 'finance', 'student_officer', 'it_admin'];
  if (staffRoles.includes(user.role)) {
    return <Navigate to="/admin" replace />;
  }

  // Students go to student dashboard
  return <Navigate to="/dashboard" replace />;
};

export default HomeRedirect;
