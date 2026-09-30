/**
 * Invoices Page — Figma Design
 * List, search, filter, and manage invoices
 */

import { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useInvoices, useCreateManualPayment } from '../hooks/queries';
import type { InvoiceListItem, InvoiceStatus } from '../types/billing';
import { StatCardSkeleton, TableSkeleton } from '../components/LoadingSkeleton';
import { NoInvoicesFound } from '../components/EmptyState';
import { showToast } from '../lib/toast';
import { useAuth } from '../contexts/AuthContext';

function formatNaira(amount: number | string): string {
  const num = typeof amount === 'number' ? amount : parseFloat(amount || '0');
  return `₦${num.toLocaleString('en-NG', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function getLevelBadge(level: string) {
  const l = (level || '').toLowerCase();
  if (l.includes('foundation')) return 'bg-blue-100 text-blue-800';
  if (l.includes('skill')) return 'bg-indigo-100 text-indigo-800';
  if (l.includes('professional')) return 'bg-purple-100 text-purple-800';
  return 'bg-gray-100 text-gray-800';
}

function getStatusBadge(status: InvoiceStatus) {
  switch (status) {
    case 'paid':
      return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800"><span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>Paid</span>;
    case 'partially_paid':
      return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800"><span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span>Partial</span>;
    case 'overdue':
      return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-100 text-rose-800"><span className="w-1.5 h-1.5 rounded-full bg-rose-600"></span>Overdue</span>;
    case 'cancelled':
      return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700"><span className="w-1.5 h-1.5 rounded-full bg-gray-500"></span>Cancelled</span>;
    default:
      return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700"><span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>Pending</span>;
  }
}

export default function InvoicesPage() {
  const { hasPermission } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [levelFilter, setLevelFilter] = useState<string>('all');

  const { data: invoicesData = [], isLoading, error, refetch } = useInvoices();

  const invoices = useMemo<InvoiceListItem[]>(
    () => (Array.isArray(invoicesData) ? invoicesData : []),
    [invoicesData]
  );

  // Compute stat totals
  const stats = useMemo(() => {
    let totalInvoiced = 0;
    let totalCollected = 0;
    let totalOutstanding = 0;
    let fullyPaid = 0;
    let overdue = 0;

    invoices.forEach((inv) => {
      const tot = parseFloat(inv.total_amount || '0');
      const paid = parseFloat(inv.amount_paid || '0');
      const bal = parseFloat(inv.balance || '0');

      totalInvoiced += tot;
      totalCollected += paid;
      totalOutstanding += bal;

      if (inv.status === 'paid') fullyPaid++;
      if (inv.status === 'overdue') overdue++;
    });

    return {
      totalInvoiced,
      totalCollected,
      totalOutstanding,
      fullyPaid,
      overdue,
    };
  }, [invoices]);

  // Filtered list
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      const matchesSearch =
        !searchTerm ||
        inv.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.student_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.student_code?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'all' || inv.status === statusFilter;
      const matchesLevel = levelFilter === 'all'; // Levels if passed in data

      return matchesSearch && matchesStatus && matchesLevel;
    });
  }, [invoices, searchTerm, statusFilter, levelFilter]);

  // Pagination Logic
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;
  
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, levelFilter]);

  const totalPages = Math.ceil(filteredInvoices.length / ITEMS_PER_PAGE);
  const paginatedInvoices = filteredInvoices.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Invoices</h1>
          <p className="mt-1 text-sm text-gray-500">Loading invoice statistics and list...</p>
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
          <h1 className="text-3xl font-bold text-slate-900">Invoices</h1>
          <p className="mt-1 text-sm text-slate-500">
            {invoices.length} total invoice{invoices.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div>
          {hasPermission('billing.create') && (
            <Link
              to="/students"
              className="inline-flex items-center px-4 py-2.5 bg-slate-900 text-white font-medium text-sm rounded-lg hover:bg-slate-800 transition-colors shadow-sm"
            >
              + Generate Invoice
            </Link>
          )}
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="text-xs font-semibold tracking-wider text-slate-500 uppercase">
            TOTAL INVOICED
          </div>
          <div className="text-2xl font-extrabold text-slate-900 mt-2">
            {formatNaira(stats.totalInvoiced)}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="text-xs font-semibold tracking-wider text-slate-500 uppercase">
            TOTAL COLLECTED
          </div>
          <div className="text-2xl font-extrabold text-slate-900 mt-2">
            {formatNaira(stats.totalCollected)}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="text-xs font-semibold tracking-wider text-slate-500 uppercase">
            OUTSTANDING
          </div>
          <div className="text-2xl font-extrabold text-slate-900 mt-2">
            {formatNaira(stats.totalOutstanding)}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="text-xs font-semibold tracking-wider text-slate-500 uppercase">
            FULLY PAID
          </div>
          <div className="text-2xl font-extrabold text-slate-900 mt-2">
            {stats.fullyPaid} <span className="text-lg font-normal text-slate-400">/ {invoices.length}</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">{stats.overdue} overdue</p>
        </div>
      </div>

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
              placeholder="Search by student or invoice number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900"
            />
          </div>

          <div className="flex gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-slate-900"
            >
              <option value="all">All Status</option>
              <option value="paid">Paid</option>
              <option value="partially_paid">Partial</option>
              <option value="pending">Pending</option>
              <option value="overdue">Overdue</option>
              <option value="cancelled">Cancelled</option>
            </select>

            <select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
              className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-slate-900"
            >
              <option value="all">All Levels</option>
              <option value="foundation">Foundation</option>
              <option value="skills">Skills</option>
              <option value="professional">Professional</option>
            </select>
          </div>
        </div>
      </div>

      {/* Invoices Table */}
      {filteredInvoices.length === 0 ? (
        <NoInvoicesFound />
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm min-w-[800px]">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-500 tracking-wider uppercase">
                    <th className="py-3.5 px-6 whitespace-nowrap">INVOICE NO.</th>
                    <th className="py-3.5 px-6 whitespace-nowrap">STUDENT</th>
                    <th className="py-3.5 px-6 whitespace-nowrap">LEVEL</th>
                    <th className="py-3.5 px-6 text-right whitespace-nowrap">TOTAL</th>
                    <th className="py-3.5 px-6 text-right whitespace-nowrap">PAID</th>
                    <th className="py-3.5 px-6 text-right whitespace-nowrap">BALANCE</th>
                    <th className="py-3.5 px-6 text-center whitespace-nowrap">STATUS</th>
                    <th className="py-3.5 px-6 whitespace-nowrap">DUE DATE</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedInvoices.map((inv) => {
                    const balanceNum = parseFloat(inv.balance || '0');
                    const isOverdue = inv.status === 'overdue';

                    return (
                      <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-4 px-6 font-semibold text-slate-900 whitespace-nowrap">
                          <Link to={`/billing/invoices/${inv.id}`} className="hover:underline text-blue-600 font-mono">
                            {inv.invoice_number}
                          </Link>
                        </td>
                        <td className="py-4 px-6 whitespace-nowrap">
                          <div className="font-semibold text-slate-900">{inv.student_name}</div>
                          <div className="text-xs text-slate-400 font-mono mt-0.5">
                            {inv.student_code || 'N/A'}
                          </div>
                        </td>
                        <td className="py-4 px-6 whitespace-nowrap">
                          <span className={`px-2.5 py-1 rounded-md text-xs font-semibold ${getLevelBadge('Foundation')}`}>
                            Foundation
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right font-semibold text-slate-900 whitespace-nowrap">
                          {formatNaira(inv.total_amount)}
                        </td>
                        <td className="py-4 px-6 text-right font-semibold text-emerald-600 whitespace-nowrap">
                          {formatNaira(inv.amount_paid)}
                        </td>
                        <td className={`py-4 px-6 text-right font-semibold whitespace-nowrap ${balanceNum > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                          {formatNaira(inv.balance)}
                        </td>
                        <td className="py-4 px-6 text-center whitespace-nowrap">
                          {getStatusBadge(inv.status)}
                        </td>
                        <td className={`py-4 px-6 font-medium whitespace-nowrap ${isOverdue ? 'text-rose-600 font-semibold' : 'text-slate-600'}`}>
                          {inv.due_date ? new Date(inv.due_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '15 Mar 2025'}
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
            {paginatedInvoices.map((inv) => (
              <div key={inv.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <Link to={`/billing/invoices/${inv.id}`} className="text-sm font-bold text-blue-600 font-mono hover:underline">
                      {inv.invoice_number}
                    </Link>
                    <p className="text-xs font-semibold text-slate-900 mt-0.5">{inv.student_name}</p>
                    <p className="text-[11px] text-slate-400 font-mono">{inv.student_code || 'N/A'}</p>
                  </div>
                  {getStatusBadge(inv.status)}
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <div>
                    <span className="text-slate-400 block font-medium">Total Amount</span>
                    <span className="text-slate-900 font-bold">{formatNaira(inv.total_amount)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Paid</span>
                    <span className="text-emerald-600 font-semibold">{formatNaira(inv.amount_paid)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Balance</span>
                    <span className="text-rose-600 font-bold">{formatNaira(inv.balance)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Due Date</span>
                    <span className="text-slate-700 font-semibold">{inv.due_date ? new Date(inv.due_date).toLocaleDateString('en-GB') : 'N/A'}</span>
                  </div>
                </div>
              </div>
            ))}
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
                      {Math.min(currentPage * ITEMS_PER_PAGE, filteredInvoices.length)}
                    </span>{' '}
                    of <span className="font-medium">{filteredInvoices.length}</span> results
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
        </>
      )}
    </div>
  );
}
