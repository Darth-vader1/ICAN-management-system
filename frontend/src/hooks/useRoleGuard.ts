import { useMemo } from 'react';
import * as rolesUtil from '../utils/roles';
import { useAuth } from './useAuth';
import type { UserRole } from '../types/auth';

export function useRoleGuard(allowedRoles: UserRole[]): {
  authorized: boolean;
  loading: boolean;
  user: ReturnType<typeof useAuth>['user'];
  checkPermission: (roles?: UserRole[]) => boolean;
} {
  const { user, isLoading } = useAuth();

  const authorized = useMemo(() => {
    return rolesUtil.hasRole(user, allowedRoles);
  }, [user, allowedRoles]);

  const checkPermission = useMemo(() => {
    return (roles?: UserRole[]) => {
      const rolesToCheck = roles ?? allowedRoles;
      return rolesUtil.hasRole(user, rolesToCheck);
    };
  }, [user, allowedRoles]);

  return {
    authorized,
    loading: isLoading,
    user,
    checkPermission,
  };
}

export function useIsStaff(): {
  isStaff: boolean;
  loading: boolean;
  user: ReturnType<typeof useAuth>['user'];
} {
  const { user, isLoading } = useAuth();
  return {
    isStaff: rolesUtil.isStaff(user),
    loading: isLoading,
    user,
  };
}

export function useIsStudent(): {
  isStudent: boolean;
  loading: boolean;
  user: ReturnType<typeof useAuth>['user'];
} {
  const { user, isLoading } = useAuth();
  return {
    isStudent: rolesUtil.isStudent(user),
    loading: isLoading,
    user,
  };
}

export function useIsFinance(): {
  isFinance: boolean;
  loading: boolean;
  user: ReturnType<typeof useAuth>['user'];
} {
  const { user, isLoading } = useAuth();
  return {
    isFinance: rolesUtil.isFinanceOrAbove(user),
    loading: isLoading,
    user,
  };
}

export function useIsManager(): {
  isManager: boolean;
  loading: boolean;
  user: ReturnType<typeof useAuth>['user'];
} {
  const { user, isLoading } = useAuth();
  return {
    isManager: rolesUtil.isManagerOrAbove(user),
    loading: isLoading,
    user,
  };
}

export function useIsITAdmin(): {
  isITAdmin: boolean;
  loading: boolean;
  user: ReturnType<typeof useAuth>['user'];
} {
  const { user, isLoading } = useAuth();
  return {
    isITAdmin: rolesUtil.isITAdminOrAbove(user),
    loading: isLoading,
    user,
  };
}

export function useIsSuperAdmin(): {
  isSuperAdmin: boolean;
  loading: boolean;
  user: ReturnType<typeof useAuth>['user'];
} {
  const { user, isLoading } = useAuth();
  return {
    isSuperAdmin: rolesUtil.isSuperAdmin(user),
    loading: isLoading,
    user,
  };
}
