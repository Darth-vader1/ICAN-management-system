import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { studentService } from '../services/studentService';

/**
 * Smart redirect component that sends users to the appropriate dashboard
 * based on their role and profile completion status
 */
export const HomeRedirect = () => {
  const { user, isLoading: authLoading, hasPermission } = useAuth();

  // Fetch student profile if user is a student using studentService.getMyProfile()
  const { data: studentProfile, isLoading: profileLoading } = useQuery({
    queryKey: ['student-profile', user?.id],
    queryFn: async () => {
      if (user?.role !== 'student') return null;
      return studentService.getMyProfile();
    },
    enabled: !!user && user.role === 'student',
    retry: false,
  });

  // Wait for auth and profile to load
  if (authLoading || (user?.role === 'student' && profileLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900 mx-auto"></div>
          <p className="mt-4 text-slate-600 text-sm font-medium">Loading your portal...</p>
        </div>
      </div>
    );
  }

  // Not logged in - go to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Staff users go to their permitted dashboard section
  if (user.is_staff_role) {
    // Bypass for super_admin is usually handled in hasPermission, but to be explicit:
    const isSuperAdmin = user.role === 'super_admin' || user.roles?.includes('super_admin');
    
    if (isSuperAdmin || hasPermission('dashboard.view')) return <Navigate to="/admin" replace />;
    if (hasPermission('students.view')) return <Navigate to="/students" replace />;
    if (hasPermission('enrollments.view')) return <Navigate to="/enrollments" replace />;
    if (hasPermission('academics.view')) return <Navigate to="/academics" replace />;
    if (hasPermission('billing.view')) return <Navigate to="/billing" replace />;
    if (hasPermission('payments.view')) return <Navigate to="/payments" replace />;
    if (hasPermission('reports.view')) return <Navigate to="/reports" replace />;
    if (hasPermission('users.view')) return <Navigate to="/admin/users" replace />;
    
    return <Navigate to="/profile" replace />;
  }

  // Students: Check if profile is complete
  if (user.role === 'student') {
    const profileData = studentProfile || (user.profile as any);

    const phoneValue = profileData?.phone_number || profileData?.user_phone || profileData?.phone || profileData?.whatsapp_number || user.phone;
    const nameValue = profileData?.first_name || user.full_name || user.email;

    const hasPhone = !!(phoneValue && String(phoneValue).trim().length > 0);
    const hasName = !!(nameValue && String(nameValue).trim().length > 0);

    const isProfileComplete = hasPhone && hasName;

    if (!isProfileComplete) {
      // Redirect to profile page with a flag to show completion prompt
      return <Navigate to="/profile?incomplete=true" replace />;
    }

    // Profile complete - go to student dashboard
    return <Navigate to="/dashboard" replace />;
  }

  // Default fallback
  return <Navigate to="/dashboard" replace />;
};

export default HomeRedirect;
