import type { DateTimeRange, PaginationParams, PaginatedResult } from './common';

export type AuditAction =
  | 'CREATE'
  | 'create'
  | 'UPDATE'
  | 'update'
  | 'DELETE'
  | 'delete'
  | 'LOGIN'
  | 'login'
  | 'LOGOUT'
  | 'logout'
  | 'VIEW'
  | 'view'
  | 'EXPORT'
  | 'export'
  | 'APPROVE'
  | 'approve'
  | 'REJECT'
  | 'reject'
  | 'SEND'
  | 'send'
  | 'VERIFY'
  | 'verify'
  | 'ALLOCATE'
  | 'allocate'
  | 'REFUND'
  | 'refund'
  | string;

export type AuditEntityType =
  | 'student'
  | 'staff'
  | 'user'
  | 'enrollment'
  | 'invoice'
  | 'payment'
  | 'refund'
  | 'fee_structure'
  | 'academic_session'
  | 'level'
  | 'course'
  | 'course_offering'
  | 'class'
  | 'schedule'
  | 'attendance_session'
  | 'attendance_record'
  | 'notification'
  | 'notification_template'
  | 'message_log'
  | string;

export interface AuditActor {
  id: string;
  email: string;
  role: string;
  full_name?: string;
}

export interface AuditLog {
  id: string;
  actor: AuditActor;
  actor_id: string;
  action: AuditAction;
  entity_type: AuditEntityType;
  entity_id: string | null;
  entity_display: string | null;
  description: string;
  ip_address: string | null;
  user_agent: string | null;
  old_value: Record<string, unknown> | null;
  new_value: Record<string, unknown> | null;
  changes: Array<{
    field: string;
    old: unknown;
    new: unknown;
  }> | null;
  created_at: string;
  timestamp: string;
}

export interface AuditLogFilters extends PaginationParams, DateTimeRange {
  actor_id?: string;
  actor_email?: string;
  action?: AuditAction | AuditAction[];
  entity_type?: AuditEntityType | AuditEntityType[];
  entity_id?: string;
  search?: string;
}

export interface AuditLogListResponse extends PaginatedResult<AuditLog> {}

export interface AuditStats {
  total_actions: number;
  by_action: Array<{ action: AuditAction; count: number }>;
  by_entity: Array<{ entity_type: AuditEntityType; count: number }>;
  by_actor: Array<{ actor_id: string; actor_email: string; count: number }>;
  last_7_days: Array<{
    date: string;
    count: number;
  }>;
}
