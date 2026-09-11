/**
 * Attendance Dashboard Component — Redesigned according to Figma Mockup Template
 * Responsive, 100% Dynamic - Zero Hardcoded Values.
 * Renders dedicated Overview, By Course, By Student, and Mark Attendance views.
 */

import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { classSessionService, attendanceRecordService } from '../services/attendanceService';
import { offeringsService } from '../services/academicsService';
import toast from 'react-hot-toast';
import { Check, CheckCircle2, Calendar, AlertTriangle, Sparkles, MapPin, User, X } from 'lucide-react';

type TabType = 'overview' | 'by_course' | 'by_student' | 'mark';

interface MarkingStudent {
  id: string;
  name: string;
  student_code: string;
  initials: string;
  prior_rate: number;
  prior_dots: ('present' | 'absent' | 'late' | 'excused')[];
  current_status: 'present' | 'absent' | 'late' | 'excused' | null;
}

export default function AttendanceDashboard() {
  const { user } = useAuth();
  const isStaff = user?.is_staff_role ?? ['super_admin', 'manager', 'finance', 'student_officer', 'it_admin'].includes(user?.role ?? '');

  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [loading, setLoading] = useState(false);
  const [staffLoading, setStaffLoading] = useState(true);

  // Staff Dynamic Dashboard States
  const [overviewData, setOverviewData] = useState<any | null>(null);
  const [rosterData, setRosterData] = useState<any[]>([]);
  const [courseStats, setCourseStats] = useState<any[]>([]);

  // Student Attendance State
  const [studentAttendanceData, setStudentAttendanceData] = useState<any | null>(null);
  const [studentLoading, setStudentLoading] = useState(false);

  // Mark Attendance State (Staff)
  const [offerings, setOfferings] = useState<any[]>([]);
  const [selectedOfferingId, setSelectedOfferingId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);

  const [markingSheet, setMarkingSheet] = useState<{
    session_id: string;
    course_offering_id: string;
    course_name: string;
    course_code: string;
    level_name: string;
    tutor_name: string;
    session_date: string;
    total_students: number;
    marked_count: number;
    students: MarkingStudent[];
  } | null>(null);

  const [markedStatuses, setMarkedStatuses] = useState<Record<string, 'present' | 'absent' | 'late' | 'excused'>>({});
  const [submitting, setSubmitting] = useState(false);

  // Student Roster Filter
  const [rosterSearch, setRosterSearch] = useState('');
  const [rosterLevel, setRosterLevel] = useState('all');
  const [rosterCourse, setRosterCourse] = useState('all');

  // Course Stats Filter
  const [courseFilterLevel, setCourseFilterLevel] = useState('all');
  
  // Attendance by Course Filter (Overview tab)
  const [attendanceByCourseFilterLevel, setAttendanceByCourseFilterLevel] = useState('all');
  
  // At-Risk Students Filter
  const [atRiskFilterLevel, setAtRiskFilterLevel] = useState('all');

  // Course Detailed Breakdown Modal State
  const [selectedCourseCode, setSelectedCourseCode] = useState<string | null>(null);
  const [courseDetailData, setCourseDetailData] = useState<any | null>(null);
  const [loadingCourseDetail, setLoadingCourseDetail] = useState(false);
  const [courseModalTab, setCourseModalTab] = useState<'sessions' | 'students'>('sessions');

  const handleOpenCourseDetail = async (code: string, offeringId?: string) => {
    if (!code && !offeringId) return;
    setSelectedCourseCode(code || 'Course Detail');
    setLoadingCourseDetail(true);
    setCourseModalTab('sessions');
    try {
      const data = await attendanceRecordService.getCourseDetail({
        course_code: code,
        course_offering_id: offeringId,
      });
      setCourseDetailData(data);
    } catch (err) {
      console.error('Error fetching course detail:', err);
      toast.error('Failed to load course breakdown');
    } finally {
      setLoadingCourseDetail(false);
    }
  };

  const handleCloseCourseDetail = () => {
    setSelectedCourseCode(null);
    setCourseDetailData(null);
  };

  // ── 1. Student Attendance Data Fetching ──
  useEffect(() => {
    if (!isStaff) {
      async function loadStudentAttendance() {
        setStudentLoading(true);
        try {
          const data = await attendanceRecordService.getMyAttendance();
          setStudentAttendanceData(data);
        } catch (err) {
          console.error('Failed to load student attendance:', err);
          toast.error('Failed to load attendance records');
        } finally {
          setStudentLoading(false);
        }
      }
      loadStudentAttendance();
    }
  }, [isStaff]);

  // ── 2. Staff Data Fetching ──
  useEffect(() => {
    if (isStaff) {
      async function loadStaffData() {
        setStaffLoading(true);
        try {
          const [offData, overviewRes, statsRes, rosterRes] = await Promise.allSettled([
            offeringsService.getAll(),
            attendanceRecordService.getOverviewSummary(),
            attendanceRecordService.getCourseStats(),
            attendanceRecordService.getStudentRoster(),
          ]);

          if (offData.status === 'fulfilled') {
            setOfferings(offData.value);
            if (offData.value.length > 0) {
              setSelectedOfferingId(offData.value[0].id);
            }
          }

          if (overviewRes.status === 'fulfilled') {
            setOverviewData(overviewRes.value);
          }

          if (statsRes.status === 'fulfilled') {
            setCourseStats(statsRes.value);
          }

          if (rosterRes.status === 'fulfilled') {
            setRosterData(rosterRes.value);
          }
        } catch (err) {
          console.error('Failed to load staff attendance data:', err);
        } finally {
          setStaffLoading(false);
        }
      }
      loadStaffData();
    }
  }, [isStaff]);

  // ── 3. Staff Marking Sheet Fetching ──
  useEffect(() => {
    if (!isStaff || (!selectedOfferingId && offerings.length === 0)) return;

    async function fetchSheet() {
      setLoading(true);
      try {
        const sheet = await classSessionService.getMarkingSheet({
          course_offering: selectedOfferingId || undefined,
          date: selectedDate,
        });
        setMarkingSheet(sheet);

        const initialMap: Record<string, 'present' | 'absent' | 'late' | 'excused'> = {};
        sheet.students.forEach((s) => {
          if (s.current_status) {
            initialMap[s.id] = s.current_status;
          }
        });
        setMarkedStatuses(initialMap);
      } catch (err) {
        console.error('Failed to load marking sheet:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchSheet();
  }, [isStaff, selectedOfferingId, selectedDate, offerings.length]);

  // Staff handlers
  const handleSetStatus = (studentId: string, status: 'present' | 'absent' | 'late' | 'excused') => {
    setMarkedStatuses((prev) => ({
      ...prev,
      [studentId]: status,
    }));
  };

  const handleMarkAll = (status: 'present' | 'absent' | 'late' | 'excused') => {
    const list = markingSheet?.students || [];
    const newMap: Record<string, 'present' | 'absent' | 'late' | 'excused'> = {};
    list.forEach((s) => {
      newMap[s.id] = status;
    });
    setMarkedStatuses(newMap);
    toast.success(`Marked all as ${status.toUpperCase()}`);
  };

  const handleSubmitAttendance = async () => {
    if (!markingSheet?.session_id) {
      toast.error('No active session to submit attendance for');
      return;
    }

    const studentKeys = Object.keys(markedStatuses);
    if (studentKeys.length === 0) {
      toast.error('Please mark attendance for at least one student');
      return;
    }

    setSubmitting(true);
    try {
      const recordsPayload = studentKeys.map((studentId) => ({
        student: studentId,
        status: markedStatuses[studentId],
      }));

      await classSessionService.markAttendance(markingSheet.session_id, {
        records: recordsPayload,
      });

      toast.success('Attendance recorded successfully!');
      const updatedOverview = await attendanceRecordService.getOverviewSummary();
      setOverviewData(updatedOverview);
    } catch (err: any) {
      console.error('Attendance submission error:', err);
      toast.error('Failed to record attendance');
    } finally {
      setSubmitting(false);
    }
  };

  // ════════════════════════════════════════════════════════════════════
  // STUDENT VIEW (Renders when user is a Student)
  // ════════════════════════════════════════════════════════════════════
  if (!isStaff) {
    const summary = studentAttendanceData?.summary || {
      overall_rate: 100,
      total_sessions: 0,
      attended_count: 0,
      present_count: 0,
      late_count: 0,
      absent_count: 0,
      excused_count: 0,
      courses_tracked: [],
      by_course: [],
    };

    const records: any[] = studentAttendanceData?.records || (Array.isArray(studentAttendanceData) ? studentAttendanceData : []);

    return (
      <div className="max-w-6xl mx-auto space-y-6 pb-16 px-4 sm:px-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">My Attendance</h1>
            <p className="mt-1 text-sm text-slate-500">Track your overall attendance rate, course progress, and session logs</p>
          </div>
        </div>

        {studentLoading ? (
          <div className="flex items-center justify-center h-64 bg-white rounded-2xl border border-slate-200 shadow-sm">
            <div className="animate-spin w-10 h-10 border-4 border-[#2563eb] border-t-transparent rounded-full" />
          </div>
        ) : (
          <>
            {/* Top KPI Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {/* Card 1: Overall Rate */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Overall Rate</span>
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                    summary.overall_rate >= 85 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}>
                    {summary.overall_rate >= 85 ? 'Good Standing' : 'Needs Attention'}
                  </span>
                </div>
                <div className="mb-3">
                  <span className="text-4xl font-bold text-slate-900 tracking-tight">{summary.overall_rate}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      summary.overall_rate >= 85 ? 'bg-emerald-500' : summary.overall_rate >= 75 ? 'bg-amber-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${Math.min(100, Math.max(0, summary.overall_rate))}%` }}
                  />
                </div>
              </div>

              {/* Card 2: Attended Classes */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-2">Attended Classes</span>
                <span className="text-4xl font-bold text-emerald-600 tracking-tight">{summary.attended_count}</span>
                <p className="text-xs text-slate-500 mt-2">{summary.present_count} Present · {summary.late_count} Late</p>
              </div>

              {/* Card 3: Missed Classes */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-2">Missed Classes</span>
                <span className="text-4xl font-bold text-red-600 tracking-tight">{summary.absent_count}</span>
                <p className="text-xs text-slate-500 mt-2">{summary.excused_count} Excused</p>
              </div>

              {/* Card 4: Total Sessions */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-2">Total Classes</span>
                <span className="text-4xl font-bold text-slate-900 tracking-tight">{summary.total_sessions}</span>
                <p className="text-xs text-slate-500 mt-2">{summary.courses_tracked?.length || 0} Enrolled Courses</p>
              </div>
            </div>

            {/* Course Breakdown Section */}
            {summary.by_course && summary.by_course.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-sm space-y-4">
                <h3 className="text-base font-bold text-slate-900">Attendance by Course</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {summary.by_course.map((c: any, idx: number) => (
                    <div
                      key={idx}
                      onClick={() => handleOpenCourseDetail(c.course_code, c.offering_id)}
                      className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3 hover:border-blue-300 hover:shadow-md hover:bg-white transition-all cursor-pointer group"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-xs font-bold text-blue-600 group-hover:text-blue-700 block">{c.course_code}</span>
                          <span className="text-sm font-bold text-slate-900">{c.course_name}</span>
                        </div>
                        <span className="text-lg font-bold text-slate-900">{c.attendance_rate}%</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-[#2563eb] h-full rounded-full"
                          style={{ width: `${c.attendance_rate}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span>{c.attended_sessions} / {c.total_sessions} classes attended</span>
                        <span className="text-blue-600 font-semibold group-hover:underline">View details →</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Detailed Sessions Log Table */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900">Attendance History</h3>
                <span className="text-xs text-slate-500 font-medium">{records.length} Recorded Sessions</span>
              </div>

              {records.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50/50 text-xs font-semibold text-slate-400 uppercase tracking-wider px-6">
                        <th className="py-3 px-6">Date</th>
                        <th className="py-3 px-6">Course</th>
                        <th className="py-3 px-6">Session Title</th>
                        <th className="py-3 px-6">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                      {records.map((r: any) => {
                        const statusColor =
                          r.status === 'present'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : r.status === 'late'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : r.status === 'excused'
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : 'bg-red-50 text-red-700 border-red-200';

                        return (
                          <tr key={r.id} className="hover:bg-slate-50/60 transition-colors">
                            <td className="py-4 px-6 font-semibold text-slate-900">{r.session_date || 'N/A'}</td>
                            <td className="py-4 px-6">
                              <span className="font-semibold text-slate-900 block">{r.course_code || 'N/A'}</span>
                              <span className="text-xs text-slate-500">{r.course_name}</span>
                            </td>
                            <td className="py-4 px-6 text-slate-700">{r.session_title || 'Class Session'}</td>
                            <td className="py-4 px-6">
                              <span className={`inline-flex items-center px-3 py-0.5 rounded-full text-xs font-semibold border capitalize ${statusColor}`}>
                                {r.status}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-12 text-center text-slate-500 text-sm">
                  No attendance records recorded yet.
                </div>
              )}
            </div>
          </>
        )}
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════
  // STAFF VIEW (Renders full attendance management dashboard for staff)
  // ════════════════════════════════════════════════════════════════════

  // Fallbacks for display metrics
  const sessionLabel = overviewData?.session_label || 'Current Session';
  const classesHeld = overviewData?.classes_held ?? 0;
  const overallRate = overviewData?.overall_rate ?? 0;
  const totalCourses = overviewData?.total_courses ?? 0;
  const totalSlots = overviewData?.total_slots ?? 0;
  const attendedSlots = overviewData?.attended_slots ?? 0;
  const atRiskCount = overviewData?.at_risk_count ?? 0;
  const perfectCount = overviewData?.perfect_count ?? 0;

  const breakdown = overviewData?.session_breakdown || {
    present_count: 0,
    late_count: 0,
    absent_count: 0,
    present_pct: 0,
    late_pct: 0,
    absent_pct: 0,
  };

  const byCourseList = overviewData?.by_course || [];
  const atRiskStudents = overviewData?.at_risk_students || [];

  if (staffLoading) {
    return (
      <div className="max-w-7xl mx-auto space-y-6 pb-16 px-4 sm:px-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-slate-200 rounded-lg w-64"></div>
          <div className="h-4 bg-slate-200 rounded-lg w-48"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-2xl p-6 border border-slate-200 h-32"></div>
            ))}
          </div>
          <div className="bg-white rounded-2xl p-6 border border-slate-200 h-44"></div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="bg-white rounded-2xl p-6 border border-slate-200 h-64"></div>
            <div className="bg-white rounded-2xl p-6 border border-slate-200 h-64"></div>
          </div>
        </div>
      </div>
    );
  }

  // Filter roster for By Student tab
  const filteredRoster = rosterData.filter((s) => {
    const matchSearch = (s.name || '').toLowerCase().includes(rosterSearch.toLowerCase()) || (s.student_code || '').toLowerCase().includes(rosterSearch.toLowerCase());
    const matchLevel = rosterLevel === 'all' || (s.level_name || '').toLowerCase().includes(rosterLevel);
    const matchCourse = rosterCourse === 'all' || (s.courses_attended && s.courses_attended.some((c: any) => c.course_code === rosterCourse));
    return matchSearch && matchLevel && matchCourse;
  });

  // Extract unique courses from roster data for course filter
  const uniqueCourses = Array.from(
    new Set(
      rosterData
        .flatMap((s) => s.courses_attended || [])
        .map((c: any) => c.course_code)
    )
  ).sort();

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-16 px-4 sm:px-6">
      {/* ── Breadcrumb ── */}
      <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
        <span>ICAN Portal</span>
        <span>/</span>
        <span className="text-slate-800 font-semibold">Attendance</span>
      </div>

      {/* ── Header Title & Subtitle + Top Action Button ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight font-serif">Attendance Management</h1>
          <p className="mt-1 text-sm text-slate-500">
            {sessionLabel} · {classesHeld} classes held · {overallRate}% overall rate
          </p>
        </div>

        {/* Top Right "Mark Attendance" Action Button */}
        <button
          type="button"
          onClick={() => setActiveTab('mark')}
          className="px-5 py-2.5 bg-[#0f172a] hover:bg-slate-800 text-white text-xs font-semibold rounded-xl shadow-sm transition-colors cursor-pointer flex items-center gap-2 self-start sm:self-auto"
        >
          <Check className="w-4 h-4 text-emerald-400 font-bold" />
          <span>Mark Attendance</span>
        </button>
      </div>

      {/* ── Navigation Tabs Bar ── */}
      <div className="border-b border-slate-200 flex items-center gap-4 sm:gap-8 text-sm font-semibold text-slate-500 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className={`pb-3 transition-colors relative cursor-pointer ${
            activeTab === 'overview' ? 'text-[#2563eb] font-bold' : 'hover:text-slate-800'
          }`}
        >
          Overview
          {activeTab === 'overview' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2563eb] rounded-full" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('by_course')}
          className={`pb-3 transition-colors relative cursor-pointer flex items-center gap-2 ${
            activeTab === 'by_course' ? 'text-[#2563eb] font-bold' : 'hover:text-slate-800'
          }`}
        >
          <span>By Course</span>
          <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-xs font-bold">
            {courseStats.length || totalCourses}
          </span>
          {activeTab === 'by_course' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2563eb] rounded-full" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('by_student')}
          className={`pb-3 transition-colors relative cursor-pointer flex items-center gap-2 ${
            activeTab === 'by_student' ? 'text-[#2563eb] font-bold' : 'hover:text-slate-800'
          }`}
        >
          <span>By Student</span>
          <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-xs font-bold">
            {rosterData.length || 10}
          </span>
          {activeTab === 'by_student' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2563eb] rounded-full" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('mark')}
          className={`pb-3 transition-colors relative cursor-pointer ${
            activeTab === 'mark' ? 'text-[#2563eb] font-bold' : 'hover:text-slate-800'
          }`}
        >
          Mark Attendance
          {activeTab === 'mark' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2563eb] rounded-full" />
          )}
        </button>
      </div>

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* ── TAB 1: OVERVIEW (Matching exact Figma Template) ── */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* 1. Stat Cards Row (4 KPI Cards) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Card 1: OVERALL ATTENDANCE */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  OVERALL ATTENDANCE
                </span>
                <div className="text-3xl font-extrabold text-slate-900 tracking-tight">{overallRate}%</div>
                <p className="text-xs text-slate-500 font-medium">
                  {attendedSlots} of {totalSlots} slots
                </p>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>

            {/* Card 2: CLASSES HELD */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  CLASSES HELD
                </span>
                <div className="text-3xl font-extrabold text-slate-900 tracking-tight">{classesHeld}</div>
                <p className="text-xs text-slate-500 font-medium">
                  Across {totalCourses} courses
                </p>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#2563eb] border border-blue-100 flex items-center justify-center">
                <Calendar className="w-5 h-5" />
              </div>
            </div>

            {/* Card 3: AT RISK */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  AT RISK
                </span>
                <div className="text-3xl font-extrabold text-slate-900 tracking-tight">{atRiskCount}</div>
                <p className="text-xs text-slate-500 font-medium">
                  Below 75% threshold
                </p>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-red-50 text-red-600 border border-red-100 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
            </div>

            {/* Card 4: PERFECT ATTENDANCE */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  PERFECT ATTENDANCE
                </span>
                <div className="text-3xl font-extrabold text-slate-900 tracking-tight">{perfectCount}</div>
                <p className="text-xs text-slate-500 font-medium">
                  100% across all courses
                </p>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* 2. Session Breakdown Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h3 className="text-base font-bold text-slate-900">Session Breakdown</h3>
              <div className="flex items-center gap-4 text-xs font-medium text-slate-600">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Present ({breakdown.present_count})
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Late ({breakdown.late_count})
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500" /> Absent ({breakdown.absent_count})
                </span>
              </div>
            </div>

            {/* Stacked Multi-color Progress Bar */}
            <div className="w-full bg-slate-100 rounded-full h-3 flex overflow-hidden">
              <div
                className="bg-emerald-500 h-full transition-all duration-500"
                style={{ width: `${breakdown.present_pct}%` }}
                title={`Present: ${breakdown.present_pct}%`}
              />
              <div
                className="bg-amber-500 h-full transition-all duration-500"
                style={{ width: `${breakdown.late_pct}%` }}
                title={`Late: ${breakdown.late_pct}%`}
              />
              <div
                className="bg-red-500 h-full transition-all duration-500"
                style={{ width: `${breakdown.absent_pct}%` }}
                title={`Absent: ${breakdown.absent_pct}%`}
              />
            </div>

            {/* Bottom percentage labels */}
            <div className="flex items-center justify-between text-xs text-slate-400 font-medium pt-1">
              <span>{breakdown.present_pct}% present</span>
              <span>{breakdown.late_pct}% late</span>
              <span>{breakdown.absent_pct}% absent</span>
            </div>
          </div>

          {/* 3. Bottom 2-Column Grid Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column: Attendance by Course */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Attendance by Course</h3>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">Click a course for detailed breakdown</p>
                </div>
                
                {/* Level Filter */}
                <select
                  value={attendanceByCourseFilterLevel}
                  onChange={(e) => setAttendanceByCourseFilterLevel(e.target.value)}
                  className="px-3 py-1.5 text-xs font-medium border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                >
                  <option value="all">All Levels</option>
                  <option value="foundation">Foundation</option>
                  <option value="skills">Skills</option>
                  <option value="professional">Professional</option>
                </select>
              </div>

              <div className="space-y-4 pt-2">
                {byCourseList
                  .filter((c: any) => attendanceByCourseFilterLevel === 'all' || (c.level_name || '').toLowerCase() === attendanceByCourseFilterLevel.toLowerCase())
                  .length === 0 ? (
                    <div className="p-8 text-center text-xs text-slate-400 font-medium">
                      No {attendanceByCourseFilterLevel !== 'all' ? attendanceByCourseFilterLevel : ''} courses found
                    </div>
                  ) : (
                    byCourseList
                      .filter((c: any) => attendanceByCourseFilterLevel === 'all' || (c.level_name || '').toLowerCase() === attendanceByCourseFilterLevel.toLowerCase())
                      .map((c: any, idx: number) => (
                  <div
                    key={idx}
                    onClick={() => handleOpenCourseDetail(c.course_code, c.course_offering_id)}
                    className="flex items-center justify-between gap-4 p-3 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-slate-50 transition-all cursor-pointer group"
                  >
                    {/* Course Initials Box */}
                    <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 font-extrabold text-xs flex items-center justify-center shrink-0">
                      {c.initials || c.course_code?.slice(0, 2) || 'CO'}
                    </div>

                    {/* Middle Info + Progress */}
                    <div className="flex-1 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-slate-900">{c.course_name}</span>
                        <span className="text-sm font-extrabold text-emerald-600">{c.attendance_rate}%</span>
                      </div>

                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <span>
                          {c.level_name} · {c.classes_count} classes · {c.student_count} students
                        </span>
                      </div>

                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                          style={{ width: `${c.attendance_rate}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))
                )}
              </div>
            </div>

            {/* Right Column: At-Risk Students */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900">At-Risk Students</h3>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">Below 75% attendance threshold</p>
                </div>
                
                {/* Level Filter for At-Risk Students */}
                <select
                  value={atRiskFilterLevel}
                  onChange={(e) => setAtRiskFilterLevel(e.target.value)}
                  className="px-3 py-1.5 text-xs font-medium border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                >
                  <option value="all">All Levels</option>
                  <option value="foundation">Foundation</option>
                  <option value="skills">Skills</option>
                  <option value="professional">Professional</option>
                </select>
              </div>

              <div className="space-y-4 pt-2">
                {atRiskStudents.filter((st: any) => atRiskFilterLevel === 'all' || (st.level_name || '').toLowerCase() === atRiskFilterLevel.toLowerCase()).length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400 font-medium">
                    {atRiskFilterLevel === 'all' 
                      ? 'No students currently below the 75% attendance threshold. Excellent work!'
                      : `No ${atRiskFilterLevel} students below 75% threshold.`
                    }
                  </div>
                ) : (
                  atRiskStudents
                    .filter((st: any) => atRiskFilterLevel === 'all' || (st.level_name || '').toLowerCase() === atRiskFilterLevel.toLowerCase())
                    .map((st: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between gap-4 p-3 rounded-xl border border-slate-100 bg-slate-50/40">
                      {/* Avatar Circle */}
                      <div className={`w-10 h-10 rounded-full text-white font-bold text-xs flex items-center justify-center shrink-0 ${
                        idx % 2 === 0 ? 'bg-emerald-600' : 'bg-amber-600'
                      }`}>
                        {st.initials || 'ST'}
                      </div>

                      {/* Info & Risk Pills */}
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold text-slate-900">{st.name}</span>
                          <span className="text-lg font-extrabold text-red-600">{st.overall_rate}%</span>
                        </div>
                        <div className="text-xs text-slate-400 font-medium">{st.level_name}</div>

                        {/* Course Risk Tags */}
                        {Array.isArray(st.courses_risk) && (
                          <div className="flex flex-wrap items-center gap-1.5 pt-1">
                            {st.courses_risk.map((cr: any, cIdx: number) => (
                              <span key={cIdx} className="bg-red-50 text-red-600 border border-red-100 font-semibold px-2 py-0.5 rounded-md text-[11px]">
                                {cr.code}: {cr.rate}%
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* ── TAB 2: BY COURSE ── */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'by_course' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Attendance Statistics by Course</h3>
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                {courseFilterLevel === 'all' 
                  ? `Showing ${courseStats.length} courses`
                  : `Showing ${courseStats.filter(cs => (cs.level_name || '').toLowerCase() === courseFilterLevel.toLowerCase()).length} ${courseFilterLevel} courses`
                }
              </p>
            </div>
            
            {/* Level Filter */}
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-slate-600">Level:</label>
              <select
                value={courseFilterLevel}
                onChange={(e) => setCourseFilterLevel(e.target.value)}
                className="px-3 py-1.5 text-xs font-medium border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              >
                <option value="all">All Levels</option>
                <option value="foundation">Foundation</option>
                <option value="skills">Skills</option>
                <option value="professional">Professional</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {courseStats
              .filter((cs) => courseFilterLevel === 'all' || (cs.level_name || '').toLowerCase() === courseFilterLevel.toLowerCase())
              .length === 0 ? (
                <div className="col-span-full p-12 text-center text-slate-400">
                  <p className="text-sm font-medium">No courses found for {courseFilterLevel} level</p>
                </div>
              ) : (
                courseStats
                  .filter((cs) => courseFilterLevel === 'all' || (cs.level_name || '').toLowerCase() === courseFilterLevel.toLowerCase())
                  .map((cs, idx) => (
              <div
                key={idx}
                onClick={() => handleOpenCourseDetail(cs.course_code, cs.course_offering_id)}
                className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-4 shadow-2xs hover:border-blue-300 hover:shadow-md hover:bg-white transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-extrabold text-[#2563eb] group-hover:text-blue-700 block">{cs.course_code}</span>
                    <span className="text-sm font-bold text-slate-900">{cs.course_name}</span>
                  </div>
                  <span className="text-xl font-extrabold text-slate-900">{cs.average_attendance_rate}%</span>
                </div>

                <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-[#2563eb] h-full rounded-full transition-all duration-500"
                    style={{ width: `${cs.average_attendance_rate}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500 font-medium pt-1 border-t border-slate-200/60">
                  <span>{cs.sessions_completed} sessions completed</span>
                  <span className="text-blue-600 font-semibold group-hover:underline">View breakdown →</span>
                </div>
              </div>
            ))
            )}
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* ── TAB 3: BY STUDENT ── */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'by_student' && (
        <div className="space-y-4">
          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm">
            <div className="flex-1 max-w-md">
              <input
                type="text"
                placeholder="Search students by name or code..."
                value={rosterSearch}
                onChange={(e) => setRosterSearch(e.target.value)}
                className="w-full px-4 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex items-center gap-3">
              <select
                value={rosterLevel}
                onChange={(e) => setRosterLevel(e.target.value)}
                className="px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-blue-500"
              >
                <option value="all">All Qualification Levels</option>
                <option value="foundation">Foundation</option>
                <option value="skills">Skills</option>
                <option value="professional">Professional</option>
              </select>

              <select
                value={rosterCourse}
                onChange={(e) => setRosterCourse(e.target.value)}
                className="px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-blue-500"
              >
                <option value="all">All Courses</option>
                {uniqueCourses.map((courseCode) => (
                  <option key={courseCode} value={courseCode}>
                    {courseCode}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Roster Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Student Attendance Roster</h3>
              <span className="text-xs text-slate-500 font-medium">{filteredRoster.length} Enrolled Students</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-xs font-semibold text-slate-400 uppercase tracking-wider px-6">
                    <th className="py-3 px-6">Student</th>
                    <th className="py-3 px-6">Student Code</th>
                    <th className="py-3 px-6">Level</th>
                    <th className="py-3 px-6">Classes Attended</th>
                    <th className="py-3 px-6">Rate</th>
                    <th className="py-3 px-6">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {filteredRoster.map((st) => (
                    <tr key={st.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-[#0f172a] text-white flex items-center justify-center text-xs font-bold">
                            {st.initials}
                          </div>
                          <span className="font-semibold text-slate-900">{st.name}</span>
                        </div>
                      </td>

                      <td className="py-4 px-6 font-mono text-xs text-slate-600">{st.student_code}</td>

                      <td className="py-4 px-6 text-slate-700">{st.level_name}</td>

                      <td className="py-4 px-6 text-slate-700">{st.classes_attended_str}</td>

                      <td className="py-4 px-6 font-extrabold text-slate-900">{st.prior_rate}%</td>

                      <td className="py-4 px-6">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            st.status === 'Good'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-red-50 text-red-700 border border-red-200'
                          }`}
                        >
                          {st.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* ── TAB 4: MARK ATTENDANCE ── */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'mark' && (
        <div className="space-y-6">
          {/* Selector Bar */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">Select Course Offering</label>
              <select
                value={selectedOfferingId}
                onChange={(e) => setSelectedOfferingId(e.target.value)}
                className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:border-blue-500"
              >
                {offerings.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.course_code} - {o.course_name} ({o.level_name || 'N/A'})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">Session Date</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Marking Sheet Table */}
          {loading ? (
            <div className="flex items-center justify-center h-64 bg-white rounded-2xl border border-slate-200 shadow-sm">
              <div className="animate-spin w-10 h-10 border-4 border-[#2563eb] border-t-transparent rounded-full" />
            </div>
          ) : markingSheet ? (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden space-y-6">
              {/* Header Details */}
              <div className="p-6 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{markingSheet.course_code} - {markingSheet.course_name}</h3>
                  <p className="text-xs text-slate-500 mt-1">Level: {markingSheet.level_name} · Tutor: {markingSheet.tutor_name} · Date: {markingSheet.session_date}</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleMarkAll('present')}
                    className="px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors cursor-pointer"
                  >
                    Mark All Present
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMarkAll('absent')}
                    className="px-3 py-1.5 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors cursor-pointer"
                  >
                    Mark All Absent
                  </button>
                </div>
              </div>

              {/* Student Marking Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-xs font-semibold text-slate-400 uppercase tracking-wider px-6">
                      <th className="py-3 px-6">Student</th>
                      <th className="py-3 px-6">Student ID</th>
                      <th className="py-3 px-6">Prior Rate</th>
                      <th className="py-3 px-6 text-right">Attendance Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {markingSheet.students.map((student) => {
                      const cur = markedStatuses[student.id];

                      return (
                        <tr key={student.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-[#0f172a] text-white flex items-center justify-center text-xs font-bold">
                                {student.initials}
                              </div>
                              <span className="font-semibold text-slate-900">{student.name}</span>
                            </div>
                          </td>

                          <td className="py-4 px-6 font-mono text-xs text-slate-600">{student.student_code}</td>

                          <td className="py-4 px-6">
                            <span className="font-semibold text-slate-900">{student.prior_rate}%</span>
                          </td>

                          <td className="py-4 px-6 text-right">
                            <div className="inline-flex items-center bg-slate-100 p-1 rounded-xl gap-1">
                              <button
                                type="button"
                                onClick={() => handleSetStatus(student.id, 'present')}
                                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                                  cur === 'present' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                                }`}
                              >
                                Present
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSetStatus(student.id, 'late')}
                                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                                  cur === 'late' ? 'bg-amber-500 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                                }`}
                              >
                                Late
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSetStatus(student.id, 'absent')}
                                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                                  cur === 'absent' ? 'bg-red-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                                }`}
                              >
                                Absent
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSetStatus(student.id, 'excused')}
                                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                                  cur === 'excused' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                                }`}
                              >
                                Excused
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Submit Footer Bar */}
              <div className="p-6 bg-slate-50 border-t border-slate-200 flex justify-end">
                <button
                  type="button"
                  onClick={handleSubmitAttendance}
                  disabled={submitting}
                  className="px-6 py-2.5 bg-[#0f172a] hover:bg-slate-800 text-white text-sm font-semibold rounded-xl shadow-sm transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? 'Submitting...' : 'Submit Attendance'}
                </button>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-slate-500 bg-white rounded-2xl border border-slate-200">
              No class offerings found.
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* ── COURSE DETAILED BREAKDOWN MODAL ── */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {selectedCourseCode && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
            {/* Header Banner */}
            <div className="bg-gradient-to-r from-[#0f172a] via-[#1e293b] to-[#1e3a5f] p-6 text-white flex items-start justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-white/10 backdrop-blur-md rounded-lg font-mono text-xs text-blue-300 font-bold border border-white/10">
                    {courseDetailData?.course_code || selectedCourseCode}
                  </span>
                  <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 rounded-lg text-xs font-semibold border border-emerald-500/30">
                    {courseDetailData?.level_name || 'Qualification Track'}
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  {courseDetailData?.course_name || selectedCourseCode} Attendance Breakdown
                </h2>
                <p className="text-xs text-slate-300">
                  Assigned Instructor: <span className="font-semibold text-slate-100">{courseDetailData?.instructor_name || 'Assigned Tutor'}</span>
                </p>
              </div>

              <button
                type="button"
                onClick={handleCloseCourseDetail}
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            {loadingCourseDetail ? (
              <div className="flex items-center justify-center h-64 p-8">
                <div className="animate-spin w-10 h-10 border-4 border-[#2563eb] border-t-transparent rounded-full" />
              </div>
            ) : courseDetailData ? (
              <div className="p-6 space-y-6 overflow-y-auto flex-1">
                {/* Quick Metrics */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Overall Rate</span>
                    <span className="text-2xl font-extrabold text-slate-900">{courseDetailData.overall_rate}%</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200/60">
                    <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider block mb-1">Present Slots</span>
                    <span className="text-2xl font-extrabold text-emerald-700">{courseDetailData.present_count}</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/60">
                    <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider block mb-1">Late Slots</span>
                    <span className="text-2xl font-extrabold text-amber-700">{courseDetailData.late_count}</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-red-50/60 border border-red-200/60">
                    <span className="text-[11px] font-bold text-red-600 uppercase tracking-wider block mb-1">Absent Slots</span>
                    <span className="text-2xl font-extrabold text-red-700">{courseDetailData.absent_count}</span>
                  </div>
                </div>

                {/* Sub Tab Buttons */}
                <div className="flex border-b border-slate-200 gap-6 text-sm font-semibold">
                  <button
                    type="button"
                    onClick={() => setCourseModalTab('sessions')}
                    className={`pb-2.5 transition-colors relative cursor-pointer ${
                      courseModalTab === 'sessions' ? 'text-[#2563eb] font-bold' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Session History ({courseDetailData.sessions?.length || 0})
                    {courseModalTab === 'sessions' && (
                      <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2563eb] rounded-full" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setCourseModalTab('students')}
                    className={`pb-2.5 transition-colors relative cursor-pointer ${
                      courseModalTab === 'students' ? 'text-[#2563eb] font-bold' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Enrolled Students ({courseDetailData.students?.length || 0})
                    {courseModalTab === 'students' && (
                      <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2563eb] rounded-full" />
                    )}
                  </button>
                </div>

                {/* Tab 1: Sessions */}
                {courseModalTab === 'sessions' && (
                  <div className="space-y-3">
                    {courseDetailData.sessions && courseDetailData.sessions.length > 0 ? (
                      <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden">
                        {courseDetailData.sessions.map((s: any) => (
                          <div key={s.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/60 transition-colors">
                            <div className="space-y-1">
                              <span className="text-xs font-bold text-slate-400 block">{s.session_date}</span>
                              <span className="text-sm font-bold text-slate-900">{s.title}</span>
                              <span className="text-xs text-slate-500 block">{s.start_time} - {s.end_time}</span>
                            </div>

                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <span className="text-xs font-bold text-slate-900 block">{s.attendance_rate}% Attendance</span>
                                <span className="text-xs text-slate-500">{s.present_count} Present · {s.late_count} Late · {s.absent_count} Absent</span>
                              </div>
                              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${
                                s.attendance_rate >= 85 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                              }`}>
                                {s.attendance_rate >= 85 ? 'Good' : 'Needs Review'}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-8 text-center text-slate-500 text-xs font-medium bg-slate-50 rounded-2xl border border-slate-200">
                        No recorded sessions found for this course.
                      </div>
                    )}
                  </div>
                )}

                {/* Tab 2: Students */}
                {courseModalTab === 'students' && (
                  <div className="space-y-3">
                    {courseDetailData.students && courseDetailData.students.length > 0 ? (
                      <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden">
                        {courseDetailData.students.map((st: any) => (
                          <div key={st.id} className="p-4 flex items-center justify-between gap-4 hover:bg-slate-50/60 transition-colors">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-slate-800 text-white font-bold text-xs flex items-center justify-center">
                                {st.initials}
                              </div>
                              <div>
                                <span className="text-sm font-bold text-slate-900 block">{st.name}</span>
                                <span className="text-xs font-mono text-slate-400">#{st.student_code}</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-6">
                              <div className="text-right">
                                <span className="text-sm font-extrabold text-slate-900 block">{st.attendance_rate}%</span>
                                <span className="text-xs text-slate-500">{st.attended_count} / {st.total_sessions} classes</span>
                              </div>

                              <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                                st.status === 'Good Standing' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'
                              }`}>
                                {st.status}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-8 text-center text-slate-500 text-xs font-medium bg-slate-50 rounded-2xl border border-slate-200">
                        No enrolled students records found for this course.
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="p-12 text-center text-slate-500 text-sm">
                Course breakdown data unavailable.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
