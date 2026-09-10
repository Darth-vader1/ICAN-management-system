/**
 * Audit Log Service for ICAN Platform
 * Backend: /api/audit-logs/
 */

import api from '../lib/api';
import type {
  AuditLog,
  AuditLogFilters,
  AuditLogListResponse,
  AuditStats,
} from '../types/audit';
import type { PaginatedResult } from '../types/common';

const BASE_PATH = '/audit-logs';

export const auditService = {
  /**
   * Get paginated audit log list with optional filters
   */
  getAuditLogs: async (
    filters?: AuditLogFilters
  ): Promise<AuditLogListResponse> => {
    const response = await api.get<AuditLogListResponse>(`${BASE_PATH}/`, {
      params: filters,
    });
    return response.data;
  },

  /**
   * Get paginated list (alias for consistency with other services)
   */
  getAll: async (
    filters?: AuditLogFilters
  ): Promise<PaginatedResult<AuditLog>> => {
    return auditService.getAuditLogs(filters);
  },

  /**
   * Get single audit log detail by ID
   */
  getAuditLog: async (id: string): Promise<AuditLog> => {
    const response = await api.get<AuditLog>(`${BASE_PATH}/${id}/`);
    return response.data;
  },

  /**
   * Get by ID alias for service pattern consistency
   */
  getById: async (id: string): Promise<AuditLog> => {
    return auditService.getAuditLog(id);
  },

  /**
   * Get audit statistics overview (dashboard widget)
   */
  getStats: async (filters?: AuditLogFilters): Promise<AuditStats> => {
    const response = await api.get<AuditStats>(`${BASE_PATH}/stats/`, {
      params: filters,
    });
    return response.data;
  },

  /**
   * Export audit logs (binary blob / file download)
   */
  exportLogs: async (
    format: 'csv' | 'xlsx' | 'json' = 'csv',
    filters?: AuditLogFilters
  ): Promise<Blob> => {
    const response = await api.get(`${BASE_PATH}/export/`, {
      params: { ...filters, format },
      responseType: 'blob',
    });
    return response.data;
  },
};

export default auditService;
