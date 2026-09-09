/**
 * Admin Dashboard Page
 * Comprehensive overview for administrators and staff
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../lib/api';

interface DashboardStats {
  total_students: number;
  active_enrollments: number;
  total_revenue: number;
  pending_payments: number;
  recent_enrollments: any[];
  recent_payments: any[];
  low_attendance: any[];
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    setLoading(true);
    try {
      // Fetch various statistics
      const [students, enrollments, invoices, payments] = await Promise.all([
        api.get('/students/').catch(() => ({ data: { results: [] } })),
        api.get('/enrollments/').catch(() => ({ data: { results: [] } })),
        api.get('/billing/invoices/').catch(() => ({ data: { results: [] } })),
        api.get('/billing/payments/').catch(() => ({ data: { results: [] } })),
      ]);

      const studentData = Array.isArray(students.data) ? students.data : students.data.results || [];
      const enrollmentData = Array.isArray(enrollments.data) ? enrollments.data : enrollments.data.results || [];
      const invoiceData = Array.isArray(invoices.data) ? invoices.data : invoices.data.results || [];
      const paymentData = Array.isArray(payments.data) ? payments.data : payments.data.results || [];

      // Calculate statistics
      const totalRevenue = invoiceData.reduce((sum: number, inv: any) => 
        sum + Number(inv.amount_paid || 0), 0
      );

      const pendingAmount = invoiceData
        .filter((inv: any) => inv.status !== 'paid' && inv.status !== 'cancelled')
        .reduce((sum: number, inv: any) => sum + Number(inv.balance || 0), 0);

      setStats({
        total_students: studentData.length,
        active_enrollments: enrollmentData.filter((e: any) => e.status === 'active').length,
        total_revenue: totalRevenue,
        pending_payments: pendingAmount,
        recent_enrollments: enrollmentData.slice(0, 5),
        recent_payments: paymentData.slice(0, 5),
        low_attendance: [],
      });
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `₦${amount.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Admin Dashboard
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          Welcome back, {user?.email}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Students</p>
              <p className="text-3xl font-bold text-gray-900">{stats?.total_students || 0}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-2xl">👥</span>
            </div>
          </div>
          <div className="mt-4">
            <Link to="/students" className="text-sm text-blue-600 hover:text-blue-800">
              View all students →
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Enrollments</p>
              <p className="text-3xl font-bold text-gray-900">{stats?.active_enrollments || 0}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-2xl">📚</span>
            </div>
          </div>
          <div className="mt-4">
            <Link to="/enrollments" className="text-sm text-green-600 hover:text-green-800">
              View enrollments →
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Revenue</p>
              <p className="text-3xl font-bold text-gray-900">
                {formatCurrency(stats?.total_revenue || 0)}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <span className="text-2xl">💰</span>
            </div>
          </div>
          <div className="mt-4">
            <Link to="/billing" className="text-sm text-purple-600 hover:text-purple-800">
              View billing →
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending Payments</p>
              <p className="text-3xl font-bold text-gray-900">
                {formatCurrency(stats?.pending_payments || 0)}
              </p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
              <span className="text-2xl">⏳</span>
            </div>
          </div>
          <div className="mt-4">
            <Link to="/billing" className="text-sm text-yellow-600 hover:text-yellow-800">
              View invoices →
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Enrollments */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Recent Enrollments</h2>
          </div>
          <div className="p-6">
            {stats?.recent_enrollments && stats.recent_enrollments.length > 0 ? (
              <div className="space-y-4">
                {stats.recent_enrollments.map((enrollment: any) => (
                  <div key={enrollment.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                    <div>
                      <p className="font-medium text-gray-900">{enrollment.student_name || 'Student'}</p>
                      <p className="text-sm text-gray-600">{enrollment.level_name} - {enrollment.session_name}</p>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      enrollment.status === 'active' ? 'bg-green-100 text-green-800' :
                      enrollment.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {enrollment.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No recent enrollments</p>
            )}
          </div>
        </div>

        {/* Recent Payments */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Recent Payments</h2>
          </div>
          <div className="p-6">
            {stats?.recent_payments && stats.recent_payments.length > 0 ? (
              <div className="space-y-4">
                {stats.recent_payments.map((payment: any) => (
                  <div key={payment.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                    <div>
                      <p className="font-medium text-gray-900">{payment.reference}</p>
                      <p className="text-sm text-gray-600">
                        {new Date(payment.transaction_date).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">{formatCurrency(payment.amount)}</p>
                      <span className={`text-xs font-medium ${
                        payment.status === 'successful' ? 'text-green-600' : 'text-gray-600'
                      }`}>
                        {payment.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No recent payments</p>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link
            to="/students/new"
            className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
          >
            <span className="text-3xl mb-2">➕</span>
            <span className="text-sm font-medium text-gray-700">Add Student</span>
          </Link>

          <Link
            to="/academics"
            className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors"
          >
            <span className="text-3xl mb-2">📚</span>
            <span className="text-sm font-medium text-gray-700">Manage Courses</span>
          </Link>

          <Link
            to="/reports"
            className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors"
          >
            <span className="text-3xl mb-2">📊</span>
            <span className="text-sm font-medium text-gray-700">Generate Report</span>
          </Link>

          <Link
            to="/notifications"
            className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-yellow-500 hover:bg-yellow-50 transition-colors"
          >
            <span className="text-3xl mb-2">📧</span>
            <span className="text-sm font-medium text-gray-700">Send Notification</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
