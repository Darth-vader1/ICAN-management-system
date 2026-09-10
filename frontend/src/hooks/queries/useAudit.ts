import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '../../lib/queryKeys';
import api from '../../lib/api';

export interface AuditLog {
  id: string;
  actor_email?: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  old_value?: Record<string, unknown>;
  new_value?: Record<string, unknown>;
  ip_address?: string;
  timestamp: string;
}

export interface AuditLogFilters {
  page?: number;
  actor?: string;
  action?: string;
  entity_type?: string;
  start_date?: string;
  end_date?: string;
}

interface PaginatedAuditLogs {
  count: number;
  next: string | null;
  previous: string | null;
  results: AuditLog[];
}

export function useAuditLogs(filters?: AuditLogFilters) {
  return useQuery({
    queryKey: QUERY_KEYS.audit.logs.list(filters as Record<string, unknown>),
    queryFn: async () => {
      const response = await api.get<PaginatedAuditLogs | AuditLog[]>('/audit-logs/', {
        params: filters,
      });
      if (response.data && typeof response.data === 'object' && 'results' in response.data) {
        return response.data;
      }
      return {
        count: Array.isArray(response.data) ? response.data.length : 0,
        next: null,
        previous: null,
        results: Array.isArray(response.data) ? response.data : [],
      } as PaginatedAuditLogs;
    },
    staleTime: 5 * 60 * 1000,
    throwOnError: false,
  });
}

export function useAuditLog(id: string, enabled: boolean = true) {
  return useQuery({
    queryKey: QUERY_KEYS.audit.logs.detail(id),
    queryFn: async () => {
      const response = await api.get<AuditLog>(`/audit-logs/${id}/`);
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
    enabled: enabled && Boolean(id),
    throwOnError: false,
  });
}
