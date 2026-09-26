import React, { useState, useMemo } from 'react';
import {
  Search,
  Calendar,
  CreditCard,
  User,
  BookOpen,
  Shield,
  MessageSquare,
  Activity,
  ChevronLeft,
  ChevronRight,
  X,
  FileText,
  Clock,
  History,
  CheckCircle2,
} from 'lucide-react';
import { useAuditLogs, useAuditStats, type AuditLog } from '../hooks/queries/useAudit';
import api from '../lib/api';
import { ExportDropdown } from '../components/ExportDropdown';
import { exportData, datestampedFilename } from '../lib/export';
import { reportService } from '../services/reportService';

const CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'finance', label: 'Finance' },
  { id: 'students', label: 'Students' },
  { id: 'academic', label: 'Academic' },
  { id: 'admin', label: 'Admin' },
  { id: 'system', label: 'System' },
  { id: 'communication', label: 'Communication' },
];

export default function AuditLogsPage() {
  const [page, setPage] = useState<number>(1);
  const [search, setSearch] = useState<string>('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [userFilter, setUserFilter] = useState<string>('');
  const [entityFilter, setEntityFilter] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const filters = {
    page,
    search: search.trim() || undefined,
    category: activeCategory !== 'all' ? activeCategory : undefined,
    actor: userFilter || undefined,
    entity_type: entityFilter || undefined,
    start_date: startDate || undefined,
    end_date: endDate || undefined,
  };

  const handleExport = async (format: 'pdf' | 'excel') => {
    const exportFormat = format === 'excel' ? 'excel' : 'pdf';
    const ext = format === 'excel' ? 'xlsx' : 'pdf';
    const exportParams = {
      search: search.trim() || undefined,
      category: activeCategory !== 'all' ? activeCategory : undefined,
      actor: userFilter || undefined,
      entity_type: entityFilter || undefined,
      start_date: startDate || undefined,
      end_date: endDate || undefined,
    };
    await exportData(
      () => reportService.exportAuditLogs(exportFormat, exportParams),
      datestampedFilename('audit_logs', ext),
    );
  };

  const { data: logResponse, isLoading, refetch } = useAuditLogs(filters);
  const { data: stats } = useAuditStats();

  const logs = logResponse?.results || [];
  const totalCount = logResponse?.count || 0;
  const totalPages = Math.ceil(totalCount / 20) || 1;

  const todayFormatted = useMemo(() => {
    return new Date().toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }, []);

  // Group logs by date (e.g., "08 SEPT 2025")
  const groupedLogs = useMemo(() => {
    const groups: Record<string, AuditLog[]> = {};
    logs.forEach((log) => {
      const dateObj = new Date(log.created_at || log.timestamp || Date.now());
      const dateKey = dateObj
        .toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        })
        .toUpperCase();
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(log);
    });
    return groups;
  }, [logs]);

  const getLogIcon = (entityType?: string, action?: string) => {
    const entity = (entityType || '').toLowerCase();
    const act = (action || '').toLowerCase();

    if (entity.includes('payment') || entity.includes('invoice') || entity.includes('fee')) {
      return (
        <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
          <CreditCard className="w-4 h-4" />
        </div>
      );
    }
    if (entity.includes('student') || entity.includes('enrollment') || entity.includes('user')) {
      return (
        <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
          <User className="w-4 h-4" />
        </div>
      );
    }
    if (entity.includes('course') || entity.includes('session') || entity.includes('schedule')) {
      return (
        <div className="w-9 h-9 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
          <BookOpen className="w-4 h-4" />
        </div>
      );
    }
    if (entity.includes('announcement') || entity.includes('notification')) {
      return (
        <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
          <MessageSquare className="w-4 h-4" />
        </div>
      );
    }
    return (
      <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
        <Activity className="w-4 h-4" />
      </div>
    );
  };

  const getActionColorClass = (action?: string) => {
    const act = (action || '').toUpperCase();
    if (act.includes('VERIFY') || act.includes('SUCCESS') || act.includes('CREATE') || act.includes('APPROVED')) {
      return 'text-emerald-600 font-bold';
    }
    if (act.includes('DELETE') || act.includes('REJECT') || act.includes('CANCEL')) {
      return 'text-rose-600 font-bold';
    }
    if (act.includes('UPDATE') || act.includes('EDIT')) {
      return 'text-blue-600 font-bold';
    }
    return 'text-slate-800 font-bold';
  };

  const formatLogTime = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return d.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });
    } catch {
      return '';
    }
  };

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Audit Logs</h1>
          <p className="text-sm text-slate-500 font-medium mt-0.5">
            System activity, security events, and administrative actions
          </p>
        </div>
        <div>
          <ExportDropdown
            label="Export Logs"
            onExportPdf={() => handleExport('pdf')}
            onExportExcel={() => handleExport('excel')}
            disabled={totalCount === 0}
          />
        </div>
      </div>

      {/* Top 4 Stat Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Events */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm relative overflow-hidden flex items-stretch gap-4">
          <div className="w-1.5 bg-[#0f172a] rounded-full shrink-0" />
          <div className="flex-1">
            <p className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {stats?.total_actions !== undefined ? stats.total_actions : totalCount}
            </p>
            <p className="text-sm font-semibold text-slate-800 mt-1">Total Events</p>
            <p className="text-xs text-slate-400 mt-0.5">All time</p>
          </div>
        </div>

        {/* Card 2: Today */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm relative overflow-hidden flex items-stretch gap-4">
          <div className="w-1.5 bg-emerald-500 rounded-full shrink-0" />
          <div className="flex-1">
            <p className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {stats?.today_actions !== undefined ? stats.today_actions : 0}
            </p>
            <p className="text-sm font-semibold text-slate-800 mt-1">Today</p>
            <p className="text-xs text-slate-400 mt-0.5">{todayFormatted}</p>
          </div>
        </div>

        {/* Card 3: Finance Actions */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm relative overflow-hidden flex items-stretch gap-4">
          <div className="w-1.5 bg-amber-500 rounded-full shrink-0" />
          <div className="flex-1">
            <p className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {stats?.finance_actions !== undefined ? stats.finance_actions : 0}
            </p>
            <p className="text-sm font-semibold text-slate-800 mt-1">Finance Actions</p>
            <p className="text-xs text-slate-400 mt-0.5">Payments, invoices</p>
          </div>
        </div>

        {/* Card 4: Sensitive Changes */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm relative overflow-hidden flex items-stretch gap-4">
          <div className="w-1.5 bg-rose-500 rounded-full shrink-0" />
          <div className="flex-1">
            <p className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {stats?.sensitive_changes !== undefined ? stats.sensitive_changes : 0}
            </p>
            <p className="text-sm font-semibold text-slate-800 mt-1">Sensitive Changes</p>
            <p className="text-xs text-slate-400 mt-0.5">Requires review</p>
          </div>
        </div>
      </div>

      {/* Main Search & Filter Card */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm space-y-4">
        {/* Top Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by action, user, entity, description..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-11 pr-4 py-3 rounded-lg border border-slate-200 bg-white text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400 shadow-xs transition"
          />
        </div>

        {/* Category Filter Pills */}
        <div className="flex flex-wrap items-center gap-2">
          {CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => {
                  setActiveCategory(cat.id);
                  setPage(1);
                }}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition ${
                  isActive
                    ? 'bg-[#0f172a] text-white shadow-sm'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Bottom Row Filters */}
        <div className="flex flex-wrap items-center gap-3 pt-1">
          {/* User Select */}
          <select
            value={userFilter}
            onChange={(e) => {
              setUserFilter(e.target.value);
              setPage(1);
            }}
            className="px-3.5 py-2 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 bg-white shadow-xs focus:outline-none min-w-[140px]"
          >
            <option value="">All users</option>
            {stats?.by_actor?.map((act) => (
              <option key={act.actor_id} value={act.actor_id}>
                {act.actor_email}
              </option>
            ))}
          </select>

          {/* Entity Select */}
          <select
            value={entityFilter}
            onChange={(e) => {
              setEntityFilter(e.target.value);
              setPage(1);
            }}
            className="px-3.5 py-2 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 bg-white shadow-xs focus:outline-none min-w-[140px]"
          >
            <option value="">All entities</option>
            {stats?.by_entity?.map((ent) => (
              <option key={ent.entity_type} value={ent.entity_type}>
                {ent.entity_type}
              </option>
            ))}
          </select>

          {/* Date Pickers */}
          <div className="flex items-center gap-2 text-slate-400 text-xs font-medium">
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 bg-white focus:outline-none shadow-xs"
            />
            <span>to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 bg-white focus:outline-none shadow-xs"
            />
          </div>
        </div>
      </div>

      {/* Events Summary Header */}
      <div className="flex items-center justify-between px-1 text-xs text-slate-500 font-medium">
        <span>{totalCount} total events</span>
        <span>
          Page {page} of {totalPages}
        </span>
      </div>

      {/* Audit Log Timeline Items */}
      {isLoading ? (
        <div className="bg-white rounded-xl p-12 text-center text-slate-400 border border-slate-200 space-y-2">
          <Activity className="w-8 h-8 animate-spin mx-auto text-slate-400" />
          <p className="text-sm font-medium">Loading audit events...</p>
        </div>
      ) : Object.keys(groupedLogs).length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center text-slate-400 border border-slate-200 space-y-2">
          <FileText className="w-10 h-10 mx-auto text-slate-300" />
          <p className="text-sm font-medium text-slate-600">No audit logs found matching criteria.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedLogs).map(([dateLabel, logList]) => (
            <div key={dateLabel} className="space-y-3">
              {/* Date Group Center Badge */}
              <div className="flex items-center justify-center my-4">
                <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase bg-slate-100/80 px-3 py-1 rounded-full border border-slate-200/60">
                  {dateLabel}
                </span>
              </div>

              {/* Log Cards for Date */}
              {logList.map((log) => (
                <div
                  key={log.id}
                  className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs hover:shadow-md transition flex items-start gap-4"
                >
                  {/* Category Icon Box */}
                  {getLogIcon(log.entity_type, log.action)}

                  {/* Log Content */}
                  <div className="flex-1 min-w-0 space-y-1">
                    {/* Action Title & Entity */}
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs uppercase ${getActionColorClass(log.action)}`}>
                          {log.action}
                        </span>
                        <span className="text-slate-400 font-medium">
                          {log.entity_type} {log.entity_id ? `#${log.entity_id.slice(0, 8)}` : ''}
                        </span>
                      </div>
                      <span className="text-slate-400 text-xs font-mono">{formatLogTime(log.created_at || log.timestamp)}</span>
                    </div>

                    {/* Human Description Line */}
                    <p className="text-slate-800 text-xs font-semibold sm:text-sm">
                      {log.description || `${log.action} action performed on ${log.entity_type}`}
                    </p>

                    {/* Actor Details & Metadata Line */}
                    <div className="flex items-center gap-2 text-xs text-slate-500 pt-1">
                      {/* Avatar Circle */}
                      <div className="w-6 h-6 rounded-full bg-[#0f172a] text-white font-bold text-[10px] flex items-center justify-center uppercase shrink-0">
                        {log.actor_initials || (log.actor_name ? log.actor_name.slice(0, 2).toUpperCase() : 'SY')}
                      </div>

                      <span className="font-semibold text-slate-700">{log.actor_name || log.actor_email || 'System'}</span>

                      {log.ip_address && (
                        <>
                          <span className="text-slate-300">•</span>
                          <span className="font-mono text-slate-400 text-[11px]">{log.ip_address}</span>
                        </>
                      )}

                      <span className="text-slate-300">•</span>

                      {/* View detail trigger */}
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="text-slate-500 hover:text-slate-900 font-medium transition flex items-center gap-0.5"
                      >
                        View detail &rarr;
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4">
          <button
            onClick={() => setPage((p) => Math.max(p - 1, 1))}
            disabled={page <= 1}
            className="px-4 py-2 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 transition flex items-center gap-1"
          >
            <ChevronLeft className="w-4 h-4" /> Previous
          </button>

          <span className="text-xs font-medium text-slate-500">
            Page {page} of {totalPages}
          </span>

          <button
            onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
            disabled={page >= totalPages}
            className="px-4 py-2 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 transition flex items-center gap-1"
          >
            Next <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Detail Inspector Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] min-w-0">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50">
              <div>
                <h3 className="text-base font-bold text-slate-900">Audit Log Details</h3>
                <p className="text-xs text-slate-400 font-mono">ID: {selectedLog.id}</p>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/50 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              {/* Human Description Banner Box */}
              <div className="p-4 bg-[#f8fafc] border border-slate-100 rounded-xl text-slate-800 font-medium text-sm leading-relaxed">
                {selectedLog.description || `${selectedLog.action} action performed on ${selectedLog.entity_type}`}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div>
                  <span className="text-slate-400 uppercase font-semibold">Action</span>
                  <p className="font-bold text-slate-800 mt-0.5">{selectedLog.action}</p>
                </div>
                <div>
                  <span className="text-slate-400 uppercase font-semibold">Entity</span>
                  <p className="font-mono text-slate-800 mt-0.5">{selectedLog.entity_type} {selectedLog.entity_id ? `#${selectedLog.entity_id}` : ''}</p>
                </div>
                <div>
                  <span className="text-slate-400 uppercase font-semibold">Actor</span>
                  <p className="font-medium text-slate-800 mt-0.5">{selectedLog.actor_name || selectedLog.actor_email || 'System'}</p>
                </div>
                <div>
                  <span className="text-slate-400 uppercase font-semibold">IP Address</span>
                  <p className="font-mono text-slate-800 mt-0.5">{selectedLog.ip_address || 'N/A'}</p>
                </div>
              </div>

              <div>
                <p className="font-semibold text-slate-700 mb-1">Before State (Old Value):</p>
                <div className="p-3 bg-slate-900 text-slate-200 font-mono text-xs rounded-lg overflow-x-auto max-h-40">
                  <pre>{JSON.stringify(selectedLog.old_value || null, null, 2)}</pre>
                </div>
              </div>

              <div>
                <p className="font-semibold text-slate-700 mb-1">After State (New Value):</p>
                <div className="p-3 bg-slate-900 text-slate-200 font-mono text-xs rounded-lg overflow-x-auto max-h-40">
                  <pre>{JSON.stringify(selectedLog.new_value || null, null, 2)}</pre>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
