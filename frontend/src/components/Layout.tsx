/**
 * Main Layout Component — Figma Design
 * Dark sidebar with grouped navigation + top header bar
 */

import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import NotificationBell from './NotificationBell';
import { useConfirm } from '../hooks/useConfirm';
import ConfirmDialog from './ConfirmDialog';
import UserAvatar from './UserAvatar';

/* ── SVG Icon Components ── */
const icons = {
  dashboard: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v5a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zm10-2a1 1 0 011-1h4a1 1 0 011 1v6a1 1 0 01-1 1h-4a1 1 0 01-1-1v-6z" />
    </svg>
  ),
  students: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  ),
  enrollments: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
    </svg>
  ),
  sessions: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  courses: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  ),
  attendance: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  finance: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
    </svg>
  ),
  invoices: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  payments: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  ),
  reports: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  announcements: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
    </svg>
  ),
  profile: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
  classes: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  ),
  settings: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  logout: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  ),
  search: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  ),
  menu: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  ),
  close: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  audit: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  ),
};

/* ── Navigation Item Type ── */
interface NavItem {
  name: string;
  href: string;
  icon: keyof typeof icons;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

/* ── Page Title Map ── */
const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/admin': 'Admin Dashboard',
  '/profile': 'My Profile',
  '/students': 'Students',
  '/academics': 'Sessions',
  '/courses': 'Courses & Levels',
  '/classes': 'Schedules',
  '/schedules': 'Schedules',
  '/enrollments': 'Enrollments',
  '/billing': 'Finance Overview',
  '/invoices': 'Invoices',
  '/payments': 'Payments',
  '/attendance': 'Attendance',
  '/reports': 'Reports',
  '/notifications': 'Announcements',
  '/audit': 'Audit Logs',
  '/audit-logs': 'Audit Logs',
  '/admin/audit': 'Audit Logs',
  '/admin/audit-logs': 'Audit Logs',
  '/admin/users': 'Users & Roles',
  '/admin/roles': 'Users & Roles',
  '/users': 'Users & Roles',
  '/settings': 'Settings',
  '/help': 'Help',
};

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { confirm, confirmState, handleConfirm, handleCancel } = useConfirm();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileOpen(false);
    };
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [mobileOpen]);

  const handleLogout = async () => {
    const confirmed = await confirm({
      title: 'Confirm Logout',
      message: 'Are you sure you want to logout? Any unsaved changes will be lost.',
      confirmText: 'Logout',
      cancelText: 'Cancel',
      variant: 'warning',
    });

    if (confirmed) {
      await logout();
      navigate('/login');
    }
  };

  const isStaff = user?.is_staff_role ?? ['super_admin', 'manager', 'finance', 'student_officer', 'it_admin'].includes(user?.role ?? '');
  const isAcademicStaff = ['super_admin', 'manager', 'student_officer'].includes(user?.role ?? '');
  const isFinance = ['super_admin', 'manager', 'finance'].includes(user?.role ?? '');
  const isStudent = user?.role === 'student';

  // Get user display name with fallbacks
  const displayName = user?.profile?.first_name || user?.email?.split('@')?.[0] || 'User';
  const rawAvatarUrl = user?.avatar_url || (user?.profile as any)?.photo || null;

  // Build navigation groups matching Figma
  const navGroups: NavGroup[] = [
    {
      label: 'MAIN',
      items: [
        { name: 'Dashboard', href: isStaff ? '/admin' : '/dashboard', icon: 'dashboard' as const },
      ],
    },
    ...(isAcademicStaff
      ? [
          {
            label: 'ACADEMIC',
            items: [
              { name: 'Students', href: '/students', icon: 'students' as const },
              { name: 'Enrollments', href: '/enrollments', icon: 'enrollments' as const },
              { name: 'Sessions', href: '/academics', icon: 'sessions' as const },
              { name: 'Courses & Levels', href: '/courses', icon: 'courses' as const },
              { name: 'Schedules', href: '/schedules', icon: 'classes' as const },
              { name: 'Virtual Classroom', href: '/classrooms', icon: 'classes' as const },
              { name: 'Attendance', href: '/attendance', icon: 'attendance' as const },
            ],
          },
        ]
      : []),
    ...(isStaff
      ? [
          {
            label: 'FINANCE',
            items: [
              ...(isFinance
                ? [
                    { name: 'Finance Overview', href: '/billing', icon: 'finance' as const },
                    { name: 'Invoices', href: '/invoices', icon: 'invoices' as const },
                    { name: 'Payments', href: '/payments', icon: 'payments' as const },
                  ]
                : []),
              { name: 'Reports', href: '/reports', icon: 'reports' as const },
            ],
          },
        ]
      : []),
    ...(isStudent
      ? [
          {
            label: 'ACADEMIC',
            items: [
              { name: 'My Enrollments', href: '/enrollments', icon: 'enrollments' as const },
              { name: 'Virtual Classroom', href: '/classrooms', icon: 'classes' as const },
              { name: 'Attendance', href: '/attendance', icon: 'attendance' as const },
            ],
          },
          {
            label: 'FINANCE',
            items: [{ name: 'Billing', href: '/billing', icon: 'finance' as const }],
          },
        ]
      : []),
    {
      label: 'COMMUNICATION',
      items: [{ name: 'Announcements', href: '/notifications', icon: 'announcements' as const }],
    },
    ...(isStaff
      ? [
          {
            label: 'ADMINISTRATION',
            items: [
              { name: 'Users & Roles', href: '/admin/users', icon: 'students' as const },
              { name: 'Audit Logs', href: '/audit', icon: 'audit' as const },
            ],
          },
        ]
      : []),
  ];

  // Current page title for breadcrumb
  const currentPath = location.pathname;
  const pageTitle = pageTitles[currentPath] || (currentPath.includes('/invoice') ? 'Invoice Details' : 'Dashboard');

  const isActive = (href: string) => currentPath === href;

  /* ── Sidebar Content (shared between desktop + mobile) ── */
  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5">
        <div className="w-9 h-9 rounded-lg bg-accent-teal flex items-center justify-center">
          <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838l-3.044 1.305 2.25.965a1 1 0 00.788 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
          </svg>
        </div>
        <div>
          <h1 className="text-white font-bold text-base leading-tight">ICAN Tutorial</h1>
          <p className="text-sidebar-muted text-xs">Management Platform</p>
        </div>
      </div>

      {/* Navigation Groups */}
      <nav className="flex-1 px-3 py-2 space-y-0.5 sidebar-scroll overflow-y-auto">
        {navGroups.map((group) => (
          <div key={group.label}>
            <p className="sidebar-section-label">{group.label}</p>
            {group.items.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`${active ? 'sidebar-link-active' : 'sidebar-link'} group relative`}
                >
                  {/* Active indicator dot */}
                  {active && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-accent-teal rounded-r-full" />
                  )}
                  <span className={active ? 'text-white' : 'text-sidebar-muted group-hover:text-white transition-colors'}>
                    {icons[item.icon]}
                  </span>
                  <span>{item.name}</span>
                  {/* Active dot on right */}
                  {active && (
                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-accent-teal" />
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* User Profile at Bottom */}
      <div className="border-t border-white/10 px-4 py-4">
        <div className="flex items-center gap-3">
          <UserAvatar
            src={rawAvatarUrl}
            name={displayName}
            email={user?.email}
            size="md"
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{displayName}</p>
            <p className="text-xs text-gray-400 capitalize truncate">
              {(user?.role || '').replace('_', ' ')}
            </p>
          </div>
          <button
            onClick={() => void handleLogout()}
            className="text-gray-400 hover:text-red-400 transition-colors flex-shrink-0"
            title="Logout"
          >
            {icons.logout}
          </button>
        </div>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-surface">
      {/* ── Desktop Sidebar ── */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-[260px] shadow-sidebar flex flex-col
          transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          hidden md:flex`}
        style={{ backgroundColor: '#0f172a' }}
      >
        {sidebarContent}
      </aside>

      {/* ── Mobile Sidebar Overlay ── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-[260px] shadow-sidebar flex flex-col
          transform transition-transform duration-300 ease-in-out md:hidden
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}
        style={{ backgroundColor: '#0f172a' }}
      >
        {/* Close button for mobile */}
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute top-4 right-4 text-sidebar-muted hover:text-white z-10"
        >
          {icons.close}
        </button>
        {sidebarContent}
      </aside>

      {/* ── Top Header Bar (fixed) ── */}
      <header
        className={`fixed top-0 right-0 z-40 bg-white border-b border-gray-200 transition-all duration-300 ${
          sidebarOpen ? 'md:left-[260px]' : 'left-0'
        } left-0`}
      >
        <div className="flex items-center justify-between h-14 px-4 sm:px-6">
          {/* Left: Menu + Breadcrumb */}
          <div className="flex items-center gap-4">
            {/* Desktop toggle */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="hidden md:block text-gray-400 hover:text-gray-600 transition-colors"
            >
              {icons.menu}
            </button>
            {/* Mobile toggle */}
            <button
              onClick={() => setMobileOpen(true)}
              className="md:hidden text-gray-400 hover:text-gray-600 transition-colors"
            >
              {icons.menu}
            </button>

            {/* Breadcrumb & Mobile Title */}
            <nav className="flex items-center gap-1.5 sm:gap-2 text-sm max-w-[180px] sm:max-w-none">
              <span className="hidden sm:inline text-gray-400">ICAN Portal</span>
              <span className="hidden sm:inline text-gray-300">/</span>
              <span className="text-slate-900 font-bold sm:font-medium text-xs sm:text-sm truncate">{pageTitle}</span>
            </nav>
          </div>

          {/* Right: Notifications + User */}
          <div className="flex items-center gap-3">
            {/* Notification Bell */}
            <NotificationBell />

            <Link to="/profile" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <UserAvatar
                src={rawAvatarUrl}
                name={displayName}
                email={user?.email}
                size="sm"
              />
              <span className="hidden sm:block text-sm font-medium text-gray-700">{displayName}</span>
            </Link>
          </div>
        </div>
      </header>

      {/* ── Main Content ── */}
      <div className={`transition-all duration-300 pt-14 ${sidebarOpen ? 'md:ml-[260px]' : ''}`}>
        {/* Page Content */}
        <main className="p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>

        {/* Footer */}
        <footer className="border-t border-slate-200 py-4 px-6 text-xs text-slate-500 flex flex-col sm:flex-row justify-between items-center gap-2 bg-slate-50">
          <p>© 2026 ICAN Tutorial Centre Management System. All rights reserved.</p>
          <div className="flex gap-4 font-medium">
            <Link to="/privacy" className="hover:text-slate-900 transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-slate-900 transition-colors">Terms & Conditions</Link>
            <Link to="/help" className="hover:text-slate-900 transition-colors">Help</Link>
          </div>
        </footer>
      </div>

      {/* Logout Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmState.isOpen}
        onClose={handleCancel}
        onConfirm={handleConfirm}
        title={confirmState.title}
        message={confirmState.message}
        confirmText={confirmState.confirmText}
        cancelText={confirmState.cancelText}
        variant={confirmState.variant as 'danger' | 'warning' | 'info'}
      />
    </div>
  );
}
