/**
 * Student Dashboard Page — Figma Design
 * Matches exact layout and visual design from Figma mockup
 */

import React, { useMemo } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { Video, Zap, Calendar, ArrowRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useMyInvoices } from '../hooks/queries/useBilling';
import { useMyEnrollments } from '../hooks/queries/useEnrollments';
import { useVirtualClasses } from '../hooks/queries/useClassroom';
import type { Invoice } from '../types/billing';
import type { Enrollment } from '../types/enrollment';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: invoicesData = [], isLoading: invoicesLoading } = useMyInvoices();
  const { data: enrollmentsData = [], isLoading: enrollmentsLoading } = useMyEnrollments();
  const { data: virtualClasses = [] } = useVirtualClasses();

  const liveClasses = useMemo(
    () => virtualClasses.filter((c) => c.status === 'LIVE' || c.status === 'LOBBY'),
    [virtualClasses]
  );
  const upcomingClasses = useMemo(
    () => virtualClasses.filter((c) => c.status === 'SCHEDULED'),
    [virtualClasses]
  );

  const loading = invoicesLoading || enrollmentsLoading;
  const invoices = Array.isArray(invoicesData) ? (invoicesData as Invoice[]) : [];
  const enrollments = Array.isArray(enrollmentsData) ? (enrollmentsData as Enrollment[]) : [];

  if (!user) return null;
  if (user.is_staff_role) {
    return <Navigate to="/admin" replace />;
  }

  // Name calculation
  const firstName =
    user.profile?.first_name ||
    user.first_name ||
    (user.email ? user.email.split('@')[0] : 'Adaeze');
  const capitalizedFirstName =
    firstName.charAt(0).toUpperCase() + firstName.slice(1);

  // Time of day greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  // Derive Invoice / Payment Metrics
  const activeInvoice = invoices[0];
  const totalFeesNum = activeInvoice ? parseFloat(String(activeInvoice.total_amount || '0')) : 0;
  const amountPaidNum = activeInvoice ? parseFloat(String(activeInvoice.amount_paid || '0')) : 0;
  const balanceDueNum = activeInvoice ? parseFloat(String(activeInvoice.balance ?? (totalFeesNum - amountPaidNum))) : 0;

  const invoiceStatusDisplay = activeInvoice ? activeInvoice.status_display || activeInvoice.status.replace('_', ' ') : 'No Active Invoice';
  const invoiceCodeDisplay = activeInvoice ? activeInvoice.invoice_number : 'N/A';
  const dueDateDisplay = activeInvoice && activeInvoice.due_date
    ? new Date(activeInvoice.due_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    : 'N/A';

  const formatCurrency = (val: number) => {
    return `₦${val.toLocaleString('en-NG', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })}`;
  };

  const paymentPercentage = totalFeesNum > 0 ? Math.round((amountPaidNum / totalFeesNum) * 100) : 0;

  // Derive Enrollment Details
  const activeEnrollment = enrollments[0];
  const sessionLabel = activeEnrollment?.session_label || 'Not Enrolled';
  const levelName = activeEnrollment?.level_name || 'Not Enrolled';

  const enrolledCoursesList =
    activeEnrollment && activeEnrollment.courses && activeEnrollment.courses.length > 0
      ? activeEnrollment.courses.map((c) => `${c.course_name} (${c.course_code})`)
      : [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* ── Greeting Header ── */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          {getGreeting()}, {capitalizedFirstName}
        </h1>
        <p className="text-sm text-slate-500 mt-1">Your ICAN tutorial portal</p>
      </div>

      {/* ── Top Stat Cards (4 Columns) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: TOTAL FEES */}
        <div className="bg-white rounded-xl shadow-sm px-5 py-5 flex flex-col justify-center border border-slate-200/80 hover:shadow-md transition-shadow">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
            TOTAL FEES
          </span>
          <span className="text-[1.75rem] font-bold text-gray-900 tabular-nums leading-none mb-1">
            {formatCurrency(totalFeesNum)}
          </span>
        </div>

        {/* Card 2: AMOUNT PAID */}
        <div className="bg-white rounded-xl shadow-sm px-5 py-5 flex flex-col justify-center border border-slate-200/80 hover:shadow-md transition-shadow">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
            AMOUNT PAID
          </span>
          <span className="text-[1.75rem] font-bold text-gray-900 tabular-nums leading-none mb-1">
            {formatCurrency(amountPaidNum)}
          </span>
        </div>

        {/* Card 3: BALANCE DUE */}
        <div className="bg-white rounded-xl shadow-sm px-5 py-5 flex flex-col justify-center border border-slate-200/80 hover:shadow-md transition-shadow">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
            BALANCE DUE
          </span>
          <span className="text-[1.75rem] font-bold text-gray-900 tabular-nums leading-none mb-1">
            {formatCurrency(balanceDueNum)}
          </span>
        </div>

        {/* Card 4: INVOICE STATUS */}
        <div className="bg-white rounded-xl shadow-sm px-5 py-5 flex flex-col justify-center border border-slate-200/80 hover:shadow-md transition-shadow">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
            INVOICE STATUS
          </span>
          <span className="text-[1.75rem] font-bold text-gray-900 tabular-nums leading-none mb-1 capitalize">
            {invoiceStatusDisplay}
          </span>
          <span className="text-xs text-gray-400 mt-1">
            {invoiceCodeDisplay}
          </span>
        </div>
      </div>

      {/* ── Virtual Classroom Live / Upcoming Banner ── */}
      {liveClasses.length > 0 ? (
        <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-900 rounded-2xl p-6 text-white shadow-lg border border-emerald-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 animate-pulse">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                LIVE CLASS IN PROGRESS
              </span>
              <span className="text-xs text-slate-300 font-semibold">{liveClasses[0].course_code}</span>
            </div>
            <h2 className="text-xl font-extrabold text-white tracking-tight">{liveClasses[0].title}</h2>
            <p className="text-xs text-slate-300">
              Instructor: <span className="font-semibold text-white">{liveClasses[0].instructor_name}</span> • {liveClasses[0].course_name}
            </p>
          </div>

          <button
            onClick={() => navigate(`/classrooms/${liveClasses[0].id}/lobby`)}
            className="inline-flex items-center gap-2 px-5 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all cursor-pointer flex-shrink-0"
          >
            <Video className="w-4 h-4" />
            <span>Join Live Room Now</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      ) : upcomingClasses.length > 0 ? (
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 flex-shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Next Scheduled Live Class</span>
                <span className="text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-600 font-semibold">{upcomingClasses[0].course_code}</span>
              </div>
              <h3 className="text-sm font-bold text-slate-900">{upcomingClasses[0].title}</h3>
              <p className="text-xs text-slate-500">
                {new Date(upcomingClasses[0].scheduled_start).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })} at{' '}
                {new Date(upcomingClasses[0].scheduled_start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>

          <button
            onClick={() => navigate('/classrooms')}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl transition-all cursor-pointer flex-shrink-0"
          >
            <span>View Virtual Classroom</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : null}

      {/* ── Main Content Section: 2 Columns ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Current Enrollment */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 mb-5">
              Current Enrollment
            </h2>

            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm py-1 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Session</span>
                <span className="text-slate-900 font-semibold">{sessionLabel}</span>
              </div>
              <div className="flex justify-between items-center text-sm py-1">
                <span className="text-slate-500 font-medium">Level</span>
                <span className="text-slate-900 font-semibold">{levelName}</span>
              </div>
            </div>

            <div className="mt-7">
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-3">
                Enrolled Courses
              </p>
              <ul className="space-y-2.5">
                {enrolledCoursesList.length > 0 ? (
                  enrolledCoursesList.map((course, idx) => (
                    <li
                      key={idx}
                      className="flex items-center text-sm font-medium text-slate-700"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-800 mr-2.5 flex-shrink-0" />
                      <span>{course}</span>
                    </li>
                  ))
                ) : (
                  <li className="text-sm italic text-slate-500">No enrolled courses found</li>
                )}
              </ul>
            </div>
          </div>
        </div>

        {/* Right Column: Payment Progress */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 mb-4">
              Payment Progress
            </h2>

            <div className="flex justify-between items-center text-xs font-medium text-slate-500 mb-2">
              <span>Paid vs. Total</span>
              <span className="text-sm font-bold text-slate-900">
                {paymentPercentage}%
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden mb-6">
              <div
                className="bg-[#1e3a5f] h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(0, paymentPercentage))}%` }}
              />
            </div>

            {/* Outstanding Balance Banner */}
            <div className="bg-[#fffdf0] border border-[#fef08a] rounded-xl p-5 mb-6">
              <p className="text-sm font-semibold text-amber-700">
                Outstanding Balance
              </p>
              <p className="text-[1.75rem] font-bold text-amber-600 tabular-nums leading-none my-2.5">
                {formatCurrency(balanceDueNum)}
              </p>
              <p className="text-xs font-medium text-amber-600/80 mt-1">
                Due by {dueDateDisplay}
              </p>
            </div>
          </div>

          {/* Make Payment Action Button */}
          <button
            onClick={() => {
              if (activeInvoice?.id) {
                navigate(`/billing/invoice/${activeInvoice.id}`);
              } else {
                navigate('/billing');
              }
            }}
            className="w-full bg-[#1e3a5f] hover:bg-[#162a45] text-white font-semibold text-sm py-3 px-4 rounded-xl text-center shadow-sm transition-colors duration-200 block cursor-pointer"
          >
            Make Payment
          </button>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
