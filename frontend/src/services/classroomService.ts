import api from '../lib/api';
import type {
  VirtualClassListItem,
  VirtualClassDetail,
  JoinTokenResponse,
  CreateVirtualClassData,
  ClassMaterial,
  ClassRecording,
  ClassAttendance,
  ClassroomFilterParams,
} from '../types/classroom';
import type { PaginatedResult } from '../types/common';

export const classroomService = {
  /**
   * List all virtual classes for user
   */
  getAll: async (params?: ClassroomFilterParams): Promise<VirtualClassListItem[]> => {
    const response = await api.get<PaginatedResult<VirtualClassListItem> | VirtualClassListItem[]>(
      '/classrooms/',
      { params }
    );
    if (response.data && typeof response.data === 'object' && 'results' in response.data) {
      return response.data.results || [];
    }
    return Array.isArray(response.data) ? response.data : [];
  },

  /**
   * Get single virtual class details
   */
  getById: async (id: string): Promise<VirtualClassDetail> => {
    const response = await api.get<VirtualClassDetail>(`/classrooms/${id}/`);
    return response.data;
  },

  /**
   * Schedule new virtual class (Staff only)
   */
  create: async (data: CreateVirtualClassData): Promise<VirtualClassDetail> => {
    const response = await api.post<VirtualClassDetail>('/classrooms/', data);
    return response.data;
  },

  /**
   * Update virtual class
   */
  update: async (id: string, data: Partial<CreateVirtualClassData>): Promise<VirtualClassDetail> => {
    const response = await api.patch<VirtualClassDetail>(`/classrooms/${id}/`, data);
    return response.data;
  },

  /**
   * Cancel / delete virtual class
   */
  delete: async (id: string): Promise<void> => {
    await api.delete(`/classrooms/${id}/`);
  },

  /**
   * Join class & get short-lived LiveKit JWT token
   */
  joinClass: async (id: string): Promise<JoinTokenResponse> => {
    const response = await api.post<JoinTokenResponse>(`/classrooms/${id}/join/`);
    return response.data;
  },

  /**
   * Start class (Staff / Instructor)
   */
  startClass: async (id: string): Promise<{ status: string; message: string }> => {
    const response = await api.post<{ status: string; message: string }>(`/classrooms/${id}/start/`);
    return response.data;
  },

  /**
   * End class for all (Staff / Instructor)
   */
  endClass: async (id: string): Promise<{ status: string; message: string }> => {
    const response = await api.post<{ status: string; message: string }>(`/classrooms/${id}/end/`);
    return response.data;
  },

  /**
   * Get class materials
   */
  getMaterials: async (id: string): Promise<ClassMaterial[]> => {
    const response = await api.get<ClassMaterial[]>(`/classrooms/${id}/materials/`);
    return response.data;
  },

  /**
   * Upload class material (Staff / Instructor)
   */
  uploadMaterial: async (id: string, formData: FormData): Promise<ClassMaterial> => {
    const response = await api.post<ClassMaterial>(`/classrooms/${id}/materials/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  /**
   * Get class attendance report
   */
  getAttendance: async (id: string): Promise<ClassAttendance[]> => {
    const response = await api.get<ClassAttendance[]>(`/classrooms/${id}/attendance/`);
    return response.data;
  },

  /**
   * Get class recordings
   */
  getRecordings: async (id: string): Promise<ClassRecording[]> => {
    const response = await api.get<ClassRecording[]>(`/classrooms/${id}/recordings/`);
    return response.data;
  },

  /**
   * Get persistent classroom chat history
   */
  getChatHistory: async (id: string): Promise<any[]> => {
    const response = await api.get<any[]>(`/classrooms/${id}/chat/`);
    return Array.isArray(response.data) ? response.data : [];
  },

  /**
   * Send and persist classroom chat message
   */
  sendChatMessage: async (id: string, text: string): Promise<any> => {
    const response = await api.post(`/classrooms/${id}/chat/`, { message_text: text });
    return response.data;
  },
};
