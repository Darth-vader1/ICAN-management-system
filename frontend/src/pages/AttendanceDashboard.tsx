/**
 * Attendance Dashboard Page
 * Shows attendance overview, statistics, and recent sessions
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { classSessionService, attendanceRecordService } from '../services/attendanceService';
import type { ClassSession, CourseAttendanceStats, AttendanceRecord } from '../types/attendance';

export default function AttendanceDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [upcomingSessions, setUpcomingSessions] = useState<ClassSession[]>([]);
  const [recentSessions, setRecentSessions] = useState<ClassSession[]>([]);
  const [courseStats, setCourseStats] = useState<CourseAttendanceStats[]>([]);
  const [myAttendance, setMyAttendance] = useState<AttendanceRecord[]>([]);

  const isStaff = user?.is_staff_role ?? ['super_admin', 'manager', 'finance', 'student_officer', 'it_admin'].includes(user?.role ?? '');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];

      if (isStaff) {
        // Staff view: upcoming sessions and course stats
        try {
          const [upcomingResp, recentResp] = await Promise.all([
            classSessionService.getAll({
              start_date: today,
              status: 'scheduled',
            }).catch(() => ({ results: [] })),
            classSessionService.getAll({
              end_date: today,
              status: 'completed',
            }).catch(() => ({ results: [] })),
          ]);

          setUpcomingSessions(Array.isArray(upcomingResp.results) ? upcomingResp.results.slice(0, 5) : []);
          setRecentSessions(Array.isArray(recentResp.results) ? recentResp.results.slice(0, 5) : []);

          // Try to get course stats but don't fail if it errors
          try {
            const statsResp = await attendanceRecordService.getCourseStats();
            setCourseStats(Array.isArray(statsResp) ? statsResp : []);
          } catch (statsError) {
            console.warn('Could not load course stats:', statsError);
            setCourseStats([]);
          }
        } catch (error) {
          console.warn('Could not load attendance sessions:', error);
          setUpcomingSessions([]);
          setRecentSessions([]);
          setCourseStats([]);
        }
      } else {
        // Student view: my attendance records
        try {
          const attendance = await attendanceRecordService.getMyAttendance();
          setMyAttendance(Array.isArray(attendance) ? attendance.slice(0, 10) : []);
        } catch (error) {
          console.warn('Could not load my attendance:', error);
          setMyAttendance([]);
        }
      }
    } catch (error) {
      console.error('Failed to fetch attendance data:', error);
      // Set empty arrays on error
      setUpcomingSessions([]);
      setRecentSessions([]);
      setCourseStats([]);
      setMyAttendance([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present':
        return 'bg-green-100 text-green-800';
      case 'absent':
        return 'bg-red-100 text-red-800';
      case 'late':
        return 'bg-yellow-100 text-yellow-800';
      case 'excused':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getSessionStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const calculateMyStats = () => {
    const total = myAttendance.length;
    if (total === 0) return { present: 0, absent: 0, late: 0, rate: 0 };

    const present = myAttendance.filter(r => r.status === 'present').length;
    const absent = myAttendance.filter(r => r.status === 'absent').length;
    const late = myAttendance.filter(r => r.status === 'late').length;
    const rate = total > 0 ? Math.round(((present + late) / total) * 100) : 0;

    return { present, absent, late, rate };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Attendance Dashboard</h1>
        <p className="mt-2 text-sm text-gray-600">
          {isStaff
            ? 'Manage class sessions and track student attendance'
            : 'View your attendance records and statistics'}
        </p>
      </div>

      {isStaff ? (
        /* Staff View */
        <>
          {/* Course Statistics */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Course Statistics</h2>
              <Link
                to="/attendance/reports"
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                View All Reports →
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {courseStats.map(stat => (
                <div key={stat.course_offering_id} className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {stat.course_code}
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">{stat.course_name}</p>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Sessions:</span>
                      <span className="font-medium">
                        {stat.sessions_completed}/{stat.total_sessions}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Students:</span>
                      <span className="font-medium">{stat.total_students}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Avg. Attendance:</span>
                      <span
                        className={`font-bold ${
                          stat.average_attendance_rate >= 80
                            ? 'text-green-600'
                            : stat.average_attendance_rate >= 60
                            ? 'text-yellow-600'
                            : 'text-red-600'
                        }`}
                      >
                        {stat.average_attendance_rate.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Upcoming Sessions */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Upcoming Sessions</h2>
              <Link
                to="/attendance/sessions"
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                View All Sessions →
              </Link>
            </div>

            {upcomingSessions.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
                No upcoming sessions
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Course
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Title
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Time
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Location
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {upcomingSessions.map(session => (
                      <tr key={session.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {session.course_code}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">{session.title}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {new Date(session.session_date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {session.start_time} - {session.end_time}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {session.location}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full ${getSessionStatusColor(
                              session.status
                            )}`}
                          >
                            {session.status_display}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Recent Sessions */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Sessions</h2>

            {recentSessions.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
                No recent sessions
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {recentSessions.map(session => (
                  <div key={session.id} className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {session.course_code}
                        </h3>
                        <p className="text-sm text-gray-600">{session.title}</p>
                      </div>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${getSessionStatusColor(
                          session.status
                        )}`}
                      >
                        {session.status_display}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Date:</span>
                        <span className="font-medium">
                          {new Date(session.session_date).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Attendance Rate:</span>
                        <span
                          className={`font-bold ${
                            session.attendance_rate >= 80
                              ? 'text-green-600'
                              : session.attendance_rate >= 60
                              ? 'text-yellow-600'
                              : 'text-red-600'
                          }`}
                        >
                          {session.attendance_rate.toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Students:</span>
                        <span className="font-medium">
                          {session.present_count + session.late_count}/{session.total_students}
                        </span>
                      </div>
                    </div>

                    <Link
                      to={`/attendance/sessions/${session.id}`}
                      className="mt-4 block text-center text-sm text-blue-600 hover:text-blue-800 font-medium"
                    >
                      View Details →
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      ) : (
        /* Student View */
        <>
          {/* My Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            {(() => {
              const stats = calculateMyStats();
              return (
                <>
                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="text-sm text-gray-600 mb-1">Attendance Rate</div>
                    <div
                      className={`text-3xl font-bold ${
                        stats.rate >= 80
                          ? 'text-green-600'
                          : stats.rate >= 60
                          ? 'text-yellow-600'
                          : 'text-red-600'
                      }`}
                    >
                      {stats.rate}%
                    </div>
                  </div>
                  <div className="bg-green-50 rounded-lg shadow p-6">
                    <div className="text-sm text-gray-600 mb-1">Present</div>
                    <div className="text-3xl font-bold text-green-600">{stats.present}</div>
                  </div>
                  <div className="bg-yellow-50 rounded-lg shadow p-6">
                    <div className="text-sm text-gray-600 mb-1">Late</div>
                    <div className="text-3xl font-bold text-yellow-600">{stats.late}</div>
                  </div>
                  <div className="bg-red-50 rounded-lg shadow p-6">
                    <div className="text-sm text-gray-600 mb-1">Absent</div>
                    <div className="text-3xl font-bold text-red-600">{stats.absent}</div>
                  </div>
                </>
              );
            })()}
          </div>

          {/* My Attendance Records */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Attendance</h2>

            {myAttendance.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
                No attendance records yet
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Session
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Notes
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {myAttendance.map(record => (
                      <tr key={record.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {new Date(record.marked_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {/* We'd need to fetch session details or include in response */}
                          Session
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                              record.status
                            )}`}
                          >
                            {record.status_display}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">{record.notes || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
