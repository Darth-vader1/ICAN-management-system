/**
 * Student Dashboard Page — Figma Design
 * Matches exact layout and visual design from Figma mockup
 */

import React, { useEffect, useState } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { invoiceService } from '../services/billingService';
import { enrollmentService } from '../services/enrollmentService';
import type { Invoice } from '../types/billing';
import type { Enrollment } from '../types/enrollment';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      if (!user || user.is_staff_role) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const [invRes, enrRes] = await Promise.allSettled([
          invoiceService.getMyInvoices(),
          enrollmentService.getMyEnrollments(),
        ]);

        if (invRes.status === 'fulfilled' && Array.isArray(invRes.value)) {
          setInvoices(invRes.value);
        }
        if (enrRes.status === 'fulfilled' && Array.isArray(enrRes.value)) {
          setEnrollments(enrRes.value);
        }
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

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
  const totalFeesNum = activeInvoice ? parseFloat(activeInvoice.total_amount || '0') : 0;
  const amountPaidNum = activeInvoice ? parseFloat(activeInvoice.amount_paid || '0') : 0;
  const balanceDueNum = activeInvoice ? parseFloat(activeInvoice.balance || '0') : 0;

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
          <Link
            to="/billing"
            className="w-full bg-[#1e3a5f] hover:bg-[#162a45] text-white font-semibold text-sm py-3 px-4 rounded-xl text-center shadow-sm transition-colors duration-200 block"
          >
            Make Payment
          </Link>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
