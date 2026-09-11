/**
 * Users & Roles Management Dashboard
 * Allows Managers, IT Admins, and Super Admins to provision staff accounts,
 * assign roles, update active status, and inspect role permission matrices.
 */

import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { staffService, type StaffListItem, type StaffProvisionData } from '../services/staffService';
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

const ROLE_LABELS: Record<string, string> = {
  super_admin: 'Super Admin',
  manager: 'Manager',
  finance: 'Finance Staff',
  student_officer: 'Student Officer',
  it_admin: 'IT Admin',
  student: 'Student',
};

interface PermissionModule {
  name: string;
  category: string;
  description: string;
  roles: Record<string, boolean>;
}

const PERMISSION_MATRIX: PermissionModule[] = [
  {
    name: 'Student Management',
    category: 'Academic',
    description: 'Create, view, edit student profiles and academic records',
    roles: {
      super_admin: true,
      manager: true,
      student_officer: true,
      it_admin: false,
      finance: false,
      student: false,
    },
  },
  {
    name: 'Academic Sessions & Schedules',
    category: 'Academic',
    description: 'Configure sessions, levels, courses, and class timetables',
    roles: {
      super_admin: true,
      manager: true,
      student_officer: true,
      it_admin: false,
      finance: false,
      student: false,
    },
  },
  {
    name: 'Enrollments & Admissions',
    category: 'Academic',
    description: 'Enroll students into levels and approve registration requests',
    roles: {
      super_admin: true,
      manager: true,
      student_officer: true,
      it_admin: false,
      finance: false,
      student: false,
    },
  },
  {
    name: 'Invoices & Fee Structures',
    category: 'Finance',
    description: 'Generate student invoices, set fee amounts, apply discounts',
    roles: {
      super_admin: true,
      manager: true,
      finance: true,
      student_officer: false,
      it_admin: false,
      student: false,
    },
  },
  {
    name: 'Payment Verification',
    category: 'Finance',
    description: 'Record manual bank payments and verify online transactions',
    roles: {
      super_admin: true,
      manager: true,
      finance: true,
      student_officer: false,
      it_admin: false,
      student: false,
    },
  },
  {
    name: 'Financial Reports & Revenue',
    category: 'Finance',
    description: 'Access revenue breakdowns, collection rates, and balance summaries',
    roles: {
      super_admin: true,
      manager: true,
      finance: true,
      student_officer: false,
      it_admin: false,
      student: false,
    },
  },
  {
    name: 'Staff Provisioning & Roles',
    category: 'Administration',
    description: 'Create staff accounts, change user roles, and toggle access',
    roles: {
      super_admin: true,
      manager: true,
      it_admin: true,
      finance: false,
      student_officer: false,
      student: false,
    },
  },
  {
    name: 'Audit Logs & Security',
    category: 'Administration',
    description: 'Inspect system activity logs, security trails, and API audit events',
    roles: {
      super_admin: true,
      manager: true,
      it_admin: true,
      finance: true,
      student_officer: true,
      student: false,
    },
  },
];

export default function UsersAndRolesPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'directory' | 'matrix'>('directory');
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [includeStudents, setIncludeStudents] = useState<boolean>(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffListItem | null>(null);

  // Form State
  const [formData, setFormData] = useState<StaffProvisionData>({
    email: '',
    first_name: '',
    last_name: '',
    phone: '',
    role: 'finance',
    department: 'Finance',
    password: 'IcanStaff@2026!',
  });

  // Fetch Staff Users Query
  const { data: staffData, isLoading, refetch } = useQuery({
    queryKey: ['staff', roleFilter, statusFilter, searchQuery, includeStudents],
    queryFn: () =>
      staffService.getStaffList({
        role: roleFilter !== 'all' ? (roleFilter as UserRole) : undefined,
        is_active: statusFilter === 'all' ? undefined : statusFilter === 'active',
        search: searchQuery || undefined,
      }),
  });

  const staffList = useMemo(() => {
    const results = Array.isArray(staffData) ? staffData : (staffData as any)?.results || [];
    return results as StaffListItem[];
  }, [staffData]);

  // Metrics
  const metrics = useMemo(() => {
    const total = staffList.length;
    const active = staffList.filter((s) => s.is_active).length;
    const managers = staffList.filter((s) => ['super_admin', 'manager'].includes(s.role)).length;
    const finance = staffList.filter((s) => s.role === 'finance').length;

    return { total, active, managers, finance };
  }, [staffList]);

  // Provision Staff Mutation
  const provisionMutation = useMutation({
    mutationFn: (data: StaffProvisionData) => staffService.provisionStaff(data),
    onSuccess: (res) => {
      showToast.success(`Staff account provisioned! Temp Password: ${res.temporary_password || 'IcanStaff@2026!'}`);
      setIsModalOpen(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ['staff'] });
    },
    onError: (err: any) => {
      showToast.error(err?.response?.data?.detail || err?.response?.data?.email?.[0] || 'Failed to provision staff account');
    },
  });

  // Update Staff Mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<StaffProvisionData> & { is_active?: boolean } }) =>
      staffService.updateStaff(id, data),
    onSuccess: () => {
      showToast.success('Staff details updated successfully!');
      setIsModalOpen(false);
      setEditingStaff(null);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ['staff'] });
    },
    onError: (err: any) => {
      showToast.error(err?.response?.data?.detail || 'Failed to update staff account');
    },
  });

  // Toggle Deactivate / Reactivate
  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      if (isActive) {
        return staffService.deactivateStaff(id);
      } else {
        return staffService.reactivateStaff(id);
      }
    },
    onSuccess: (res) => {
      showToast.success(res.message || 'Status updated');
      queryClient.invalidateQueries({ queryKey: ['staff'] });
    },
    onError: (err: any) => {
      showToast.error(err?.response?.data?.detail || 'Action failed');
    },
  });

  // Reset Password Mutation
  const resetPasswordMutation = useMutation({
    mutationFn: (id: string) => staffService.resetPassword(id, 'IcanStaff@2026!'),
    onSuccess: (res) => {
      showToast.success(`Password reset! Temp Password: ${res.temporary_password || 'IcanStaff@2026!'}`);
    },
    onError: (err: any) => {
      showToast.error(err?.response?.data?.detail || 'Failed to reset password');
    },
  });

  const resetForm = () => {
    setFormData({
      email: '',
      first_name: '',
      last_name: '',
      phone: '',
      role: 'finance',
      department: 'Finance',
      password: 'IcanStaff@2026!',
    });
  };

  const handleOpenCreateModal = () => {
    setEditingStaff(null);
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (staff: StaffListItem) => {
    setEditingStaff(staff);
    const names = (staff.full_name || '').split(' ');
    setFormData({
      email: staff.email,
      first_name: names[0] || '',
      last_name: names.slice(1).join(' ') || '',
      role: staff.role,
      department: staff.department || 'General',
    });
    setIsModalOpen(true);
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingStaff) {
      updateMutation.mutate({
        id: editingStaff.id,
        data: {
          role: formData.role,
          department: formData.department,
          first_name: formData.first_name,
          last_name: formData.last_name,
        },
      });
    } else {
      provisionMutation.mutate(formData);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Users & Roles Dashboard</h1>
          <p className="text-sm text-slate-500 font-medium mt-1">
            Provision staff accounts, assign system roles, and configure module permissions
          </p>
        </div>
        <button
          onClick={handleOpenCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-sm font-semibold shadow-sm transition-colors cursor-pointer self-start sm:self-auto"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Provision Staff Member
        </button>
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
          <p className="text-xs text-slate-500 mt-3 font-medium">Registered system staff</p>
        </div>

        <div className="card p-5 bg-white border border-slate-200 rounded-xl shadow-xs">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">ACTIVE ACCOUNTS</p>
              <h3 className="text-2xl font-bold text-emerald-600 mt-1">{metrics.active}</h3>
            </div>
            <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-3 font-medium">Enabled & verified staff</p>
        </div>

        <div className="card p-5 bg-white border border-slate-200 rounded-xl shadow-xs">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">MANAGERS & ADMINS</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">{metrics.managers}</h3>
            </div>
            <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-3 font-medium">Administrative control access</p>
        </div>

        <div className="card p-5 bg-white border border-slate-200 rounded-xl shadow-xs">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">FINANCE OFFICERS</p>
              <h3 className="text-2xl font-bold text-blue-600 mt-1">{metrics.finance}</h3>
            </div>
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-3 font-medium">Billing & payment staff</p>
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
            Staff Directory & Accounts
          </button>
          <button
            onClick={() => setActiveTab('matrix')}
            className={`py-3 font-semibold text-sm border-b-2 transition-colors cursor-pointer ${
              activeTab === 'matrix'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Role Permissions Matrix
          </button>
        </nav>
      </div>

      {/* TAB 1: STAFF DIRECTORY */}
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
                <option value="manager">Manager</option>
                <option value="finance">Finance Staff</option>
                <option value="student_officer">Student Officer</option>
                <option value="it_admin">IT Admin</option>
                <option value="super_admin">Super Admin</option>
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
            {isLoading ? (
              <div className="p-12 text-center text-slate-400 text-sm">
                <div className="animate-spin w-8 h-8 border-3 border-slate-900 border-t-transparent rounded-full mx-auto mb-3"></div>
                Loading staff accounts...
              </div>
            ) : staffList.length === 0 ? (
              <div className="p-12 text-center text-slate-500 text-sm">
                No staff members found matching your search.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      <th className="py-3.5 px-6">STAFF MEMBER</th>
                      <th className="py-3.5 px-6">ASSIGNED ROLE</th>
                      <th className="py-3.5 px-6">DEPARTMENT</th>
                      <th className="py-3.5 px-6 text-center">STATUS</th>
                      <th className="py-3.5 px-6 text-right pr-6">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {staffList.map((staff) => {
                      const initials = (staff.full_name || staff.email || 'U')
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .substring(0, 2)
                        .toUpperCase();

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
                            <span className={`px-2.5 py-1 rounded-md text-xs font-semibold border ${ROLE_COLORS[staff.role] || 'bg-slate-100 text-slate-800'}`}>
                              {ROLE_LABELS[staff.role] || staff.role}
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
                              <button
                                onClick={() => handleOpenEditModal(staff)}
                                className="px-2.5 py-1 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-md transition-colors cursor-pointer"
                              >
                                Edit Role
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

      {/* TAB 2: PERMISSIONS MATRIX */}
      {activeTab === 'matrix' && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <h3 className="text-base font-bold text-slate-900 mb-1">System Role Capabilities & Permissions</h3>
            <p className="text-xs text-slate-500">
              Overview of module permissions granted per user role across the ICAN platform.
            </p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="py-4 px-6 min-w-[220px]">MODULE / CAPABILITY</th>
                    <th className="py-4 px-3 text-center min-w-[100px]">SUPER ADMIN</th>
                    <th className="py-4 px-3 text-center min-w-[100px]">MANAGER</th>
                    <th className="py-4 px-3 text-center min-w-[100px]">FINANCE</th>
                    <th className="py-4 px-3 text-center min-w-[110px]">STUDENT OFFICER</th>
                    <th className="py-4 px-3 text-center min-w-[100px]">IT ADMIN</th>
                    <th className="py-4 px-3 text-center min-w-[100px]">STUDENT</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {PERMISSION_MATRIX.map((perm, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-4 px-6">
                        <div className="font-semibold text-slate-900 text-sm">{perm.name}</div>
                        <div className="text-xs text-slate-400 mt-0.5">{perm.description}</div>
                      </td>

                      {['super_admin', 'manager', 'finance', 'student_officer', 'it_admin', 'student'].map((r) => {
                        const isGranted = perm.roles[r];
                        return (
                          <td key={r} className="py-4 px-3 text-center">
                            {isGranted ? (
                              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 text-emerald-700">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                              </span>
                            ) : (
                              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-slate-400">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                                </svg>
                              </span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* PROVISION / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-4 sm:p-6 space-y-4 max-h-[90vh] overflow-y-auto min-w-0">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900">
                {editingStaff ? 'Edit Staff Role & Details' : 'Provision New Staff Member'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="space-y-4 text-xs font-medium">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 mb-1">First Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1">Last Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
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
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 disabled:bg-slate-100 disabled:text-slate-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 mb-1">Role *</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                  >
                    <option value="manager">Manager</option>
                    <option value="finance">Finance Staff</option>
                    <option value="student_officer">Student Officer</option>
                    <option value="it_admin">IT Admin</option>
                    <option value="super_admin">Super Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 mb-1">Department</label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                  />
                </div>
              </div>

              {!editingStaff && (
                <div>
                  <label className="block text-slate-600 mb-1">Temporary Password</label>
                  <input
                    type="text"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                  />
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={provisionMutation.isPending || updateMutation.isPending}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg transition-colors"
                >
                  {provisionMutation.isPending || updateMutation.isPending ? 'Saving...' : editingStaff ? 'Save Changes' : 'Provision Staff'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
