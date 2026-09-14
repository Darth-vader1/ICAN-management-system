import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, AlertCircle, Clock, User, Award } from 'lucide-react';
import { useVirtualClass, useClassAttendance } from '../hooks/queries/useClassroom';
import { DashboardSkeleton } from '../components/LoadingSkeleton';

export const ClassroomAttendancePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: virtualClass, isLoading: classLoading } = useVirtualClass(id || '');
  const { data: attendanceList = [], isLoading: attendanceLoading } = useClassAttendance(id || '');

  if (classLoading || attendanceLoading || !virtualClass) {
    return (
      <div className="max-w-5xl mx-auto p-6 space-y-6">
        <DashboardSkeleton />
      </div>
    );
  }

  const getStatusBadge = (statusStr: string) => {
    if (statusStr === 'PRESENT') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle className="w-3.5 h-3.5" />
          Present (≥75%)
        </span>
      );
    }
    if (statusStr === 'PARTIAL') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
          <Clock className="w-3.5 h-3.5" />
          Partial (25%-74%)
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-200">
        <AlertCircle className="w-3.5 h-3.5" />
        Absent (&lt;25%)
      </span>
    );
  };

  const presentCount = attendanceList.filter((a) => a.attendance_status === 'PRESENT').length;
  const partialCount = attendanceList.filter((a) => a.attendance_status === 'PARTIAL').length;
  const absentCount = attendanceList.filter((a) => a.attendance_status === 'ABSENT').length;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      <button
        onClick={() => navigate('/classrooms')}
        className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-2 transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Virtual Classrooms</span>
      </button>

      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="px-2.5 py-1 rounded text-xs font-mono font-bold bg-blue-50 text-blue-700 border border-blue-200 uppercase">
            {virtualClass.course_code}
          </span>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight mt-2">
            Attendance Log: {virtualClass.title}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Instructor: {virtualClass.instructor_name} • Scheduled Duration: {virtualClass.total_scheduled_duration_minutes}m
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold">
          <span className="px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-200">
            {presentCount} Present
          </span>
          <span className="px-3 py-1.5 bg-amber-50 text-amber-700 rounded-xl border border-amber-200">
            {partialCount} Partial
          </span>
          <span className="px-3 py-1.5 bg-red-50 text-red-700 rounded-xl border border-red-200">
            {absentCount} Absent
          </span>
        </div>
      </div>

      {/* Attendance Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200/80 bg-slate-50/50 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3.5 px-5">Student</th>
                <th className="py-3.5 px-4">Student ID</th>
                <th className="py-3.5 px-4">First Joined</th>
                <th className="py-3.5 px-4">Total Active Time</th>
                <th className="py-3.5 px-5">Attendance Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {attendanceList.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400 italic text-xs">
                    No attendance records logged for this session yet.
                  </td>
                </tr>
              ) : (
                attendanceList.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#0f172a] text-white flex items-center justify-center font-bold text-xs">
                          {a.student_name.slice(0, 2).toUpperCase()}
                        </div>
                        <span className="font-semibold text-slate-900">{a.student_name}</span>
                      </div>
                    </td>

                    <td className="py-4 px-4 font-mono text-xs text-slate-600">{a.student_code}</td>

                    <td className="py-4 px-4 text-xs text-slate-600">
                      {a.first_joined_at
                        ? new Date(a.first_joined_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        : '—'}
                    </td>

                    <td className="py-4 px-4 font-bold text-slate-900 text-xs">
                      {a.total_duration_minutes} min ({Math.round((a.total_duration_seconds / (virtualClass.total_scheduled_duration_minutes * 60)) * 100)}%)
                    </td>

                    <td className="py-4 px-5">{getStatusBadge(a.attendance_status)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ClassroomAttendancePage;
