/**
 * Users & Roles Management Dashboard
 * Dynamic Role-Based Access Control (RBAC) System.
 * Allows authorized administrators to create custom roles, assign/remove permissions,
 * and assign dynamic roles to users without code changes.
 */

import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { staffService, type StaffListItem, type StaffProvisionData } from '../services/staffService';
import { roleService, type RoleItem, type PermissionItem } from '../services/roleService';
import { useAuth } from '../contexts/AuthContext';
import type { UserRole } from '../types/auth';
import { showToast } from '../lib/toast';
import UserAvatar from '../components/UserAvatar';

const ROLE_COLORS: Record<string, string> = {
  super_admin: 'bg-purple-100 text-purple-800 border-purple-200',
  manager: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  finance: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  student_officer: 'bg-blue-100 text-blue-800 border-blue-200',
  it_admin: 'bg-amber-100 text-amber-800 border-amber-200',
  student: 'bg-slate-100 text-slate-800 border-slate-200',
};

const MODULE_LABELS: Record<string, string> = {
  students: 'Student Management',
  academics: 'Academics & Timetable',
  enrollments: 'Enrollments & Registration',
  billing: 'Billing & Fee Structures',
  payments: 'Payment Processing & Verification',
  attendance: 'Attendance Logging',
  notifications: 'System Notifications & Announcements',
  reports: 'Reports & Analytics',
  audit: 'Audit Trails & Security Logs',
  users: 'User Account Management',
  roles: 'Roles & Permission Matrix',
  classroom: 'Virtual Classroom Platform',
  settings: 'System Configuration Settings',
  dashboard: 'Admin Dashboard',
};

export default function UsersAndRolesPage() {
  const queryClient = useQueryClient();
  const { user: currentUser, hasPermission } = useAuth();
  const [activeTab, setActiveTab] = useState<'directory' | 'roles_matrix'>('directory');
  
  // Directory State
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Matrix State
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [editingPermissions, setEditingPermissions] = useState<string[]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Modals State
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffListItem | null>(null);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);

  // Form States
  const [staffFormData, setStaffFormData] = useState<StaffProvisionData>({
    email: '',
    first_name: '',
    last_name: '',
    phone: '',
    role: 'finance',
    department: 'Finance',
    password: 'IcanStaff@2026!',
  });

  const [roleFormData, setRoleFormData] = useState({
    name: '',
    code: '',
    description: '',
  });

  // Queries
  const { data: staffData, isLoading: isStaffLoading } = useQuery({
    queryKey: ['staff', roleFilter, statusFilter, searchQuery],
    queryFn: () =>
      staffService.getStaffList({
        role: roleFilter !== 'all' ? (roleFilter as UserRole) : undefined,
        is_active: statusFilter === 'all' ? undefined : statusFilter === 'active',
        search: searchQuery || undefined,
      }),
  });

  const { data: rolesData, isLoading: isRolesLoading } = useQuery({
    queryKey: ['roles'],
    queryFn: () => roleService.getRoles(),
  });

  const { data: permissionsData, isLoading: isPermissionsLoading } = useQuery({
    queryKey: ['permissions'],
    queryFn: () => roleService.getPermissions(),
  });

  const staffList = useMemo(() => {
    const results = Array.isArray(staffData) ? staffData : (staffData as any)?.results || [];
    return results as StaffListItem[];
  }, [staffData]);

  const rolesList = useMemo<RoleItem[]>(() => {
    if (Array.isArray(rolesData)) return rolesData as RoleItem[];
    if ((rolesData as any)?.results && Array.isArray((rolesData as any).results)) {
      return (rolesData as any).results as RoleItem[];
    }
    return [];
  }, [rolesData]);

  const allPermissions = useMemo<PermissionItem[]>(() => {
    if (Array.isArray(permissionsData)) return permissionsData as PermissionItem[];
    if ((permissionsData as any)?.results && Array.isArray((permissionsData as any).results)) {
      return (permissionsData as any).results as PermissionItem[];
    }
    if (permissionsData && typeof permissionsData === 'object') {
      const flattened: PermissionItem[] = [];
      Object.values(permissionsData).forEach((item) => {
        if (Array.isArray(item)) flattened.push(...(item as PermissionItem[]));
      });
      if (flattened.length > 0) return flattened;
    }
    return [];
  }, [permissionsData]);

  // Group permissions by module
  const groupedPermissions = useMemo(() => {
    const map: Record<string, PermissionItem[]> = {};
    allPermissions.forEach((p) => {
      if (!map[p.module]) map[p.module] = [];
      map[p.module].push(p);
    });
    return map;
  }, [allPermissions]);

  // Active selected role for permission matrix editing
  const selectedRole = useMemo(() => {
    if (!selectedRoleId && rolesList.length > 0) {
      return rolesList[0];
    }
    return rolesList.find((r) => r.id === selectedRoleId) || rolesList[0] || null;
  }, [rolesList, selectedRoleId]);

  // Update local editing permissions when selected role changes
  React.useEffect(() => {
    if (selectedRole) {
      setEditingPermissions(selectedRole.permissions || []);
      setHasUnsavedChanges(false);
    }
  }, [selectedRole?.id, JSON.stringify(selectedRole?.permissions)]);

  // Metrics
  const metrics = useMemo(() => {
    const total = staffList.length;
    const active = staffList.filter((s) => s.is_active).length;
    const customRolesCount = rolesList.filter((r) => !r.is_system).length;
    const systemRolesCount = rolesList.filter((r) => r.is_system).length;

    return { total, active, customRolesCount, systemRolesCount };
  }, [staffList, rolesList]);

  // Mutations
  const provisionMutation = useMutation({
    mutationFn: (data: StaffProvisionData) => staffService.provisionStaff(data),
    onSuccess: (res) => {
      showToast.success(`Staff account provisioned! Temp Password: ${res.temporary_password || 'IcanStaff@2026!'}`);
      setIsStaffModalOpen(false);
      resetStaffForm();
      queryClient.invalidateQueries({ queryKey: ['staff'] });
    },
    onError: (err: any) => {
      showToast.error(err?.response?.data?.detail || 'Failed to provision staff account');
    },
  });

  const updateStaffMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<StaffProvisionData> & { is_active?: boolean } }) =>
      staffService.updateStaff(id, data),
    onSuccess: () => {
      showToast.success('Staff details updated successfully!');
      setIsStaffModalOpen(false);
      setEditingStaff(null);
      resetStaffForm();
      queryClient.invalidateQueries({ queryKey: ['staff'] });
    },
    onError: (err: any) => {
      showToast.error(err?.response?.data?.detail || 'Failed to update staff account');
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      return isActive ? staffService.deactivateStaff(id) : staffService.reactivateStaff(id);
    },
    onSuccess: (res) => {
      showToast.success(res.message || 'Status updated');
      queryClient.invalidateQueries({ queryKey: ['staff'] });
    },
    onError: (err: any) => {
      showToast.error(err?.response?.data?.detail || 'Action failed');
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: (id: string) => staffService.resetPassword(id, 'IcanStaff@2026!'),
    onSuccess: (res) => {
      showToast.success(`Password reset! Temp Password: ${res.temporary_password || 'IcanStaff@2026!'}`);
    },
    onError: (err: any) => {
      showToast.error(err?.response?.data?.detail || 'Failed to reset password');
    },
  });

  const createRoleMutation = useMutation({
    mutationFn: (payload: { name: string; code: string; description: string; permissions: string[] }) =>
      roleService.createRole(payload),
    onSuccess: (newRole) => {
      showToast.success(`Role '${newRole.name}' created successfully!`);
      setIsRoleModalOpen(false);
      setRoleFormData({ name: '', code: '', description: '' });
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      setSelectedRoleId(newRole.id);
    },
    onError: (err: any) => {
      showToast.error(err?.response?.data?.detail || err?.response?.data?.permissions?.[0] || 'Failed to create role');
    },
  });

  const updateRolePermissionsMutation = useMutation({
    mutationFn: ({ id, permissions }: { id: string; permissions: string[] }) =>
      roleService.updateRole(id, { permissions }),
    onSuccess: () => {
      showToast.success('Role permissions updated successfully!');
      setHasUnsavedChanges(false);
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      queryClient.invalidateQueries({ queryKey: ['auth'] });
    },
    onError: (err: any) => {
      showToast.error(err?.response?.data?.detail || err?.response?.data?.permissions?.[0] || 'Failed to update permissions');
    },
  });

  const deleteRoleMutation = useMutation({
    mutationFn: (id: string) => roleService.deleteRole(id),
    onSuccess: (res) => {
      showToast.success(res.detail || 'Role deleted');
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      setSelectedRoleId(null);
    },
    onError: (err: any) => {
      showToast.error(err?.response?.data?.detail || 'Failed to delete role');
    },
  });

  // Helper functions
  const resetStaffForm = () => {
    setStaffFormData({
      email: '',
      first_name: '',
      last_name: '',
      phone: '',
      role: 'finance',
      department: 'Finance',
      password: 'IcanStaff@2026!',
    });
  };

  const handleOpenStaffCreateModal = () => {
    setEditingStaff(null);
    resetStaffForm();
    setIsStaffModalOpen(true);
  };

  const handleOpenStaffEditModal = (staff: StaffListItem) => {
    setEditingStaff(staff);
    const names = (staff.full_name || '').split(' ');
    setStaffFormData({
      email: staff.email,
      first_name: names[0] || '',
      last_name: names.slice(1).join(' ') || '',
      role: staff.role,
      department: staff.department || 'General',
    });
    setIsStaffModalOpen(true);
  };

  const handleTogglePermission = (codename: string) => {
    const isSuperAdmin = currentUser?.role === 'super_admin' || currentUser?.roles?.includes('super_admin');
    if (selectedRole?.is_protected && !isSuperAdmin) {
      showToast.error('Super Admin protected permissions can only be modified by Super Admins.');
      return;
    }

    setEditingPermissions((prev) => {
      const next = prev.includes(codename) ? prev.filter((c) => c !== codename) : [...prev, codename];
      setHasUnsavedChanges(true);
      return next;
    });
  };

  const handleSelectAllModule = (moduleKey: string) => {
    const modPerms = groupedPermissions[moduleKey] || [];
    const codenames = modPerms.map((p) => p.codename);
    setEditingPermissions((prev) => {
      const newPerms = Array.from(new Set([...prev, ...codenames]));
      setHasUnsavedChanges(true);
      return newPerms;
    });
  };

  const handleClearAllModule = (moduleKey: string) => {
    const modPerms = groupedPermissions[moduleKey] || [];
    const codenames = new Set(modPerms.map((p) => p.codename));
    setEditingPermissions((prev) => {
      const newPerms = prev.filter((c) => !codenames.has(c));
      setHasUnsavedChanges(true);
      return newPerms;
    });
  };

  const handleSavePermissions = () => {
    if (!selectedRole) return;
    updateRolePermissionsMutation.mutate({
      id: selectedRole.id,
      permissions: editingPermissions,
    });
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Configurable Role & Permission Management</h1>
          <p className="text-sm text-slate-500 font-medium mt-1">
            Assign dynamic permissions to roles, create custom roles, and provision staff accounts
          </p>
        </div>
        <div className="flex gap-2 self-start sm:self-auto">
          {hasPermission('roles.manage') && (
            <button
              onClick={() => setIsRoleModalOpen(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-sm font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Create Custom Role
            </button>
          )}

          {hasPermission('users.manage') && (
            <button
              onClick={handleOpenStaffCreateModal}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-sm font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
              Provision Staff Member
            </button>
          )}
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-5 bg-white border border-slate-200 rounded-xl shadow-xs">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">TOTAL STAFF</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">{metrics.total}</h3>
            </div>
            <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-3 font-medium">Registered system accounts</p>
        </div>

        <div className="card p-5 bg-white border border-slate-200 rounded-xl shadow-xs">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">SYSTEM ROLES</p>
              <h3 className="text-2xl font-bold text-emerald-600 mt-1">{metrics.systemRolesCount}</h3>
            </div>
            <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-3 font-medium">Built-in default system roles</p>
        </div>

        <div className="card p-5 bg-white border border-slate-200 rounded-xl shadow-xs">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">CUSTOM ROLES</p>
              <h3 className="text-2xl font-bold text-purple-600 mt-1">{metrics.customRolesCount}</h3>
            </div>
            <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-3 font-medium">Dynamically created user roles</p>
        </div>

        <div className="card p-5 bg-white border border-slate-200 rounded-xl shadow-xs">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">GRANULAR PERMISSIONS</p>
              <h3 className="text-2xl font-bold text-blue-600 mt-1">{allPermissions.length}</h3>
            </div>
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-3 font-medium">Active permissions across 14 modules</p>
        </div>
      </div>

      {/* Tabs Header */}
      <div className="border-b border-slate-200">
        <nav className="flex gap-6">
          <button
            onClick={() => setActiveTab('directory')}
            className={`py-3 font-semibold text-sm border-b-2 transition-colors cursor-pointer ${
              activeTab === 'directory'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Staff Directory & User Role Assignment
          </button>
          {hasPermission('roles.manage') && (
            <button
              onClick={() => setActiveTab('roles_matrix')}
              className={`py-3 font-semibold text-sm border-b-2 transition-colors cursor-pointer ${
                activeTab === 'roles_matrix'
                  ? 'border-slate-900 text-slate-900'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              Dynamic Roles & Permission Matrix Editor
            </button>
          )}
        </nav>
      </div>

      {/* TAB 1: STAFF DIRECTORY & USER ROLE ASSIGNMENT */}
      {activeTab === 'directory' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
            <div className="flex-1 min-w-[240px]">
              <div className="relative">
                <svg className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search staff by name, email, or department..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2 items-center">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none"
              >
                <option value="all">All Roles</option>
                {rolesList.map((r) => (
                  <option key={r.code} value={r.code}>
                    {r.name}
                  </option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive Only</option>
              </select>
            </div>
          </div>

          {/* Directory Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            {isStaffLoading ? (
              <div className="p-12 text-center text-slate-400 text-sm">
                <div className="animate-spin w-8 h-8 border-3 border-slate-900 border-t-transparent rounded-full mx-auto mb-3"></div>
                Loading staff accounts...
              </div>
            ) : staffList.length === 0 ? (
              <div className="p-12 text-center text-slate-500 text-sm">
                No staff accounts found.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      <th className="py-3.5 px-6">STAFF MEMBER</th>
                      <th className="py-3.5 px-6">PRIMARY ROLE</th>
                      <th className="py-3.5 px-6">DEPARTMENT</th>
                      <th className="py-3.5 px-6 text-center">STATUS</th>
                      <th className="py-3.5 px-6 text-right pr-6">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {staffList.map((staff) => {
                      const matchedRole = rolesList.find((r) => r.code === staff.role);
                      const roleLabel = matchedRole ? matchedRole.name : staff.role;

                      return (
                        <tr key={staff.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              <UserAvatar
                                src={staff.avatar_url}
                                name={staff.full_name}
                                email={staff.email}
                                size="md"
                              />
                              <div>
                                <p className="font-semibold text-slate-900 text-sm leading-tight">{staff.full_name || 'Staff User'}</p>
                                <p className="text-xs text-slate-400 font-mono mt-0.5">{staff.email}</p>
                              </div>
                            </div>
                          </td>

                          <td className="py-4 px-6">
                            <span className={`px-2.5 py-1 rounded-md text-xs font-semibold border ${ROLE_COLORS[staff.role] || 'bg-indigo-50 text-indigo-800 border-indigo-200'}`}>
                              {roleLabel}
                            </span>
                          </td>

                          <td className="py-4 px-6 text-slate-600 font-medium text-xs">
                            {staff.department || 'General'}
                          </td>

                          <td className="py-4 px-6 text-center">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                              staff.is_active ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${staff.is_active ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                              {staff.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </td>

                          <td className="py-4 px-6 text-right pr-6">
                            <div className="flex items-center justify-end gap-2">
                              {hasPermission('users.manage') ? (
                                <>
                                  <button
                                    onClick={() => handleOpenStaffEditModal(staff)}
                                    className="px-2.5 py-1 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-md transition-colors cursor-pointer"
                                  >
                                    Change Role
                                  </button>

                                  <button
                                    onClick={() => toggleActiveMutation.mutate({ id: staff.id, isActive: staff.is_active })}
                                    disabled={toggleActiveMutation.isPending}
                                    className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                                      staff.is_active
                                        ? 'bg-rose-50 hover:bg-rose-100 text-rose-700'
                                        : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700'
                                    }`}
                                  >
                                    {staff.is_active ? 'Deactivate' : 'Reactivate'}
                                  </button>

                                  <button
                                    onClick={() => resetPasswordMutation.mutate(staff.id)}
                                    disabled={resetPasswordMutation.isPending}
                                    className="px-2.5 py-1 text-xs font-semibold bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-md transition-colors cursor-pointer"
                                    title="Reset Password"
                                  >
                                    Reset Pass
                                  </button>
                                </>
                              ) : (
                                <span className="text-slate-400 font-normal italic">-</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: DYNAMIC ROLES & PERMISSION MATRIX EDITOR */}
      {hasPermission('roles.manage') && activeTab === 'roles_matrix' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Roles Selector Sidebar */}
          <div className="lg:col-span-1 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">AVAILABLE ROLES</h3>
              {hasPermission('roles.manage') && (
                <button
                  onClick={() => setIsRoleModalOpen(true)}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                >
                  + New Role
                </button>
              )}
            </div>

            <div className="space-y-2">
              {isRolesLoading ? (
                <div className="p-4 text-center text-xs text-slate-400">Loading roles...</div>
              ) : (
                rolesList.map((r) => {
                  const isSelected = selectedRole?.id === r.id;
                  return (
                    <div
                      key={r.id}
                      onClick={() => {
                        if (hasUnsavedChanges) {
                          if (!window.confirm('You have unsaved permission changes. Discard them?')) return;
                        }
                        setSelectedRoleId(r.id);
                      }}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-slate-900 text-white border-slate-900 shadow-md'
                          : 'bg-white border-slate-200 hover:border-slate-300 text-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="font-bold text-sm leading-tight">{r.name}</div>
                        <div className="flex items-center gap-1">
                          {r.is_protected ? (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400">
                              Protected
                            </span>
                          ) : r.is_system ? (
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${isSelected ? 'bg-indigo-500/30 text-indigo-200' : 'bg-slate-100 text-slate-600'}`}>
                              System
                            </span>
                          ) : (
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${isSelected ? 'bg-emerald-500/30 text-emerald-200' : 'bg-emerald-100 text-emerald-800'}`}>
                              Custom
                            </span>
                          )}
                        </div>
                      </div>
                      <p className={`text-xs mt-1 line-clamp-2 ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                        {r.description || 'No description provided.'}
                      </p>
                      <div className={`text-[11px] mt-2 font-mono flex justify-between ${isSelected ? 'text-slate-400' : 'text-slate-400'}`}>
                        <span>{r.permissions?.length || 0} permissions</span>
                        <span>{r.user_count || 0} users</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Matrix Permission Editor Area */}
          <div className="lg:col-span-3 space-y-4">
            {selectedRole ? (
              <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
                {/* Role Details Header */}
                <div className="p-5 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50">
                  <div>
                    <div className="flex items-center gap-3">
                      <h2 className="text-xl font-bold text-slate-900">{selectedRole.name}</h2>
                      <span className="px-2 py-0.5 rounded-full text-xs font-mono bg-slate-200 text-slate-700">
                        {selectedRole.code}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">{selectedRole.description}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    {hasPermission('roles.manage') && !selectedRole.is_system && !selectedRole.is_protected && (
                      <button
                        onClick={() => {
                          if (window.confirm(`Are you sure you want to delete custom role '${selectedRole.name}'?`)) {
                            deleteRoleMutation.mutate(selectedRole.id);
                          }
                        }}
                        disabled={deleteRoleMutation.isPending}
                        className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                      >
                        Delete Role
                      </button>
                    )}

                    {hasPermission('roles.manage') && (
                      <button
                        onClick={handleSavePermissions}
                        disabled={!hasUnsavedChanges || updateRolePermissionsMutation.isPending}
                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          hasUnsavedChanges
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md animate-pulse'
                            : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                        }`}
                      >
                        {updateRolePermissionsMutation.isPending ? 'Saving...' : 'Save Permission Matrix'}
                      </button>
                    )}
                  </div>
                </div>

                {/* Modules Grid */}
                {isPermissionsLoading ? (
                  <div className="p-12 text-center text-slate-400 text-sm">Loading permission matrix...</div>
                ) : (
                  <div className="p-5 space-y-6 divide-y divide-slate-100 max-h-[70vh] overflow-y-auto">
                    {Object.keys(groupedPermissions).map((moduleKey) => {
                      const modPerms = groupedPermissions[moduleKey];
                      const allSelected = modPerms.every((p) => editingPermissions.includes(p.codename));

                      return (
                        <div key={moduleKey} className="pt-5 first:pt-0 space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-bold text-slate-900">
                                {MODULE_LABELS[moduleKey] || moduleKey.toUpperCase()}
                              </h4>
                              <span className="text-xs text-slate-400 font-mono">({modPerms.length})</span>
                            </div>

                            <div className="flex items-center gap-2 text-xs">
                              <button
                                onClick={() => handleSelectAllModule(moduleKey)}
                                className="text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer"
                              >
                                Select All
                              </button>
                              <span className="text-slate-300">|</span>
                              <button
                                onClick={() => handleClearAllModule(moduleKey)}
                                className="text-slate-500 hover:text-slate-700 font-semibold cursor-pointer"
                              >
                                Clear All
                              </button>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {modPerms.map((perm) => {
                              const isChecked = editingPermissions.includes(perm.codename);
                              return (
                                <label
                                  key={perm.codename}
                                  onClick={() => handleTogglePermission(perm.codename)}
                                  className={`p-3 rounded-lg border transition-all cursor-pointer flex items-start gap-3 ${
                                    isChecked
                                      ? 'bg-indigo-50/60 border-indigo-200 text-indigo-950'
                                      : 'bg-slate-50/50 border-slate-200 text-slate-700 hover:bg-slate-100/60'
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => {}}
                                    className="mt-0.5 w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                                  />
                                  <div>
                                    <div className="font-semibold text-xs leading-tight">{perm.name}</div>
                                    <div className="text-[11px] text-slate-500 mt-0.5">{perm.description}</div>
                                    <div className="text-[10px] font-mono text-slate-400 mt-1">{perm.codename}</div>
                                  </div>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              <div className="p-12 text-center text-slate-400 bg-white rounded-xl border border-slate-200">
                Select a role from the left menu to view and edit its permissions.
              </div>
            )}
          </div>
        </div>
      )}

      {/* PROVISION / EDIT STAFF MODAL */}
      {isStaffModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-4 sm:p-6 space-y-4 max-h-[90vh] overflow-y-auto min-w-0">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900">
                {editingStaff ? 'Change User Role & Profile Details' : 'Provision New Staff Member'}
              </h3>
              <button
                onClick={() => setIsStaffModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (editingStaff) {
                  updateStaffMutation.mutate({
                    id: editingStaff.id,
                    data: {
                      role: staffFormData.role,
                      department: staffFormData.department,
                      first_name: staffFormData.first_name,
                      last_name: staffFormData.last_name,
                    },
                  });
                } else {
                  provisionMutation.mutate(staffFormData);
                }
              }}
              className="space-y-4 text-xs font-medium"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 mb-1">First Name *</label>
                  <input
                    type="text"
                    required
                    value={staffFormData.first_name}
                    onChange={(e) => setStaffFormData({ ...staffFormData, first_name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1">Last Name *</label>
                  <input
                    type="text"
                    required
                    value={staffFormData.last_name}
                    onChange={(e) => setStaffFormData({ ...staffFormData, last_name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  disabled={!!editingStaff}
                  value={staffFormData.email}
                  onChange={(e) => setStaffFormData({ ...staffFormData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 disabled:bg-slate-100 disabled:text-slate-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 mb-1">Assigned Dynamic Role *</label>
                  <select
                    value={staffFormData.role}
                    onChange={(e) => setStaffFormData({ ...staffFormData, role: e.target.value as UserRole })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 font-semibold"
                  >
                    {rolesList.map((r) => (
                      <option key={r.code} value={r.code}>
                        {r.name} ({r.code})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 mb-1">Department</label>
                  <input
                    type="text"
                    value={staffFormData.department}
                    onChange={(e) => setStaffFormData({ ...staffFormData, department: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                  />
                </div>
              </div>

              {!editingStaff && (
                <div>
                  <label className="block text-slate-600 mb-1">Temporary Password</label>
                  <input
                    type="text"
                    value={staffFormData.password}
                    onChange={(e) => setStaffFormData({ ...staffFormData, password: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                  />
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsStaffModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={provisionMutation.isPending || updateStaffMutation.isPending}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  {provisionMutation.isPending || updateStaffMutation.isPending ? 'Saving...' : editingStaff ? 'Save Changes' : 'Provision Staff'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE CUSTOM ROLE MODAL */}
      {isRoleModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-4 sm:p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900">Define New Custom System Role</h3>
              <button
                onClick={() => setIsRoleModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const code = roleFormData.code || roleFormData.name.toLowerCase().replace(/\s+/g, '_');
                createRoleMutation.mutate({
                  name: roleFormData.name,
                  code,
                  description: roleFormData.description,
                  permissions: [],
                });
              }}
              className="space-y-4 text-xs font-medium"
            >
              <div>
                <label className="block text-slate-600 mb-1">Role Display Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Admissions Officer"
                  value={roleFormData.name}
                  onChange={(e) => setRoleFormData({ ...roleFormData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 font-semibold"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1">Role Unique Code (Slug)</label>
                <input
                  type="text"
                  placeholder="e.g., admissions_officer (auto-generated if left blank)"
                  value={roleFormData.code}
                  onChange={(e) => setRoleFormData({ ...roleFormData, code: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1">Role Description</label>
                <textarea
                  rows={3}
                  placeholder="Describe the responsibilities and scope of this role..."
                  value={roleFormData.description}
                  onChange={(e) => setRoleFormData({ ...roleFormData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsRoleModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createRoleMutation.isPending}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  {createRoleMutation.isPending ? 'Creating Role...' : 'Create Role'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
