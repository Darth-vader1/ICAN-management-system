import apiClient from '../lib/api';

export interface PermissionItem {
  id: string;
  codename: string;
  name: string;
  module: string;
  description: string;
  is_system: boolean;
}

export interface RoleItem {
  id: string;
  name: string;
  code: string;
  description: string;
  is_system: boolean;
  is_protected: boolean;
  permissions: string[];
  permission_details?: PermissionItem[];
  user_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface CreateRolePayload {
  name: string;
  code?: string;
  description?: string;
  permissions: string[];
}

export const roleService = {
  async getRoles(): Promise<RoleItem[]> {
    const response = await apiClient.get<RoleItem[] | { results: RoleItem[] }>('/auth/roles/');
    if (Array.isArray(response.data)) {
      return response.data;
    }
    return response.data?.results || [];
  },

  async getPermissions(groupByModule: boolean = false): Promise<Record<string, PermissionItem[]> | PermissionItem[]> {
    const response = await apiClient.get('/auth/permissions/', {
      params: { group_by_module: groupByModule },
    });
    if (Array.isArray(response.data)) {
      return response.data;
    }
    if (response.data && Array.isArray((response.data as any).results)) {
      return (response.data as any).results;
    }
    return response.data;
  },

  async createRole(payload: CreateRolePayload): Promise<RoleItem> {
    const response = await apiClient.post<RoleItem>('/auth/roles/', payload);
    return response.data;
  },

  async updateRole(id: string, payload: Partial<CreateRolePayload>): Promise<RoleItem> {
    const response = await apiClient.patch<RoleItem>(`/auth/roles/${id}/`, payload);
    return response.data;
  },

  async deleteRole(id: string): Promise<{ detail: string }> {
    const response = await apiClient.delete<{ detail: string }>(`/auth/roles/${id}/`);
    return response.data;
  },
};

export default roleService;
