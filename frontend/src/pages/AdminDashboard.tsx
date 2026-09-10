/**
 * Admin Dashboard Page — Figma Design
 * Rich analytics dashboard with stat cards, progress bar,
 * charts, overdue invoices, recent payments, and quick actions.
 */

import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { DashboardSkeleton } from '../components/LoadingSkeleton';
import { showToast } from '../lib/toast';
import api from '../lib/api';
import StatCard from '../components/dashboard/StatCard';
import ProgressBar from '../components/dashboard/ProgressBar';
import QuickActions from '../components/dashboard/QuickActions';
import CollectionChart from '../components/charts/CollectionChart';

interface DashboardData {
  students: any[];
  enrollments: any[];
  invoices: any[];
  payments: any[];
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string>('');

  const displayName = user?.profile?.first_name || user?.email?.split('@')[0] || 'User';

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError('');
    try {
      const [students, enrollments, invoices, payments] = await Promise.all([
        api.get('/students/').catch(() => ({ data: { results: [] } })),
        api.get('/enrollments/').catch(() => ({ data: { results: [] } })),
        api.get('/billing/invoices/').catch(() => ({ data: { results: [] } })),
        api.get('/billing/payments/').catch(() => ({ data: { results: [] } })),
      ]);

      setData({
        students: Array.isArray(students.data) ? students.data : students.data.results || [],
        enrollments: Array.isArray(enrollments.data) ? enrollments.data : enrollments.data.results || [],
        invoices: Array.isArray(invoices.data) ? invoices.data : invoices.data.results || [],
        payments: Array.isArray(payments.data) ? payments.data : payments.data.results || [],
      });
    } catch (err: any) {
      console.error('Failed to fetch dashboard data:', err);
      setError('Failed to load dashboard data');
      showToast.apiError(err);
    } finally {
      setLoading(false);
    }
  };

  // Computed statistics
  const stats = useMemo(() => {
    if (!data) return null;

    const totalStudents = data.students.length;
    const activeStudents = data.students.filter((s: any) => s.status === 'active' || !s.status).length;

    const totalInvoiced = data.invoices.reduce(
      (sum: number, inv: any) => sum + Number(inv.total_amount || inv.amount || 0), 0
    );
    const totalCollected = data.invoices.reduce(
      (sum: number, inv: any) => sum + Number(inv.amount_paid || 0), 0
    );
    const totalOutstanding = data.invoices
      .filter((inv: any) => inv.status !== 'paid' && inv.status !== 'cancelled')
      .reduce((sum: number, inv: any) => sum + Number(inv.balance || 0), 0);
    const overdueAmount = data.invoices
      .filter((inv: any) => inv.status === 'overdue')
      .reduce((sum: number, inv: any) => sum + Number(inv.balance || 0), 0);
    const partialAmount = data.invoices
      .filter((inv: any) => inv.status === 'partially_paid')
      .reduce((sum: number, inv: any) => sum + Number(inv.amount_paid || 0), 0);

    const collectionRate = totalInvoiced > 0 ? (totalCollected / totalInvoiced) * 100 : 0;

    const overdueInvoices = data.invoices
      .filter((inv: any) => inv.status === 'overdue' || (inv.status !== 'paid' && inv.status !== 'cancelled' && new Date(inv.due_date) < new Date()))
      .slice(0, 5);

    const recentPayments = data.payments
      .sort((a: any, b: any) => new Date(b.transaction_date || b.created_at).getTime() - new Date(a.transaction_date || a.created_at).getTime())
      .slice(0, 5);

    // Monthly collection data for chart
    const monthlyData = Array.from({ length: 12 }, (_, i) => {
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const monthPayments = data.payments.filter((p: any) => {
        const date = new Date(p.transaction_date || p.created_at);
        return date.getMonth() === i;
      });
      const amount = monthPayments.reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0);
      return { month: monthNames[i], amount };
    });

    // Students by level
    const levelCounts: Record<string, number> = {};
    data.enrollments.forEach((e: any) => {
      const level = e.level_name || 'Unknown';
      levelCounts[level] = (levelCounts[level] || 0) + 1;
    });
    const studentsByLevel = Object.entries(levelCounts).map(([name, count]) => ({ name, count }));

    return {
      totalStudents,
      activeStudents,
      totalInvoiced,
      totalCollected,
      totalOutstanding,
      overdueAmount,
      partialAmount,
      collectionRate,
      overdueInvoices,
      recentPayments,
      monthlyData,
      studentsByLevel,
    };
  }, [data]);

  const formatCurrency = (amount: number) => {
    return `₦${amount.toLocaleString('en-NG', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (error || !stats) {
    return (
      <div className="space-y-4">
        <div className="card border-red-200 bg-red-50">
          <div className="flex items-center gap-3">
            <svg className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-red-800 font-medium">{error || 'Failed to load dashboard'}</p>
          </div>
        </div>
        <button onClick={fetchDashboardData} className="btn-primary">
          Try Again
        </button>
      </div>
    );
  }

  // Quick action definitions
  const quickActions = [
    {
      label: 'Register Student',
      href: '/students',
      color: 'bg-purple-100 text-purple-600',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
        </svg>
      ),
    },
    {
      label: 'Record Payment',
      href: '/billing',
      color: 'bg-emerald-100 text-emerald-600',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      label: 'View Invoices',
      href: '/billing',
      color: 'bg-blue-100 text-blue-600',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
    {
      label: 'Run Reports',
      href: '/reports',
      color: 'bg-indigo-100 text-indigo-600',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
  ];

  // Stat card icon components
  const studentsIcon = (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
  const invoicedIcon = (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
  const collectedIcon = (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {getGreeting()}, {displayName}
        </h1>
        <p className="text-sm text-gray-500 mt-1">Student and operational overview</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="TOTAL STUDENTS"
          value={stats.totalStudents.toString()}
          subtitle={`${stats.activeStudents} active`}
          icon={studentsIcon}
          iconBg="bg-blue-50 text-blue-600"
        />
        <StatCard
          label="TOTAL INVOICED"
          value={formatCurrency(stats.totalInvoiced)}
          subtitle="2025/2026 session"
          icon={invoicedIcon}
          iconBg="bg-purple-50 text-purple-600"
        />
        <StatCard
          label="TOTAL COLLECTED"
          value={formatCurrency(stats.totalCollected)}
          subtitle={`${stats.collectionRate.toFixed(1)}% collection rate`}
          icon={collectedIcon}
          iconBg="bg-emerald-50 text-emerald-600"
          trend={stats.collectionRate > 0 ? { value: `${stats.collectionRate.toFixed(1)}% collection rate`, positive: true } : undefined}
        />
        <StatCard
          label="OUTSTANDING"
          value={formatCurrency(stats.totalOutstanding)}
          subtitle={`${formatCurrency(stats.overdueAmount)} overdue`}
          alert={stats.totalOutstanding > 0}
        />
      </div>

      {/* Collection Progress */}
      <ProgressBar
        title={`Collection Progress — 2025/2026`}
        subtitle={`Target: ${formatCurrency(stats.totalInvoiced)}`}
        percentage={stats.collectionRate}
        segments={[
          { label: 'Collected', amount: formatCurrency(stats.totalCollected), color: 'bg-navy' },
          { label: 'Partial', amount: formatCurrency(stats.partialAmount), color: 'bg-amber-500' },
          { label: 'Overdue', amount: formatCurrency(stats.overdueAmount), color: 'bg-red-500' },
        ]}
      />

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Collections (2/3 width) */}
        <div className="lg:col-span-2">
          <CollectionChart
            title="Monthly Collections"
            subtitle="2025 payment inflows"
            data={stats.monthlyData}
          />
        </div>

        {/* Students by Level (1/3 width) */}
        <div className="card">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Students by Level</h3>
          <div className="space-y-4">
            {stats.studentsByLevel.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">No enrollment data</p>
            ) : (
              stats.studentsByLevel.map((level) => {
                const maxCount = Math.max(...stats.studentsByLevel.map((l) => l.count));
                const width = maxCount > 0 ? (level.count / maxCount) * 100 : 0;
                return (
                  <div key={level.name}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-medium text-gray-700">{level.name}</span>
                      <span className="text-sm text-gray-400">{level.count} students</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-navy rounded-full transition-all duration-700 ease-out"
                        style={{ width: `${width}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Overdue Invoices + Recent Payments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Overdue Invoices */}
        <div className="card p-0">
          <div className="flex items-center justify-between px-6 pt-5 pb-3">
            <div>
              <h3 className="text-base font-semibold text-gray-900">Overdue Invoices</h3>
              <p className="text-xs text-gray-400 mt-0.5">{stats.overdueInvoices.length} requiring attention</p>
            </div>
            <Link to="/billing" className="text-sm text-gray-400 hover:text-primary-600 transition-colors">View all</Link>
          </div>
          <div className="divide-y divide-gray-100">
            {stats.overdueInvoices.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">No overdue invoices 🎉</p>
            ) : (
              stats.overdueInvoices.map((inv: any) => (
                <div key={inv.id} className="flex items-center gap-3 px-6 py-3.5 hover:bg-gray-50 transition-colors">
                  <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{inv.student_name || 'Student'}</p>
                    <p className="text-xs text-gray-400">{inv.invoice_number || `INV-${inv.id}`} · {inv.level_name || ''}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-semibold text-red-600">{formatCurrency(Number(inv.balance || inv.total_amount || 0))}</p>
                    <p className="text-xs text-gray-400">due {inv.due_date ? new Date(inv.due_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Payments */}
        <div className="card p-0">
          <div className="flex items-center justify-between px-6 pt-5 pb-3">
            <div>
              <h3 className="text-base font-semibold text-gray-900">Recent Payments</h3>
              <p className="text-xs text-gray-400 mt-0.5">Latest verified transactions</p>
            </div>
            <Link to="/billing" className="text-sm text-gray-400 hover:text-primary-600 transition-colors">View all</Link>
          </div>
          <div className="divide-y divide-gray-100">
            {stats.recentPayments.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">No payments recorded</p>
            ) : (
              stats.recentPayments.map((pay: any) => {
                const statusColor = pay.status === 'successful' || pay.status === 'verified'
                  ? 'badge-success'
                  : pay.status === 'pending'
                  ? 'badge-warning'
                  : 'badge-neutral';
                return (
                  <div key={pay.id} className="flex items-center gap-3 px-6 py-3.5 hover:bg-gray-50 transition-colors">
                    <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{pay.student_name || pay.reference || 'Payment'}</p>
                      <p className="text-xs text-gray-400">
                        {pay.reference || `PAY-${pay.id}`} · {pay.transaction_date ? new Date(pay.transaction_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-semibold text-emerald-600">+{formatCurrency(Number(pay.amount || 0))}</p>
                      <span className={statusColor}>{pay.status || 'Verified'}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h3 className="text-base font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <QuickActions actions={quickActions} />
      </div>
    </div>
  );
}
