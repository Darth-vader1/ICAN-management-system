import type { UserRole } from '../types/auth';

export function roleHomePath(role: UserRole): string {
  return role === 'student' ? '/student/dashboard' : '/admin/dashboard';
}