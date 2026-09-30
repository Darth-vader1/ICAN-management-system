/**
 * Staff / Manager Enrollment Dashboard — Exact Figma Design
 * Display all student enrollments with search, filtering, status badges, course codes, and invoice links.
 */

import React, { useState, useMemo, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useEnrollments } from '../hooks/queries/useEnrollments';
import { DashboardSkeleton } from '../components/LoadingSkeleton';
import type { EnrollmentListItem } from '../types/enrollment';

// Helper to extract student initials for avatar
function getInitials(name: string): string {
  if (!name) return 'ST';
  const parts = name.trim().split(' ');
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

// Fixed color palette for initials avatar circles matching Figma mockup
const avatarColors = [
  'bg-[#0f172a] text-white', // Navy/Dark slate
  'bg-purple-700 text-white', // Dark Purple
  'bg-amber-600 text-white',  // Warm Orange
  'bg-emerald-700 text-white',// Deep Emerald
  'bg-blue-700 text-white',   // Royal Blue
  'bg-indigo-700 text-white', // Indigo
  'bg-teal-700 text-white',   // Teal
];

function getAvatarColor(index: number): string {
  return avatarColors[index % avatarColors.length];
}

export const StaffEnrollmentDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const { data: enrollmentsData = [], isLoading, error, refetch } = useEnrollments();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('All Levels');
  const [selectedStatus, setSelectedStatus] = useState('All Status');

  const enrollments = Array.isArray(enrollmentsData) ? (enrollmentsData as EnrollmentListItem[]) : [];

  // Filter logic
  const filteredEnrollments = useMemo(() => {
    return enrollments.filter((item) => {
      // Search text match (student name, code, session, level)
      const matchesSearch =
        !searchTerm ||
        item.student_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.student_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.session_label?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.level_name?.toLowerCase().includes(searchTerm.toLowerCase());

      // Level match
      const matchesLevel =
        selectedLevel === 'All Levels' ||
        item.level_name?.toLowerCase() === selectedLevel.toLowerCase();

      // Status match
      const matchesStatus =
        selectedStatus === 'All Status' ||
        item.status?.toLowerCase() === selectedStatus.toLowerCase();

      return matchesSearch && matchesLevel && matchesStatus;
    });
  }, [enrollments, searchTerm, selectedLevel, selectedStatus]);

  // Pagination Logic
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;
  
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedLevel, selectedStatus]);

  const totalPages = Math.ceil(filteredEnrollments.length / ITEMS_PER_PAGE);
  const paginatedEnrollments = filteredEnrollments.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Dynamic session subtitle count
  const activeCount = enrollments.filter((e) => e.status === 'active').length;
  const currentSessionLabel = enrollments[0]?.session_label || 'N/A';

  // Format date helper
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    try {
      return new Date(dateStr).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  // Payment status dot badge generator
  const renderPaymentBadge = (status?: string) => {
    const s = (status || 'unpaid').toLowerCase();
    if (s === 'paid') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          Paid
        </span>
      );
    }
    if (s === 'partially_paid' || s === 'partial') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
          Partial
        </span>
      );
    }
    if (s === 'overdue') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
          Overdue
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
        <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
        Unpaid
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto pb-10">
        <DashboardSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto pb-10">
        <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
          <p className="text-red-700 font-semibold mb-3">Failed to load enrollments data</p>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-[#1e3a5f] text-white text-sm font-semibold rounded-lg hover:bg-[#162a45] transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Enrollments</h1>
          <p className="text-sm text-slate-500 mt-1">
            {activeCount} active enrollment{activeCount !== 1 ? 's' : ''} in {currentSessionLabel}
          </p>
        </div>
        {hasPermission('enrollments.manage') && (
          <Link
            to="/enrollments/new"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#1e3a5f] hover:bg-[#162a45] text-white font-semibold text-sm rounded-lg shadow-sm transition-colors cursor-pointer self-start sm:self-auto"
          >
            <span>+</span>
            <span>New Enrollment</span>
          </Link>
        )}
      </div>

      {/* ── Search & Filter Controls ── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1 w-full">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search student, session, level..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20 focus:border-[#1e3a5f] transition-all"
            />
          </div>

          {/* Filter: Level */}
          <div className="w-full sm:w-44">
            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20 focus:border-[#1e3a5f] transition-all cursor-pointer"
            >
              <option value="All Levels">All Levels</option>
              <option value="Foundation">Foundation</option>
              <option value="Skills">Skills</option>
              <option value="Professional">Professional</option>
            </select>
          </div>

          {/* Filter: Status */}
          <div className="w-full sm:w-44">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20 focus:border-[#1e3a5f] transition-all cursor-pointer"
            >
              <option value="All Status">All Status</option>
              <option value="active">Active</option>
              <option value="draft">Draft</option>
              <option value="completed">Completed</option>
              <option value="withdrawn">Withdrawn</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── Table Container ── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="border-b border-slate-200/80 bg-slate-50/50">
                <th className="py-3.5 px-5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  STUDENT
                </th>
                <th className="py-3.5 px-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  SESSION
                </th>
                <th className="py-3.5 px-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  LEVEL
                </th>
                <th className="py-3.5 px-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  COURSES
                </th>
                <th className="py-3.5 px-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  INVOICE
                </th>
                <th className="py-3.5 px-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  PAYMENT
                </th>
                <th className="py-3.5 px-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  ENROLLED ON
                </th>
                <th className="py-3.5 px-5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  STATUS
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredEnrollments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 text-sm italic">
                    No enrollments found matching your query
                  </td>
                </tr>
              ) : (
                paginatedEnrollments.map((item, idx) => {
                  const initials = getInitials(item.student_name);
                  const avatarBg = getAvatarColor(idx);
                  const coursesList = item.courses || [];
                  const displayedCourses = coursesList.slice(0, 3);
                  const remainingCoursesCount = coursesList.length - 3;

                  return (
                    <tr
                      key={item.id}
                      onClick={() => {
                        if (item.invoice_id) {
                          navigate(`/billing/invoice/${item.invoice_id}`);
                        }
                      }}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                    >
                      {/* STUDENT */}
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-full ${avatarBg} flex items-center justify-center font-bold text-xs flex-shrink-0 shadow-xs`}
                          >
                            {initials}
                          </div>
                          <div>
                            <span className="font-semibold text-slate-900 text-sm block">
                              {item.student_name}
                            </span>
                            {item.student_code && (
                              <span className="text-xs text-slate-400 font-normal">
                                {item.student_code}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* SESSION */}
                      <td className="py-4 px-4 text-sm font-medium text-slate-600 tabular-nums">
                        {item.session_label || 'N/A'}
                      </td>

                      {/* LEVEL */}
                      <td className="py-4 px-4">
                        <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-600 border border-blue-100">
                          {item.level_name}
                        </span>
                      </td>

                      {/* COURSES */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {displayedCourses.length > 0 ? (
                            displayedCourses.map((code, cIdx) => (
                              <span
                                key={cIdx}
                                className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded font-semibold text-xs border border-slate-200/60"
                              >
                                {code}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-slate-400 italic">No courses</span>
                          )}
                          {remainingCoursesCount > 0 && (
                            <span className="px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded font-semibold text-xs border border-slate-200/60">
                              +{remainingCoursesCount}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* INVOICE */}
                      <td className="py-4 px-4">
                        {item.invoice_id ? (
                          <Link
                            to={`/billing/invoice/${item.invoice_id}`}
                            onClick={(e) => e.stopPropagation()}
                            className="text-xs font-mono font-medium text-slate-600 hover:text-[#1e3a5f] hover:underline"
                          >
                            {item.invoice_number || 'INV-2025'}
                          </Link>
                        ) : item.invoice_number ? (
                          <span className="text-xs font-mono font-medium text-slate-600">
                            {item.invoice_number}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400 font-mono">N/A</span>
                        )}
                      </td>

                      {/* PAYMENT */}
                      <td className="py-4 px-4">{renderPaymentBadge(item.payment_status)}</td>

                      {/* ENROLLED ON */}
                      <td className="py-4 px-4 text-sm text-slate-600 font-medium">
                        {formatDate(item.enrollment_date)}
                      </td>

                      {/* STATUS */}
                      <td className="py-4 px-5">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-xs font-semibold capitalize ${
                            item.status === 'active'
                              ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                              : item.status === 'draft'
                              ? 'bg-slate-100 text-slate-600 border border-slate-200'
                              : 'bg-blue-50 text-blue-600 border border-blue-200'
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-white px-4 py-3 border border-slate-200 rounded-xl shadow-sm sm:px-6">
          <div className="flex flex-1 justify-between sm:hidden">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="relative inline-flex items-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="relative ml-3 inline-flex items-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-slate-700">
                Showing <span className="font-medium">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> to{' '}
                <span className="font-medium">
                  {Math.min(currentPage * ITEMS_PER_PAGE, filteredEnrollments.length)}
                </span>{' '}
                of <span className="font-medium">{filteredEnrollments.length}</span> results
              </p>
            </div>
            <div>
              <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center rounded-l-md px-2 py-2 text-slate-400 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                >
                  <span className="sr-only">Previous</span>
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
                  </svg>
                </button>
                <span className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-slate-900 ring-1 ring-inset ring-slate-300 focus:z-20 focus:outline-offset-0">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center rounded-r-md px-2 py-2 text-slate-400 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                >
                  <span className="sr-only">Next</span>
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                  </svg>
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffEnrollmentDashboard;
