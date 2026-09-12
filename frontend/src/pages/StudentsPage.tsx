/**
 * Students Management Page — Figma Design
 * List, search, filter, and manage students (Staff only)
 */

import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { TableSkeleton } from '../components/LoadingSkeleton';
import { NoStudentsFound } from '../components/EmptyState';
import { useConfirm } from '../hooks/useConfirm';
import { ConfirmDialog } from '../components/ConfirmDialog';
import {
  useStudents,
  useUpdateStudent,
  useDeleteStudent,
} from '../hooks/queries';
import UserAvatar from '../components/UserAvatar';

/* ── Avatar Color Map ── */
const avatarColors = [
  'bg-blue-600',
  'bg-emerald-600',
  'bg-violet-600',
  'bg-amber-600',
  'bg-rose-600',
  'bg-cyan-600',
  'bg-indigo-600',
  'bg-pink-600',
  'bg-teal-600',
  'bg-orange-600',
];

function getAvatarColor(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return avatarColors[Math.abs(hash) % avatarColors.length];
}

/* ── Get display name and initials from any student record ── */
function getStudentDisplay(student: any) {
  const first = (student.first_name || '').trim();
  const last = (student.last_name || '').trim();
  const full = (student.full_name || '').trim();
  const email = (student.email || student.user_email || '').trim();

  let name = '';
  if (first || last) {
    name = `${first} ${last}`.trim();
  } else if (full) {
    name = full;
  } else if (email) {
    name = email.split('@')[0];
  } else {
    name = 'Unknown';
  }

  // Compute initials
  let initials = '';
  if (first && last) {
    initials = `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
  } else if (full && full.includes(' ')) {
    const parts = full.split(' ');
    initials = `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase();
  } else if (name.length > 0) {
    initials = name.substring(0, 2).toUpperCase();
  }

  return { name, email, initials };
}

/* ── Level Badge Colors ── */
function getLevelBadge(level: string) {
  const l = (level || '').toLowerCase();
  if (l.includes('foundation')) return 'bg-blue-50 text-blue-700 ring-1 ring-blue-600/10';
  if (l.includes('skill')) return 'bg-teal-50 text-teal-700 ring-1 ring-teal-600/10';
  if (l.includes('professional')) return 'bg-purple-50 text-purple-700 ring-1 ring-purple-600/10';
  return 'bg-gray-100 text-gray-600 ring-1 ring-gray-500/10';
}

/* ── Status Styles ── */
function getStatusStyle(isActive: boolean) {
  if (isActive) {
    return { dot: 'bg-emerald-500', text: 'text-emerald-700', label: 'Active' };
  }
  return { dot: 'bg-gray-400', text: 'text-gray-600', label: 'Inactive' };
}

export default function StudentsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const { confirm, confirmState, handleConfirm, handleCancel } = useConfirm();

  const {
    data: students = [],
    isLoading,
    error,
    refetch,
  } = useStudents();

  const deleteStudentMutation = useDeleteStudent();
  const updateStudentMutation = useUpdateStudent();

  // Normalize student data to array
  const studentsList = useMemo(
    () => {
      const raw = Array.isArray(students) ? students : (students as any)?.results || [];
      return raw as any[];
    },
    [students]
  );

  // Extract unique levels for filter dropdown
  const levels = useMemo(() => {
    const set = new Set<string>();
    studentsList.forEach((s: any) => {
      if (s.level_name) set.add(s.level_name);
    });
    return Array.from(set).sort();
  }, [studentsList]);

  // Filtered students
  const filteredStudents = useMemo(() => {
    let result = studentsList;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter((s: any) => {
        const { name, email } = getStudentDisplay(s);
        return (
          name.toLowerCase().includes(term) ||
          email.toLowerCase().includes(term) ||
          (s.student_code || s.student_id || '').toLowerCase().includes(term) ||
          (s.phone_number || '').includes(term) ||
          (s.whatsapp_number || '').includes(term)
        );
      });
    }

    if (levelFilter !== 'all') {
      result = result.filter((s: any) => s.level_name === levelFilter);
    }

    if (statusFilter !== 'all') {
      const isActive = statusFilter === 'active';
      result = result.filter((s: any) => s.is_active === isActive);
    }

    return result;
  }, [studentsList, searchTerm, levelFilter, statusFilter]);

  // Computed stats
  const activeCount = studentsList.filter((s: any) => s.is_active).length;

  const levelCounts = useMemo(() => {
    const counts: Record<string, number> = {
      'Foundation': 0,
      'Skills': 0,
      'Professional': 0,
    };
    studentsList.forEach((s: any) => {
      const level = (s.level_name || '').trim();
      if (level) {
        const lower = level.toLowerCase();
        if (lower.includes('foundation')) {
          counts['Foundation']++;
        } else if (lower.includes('skill')) {
          counts['Skills']++;
        } else if (lower.includes('professional')) {
          counts['Professional']++;
        } else {
          counts[level] = (counts[level] || 0) + 1;
        }
      }
    });
    return counts;
  }, [studentsList]);

  const handleDeleteStudent = async (student: any) => {
    const { name } = getStudentDisplay(student);
    const confirmed = await confirm({
      title: 'Delete Student?',
      message: `Are you sure you want to delete ${name}? This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      variant: 'danger',
    });

    if (confirmed) {
      deleteStudentMutation.mutate({ id: student.id });
    }
  };

  const handleToggleStudentStatus = async (student: any) => {
    const { name } = getStudentDisplay(student);
    const newStatus = !student.is_active;
    const actionText = newStatus ? 'Activate' : 'Deactivate';

    const confirmed = await confirm({
      title: `${actionText} Student?`,
      message: `Are you sure you want to ${actionText.toLowerCase()} ${name}?`,
      confirmText: actionText,
      cancelText: 'Cancel',
      variant: newStatus ? 'info' : 'warning',
    });

    if (confirmed) {
      updateStudentMutation.mutate({
        id: student.id,
        data: { is_active: newStatus },
      });
    }
  };

  const loading = isLoading || deleteStudentMutation.isPending;
  const errorMessage = error
    ? error instanceof Error ? error.message : 'Failed to load students'
    : '';

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-8 w-40 animate-shimmer rounded" />
            <div className="h-4 w-32 animate-shimmer rounded mt-2" />
          </div>
          <div className="h-10 w-40 animate-shimmer rounded-lg" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="card p-5 h-[84px] animate-shimmer" />
          ))}
        </div>
        <TableSkeleton rows={8} columns={7} />
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="space-y-4 animate-fade-in">
        <h1 className="page-header">Students</h1>
        <div className="card border-red-200 bg-red-50">
          <div className="flex items-center gap-3">
            <svg className="h-5 w-5 text-red-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-red-800 font-medium">{errorMessage}</p>
          </div>
        </div>
        <button onClick={() => refetch()} className="btn-primary">Try Again</button>
      </div>
    );
  }

  if (studentsList.length === 0 && !searchTerm) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <h1 className="page-header">Students</h1>
          <Link to="/students/new" className="inline-flex items-center gap-2 rounded-lg bg-navy px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-navy-dark focus:outline-none focus:ring-2 focus:ring-navy focus:ring-offset-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Register Student
          </Link>
        </div>
        <NoStudentsFound onAdd={() => window.location.href = '/students/new'} />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-header">Students</h1>
          <p className="page-subtitle">{activeCount} active of {studentsList.length} total</p>
        </div>
        <Link
          to="/students/new"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-navy px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-navy-dark focus:outline-none focus:ring-2 focus:ring-navy focus:ring-offset-2 self-start sm:self-auto"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Register Student
        </Link>
      </div>

      {/* ── Stat Cards (always show 4) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-5">
          <p className="stat-label">TOTAL STUDENTS</p>
          <p className="text-2xl font-bold text-gray-900 mt-1 tabular-nums">{studentsList.length}</p>
        </div>
        <div className="card p-5">
          <p className="stat-label">FOUNDATION</p>
          <p className="text-2xl font-bold text-gray-900 mt-1 tabular-nums">{levelCounts['Foundation'] || 0}</p>
        </div>
        <div className="card p-5">
          <p className="stat-label">SKILLS</p>
          <p className="text-2xl font-bold text-gray-900 mt-1 tabular-nums">{levelCounts['Skills'] || 0}</p>
        </div>
        <div className="card p-5">
          <p className="stat-label">PROFESSIONAL</p>
          <p className="text-2xl font-bold text-gray-900 mt-1 tabular-nums">{levelCounts['Professional'] || 0}</p>
        </div>
      </div>

      {/* ── Search + Filters ── */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="flex-1 relative">
          <svg
            className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search by name, email, phone, student ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input pl-10"
          />
        </div>
        <select
          value={levelFilter}
          onChange={(e) => setLevelFilter(e.target.value)}
          className="input w-auto min-w-[140px]"
        >
          <option value="all">All Levels</option>
          {levels.map((level) => (
            <option key={level} value={level}>{level}</option>
          ))}
          {levels.length === 0 && (
            <>
              <option value="Foundation">Foundation</option>
              <option value="Skills">Skills</option>
              <option value="Professional">Professional</option>
            </>
          )}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="input w-auto min-w-[130px]"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* ── Students Table ── */}
      <div className="card p-0 overflow-hidden">
        {filteredStudents.length === 0 ? (
          <div className="py-16 text-center">
            <svg className="mx-auto h-10 w-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <p className="mt-3 text-sm text-gray-500">
              {searchTerm ? 'No students found matching your search' : 'No students available'}
            </p>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="mt-3 text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                Clear search
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="table-header">STUDENT</th>
                  <th className="table-header">STUDENT ID</th>
                  <th className="table-header">LEVEL</th>
                  <th className="table-header">CONTACT</th>
                  <th className="table-header">STATUS</th>
                  <th className="table-header">REGISTERED</th>
                  <th className="table-header text-right pr-6">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredStudents.map((student: any) => {
                  const { name, email, initials } = getStudentDisplay(student);
                  const level = (student.level_name || '').trim();
                  const statusInfo = getStatusStyle(student.is_active);
                  const studentId = student.student_code || student.student_id || '—';
                  const contact = student.whatsapp_number || student.user_phone || student.phone_number || '—';
                  const regDate = student.created_at
                    ? new Date(student.created_at).toLocaleDateString('en-GB', {
                        day: 'numeric', month: 'short', year: 'numeric',
                      })
                    : '—';

                  return (
                    <tr key={student.id} className="hover:bg-gray-50/50 transition-colors group">
                      {/* Student */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <UserAvatar
                            src={student.photo}
                            name={name}
                            email={email}
                            size="md"
                          />
                          <div className="min-w-0">
                            <Link
                              to={`/students/${student.id}`}
                              className="text-sm font-semibold text-gray-900 hover:text-primary-600 transition-colors block truncate max-w-[200px]"
                            >
                              {name}
                            </Link>
                            {email && (
                              <p className="text-xs text-gray-400 truncate max-w-[200px]">{email}</p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Student ID */}
                      <td className="px-4 py-3.5">
                        <span className="text-sm text-gray-600">{studentId}</span>
                      </td>

                      {/* Level */}
                      <td className="px-4 py-3.5">
                        {level ? (
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getLevelBadge(level)}`}>
                            {level}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>

                      {/* Contact */}
                      <td className="px-4 py-3.5">
                        <span className="text-sm text-gray-600">{contact}</span>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${statusInfo.dot}`} />
                          <span className={`text-xs font-medium ${statusInfo.text}`}>{statusInfo.label}</span>
                        </div>
                      </td>

                      {/* Registered */}
                      <td className="px-4 py-3.5">
                        <span className="text-sm text-gray-500">{regDate}</span>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 text-right pr-6">
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            to={`/students/${student.id}`}
                            className="inline-flex items-center px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
                            title="View details"
                          >
                            <svg className="w-3.5 h-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            View
                          </Link>
                          <button
                            onClick={() => handleToggleStudentStatus(student)}
                            className={`inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                              student.is_active
                                ? 'text-amber-700 hover:bg-amber-50'
                                : 'text-emerald-700 hover:bg-emerald-50'
                            }`}
                            title={student.is_active ? 'Deactivate student' : 'Activate student'}
                          >
                            {student.is_active ? 'Deactivate' : 'Activate'}
                          </button>
                          <button
                            onClick={() => handleDeleteStudent(student)}
                            className="inline-flex items-center px-2.5 py-1 text-xs font-medium text-red-500 hover:bg-red-50 rounded-md transition-colors"
                            title="Delete student"
                          >
                            <svg className="w-3.5 h-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Delete
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

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmState.isOpen}
        onClose={handleCancel}
        onConfirm={handleConfirm}
        title={confirmState.title}
        message={confirmState.message}
        confirmText={confirmState.confirmText}
        cancelText={confirmState.cancelText}
        variant={confirmState.variant}
      />
    </div>
  );
}
