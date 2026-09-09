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
};

export default { classSessionService, attendanceRecordService };
