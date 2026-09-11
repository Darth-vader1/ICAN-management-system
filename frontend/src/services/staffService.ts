/**
 * Staff Management Service for ICAN Platform
 * Backend: /api/auth/staff/provision/  +  /api/auth/staff/
 */

import api from '../lib/api';
import type { UserRole } from '../types/auth';
import type { PaginatedResult, PaginationParams } from '../types/common';

export interface StaffMember {
  id: string;
  user_id: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  phone: string;
  role: UserRole;
  department: string;
  is_active: boolean;
  date_joined: string;
  last_login: string | null;
  avatar_url?: string | null;
}

export interface StaffListItem {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  department: string;
  is_active: boolean;
  last_login: string | null;
  avatar_url?: string | null;
}

export interface StaffProvisionData {
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  role: UserRole;
  department?: string;
  password?: string;
  send_invite?: boolean;
}

export interface StaffUpdateData extends Partial<StaffProvisionData> {
  is_active?: boolean;
}

export interface StaffFilters extends PaginationParams {
  role?: UserRole;
  department?: string;
  is_active?: boolean;
  search?: string;
}

export interface StaffProvisionResponse {
  id: string;
  email: string;
  temporary_password?: string;
  invite_sent: boolean;
}

const BASE_PATH = '/auth/staff';

export const staffService = {
  /**
   * Provision (create) a new staff account
   * Uses backend /auth/staff/provision/ endpoint
   */
  provisionStaff: async (
    data: StaffProvisionData
  ): Promise<StaffProvisionResponse> => {
    const response = await api.post<StaffProvisionResponse>(
      `${BASE_PATH}/provision/`,
      data
    );
    return response.data;
  },

  /**
   * List paginated staff members with filters
   */
  getStaffList: async (
    filters?: StaffFilters
  ): Promise<PaginatedResult<StaffListItem>> => {
    const response = await api.get<PaginatedResult<StaffListItem>>(
      `${BASE_PATH}/`,
      { params: filters }
    );
    return response.data;
  },

  /**
   * Alias for pattern consistency with other services
   */
  getAll: async (
    filters?: StaffFilters
  ): Promise<PaginatedResult<StaffListItem>> => {
    return staffService.getStaffList(filters);
  },

  /**
   * Get single staff member by ID (full detail)
   */
  getStaffMember: async (id: string): Promise<StaffMember> => {
    const response = await api.get<StaffMember>(`${BASE_PATH}/${id}/`);
    return response.data;
  },

  /**
   * Alias for pattern consistency
   */
  getById: async (id: string): Promise<StaffMember> => {
    return staffService.getStaffMember(id);
  },

  /**
   * Update staff member details
   */
  updateStaff: async (
    id: string,
    data: StaffUpdateData
  ): Promise<StaffMember> => {
    const response = await api.patch<StaffMember>(
      `${BASE_PATH}/${id}/`,
      data
    );
    return response.data;
  },

  /**
   * Alias
   */
  update: async (id: string, data: StaffUpdateData): Promise<StaffMember> => {
    return staffService.updateStaff(id, data);
  },

  /**
   * Deactivate a staff account (soft delete / lock)
   */
  deactivateStaff: async (
    id: string,
    reason?: string
  ): Promise<{ success: boolean; message: string }> => {
    const response = await api.post(
      `${BASE_PATH}/${id}/deactivate/`,
      reason ? { reason } : {}
    );
    return response.data;
  },

  /**
   * Reactivate a previously deactivated staff account
   */
  reactivateStaff: async (
    id: string
  ): Promise<{ success: boolean; message: string }> => {
    const response = await api.post(`${BASE_PATH}/${id}/reactivate/`);
    return response.data;
  },

  /**
   * Reset staff member password (admin override)
   */
  resetPassword: async (
    id: string,
    new_password?: string
  ): Promise<{ success: boolean; temporary_password?: string }> => {
    const response = await api.post(`${BASE_PATH}/${id}/reset_password/`, {
      new_password,
    });
    return response.data;
  },
  /**
   * Upload staff member avatar photo (admin override)
   */
  uploadAvatar: async (id: string, file: File): Promise<StaffMember> => {
    const formData = new FormData();
    formData.append('avatar', file);
    const response = await api.post<StaffMember>(
      `${BASE_PATH}/${id}/avatar/`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },
};

export default staffService;
