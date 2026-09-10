import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '../test/test-utils';
import { RoleGuard } from './RoleGuard';
import * as AuthContext from '../contexts/AuthContext';

describe('RoleGuard', () => {
  it('renders children when user has allowed role', () => {
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      user: { id: '1', email: 'student@ican.edu', role: 'student', is_active: true },
      isAuthenticated: true,
      login: vi.fn(),
      logout: vi.fn(),
      register: vi.fn(),
    });

    render(
      <RoleGuard allowedRoles={['student']}>
        <div>Student Content</div>
      </RoleGuard>
    );

    expect(screen.getByText('Student Content')).toBeInTheDocument();
  });

  it('does not render children when user lacks required role', () => {
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      user: { id: '1', email: 'student@ican.edu', role: 'student', is_active: true },
      isAuthenticated: true,
      login: vi.fn(),
      logout: vi.fn(),
      register: vi.fn(),
    });

    render(
      <RoleGuard allowedRoles={['super_admin', 'manager']}>
        <div>Admin Content</div>
      </RoleGuard>
    );

    expect(screen.queryByText('Admin Content')).not.toBeInTheDocument();
  });

  it('renders children for multiple allowed roles', () => {
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      user: { id: '2', email: 'staff@ican.edu', role: 'student_officer', is_active: true },
      isAuthenticated: true,
      login: vi.fn(),
      logout: vi.fn(),
      register: vi.fn(),
    });

    render(
      <RoleGuard allowedRoles={['super_admin', 'student_officer', 'manager']}>
        <div>Staff Content</div>
      </RoleGuard>
    );

    expect(screen.getByText('Staff Content')).toBeInTheDocument();
  });

  it('does not render when user is not authenticated', () => {
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      user: null,
      isAuthenticated: false,
      login: vi.fn(),
      logout: vi.fn(),
      register: vi.fn(),
    });

    render(
      <RoleGuard allowedRoles={['student']}>
        <div>Protected Content</div>
      </RoleGuard>
    );

    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('renders for super_admin regardless of specific role requirements', () => {
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      user: { id: '3', email: 'admin@ican.edu', role: 'super_admin', is_active: true },
      isAuthenticated: true,
      login: vi.fn(),
      logout: vi.fn(),
      register: vi.fn(),
    });

    render(
      <RoleGuard allowedRoles={['student']}>
        <div>Any Content</div>
      </RoleGuard>
    );

    // Assuming super_admin has access to everything
    // This depends on your RoleGuard implementation
    expect(screen.queryByText('Any Content')).toBeInTheDocument();
  });
});
