/**
 * Finance Overview & Billing Page — Figma Redesign
 * 100% Dynamic - Zero Hardcoded Values
 */

import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { invoiceService } from '../services/billingService';
import { reportService } from '../services/reportService';
import { useInvoices, useMyInvoices, usePayments, useMyPayments } from '../hooks/queries';
import { PaymentModal } from '../components/PaymentModal';
import type { InvoiceListItem, PaymentListItem } from '../types/billing';
import toast from 'react-hot-toast';

export default function BillingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const isStudent = user?.role === 'student';
  const isStaff = user?.is_staff_role ?? ['super_admin', 'manager', 'finance', 'student_officer', 'it_admin'].includes(user?.role ?? '');

  // Finance Overview Dashboard State
  const [overviewData, setOverviewData] = useState<{
    session_label: string;
    expected_revenue: number;
    collected: number;
    outstanding: number;
    overdue: number;
    overdue_count: number;
    collection_rate: number;
    pending_verification: {
      count: number;
      latest: { id: string; student_name: string; amount: number } | null;
    };
    outstanding_by_student: Array<{
      id: string;
      student_name: string;
      invoice_number: string;
      level_name: string;
      amount: number;
      status: string;
    }>;
    recent_transactions: Array<{
      id: string;
      student_name: string;
      payment_reference: string;
      date: string;
      amount: number;
      status: string;
      method: string;
    }>;
  } | null>(null);

  const [loadingOverview, setLoadingOverview] = useState(false);
  const [generatingReport, setGeneratingReport] = useState(false);

  // Student Billing View State
  const [selectedTab, setSelectedTab] = useState<'invoices' | 'payments'>('invoices');
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceListItem | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const myInvoicesQuery = useMyInvoices();
  const invoicesQuery = useInvoices();
  const myPaymentsQuery = useMyPayments();
  const paymentsQuery = usePayments();

  const { data: invoicesData = [], isLoading: invoicesLoading } = isStudent ? myInvoicesQuery : invoicesQuery;
  const { data: paymentsData = [], isLoading: paymentsLoading } = isStudent ? myPaymentsQuery : paymentsQuery;

  const invoices = Array.isArray(invoicesData) ? (invoicesData as InvoiceListItem[]) : [];
  const payments = Array.isArray(paymentsData) ? (paymentsData as PaymentListItem[]) : [];
  const isLoadingData = invoicesLoading || paymentsLoading;

  // Fetch Finance Overview Data for Staff
  useEffect(() => {
    async function loadOverview() {
      if (!isStaff) return;
      setLoadingOverview(true);
      try {
        const data = await invoiceService.getOverview();
        setOverviewData(data);
      } catch (err) {
        console.error('Failed to load financial overview:', err);
        toast.error('Failed to load financial overview');
      } finally {
        setLoadingOverview(false);
      }
    }
    loadOverview();
  }, [isStaff]);

  // Handle Report Generation
  const handleGenerateReport = async () => {
    setGeneratingReport(true);
    try {
      await reportService.exportFinancialSummary('pdf');
      toast.success('Financial report generated successfully!');
    } catch (err) {
      console.error('Report generation error:', err);
      // Fallback redirect to reports page
      navigate('/reports');
    } finally {
      setGeneratingReport(false);
    }
  };

  const formatMoney = (amount: number) => {
    return '₦' + Number(amount || 0).toLocaleString('en-NG', { maximumFractionDigits: 0 });
  };

  // If Student, render Student Billing View
  if (isStudent) {
    const totalInvoiced = invoices.reduce((sum, inv) => sum + Number(inv.total_amount || 0), 0);
    const totalPaid = invoices.reduce((sum, inv) => sum + Number(inv.amount_paid || 0), 0);
    const balance = totalInvoiced - totalPaid;

    if (isLoadingData) {
      return (
        <div className="max-w-7xl mx-auto flex justify-center items-center py-16">
          <div className="animate-spin w-8 h-8 border-4 border-accent-teal border-t-transparent rounded-full" />
        </div>
      );
    }

    return (
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Billing & Invoices</h1>
          <p className="text-sm text-slate-500 font-medium mt-1">View your tuition invoices and payment history</p>
        </div>

        {/* Student Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">TOTAL INVOICED</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{formatMoney(totalInvoiced)}</p>
          </div>
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">TOTAL PAID</p>
            <p className="text-2xl font-bold text-emerald-600 mt-1">{formatMoney(totalPaid)}</p>
          </div>
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">OUTSTANDING BALANCE</p>
            <p className={`text-2xl font-bold mt-1 ${balance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
              {formatMoney(balance)}
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="border-b border-gray-200 overflow-x-auto">
          <nav className="flex space-x-6 sm:space-x-8 min-w-max">
            <button
              onClick={() => setSelectedTab('invoices')}
              className={`pb-3 text-sm font-semibold border-b-2 transition-colors ${
                selectedTab === 'invoices'
                  ? 'border-accent-teal text-slate-900'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              Invoices ({invoices.length})
            </button>
            <button
              onClick={() => setSelectedTab('payments')}
              className={`pb-3 text-sm font-semibold border-b-2 transition-colors ${
                selectedTab === 'payments'
                  ? 'border-accent-teal text-slate-900'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              Payment History ({payments.length})
            </button>
          </nav>
        </div>

        {/* Invoices List */}
        {selectedTab === 'invoices' ? (
          <>
            {/* Desktop Table View (>= 768px) */}
            <div className="hidden md:block bg-white rounded-xl border border-slate-200 shadow-sm overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[750px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs font-semibold uppercase tracking-wider">
                    <th className="py-3.5 px-4 whitespace-nowrap">Invoice #</th>
                    <th className="py-3.5 px-4 whitespace-nowrap">Date</th>
                    <th className="py-3.5 px-4 whitespace-nowrap">Due Date</th>
                    <th className="py-3.5 px-4 whitespace-nowrap">Amount</th>
                    <th className="py-3.5 px-4 whitespace-nowrap">Paid</th>
                    <th className="py-3.5 px-4 whitespace-nowrap">Balance</th>
                    <th className="py-3.5 px-4 whitespace-nowrap">Status</th>
                    <th className="py-3.5 px-4 text-right pr-6 whitespace-nowrap">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-sm">
                  {invoices.length > 0 ? (
                    invoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3.5 px-4 font-semibold text-slate-900 whitespace-nowrap">
                          <Link to={`/billing/invoice/${inv.id}`} className="hover:underline text-blue-600 font-mono">
                            {inv.invoice_number}
                          </Link>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">{new Date(inv.created_at).toLocaleDateString('en-GB')}</td>
                        <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">{new Date(inv.due_date).toLocaleDateString('en-GB')}</td>
                        <td className="py-3.5 px-4 font-bold text-slate-900 whitespace-nowrap">{formatMoney(Number(inv.total_amount))}</td>
                        <td className="py-3.5 px-4 font-semibold text-emerald-600 whitespace-nowrap">{formatMoney(Number(inv.amount_paid))}</td>
                        <td className="py-3.5 px-4 font-semibold text-rose-600 whitespace-nowrap">{formatMoney(Number(inv.balance || 0))}</td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                            {inv.status_display}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right pr-6 whitespace-nowrap">
                          <div className="flex items-center justify-end gap-2">
                            {Number(inv.balance || 0) > 0 && (
                              <button
                                onClick={() => {
                                  setSelectedInvoice(inv);
                                  setIsPaymentModalOpen(true);
                                }}
                                className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded-md transition-colors"
                              >
                                Pay
                              </button>
                            )}
                            <button
                              onClick={() => navigate(`/billing/invoice/${inv.id}`)}
                              className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-md transition-colors"
                            >
                              View
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-500 text-sm italic">
                        No invoices found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View (< 768px) */}
            <div className="block md:hidden space-y-3">
              {invoices.length > 0 ? (
                invoices.map((inv) => (
                  <div key={inv.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <Link to={`/billing/invoice/${inv.id}`} className="text-sm font-bold text-blue-600 font-mono hover:underline">
                          {inv.invoice_number}
                        </Link>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Issued: {new Date(inv.created_at).toLocaleDateString('en-GB')}
                        </p>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                        {inv.status_display}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      <div>
                        <span className="text-slate-400 block font-medium">Due Date</span>
                        <span className="text-slate-800 font-semibold">{new Date(inv.due_date).toLocaleDateString('en-GB')}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-medium">Total Amount</span>
                        <span className="text-slate-900 font-bold">{formatMoney(Number(inv.total_amount))}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-medium">Paid</span>
                        <span className="text-emerald-600 font-semibold">{formatMoney(Number(inv.amount_paid))}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-medium">Balance</span>
                        <span className="text-rose-600 font-bold">{formatMoney(Number(inv.balance || 0))}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      {Number(inv.balance || 0) > 0 && (
                        <button
                          onClick={() => {
                            setSelectedInvoice(inv);
                            setIsPaymentModalOpen(true);
                          }}
                          className="flex-1 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded-lg transition-colors text-center"
                        >
                          Pay Now
                        </button>
                      )}
                      <button
                        onClick={() => navigate(`/billing/invoice/${inv.id}`)}
                        className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg transition-colors text-center"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="bg-white p-8 rounded-xl border border-slate-200 text-center text-slate-500 text-sm italic">
                  No invoices found.
                </div>
              )}
            </div>
          </>
        ) : (
          /* Payments List */
          <>
            {/* Desktop Table View (>= 768px) */}
            <div className="hidden md:block bg-white rounded-xl border border-slate-200 shadow-sm overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[550px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs font-semibold uppercase tracking-wider">
                    <th className="py-3.5 px-4 whitespace-nowrap">Reference</th>
                    <th className="py-3.5 px-4 whitespace-nowrap">Date</th>
                    <th className="py-3.5 px-4 whitespace-nowrap">Amount</th>
                    <th className="py-3.5 px-4 whitespace-nowrap">Method</th>
                    <th className="py-3.5 px-4 whitespace-nowrap">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-sm">
                  {payments.length > 0 ? (
                    payments.map((pay) => (
                      <tr key={pay.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3.5 px-4 font-semibold text-slate-900 whitespace-nowrap font-mono">{pay.provider_reference || pay.id.substring(0, 8)}</td>
                        <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">{new Date(pay.transaction_date).toLocaleDateString('en-GB')}</td>
                        <td className="py-3.5 px-4 font-bold text-emerald-600 whitespace-nowrap">{formatMoney(Number(pay.amount))}</td>
                        <td className="py-3.5 px-4 text-slate-700 whitespace-nowrap">{pay.method_display}</td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {pay.status_display}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-500 text-sm italic">
                        No payment records found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View (< 768px) */}
            <div className="block md:hidden space-y-3">
              {payments.length > 0 ? (
                payments.map((pay) => (
                  <div key={pay.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs text-slate-400 font-medium">Reference</p>
                        <p className="text-sm font-bold text-slate-900 font-mono">{pay.provider_reference || pay.id.substring(0, 8)}</p>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {pay.status_display}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs pt-1 border-t border-slate-100">
                      <span className="text-slate-500">{new Date(pay.transaction_date).toLocaleDateString('en-GB')} ({pay.method_display})</span>
                      <span className="text-sm font-bold text-emerald-600">{formatMoney(Number(pay.amount))}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="bg-white p-8 rounded-xl border border-slate-200 text-center text-slate-500 text-sm italic">
                  No payment records found.
                </div>
              )}
            </div>
          </>
        )}

        {/* Payment Modal */}
        <PaymentModal
          isOpen={isPaymentModalOpen}
          onClose={() => {
            setIsPaymentModalOpen(false);
            setSelectedInvoice(null);
          }}
          invoice={selectedInvoice}
        />
      </div>
    );
  }

  // Staff / Admin Finance Overview View (Matching Figma Design)
  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* ── Page Header matching Figma ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Finance Overview</h1>
          <p className="text-sm text-slate-500 font-medium mt-0.5">
            {overviewData ? overviewData.session_label : 'Loading session data...'}
          </p>
        </div>
        <div>
          <button
            onClick={handleGenerateReport}
            disabled={generatingReport}
            className="inline-flex items-center gap-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-medium text-sm px-4 py-2 rounded-lg shadow-sm transition-all disabled:opacity-50"
          >
            <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            {generatingReport ? 'Generating...' : 'Generate Report'}
          </button>
        </div>
      </div>

      {loadingOverview ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin w-8 h-8 border-4 border-accent-teal border-t-transparent rounded-full" />
        </div>
      ) : (
        <>
          {/* ── Top 4 Stat Cards Row matching Figma ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* EXPECTED REVENUE */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-2">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">EXPECTED REVENUE</p>
              <p className="text-3xl font-bold text-slate-900">
                {formatMoney(overviewData?.expected_revenue || 0)}
              </p>
            </div>

            {/* COLLECTED */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-1">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">COLLECTED</p>
              <p className="text-3xl font-bold text-slate-900">
                {formatMoney(overviewData?.collected || 0)}
              </p>
              <p className="text-xs text-slate-500 font-medium">
                {overviewData?.collection_rate || 0}% collection rate
              </p>
            </div>

            {/* OUTSTANDING */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-2">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">OUTSTANDING</p>
              <p className="text-3xl font-bold text-slate-900">
                {formatMoney(overviewData?.outstanding || 0)}
              </p>
            </div>

            {/* OVERDUE */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-1">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">OVERDUE</p>
              <p className="text-3xl font-bold text-slate-900">
                {formatMoney(overviewData?.overdue || 0)}
              </p>
              <p className="text-xs text-slate-500 font-medium">
                {overviewData?.overdue_count || 0} invoice{overviewData?.overdue_count === 1 ? '' : 's'}
              </p>
            </div>
          </div>

          {/* ── Pending Verification Alert Banner matching Figma ── */}
          {overviewData?.pending_verification && overviewData.pending_verification.count > 0 && (
            <div className="bg-amber-50/70 border border-amber-200/60 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-full bg-amber-100/80 text-amber-600 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">
                    {overviewData.pending_verification.count} payment{overviewData.pending_verification.count > 1 ? 's' : ''} awaiting verification
                  </p>
                  {overviewData.pending_verification.latest && (
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      {overviewData.pending_verification.latest.student_name}: {formatMoney(overviewData.pending_verification.latest.amount)}
                    </p>
                  )}
                </div>
              </div>

              <button
                onClick={() => navigate('/payments')}
                className="bg-[#0f172a] hover:bg-slate-800 text-white font-medium text-xs px-4 py-2.5 rounded-lg shadow-sm transition-all flex-shrink-0"
              >
                Verify Now
              </button>
            </div>
          )}

          {/* ── Two-Column Bottom Grid matching Figma ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Column 1: Outstanding by Student */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Outstanding by Student</h3>
                  <p className="text-xs text-slate-500">Ranked highest to lowest</p>
                </div>
                <button
                  onClick={() => navigate('/invoices')}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
                >
                  View invoices
                </button>
              </div>

              <div className="space-y-3">
                {overviewData?.outstanding_by_student && overviewData.outstanding_by_student.length > 0 ? (
                  overviewData.outstanding_by_student.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3.5 rounded-lg hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100"
                    >
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{item.student_name}</p>
                        <p className="text-xs text-slate-400 font-medium mt-0.5">
                          {item.level_name} · {item.invoice_number}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-rose-600">{formatMoney(item.amount)}</p>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-100 mt-0.5">
                          ● {item.status}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 italic py-6 text-center">No outstanding student balances found.</p>
                )}
              </div>
            </div>

            {/* Column 2: Recent Transactions */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900">Recent Transactions</h3>
                <button
                  onClick={() => navigate('/payments')}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
                >
                  View all
                </button>
              </div>

              <div className="space-y-3">
                {overviewData?.recent_transactions && overviewData.recent_transactions.length > 0 ? (
                  overviewData.recent_transactions.map((tx) => (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between p-3.5 rounded-lg hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100"
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="w-9 h-9 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{tx.student_name}</p>
                          <p className="text-xs text-slate-400 font-medium mt-0.5">
                            {tx.payment_reference} · {tx.date}
                          </p>
                        </div>
                      </div>
                      <span className="text-sm font-bold text-emerald-600">{formatMoney(tx.amount)}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 italic py-6 text-center">No recent transactions recorded.</p>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
