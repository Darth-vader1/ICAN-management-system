/**
 * Student Service for ICAN Platform
 * Handles student profile and related operations
 */

import api from '../lib/api';
import type {
  StudentProfile,
  StudentListItem,
  StudentCreateData,
  StudentUpdateData,
  StudentSearchResult,
  StudentImportResult,
  StudentEnrollments,
  StudentAttendanceSummary,
} from '../types/student';
import type { PaginatedResult } from '../types/common';
import type { EnrollmentListItem } from '../types/enrollment';

interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export const studentService = {
  /**
   * Get all students (handles both paginated and non-paginated responses)
   */
  getAll: async (params?: {
    page?: number;
    page_size?: number;
    search?: string;
    level?: string;
    is_active?: boolean;
  }): Promise<StudentListItem[]> => {
    const response = await api.get<
      PaginatedResponse<StudentListItem> | StudentListItem[]
    >('/students/', { params });
    if (response.data && typeof response.data === 'object' && 'results' in response.data) {
      return response.data.results || [];
    }
    return Array.isArray(response.data) ? response.data : [];
  },

  /**
   * Get paginated student list with full pagination envelope
   */
  getPaginated: async (params?: {
    page?: number;
    page_size?: number;
    search?: string;
    level?: string;
    is_active?: boolean;
  }): Promise<PaginatedResult<StudentListItem>> => {
    const response = await api.get<PaginatedResult<StudentListItem>>('/students/', {
      params,
    });
    return response.data;
  },

  /**
   * Get student by ID
   */
  getById: async (id: string): Promise<StudentProfile> => {
    const response = await api.get<StudentProfile>(`/students/${id}/`);
    return response.data;
  },

  /**
   * Get current student profile
   */
  getMyProfile: async (): Promise<StudentProfile> => {
    const response = await api.get<StudentProfile>('/students/me/');
    return response.data;
  },

  /**
   * Create student profile
   */
  create: async (data: StudentCreateData): Promise<StudentProfile> => {
    const response = await api.post<StudentProfile>('/students/', data);
    return response.data;
  },

  /**
   * Update student profile
   */
  update: async (id: string, data: StudentUpdateData): Promise<StudentProfile> => {
    const response = await api.patch<StudentProfile>(`/students/${id}/`, data);
    return response.data;
  },

  /**
   * Delete student profile
   */
  delete: async (id: string): Promise<void> => {
    await api.delete(`/students/${id}/`);
  },

  /**
   * Deactivate a student account (soft lock / suspend)
   */
  deactivate: async (
    id: string,
    reason?: string
  ): Promise<{ success: boolean; message: string; student: StudentProfile }> => {
    const response = await api.post(
      `/students/${id}/deactivate/`,
      reason ? { reason } : {}
    );
    return response.data;
  },

  /**
   * Reactivate a previously deactivated student account
   */
  reactivate: async (
    id: string
  ): Promise<{ success: boolean; message: string; student: StudentProfile }> => {
    const response = await api.post(`/students/${id}/reactivate/`);
    return response.data;
  },

  /**
   * Search students (lightweight autocomplete / quick lookup)
   */
  searchStudents: async (query: string, limit = 20): Promise<StudentSearchResult[]> => {
    const response = await api.get<{ results: StudentSearchResult[] } | StudentSearchResult[]>(
      '/students/search/',
      { params: { q: query, limit } }
    );
    if (response.data && typeof response.data === 'object' && 'results' in response.data) {
      return response.data.results || [];
    }
    return Array.isArray(response.data) ? response.data : [];
  },

  /**
   * Bulk import students from CSV / XLSX file
   * Accepts FormData with `file` field
   */
  importStudents: async (
    file: File,
    mode: 'create' | 'update_or_create' = 'create'
  ): Promise<StudentImportResult> => {
    const form = new FormData();
    form.append('file', file);
    form.append('mode', mode);
    const response = await api.post<StudentImportResult>('/students/import/', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 120000,
    });
    return response.data;
  },

  /**
   * Download student import template CSV
   */
  downloadImportTemplate: async (): Promise<Blob> => {
    const response = await api.get('/students/import/template/', {
      responseType: 'blob',
    });
    return response.data;
  },

  /**
   * Get enrollments for a specific student (uses backend /student_summary endpoints)
   */
  getStudentEnrollments: async (
    studentId: string,
    params?: { status?: string; session?: string }
  ): Promise<EnrollmentListItem[]> => {
    const response = await api.get<{
      enrollments: EnrollmentListItem[];
    } | PaginatedResponse<EnrollmentListItem> | EnrollmentListItem[]>(
      `/students/${studentId}/enrollments/`,
      { params }
    );
    const data = response.data as any;
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.enrollments)) return data.enrollments;
    if (data && Array.isArray(data.results)) return data.results;
    return [];
  },

  /**
   * Get attendance summary for a specific student (student_report / student_summary endpoint)
   */
  getStudentAttendanceSummary: async (
    studentId: string,
    params?: { session?: string; course_offering?: string; start_date?: string; end_date?: string }
  ): Promise<StudentAttendanceSummary> => {
    const response = await api.get<StudentAttendanceSummary>(
      `/students/${studentId}/attendance_summary/`,
      { params }
    );
    return response.data;
  },
};

export default studentService;
