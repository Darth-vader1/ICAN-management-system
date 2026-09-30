import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '../test/test-utils';
import { RoleGuard } from './RoleGuard';
import * as AuthContext from '../contexts/AuthContext';

describe('RoleGuard', () => {
  it('renders children when user has required permission', () => {
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      user: { id: '1', email: 'staff@ican.edu', role: 'finance', is_active: true },
      isAuthenticated: true,
      hasPermission: vi.fn().mockImplementation((perm) => perm === 'billing.manage'),
      login: vi.fn(),
      logout: vi.fn(),
      register: vi.fn(),
    } as any);

    render(
      <RoleGuard requiredPermission="billing.manage">
        <div>Finance Content</div>
      </RoleGuard>
    );

    expect(screen.getByText('Finance Content')).toBeInTheDocument();
  });

  it('does not render children when user lacks required permission', () => {
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      user: { id: '1', email: 'student@ican.edu', role: 'student', is_active: true },
      isAuthenticated: true,
      hasPermission: vi.fn().mockReturnValue(false),
      login: vi.fn(),
      logout: vi.fn(),
      register: vi.fn(),
    } as any);

    render(
      <RoleGuard requiredPermission="dashboard.view">
        <div>Admin Content</div>
      </RoleGuard>
    );

    expect(screen.queryByText('Admin Content')).not.toBeInTheDocument();
  });

  it('renders children if no required permission is provided (default open to authenticated users)', () => {
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      user: { id: '2', email: 'staff@ican.edu', role: 'student', is_active: true },
      isAuthenticated: true,
      hasPermission: vi.fn().mockReturnValue(false),
      login: vi.fn(),
      logout: vi.fn(),
      register: vi.fn(),
    } as any);

    render(
      <RoleGuard>
        <div>Open Content</div>
      </RoleGuard>
    );

    expect(screen.getByText('Open Content')).toBeInTheDocument();
  });

  it('does not render when user is not authenticated', () => {
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      user: null,
      isAuthenticated: false,
      hasPermission: vi.fn().mockReturnValue(false),
      login: vi.fn(),
      logout: vi.fn(),
      register: vi.fn(),
    } as any);

    render(
      <RoleGuard requiredPermission="students.view">
        <div>Protected Content</div>
      </RoleGuard>
    );

    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('renders for super_admin regardless of specific permission requirements', () => {
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      user: { id: '3', email: 'admin@ican.edu', role: 'super_admin', is_active: true },
      isAuthenticated: true,
      hasPermission: vi.fn().mockReturnValue(false), // even if hasPermission is false
      login: vi.fn(),
      logout: vi.fn(),
      register: vi.fn(),
    } as any);

    render(
      <RoleGuard requiredPermission="some.strict.permission">
        <div>Admin Content</div>
      </RoleGuard>
    );

    expect(screen.getByText('Admin Content')).toBeInTheDocument();
  });
});
