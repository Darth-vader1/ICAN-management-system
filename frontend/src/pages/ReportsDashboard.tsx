/**
 * Reports Dashboard Page - PRODUCTION READY
 * Central hub for all reports with export functionality
 */

import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { reportService } from '../services/reportService';
import type { FinancialSummary } from '../types/report';
import { StatCardSkeleton } from '../components/LoadingSkeleton';
import { EmptyState } from '../components/EmptyState';
import { ButtonWithLoading } from '../components/LoadingSpinner';
import { showToast } from '../lib/toast';
import { useFinancialReport } from '../hooks/queries';

export default function ReportsDashboard() {
  const { user } = useAuth();
  const [exportingReport, setExportingReport] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState({
    start_date: '',
    end_date: '',
  });

  const isFinance = user?.role === 'finance' || user?.role === 'super_admin';
  const isStaff = user?.is_staff_role ?? ['super_admin', 'manager', 'finance', 'student_officer', 'it_admin'].includes(user?.role ?? '');

  // Fetch financial summary via shared hook
  const {
    data: financialSummary,
    isLoading: summaryLoading,
    error: summaryError,
    refetch: refetchSummary,
  } = useFinancialReport(isFinance ? dateRange : undefined);

  const handleExport = async (reportType: string, format: 'csv' | 'excel' | 'pdf') => {
    setExportingReport(`${reportType}-${format}`);
    try {
      let blob: Blob;
      let filename: string;

      switch (reportType) {
        case 'financial':
          blob = await reportService.exportFinancialSummary(format, dateRange);
          filename = `financial_summary.${format}`;
          break;
        case 'attendance':
          blob = await reportService.exportAttendanceReport(format, dateRange);
          filename = `attendance_report.${format}`;
          break;
        case 'payments':
          blob = await reportService.exportPaymentReport(format, dateRange);
          filename = `payment_report.${format}`;
          break;
        case 'enrollments':
          blob = await reportService.exportEnrollmentReport(format, dateRange);
          filename = `enrollment_report.${format}`;
          break;
        default:
          return;
      }

      reportService.downloadBlob(blob, filename);
      showToast.success(`Report exported successfully as ${format.toUpperCase()}`);
    } catch (error) {
      console.error('Export failed:', error);
      showToast.error('Failed to export report. Please try again.');
    } finally {
      setExportingReport(null);
    }
  };

  const formatCurrency = (amount: number) => {
    return `₦${amount.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  if (!isStaff) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <p className="text-yellow-800">You don't have permission to access reports.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
        <p className="mt-2 text-sm text-gray-600">
          Generate and export reports in CSV, Excel, or PDF format
        </p>
      </div>

      {/* Date Range Filter */}
      <div className="mb-8 bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Date Range Filter</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={dateRange.start_date}
              onChange={(e) => setDateRange(prev => ({ ...prev, start_date: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Date
            </label>
            <input
              type="date"
              value={dateRange.end_date}
              onChange={(e) => setDateRange(prev => ({ ...prev, end_date: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="flex items-end">
            <ButtonWithLoading
              onClick={() => refetchSummary()}
              loading={summaryLoading}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Apply Filter
            </ButtonWithLoading>
          </div>
        </div>
      </div>

      {/* Financial Summary */}
      {isFinance && (
        <>
          {summaryLoading ? (
            <div className="mb-8 bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Financial Summary</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <StatCardSkeleton />
                <StatCardSkeleton />
                <StatCardSkeleton />
                <StatCardSkeleton />
              </div>
            </div>
          ) : summaryError ? (
            <div className="mb-8 bg-white rounded-lg shadow p-6">
              <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                <svg
                  className="h-12 w-12 text-red-400 mx-auto mb-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Failed to load financial summary
                </h3>
                <p className="text-gray-600 mb-4">
                  {summaryError instanceof Error ? summaryError.message : 'An error occurred'}
                </p>
                <button
                  onClick={() => refetchSummary()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Try Again
                </button>
              </div>
            </div>
          ) : financialSummary ? (
            <div className="mb-8 bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Financial Summary</h2>
                <div className="flex gap-2">
                  <ButtonWithLoading
                    onClick={() => handleExport('financial', 'csv')}
                    loading={exportingReport === 'financial-csv'}
                    className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                  >
                    CSV
                  </ButtonWithLoading>
                  <ButtonWithLoading
                    onClick={() => handleExport('financial', 'excel')}
                    loading={exportingReport === 'financial-excel'}
                    className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                  >
                    Excel
                  </ButtonWithLoading>
                  <ButtonWithLoading
                    onClick={() => handleExport('financial', 'pdf')}
                    loading={exportingReport === 'financial-pdf'}
                    className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                  >
                    PDF
                  </ButtonWithLoading>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                  <div className="text-sm text-gray-600 mb-1">Total Invoiced</div>
                  <div className="text-2xl font-bold text-blue-600">
                    {formatCurrency(financialSummary.overview.total_invoiced)}
                  </div>
                </div>
                <div className="bg-green-50 rounded-lg p-4 border border-green-100">
                  <div className="text-sm text-gray-600 mb-1">Total Paid</div>
                  <div className="text-2xl font-bold text-green-600">
                    {formatCurrency(financialSummary.overview.total_paid)}
                  </div>
                </div>
                <div className="bg-red-50 rounded-lg p-4 border border-red-100">
                  <div className="text-sm text-gray-600 mb-1">Outstanding</div>
                  <div className="text-2xl font-bold text-red-600">
                    {formatCurrency(financialSummary.overview.total_outstanding)}
                  </div>
                </div>
                <div className="bg-purple-50 rounded-lg p-4 border border-purple-100">
                  <div className="text-sm text-gray-600 mb-1">Collection Rate</div>
                  <div className="text-2xl font-bold text-purple-600">
                    {financialSummary.overview.collection_rate.toFixed(1)}%
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Payment Methods */}
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Payment Methods</h3>
                  {financialSummary.payment_methods.length === 0 ? (
                    <p className="text-sm text-gray-500 py-4 text-center">No payments recorded</p>
                  ) : (
                    <div className="space-y-2">
                      {financialSummary.payment_methods.map((method, index) => (
                        <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded border border-gray-100">
                          <span className="text-sm text-gray-600 capitalize">{method.method}</span>
                          <span className="text-sm font-medium">{formatCurrency(method.total)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Invoice Status */}
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Invoice Status</h3>
                  {financialSummary.invoice_status.length === 0 ? (
                    <p className="text-sm text-gray-500 py-4 text-center">No invoices found</p>
                  ) : (
                    <div className="space-y-2">
                      {financialSummary.invoice_status.map((status, index) => (
                        <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded border border-gray-100">
                          <span className="text-sm text-gray-600 capitalize">{status.status}</span>
                          <span className="text-sm font-medium">{status.count} invoices</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="mb-8 bg-white rounded-lg shadow">
              <EmptyState
                icon={
                  <svg
                    className="h-8 w-8 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                }
                title="No financial data"
                description="Select a date range and click 'Apply Filter' to view financial summary."
              />
            </div>
          )}
        </>
      )}

      {/* Report Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Financial Reports */}
        {isFinance && (
          <div className="bg-white rounded-lg shadow p-6 border border-gray-200 hover:border-gray-300 transition-colors">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Financial Reports</h3>
                <p className="text-sm text-gray-600">Revenue & payments</p>
              </div>
            </div>
            <div className="space-y-2">
              <ButtonWithLoading
                onClick={() => handleExport('financial', 'excel')}
                loading={exportingReport === 'financial-excel'}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 rounded transition-colors"
              >
                Download Financial Summary
              </ButtonWithLoading>
              <ButtonWithLoading
                onClick={() => handleExport('payments', 'excel')}
                loading={exportingReport === 'payments-excel'}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 rounded transition-colors"
              >
                Download Payment Report
              </ButtonWithLoading>
            </div>
          </div>
        )}

        {/* Student Reports */}
        <div className="bg-white rounded-lg shadow p-6 border border-gray-200 hover:border-gray-300 transition-colors">
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Student Reports</h3>
              <p className="text-sm text-gray-600">Enrollment & attendance</p>
            </div>
          </div>
          <div className="space-y-2">
            <ButtonWithLoading
              onClick={() => handleExport('enrollments', 'excel')}
              loading={exportingReport === 'enrollments-excel'}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 rounded transition-colors"
            >
              Download Enrollment Report
            </ButtonWithLoading>
            <p className="text-xs text-gray-500 px-4 py-2">Individual student reports available from student profiles</p>
          </div>
        </div>

        {/* Attendance Reports */}
        <div className="bg-white rounded-lg shadow p-6 border border-gray-200 hover:border-gray-300 transition-colors">
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mr-4">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Attendance Reports</h3>
              <p className="text-sm text-gray-600">Session analytics</p>
            </div>
          </div>
          <div className="space-y-2">
            <ButtonWithLoading
              onClick={() => handleExport('attendance', 'excel')}
              loading={exportingReport === 'attendance-excel'}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 rounded transition-colors"
            >
              Download Attendance Report
            </ButtonWithLoading>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>Tip:</strong> Use the date range filter to narrow down your reports to specific periods.
          All exports include timestamps and can be opened in Excel, Google Sheets, or any PDF viewer.
        </p>
      </div>
    </div>
  );
}
