/**
 * Attendance Service for ICAN Platform
 * Phase 7: Attendance System
 */

import api from '../lib/api';
import type {
  ClassSession,
  AttendanceRecord,
  AttendanceMarkRequest,
  AttendanceMarkResponse,
  StudentAttendanceSummary,
  CourseAttendanceStats,
} from '../types/attendance';

interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

/**
 * Class Session Service
 */
export const classSessionService = {
  /**
   * Get all class sessions
   */
  getAll: async (params?: {
    page?: number;
    instructor?: string;
    start_date?: string;
    end_date?: string;
    status?: string;
  }): Promise<PaginatedResponse<ClassSession>> => {
    const response = await api.get('/attendance/class-sessions/', { params });
    return response.data;
  },

  /**
   * Get session by ID
   */
  getById: async (id: string): Promise<ClassSession> => {
    const response = await api.get(`/attendance/class-sessions/${id}/`);
    return response.data;
  },

  /**
   * Create session
   */
  create: async (data: Partial<ClassSession>): Promise<ClassSession> => {
    const response = await api.post('/attendance/class-sessions/', data);
    return response.data;
  },

  /**
   * Update session
   */
  update: async (id: string, data: Partial<ClassSession>): Promise<ClassSession> => {
    const response = await api.patch(`/attendance/class-sessions/${id}/`, data);
    return response.data;
  },

  /**
   * Delete session
   */
  delete: async (id: string): Promise<void> => {
    await api.delete(`/attendance/class-sessions/${id}/`);
  },

  /**
   * Mark attendance for a session (bulk)
   */
  markAttendance: async (
    sessionId: string,
    data: AttendanceMarkRequest
  ): Promise<AttendanceMarkResponse> => {
    const response = await api.post(
      `/attendance/class-sessions/${sessionId}/mark_attendance/`,
      data
    );
    return response.data;
  },

  /**
   * Get attendance list for a session
   */
  getAttendanceList: async (sessionId: string): Promise<AttendanceRecord[]> => {
    const response = await api.get(
      `/attendance/class-sessions/${sessionId}/attendance_list/`
    );
    return response.data;
  },

  /**
   * Get marking sheet for a course offering and date
   */
  getMarkingSheet: async (params?: {
    course_offering?: string;
    date?: string;
  }): Promise<{
    session_id: string;
    course_offering_id: string;
    course_name: string;
    course_code: string;
    level_name: string;
    tutor_name: string;
    session_date: string;
    total_students: number;
    marked_count: number;
    students: Array<{
      id: string;
      name: string;
      student_code: string;
      initials: string;
      prior_rate: number;
      prior_dots: Array<'present' | 'absent' | 'late' | 'excused'>;
      current_status: 'present' | 'absent' | 'late' | 'excused' | null;
    }>;
  }> => {
    const response = await api.get('/attendance/class-sessions/marking_sheet/', { params });
    return response.data;
  },
};

/**
 * Attendance Record Service
 */
export const attendanceRecordService = {
  /**
   * Get all attendance records
   */
  getAll: async (params?: {
    page?: number;
    student?: string;
    class_session?: string;
    status?: string;
  }): Promise<PaginatedResponse<AttendanceRecord>> => {
    const response = await api.get('/attendance/records/', { params });
    return response.data;
  },

  /**
   * Get record by ID
   */
  getById: async (id: string): Promise<AttendanceRecord> => {
    const response = await api.get(`/attendance/records/${id}/`);
    return response.data;
  },

  /**
   * Create record
   */
  create: async (data: Partial<AttendanceRecord>): Promise<AttendanceRecord> => {
    const response = await api.post('/attendance/records/', data);
    return response.data;
  },

  /**
   * Update record
   */
  update: async (
    id: string,
    data: Partial<AttendanceRecord>
  ): Promise<AttendanceRecord> => {
    const response = await api.patch(`/attendance/records/${id}/`, data);
    return response.data;
  },

  /**
   * Delete record
   */
  delete: async (id: string): Promise<void> => {
    await api.delete(`/attendance/records/${id}/`);
  },

  /**
   * Get my attendance (for students)
   */
  getMyAttendance: async (params?: {
    course_offering?: string;
  }): Promise<AttendanceRecord[]> => {
    const response = await api.get('/attendance/records/my_attendance/', { params });
    return response.data;
  },

  /**
   * Get student attendance summary for a course
   */
  getStudentSummary: async (
    courseOfferingId: string
  ): Promise<StudentAttendanceSummary[]> => {
    const response = await api.get('/attendance/records/student_summary/', {
      params: { course_offering: courseOfferingId },
    });
    return response.data;
  },

  /**
   * Get attendance statistics for all courses
   */
  getCourseStats: async (): Promise<CourseAttendanceStats[]> => {
    const response = await api.get('/attendance/records/course_stats/');
    return response.data;
  },

  /**
   * Get aggregated dashboard overview summary
   */
  getOverviewSummary: async (): Promise<{
    session_label: string;
    classes_held: number;
    total_courses: number;
    overall_rate: number;
    total_slots: number;
    attended_slots: number;
    at_risk_count: number;
    perfect_count: number;
    session_breakdown: {
      present_count: number;
      late_count: number;
      absent_count: number;
      excused_count: number;
      present_pct: number;
      late_pct: number;
      absent_pct: number;
    };
    by_course: Array<{
      course_offering_id: string;
      course_code: string;
      course_name: string;
      level_name: string;
      classes_count: number;
      student_count: number;
      attendance_rate: number;
      initials: string;
    }>;
    at_risk_students: Array<{
      id: string;
      name: string;
      initials: string;
      level_name: string;
      overall_rate: number;
      courses_risk: Array<{ code: string; rate: number }>;
    }>;
  }> => {
    const response = await api.get('/attendance/records/overview_summary/');
    return response.data;
  },

  /**
   * Get student roster with attendance history
   */
  getStudentRoster: async (): Promise<Array<{
    id: string;
    name: string;
    student_code: string;
    initials: string;
    level_name: string;
    attended_count: number;
    total_sessions: number;
    classes_attended_str: string;
    prior_dots: ('present' | 'absent' | 'late' | 'excused')[];
    prior_rate: number;
    status: string;
  }>> => {
    const response = await api.get('/attendance/records/student_roster/');
    return response.data;
  },

  /**
   * Get detailed course breakdown
   */
  getCourseDetail: async (params: { course_code?: string; course_offering_id?: string }): Promise<{
    course_offering_id: string;
    course_code: string;
    course_name: string;
    level_name: string;
    instructor_name: string;
    overall_rate: number;
    total_sessions: number;
    total_students: number;
    present_count: number;
    late_count: number;
    absent_count: number;
    excused_count: number;
    sessions: Array<{
      id: string;
      title: string;
      session_date: string;
      start_time: string;
      end_time: string;
      status: string;
      attendance_rate: number;
      present_count: number;
      late_count: number;
      absent_count: number;
    }>;
    students: Array<{
      id: string;
      name: string;
      student_code: string;
      initials: string;
      attended_count: number;
      total_sessions: number;
      attendance_rate: number;
      status: string;
    }>;
  }> => {
    const response = await api.get('/attendance/records/course_detail/', { params });
    return response.data;
  },
};

export default { classSessionService, attendanceRecordService };

