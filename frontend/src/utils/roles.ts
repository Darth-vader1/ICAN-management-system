import type { User, UserRole, StudentProfile, StaffProfile } from '../types/auth';

export const ROLE_HIERARCHY: UserRole[] = [
  'super_admin',
  'it_admin',
  'manager',
  'finance',
  'student_officer',
  'student',
];

export const ROLE_LABELS: Record<UserRole, string> = {
  super_admin: 'Super Admin',
  it_admin: 'IT Admin',
  manager: 'Manager',
  finance: 'Finance',
  student_officer: 'Student Officer',
  student: 'Student',
};

export const STAFF_ROLES: Exclude<UserRole, 'student'>[] = [
  'super_admin',
  'it_admin',
  'manager',
  'finance',
  'student_officer',
];

export function isStaffRole(role: UserRole): boolean {
  return STAFF_ROLES.includes(role);
}

export function roleRank(role: UserRole): number {
  return ROLE_HIERARCHY.indexOf(role);
}

export function hasRole(
  user: User | { role?: UserRole | null } | null | undefined,
  allowed: UserRole[]
): boolean {
  if (!user) return false;
  const role = user.role;
  if (!role) return false;
  return allowed.includes(role);
}

export function isStaff(
  user: User | { role?: UserRole | null } | null | undefined
): boolean {
  if (!user || !user.role) return false;
  return isStaffRole(user.role);
}

export function isStudent(
  user: User | { role?: UserRole | null } | null | undefined
): boolean {
  return !!user && user.role === 'student';
}

export function isFinanceOrAbove(
  user: User | { role?: UserRole | null } | null | undefined
): boolean {
  if (!user || !user.role) return false;
  const rank = roleRank(user.role);
  return rank >= 0 && rank <= roleRank('finance');
}

export function isManagerOrAbove(
  user: User | { role?: UserRole | null } | null | undefined
): boolean {
  if (!user || !user.role) return false;
  const rank = roleRank(user.role);
  return rank >= 0 && rank <= roleRank('manager');
}

export function isITAdminOrAbove(
  user: User | { role?: UserRole | null } | null | undefined
): boolean {
  if (!user || !user.role) return false;
  const rank = roleRank(user.role);
  return rank >= 0 && rank <= roleRank('it_admin');
}

export function isSuperAdmin(
  user: User | { role?: UserRole | null } | null | undefined
): boolean {
  return !!user && user.role === 'super_admin';
}

export function roleHomePath(role: UserRole): string {
  return '/dashboard';
}

export function getProfileName(
  user: User | null | undefined
): string {
  if (!user) return '';

  const profile = user.profile;
  if (profile) {
    const first = (profile as StudentProfile | StaffProfile).first_name ?? '';
    const last = (profile as StudentProfile | StaffProfile).last_name ?? '';
    const full = `${first} ${last}`.trim();
    if (full) return full;
  }

  if (user.email) {
    return user.email.split('@')[0];
  }

  return '';
}
