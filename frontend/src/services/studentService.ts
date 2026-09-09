/**
 * Student Service for ICAN Platform
 * Handles student profile and related operations
 */

import api from '../lib/api';

export interface StudentProfile {
  id: string;
  user: string;
  student_id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  phone_number: string;
  address: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  created_at: string;
  updated_at: string;
}

interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export const studentService = {
  /**
   * Get all students
   */
  getAll: async (params?: { page?: number; search?: string }): Promise<PaginatedResponse<StudentProfile>> => {
    const response = await api.get('/students/', { params });
    return response.data;
  },

  /**
   * Get student by ID
   */
  getById: async (id: string): Promise<StudentProfile> => {
    const response = await api.get(`/students/${id}/`);
    return response.data;
  },

  /**
   * Get current student profile
   */
  getMyProfile: async (): Promise<StudentProfile> => {
    const response = await api.get('/students/me/');
    return response.data;
  },

  /**
   * Create student profile
   */
  create: async (data: Partial<StudentProfile>): Promise<StudentProfile> => {
    const response = await api.post('/students/', data);
    return response.data;
  },

  /**
   * Update student profile
   */
  update: async (id: string, data: Partial<StudentProfile>): Promise<StudentProfile> => {
    const response = await api.patch(`/students/${id}/`, data);
    return response.data;
  },

  /**
   * Delete student profile
   */
  delete: async (id: string): Promise<void> => {
    await api.delete(`/students/${id}/`);
  },
};

export default studentService;
