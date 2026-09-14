/**
 * Payments Page — Figma Design
 * List, search, filter, verify, and export payments
 */

import { useState, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { usePayments, useCreateManualPayment, useVerifyPayment, useStudents } from '../hooks/queries';
import type { PaymentListItem, PaymentMethod, PaymentStatus } from '../types/billing';
import { StatCardSkeleton, TableSkeleton } from '../components/LoadingSkeleton';
import { ButtonWithLoading } from '../components/LoadingSpinner';
import { showToast } from '../lib/toast';
import { reportService } from '../services/reportService';

function formatNaira(amount: number | string): string {
  const num = typeof amount === 'number' ? amount : parseFloat(amount || '0');
  return `₦${num.toLocaleString('en-NG', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function getMethodLabel(method: string) {
  const m = (method || '').toLowerCase();
  if (m.includes('paystack') || m.includes('online')) return { label: 'Online', sub: 'Paystack' };
  if (m.includes('bank')) return { label: 'Bank Transfer', sub: 'Manual' };
  if (m.includes('cash')) return { label: 'Cash', sub: 'Over the counter' };
  if (m.includes('pos')) return { label: 'POS Terminal', sub: 'Card' };
  return { label: method || 'Other', sub: '' };
}

function getStatusBadge(status: PaymentStatus | string) {
  const s = (status || '').toLowerCase();
  switch (s) {
    case 'successful':
      return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">Successful</span>;
    case 'pending':
      return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">Pending</span>;
    case 'failed':
      return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800">Failed</span>;
    default:
      return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 capitalize">{status || 'Pending'}</span>;
  }
}

export default function PaymentsPage() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [methodFilter, setMethodFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);

  // Manual payment form state
  const [formData, setFormData] = useState({
    student: '',
    amount: '',
    method: 'bank_transfer' as Exclude<PaymentMethod, 'paystack'>,
    notes: '',
  });

  const [displayAmount, setDisplayAmount] = useState('');

  // Number formatting helpers for payment amount
  const formatNumberWithCommas = (val: string) => {
    const cleanVal = val.replace(/[^0-9.]/g, '');
    const parts = cleanVal.split('.');
    if (parts.length > 2) {
      parts[1] = parts.slice(1).join('');
    }
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return parts.join('.');
  };

  const getUnformattedValue = (val: string) => {
    return val.replace(/,/g, '');
  };

  const { data: paymentsData = [], isLoading, refetch } = usePayments();
  const { data: studentsData = [] } = useStudents(undefined, Boolean(user?.is_staff_role));
  const createPaymentMutation = useCreateManualPayment();
  const verifyPaymentMutation = useVerifyPayment();

  const payments = useMemo<PaymentListItem[]>(
    () => (Array.isArray(paymentsData) ? paymentsData : []),
    [paymentsData]
  );

  const students = useMemo(
    () => (Array.isArray(studentsData) ? studentsData : (studentsData as any)?.results || []),
    [studentsData]
  );

  // Stats computation
  const stats = useMemo(() => {
    let totalVerified = 0;
    let onlinePaystack = 0;
    let manualPayments = 0;
    let pendingVerification = 0;

    payments.forEach((p) => {
      const amt = parseFloat(p.amount || '0');
      if (p.status === 'successful') {
        totalVerified += amt;
        const m = (p.method_display || '').toLowerCase();
        if (m.includes('paystack') || m.includes('online')) {
          onlinePaystack += amt;
        } else {
          manualPayments += amt;
        }
      }
      if (p.status === 'pending') {
        pendingVerification++;
      }
    });

    return {
      totalVerified,
      onlinePaystack,
      manualPayments,
      pendingVerification,
    };
  }, [payments]);

  // Filtered payments
  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      const matchesSearch =
        !searchTerm ||
        p.provider_reference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.student_name?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesMethod = methodFilter === 'all';
      const matchesStatus = statusFilter === 'all' || p.status === statusFilter;

      return matchesSearch && matchesMethod && matchesStatus;
    });
  }, [payments, searchTerm, methodFilter, statusFilter]);

  const [exportingPDF, setExportingPDF] = useState(false);

  const handleExportPDF = async () => {
    if (payments.length === 0) {
      showToast.error('No payment transactions to export');
      return;
    }
    setExportingPDF(true);
    const toastId = showToast.loading('Generating Payments PDF report...');
    try {
      let blob: Blob;
      let filename = `payments_report_${new Date().toISOString().slice(0, 10)}.pdf`;
      try {
        blob = await reportService.exportPaymentReport('pdf');
      } catch (apiErr: any) {
        console.warn('Backend payment report endpoint unavailable, using client-side data export:', apiErr);
        const headers = ['Reference', 'Student', 'Date', 'Method', 'Amount', 'Status'];
        const rows = payments.map((p) => [
          p.provider_reference || p.id,
          `"${p.student_name || ''}"`,
          p.transaction_date ? new Date(p.transaction_date).toLocaleDateString() : '',
          p.method_display,
          p.amount,
          p.status,
        ]);
        const csvContent = '\ufeff' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
        blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        filename = `payments_report_${new Date().toISOString().slice(0, 10)}.csv`;
      }

      reportService.downloadBlob(blob, filename);
      showToast.dismiss(toastId);
      showToast.success(`Report downloaded: ${filename}`);
    } catch (err: any) {
      showToast.dismiss(toastId);
      console.error('PDF export error:', err);
      let errorMsg = 'Failed to export Payments PDF';
      if (err?.response?.data instanceof Blob) {
        try {
          const text = await err.response.data.text();
          const json = JSON.parse(text);
          if (json.error || json.detail) {
            errorMsg = json.error || json.detail;
          }
        } catch {
          // fallback
        }
      } else if (err?.response?.data?.error || err?.response?.data?.detail) {
        errorMsg = err.response.data.error || err.response.data.detail;
      }
      showToast.error(errorMsg);
    } finally {
      setExportingPDF(false);
    }
  };

  const handleRecordPaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.student) {
      showToast.error('Please select a student');
      return;
    }
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      showToast.error('Please enter a valid payment amount');
      return;
    }

    createPaymentMutation.mutate(
      {
        data: {
          student: formData.student,
          amount: parseFloat(formData.amount),
          method: formData.method,
          notes: formData.notes,
        },
      },
      {
        onSuccess: () => {
          setShowModal(false);
          setFormData({ student: '', amount: '', method: 'bank_transfer', notes: '' });
          setDisplayAmount('');
          refetch();
        },
      }
    );
  };

  const handleVerifyPayment = (id: string) => {
    verifyPaymentMutation.mutate(
      {
        id,
        data: { verify: true } as any,
      },
      {
        onSuccess: () => {
          refetch();
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Payments</h1>
          <p className="mt-1 text-sm text-slate-500">Loading payments list...</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
        </div>
        <TableSkeleton rows={8} columns={8} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Payments</h1>
          <p className="mt-1 text-sm text-slate-500">
            {payments.length} transactions recorded
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleExportPDF}
            disabled={exportingPDF}
            className="px-4 py-2.5 bg-white border border-slate-200 text-slate-700 font-semibold text-sm rounded-lg hover:bg-slate-50 transition-colors shadow-sm cursor-pointer disabled:opacity-50"
          >
            Export PDF
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2.5 bg-slate-900 text-white font-semibold text-sm rounded-lg hover:bg-slate-800 transition-colors shadow-sm cursor-pointer"
          >
            + Record Payment
          </button>
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="text-xs font-semibold tracking-wider text-slate-500 uppercase">
            TOTAL VERIFIED
          </div>
          <div className="text-2xl font-extrabold text-slate-900 mt-2">
            {formatNaira(stats.totalVerified)}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="text-xs font-semibold tracking-wider text-slate-500 uppercase">
            ONLINE (PAYSTACK)
          </div>
          <div className="text-2xl font-extrabold text-slate-900 mt-2">
            {formatNaira(stats.onlinePaystack)}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="text-xs font-semibold tracking-wider text-slate-500 uppercase">
            MANUAL PAYMENTS
          </div>
          <div className="text-2xl font-extrabold text-slate-900 mt-2">
            {formatNaira(stats.manualPayments)}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="text-xs font-semibold tracking-wider text-slate-500 uppercase">
            PENDING VERIFICATION
          </div>
          <div className="text-2xl font-extrabold text-slate-900 mt-2">
            {stats.pendingVerification}
          </div>
          <p className="text-xs text-slate-500 mt-1">Require review</p>
        </div>
      </div>

      {/* Yellow Alert Banner for Pending Payments */}
      {stats.pendingVerification > 0 && (
        <div className="bg-amber-50/80 border border-amber-200/80 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-amber-900 text-sm font-medium">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            {stats.pendingVerification} payment(s) awaiting verification
          </div>
          <button
            onClick={() => setStatusFilter('pending')}
            className="text-xs font-semibold text-amber-900 underline hover:text-amber-800 cursor-pointer"
          >
            Filter to pending
          </button>
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
        <div className="flex flex-col md:flex-row gap-4 justify-between">
          <div className="relative flex-1">
            <svg
              className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search by student, reference, invoice..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900"
            />
          </div>

          <div className="flex gap-3">
            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-slate-900"
            >
              <option value="all">All Methods</option>
              <option value="paystack">Online (Paystack)</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="cash">Cash</option>
              <option value="pos">POS Terminal</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-slate-900"
            >
              <option value="all">All Status</option>
              <option value="successful">Successful</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>
          </div>
        </div>
      </div>

      {filteredPayments.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center text-slate-500">
          No payment transactions found.
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm min-w-[850px]">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-500 tracking-wider uppercase">
                    <th className="py-3.5 px-6 whitespace-nowrap">REFERENCE</th>
                    <th className="py-3.5 px-6 whitespace-nowrap">STUDENT</th>
                    <th className="py-3.5 px-6 whitespace-nowrap">DATE</th>
                    <th className="py-3.5 px-6 whitespace-nowrap">METHOD</th>
                    <th className="py-3.5 px-6 text-right whitespace-nowrap">AMOUNT</th>
                    <th className="py-3.5 px-6 text-center whitespace-nowrap">TXN STATUS</th>
                    <th className="py-3.5 px-6 text-center whitespace-nowrap">VERIFICATION</th>
                    <th className="py-3.5 px-6 whitespace-nowrap">VERIFIED BY</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredPayments.map((p) => {
                    const mInfo = getMethodLabel(p.method_display);
                    const isVerified = p.status === 'successful';

                    return (
                      <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-4 px-6 font-semibold text-slate-900 font-mono text-xs whitespace-nowrap">
                          {p.provider_reference || `PAY-${p.id.slice(0, 8).toUpperCase()}`}
                        </td>
                        <td className="py-4 px-6 whitespace-nowrap">
                          <div className="font-semibold text-slate-900">{p.student_name}</div>
                        </td>
                        <td className="py-4 px-6 text-slate-600 whitespace-nowrap">
                          {p.transaction_date
                            ? new Date(p.transaction_date).toLocaleDateString('en-GB', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                              })
                            : '-'}
                        </td>
                        <td className="py-4 px-6 whitespace-nowrap">
                          <div className="font-medium text-slate-900">{mInfo.label}</div>
                          {mInfo.sub && <div className="text-xs text-slate-400 font-mono">{mInfo.sub}</div>}
                        </td>
                        <td className="py-4 px-6 text-right font-extrabold text-emerald-600 whitespace-nowrap">
                          {formatNaira(p.amount)}
                        </td>
                        <td className="py-4 px-6 text-center whitespace-nowrap">
                          {getStatusBadge(p.status)}
                        </td>
                        <td className="py-4 px-6 text-center whitespace-nowrap">
                          {isVerified ? (
                            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                              Verified
                            </span>
                          ) : (
                            <button
                              onClick={() => handleVerifyPayment(p.id)}
                              disabled={verifyPaymentMutation.isPending}
                              className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 hover:bg-amber-200 text-amber-800 transition-colors cursor-pointer disabled:opacity-50"
                            >
                              Verify Payment
                            </button>
                          )}
                        </td>
                        <td className="py-4 px-6 text-slate-700 text-xs font-medium whitespace-nowrap">
                          {isVerified ? (p.verified_by_name || p.verified_by_email || 'Verified User') : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Cards View */}
          <div className="block md:hidden space-y-3">
            {filteredPayments.map((p) => {
              const mInfo = getMethodLabel(p.method_display);
              const isVerified = p.status === 'successful';

              return (
                <div key={p.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs text-slate-400 font-mono">{p.provider_reference || `PAY-${p.id.slice(0, 8).toUpperCase()}`}</p>
                      <p className="text-sm font-bold text-slate-900 mt-0.5">{p.student_name}</p>
                    </div>
                    {getStatusBadge(p.status)}
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <div>
                      <span className="text-slate-400 block font-medium">Amount</span>
                      <span className="text-emerald-600 font-bold">{formatNaira(p.amount)}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-medium">Method</span>
                      <span className="text-slate-800 font-semibold">{mInfo.label}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-medium">Date</span>
                      <span className="text-slate-700">{p.transaction_date ? new Date(p.transaction_date).toLocaleDateString('en-GB') : '-'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-medium">Verified By</span>
                      <span className="text-slate-700 font-medium">{isVerified ? (p.verified_by_name || 'Verified') : 'Pending'}</span>
                    </div>
                  </div>

                  {!isVerified && (
                    <button
                      onClick={() => handleVerifyPayment(p.id)}
                      disabled={verifyPaymentMutation.isPending}
                      className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold rounded-lg transition-colors text-center shadow-xs cursor-pointer disabled:opacity-50"
                    >
                      Verify Payment
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Record Payment Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-4 sm:p-6 space-y-4 max-h-[90vh] overflow-y-auto min-w-0">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-lg font-bold text-slate-900">Record Manual Payment</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRecordPaymentSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Select Student <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={formData.student}
                  onChange={(e) => setFormData({ ...formData, student: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-slate-900"
                >
                  <option value="">-- Choose Student --</option>
                  {students.map((st: any) => (
                    <option key={st.id} value={st.id}>
                      {st.first_name || st.full_name} {st.last_name || ''} ({st.student_code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Amount (NGN) <span className="text-rose-500">*</span>
                  </label>
                  {formData.amount && parseFloat(formData.amount) > 0 && (
                    <span className="text-xs font-extrabold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200 font-mono">
                      {formatNaira(formData.amount)}
                    </span>
                  )}
                </div>

                <div className="relative rounded-lg shadow-2xs">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500 font-bold text-sm">
                    ₦
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 50,000"
                    value={displayAmount}
                    onChange={(e) => {
                      const raw = e.target.value;
                      const formatted = formatNumberWithCommas(raw);
                      const numeric = getUnformattedValue(formatted);
                      setDisplayAmount(formatted);
                      setFormData({ ...formData, amount: numeric });
                    }}
                    className="w-full pl-8 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-slate-900 focus:border-slate-900 font-mono"
                  />
                </div>

                {/* Quick Select Presets */}
                <div className="flex items-center gap-1.5 mt-2">
                  <span className="text-[11px] text-slate-400 font-medium mr-1">Quick Select:</span>
                  {[5000, 10000, 25000, 50000, 100000].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => {
                        const str = preset.toString();
                        const formatted = formatNumberWithCommas(str);
                        setDisplayAmount(formatted);
                        setFormData({ ...formData, amount: str });
                      }}
                      className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold rounded-md transition-colors cursor-pointer"
                    >
                      +₦{preset >= 1000 ? `${(preset / 1000).toFixed(0)}k` : preset}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Payment Method <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.method}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      method: e.target.value as Exclude<PaymentMethod, 'paystack'>,
                    })
                  }
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-slate-900"
                >
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="cash">Cash</option>
                  <option value="pos">POS Terminal</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Notes / Reference
                </label>
                <textarea
                  rows={3}
                  placeholder="Bank reference, teller number, etc."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <ButtonWithLoading
                  type="submit"
                  loading={createPaymentMutation.isPending}
                  className="flex-1 px-4 py-2.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 text-sm font-semibold transition-colors"
                >
                  Record Payment
                </ButtonWithLoading>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 text-sm font-semibold transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
