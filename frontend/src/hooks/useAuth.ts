import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth as useBaseAuth } from '../contexts/AuthContext';
import * as rolesUtil from '../utils/roles';
import type { UserRole } from '../types/auth';

export function useAuth() {
  const base = useBaseAuth();

  const isStaff = useMemo(
    () => (base.user ? rolesUtil.isStaff(base.user) : false),
    [base.user]
  );

  const isStudent = useMemo(
    () => (base.user ? rolesUtil.isStudent(base.user) : false),
    [base.user]
  );

  const isFinance = useMemo(
    () => (base.user ? rolesUtil.isFinanceOrAbove(base.user) : false),
    [base.user]
  );

  const isManager = useMemo(
    () => (base.user ? rolesUtil.isManagerOrAbove(base.user) : false),
    [base.user]
  );

  const isITAdmin = useMemo(
    () => (base.user ? rolesUtil.isITAdminOrAbove(base.user) : false),
    [base.user]
  );

  const isSuperAdmin = useMemo(
    () => (base.user ? rolesUtil.isSuperAdmin(base.user) : false),
    [base.user]
  );

  const hasRole = (allowed: UserRole[]) =>
    base.user ? rolesUtil.hasRole(base.user, allowed) : false;

  const roleLabel = base.user ? rolesUtil.ROLE_LABELS[base.user.role] : '';
  const displayName = base.user ? rolesUtil.getProfileName(base.user) : '';

  return {
    ...base,
    isStaff,
    isStudent,
    isFinance,
    isManager,
    isITAdmin,
    isSuperAdmin,
    hasRole,
    roleLabel,
    displayName,
  };
}

export interface UseRequireRoleOptions {
  redirectTo?: string;
}

export function useRequireRole(
  allowedRoles: UserRole[],
  options: UseRequireRoleOptions = {}
): {
  authorized: boolean;
  loading: boolean;
} {
  const { user, isLoading } = useBaseAuth();
  const navigate = useNavigate();
  const { redirectTo = '/dashboard' } = options;

  const authorized = useMemo(
    () => rolesUtil.hasRole(user, allowedRoles),
    [user, allowedRoles]
  );

  useEffect(() => {
    if (isLoading) return;
    if (!user || !authorized) {
      navigate(redirectTo, { replace: true });
    }
  }, [authorized, isLoading, user, navigate, redirectTo]);

  return {
    authorized,
    loading: isLoading,
  };
}

export type UseAuthReturn = ReturnType<typeof useAuth>;
export type { UserRole };

export default useAuth;
