/**
 * Role-Based Access Control Guard
 * Protects routes based on user roles
 */

import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface RoleGuardProps {
  children: ReactNode;
  requiredPermission?: string;
  redirectTo?: string;
  fallback?: ReactNode;
}

export function RoleGuard({ 
  children, 
  requiredPermission,
  redirectTo = '/dashboard',
  fallback 
}: RoleGuardProps) {
  const { user, hasPermission } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Super Admin bypass
  const isSuperAdmin = user.role === 'super_admin' || user.roles?.includes('super_admin');
  let hasAccess = isSuperAdmin;

  if (requiredPermission && !hasAccess) {
    // Strict RBAC mode: user MUST have the exact dynamic permission
    hasAccess = hasPermission(requiredPermission);
  }

  // If no permission is passed, we assume the route just requires authentication (already checked above),
  // but to be safe and enforce RBAC, routes wrapped in RoleGuard SHOULD provide a requiredPermission.
  // We'll allow access if neither allowedRoles nor requiredPermission was traditionally needed, 
  // though now everything should use requiredPermission.
  if (!requiredPermission && !hasAccess) {
      hasAccess = true;
  }

  if (!hasAccess) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
}

export default RoleGuard;

// Helper component for unauthorized access message
export function UnauthorizedMessage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
        <p className="text-gray-600 mb-6">
          You don't have permission to access this page. Please contact your administrator if you believe this is an error.
        </p>
        <a
          href="/dashboard"
          className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
        >
          Back to Dashboard
        </a>
      </div>
    </div>
  );
}
