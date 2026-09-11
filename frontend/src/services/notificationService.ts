/**
 * Notification Service for ICAN Platform
 * Phase 6: Communication System
 */

import api from '../lib/api';
import type {
  Notification,
  NotificationTemplate,
  MessageLog,
  UnreadCountResponse,
} from '../types/notification';
import type { PaginatedResult, SuccessResponse } from '../types/common';

interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

/**
 * Notification Service - In-app notifications
 */
export const notificationService = {
  /**
   * Get all notifications for current user
   */
  getAll: async (params?: {
    page?: number;
    is_read?: boolean;
    category?: string;
  }): Promise<PaginatedResponse<Notification>> => {
    const response = await api.get('/notifications/notifications/', { params });
    return response.data;
  },

  /**
   * Get unread count
   */
  getUnreadCount: async (): Promise<number> => {
    const response = await api.get<UnreadCountResponse>(
      '/notifications/notifications/unread_count/'
    );
    return response.data.count;
  },

  /**
   * Mark notification as read
   */
  markAsRead: async (id: string): Promise<Notification> => {
    const response = await api.post(`/notifications/notifications/${id}/mark_read/`);
    return response.data;
  },

  /**
   * Mark all notifications as read
   */
  markAllAsRead: async (): Promise<{ marked_read: number }> => {
    const response = await api.post('/notifications/notifications/mark_all_read/');
    return response.data;
  },

  /**
   * Get single notification
   */
  getById: async (id: string): Promise<Notification> => {
    const response = await api.get(`/notifications/notifications/${id}/`);
    return response.data;
  },
};

/**
 * Notification Template Service - Admin only
 */
export const notificationTemplateService = {
  /**
   * Get all templates
   */
  getAll: async (params?: {
    channel?: string;
    is_active?: boolean;
  }): Promise<PaginatedResponse<NotificationTemplate>> => {
    const response = await api.get('/notifications/templates/', { params });
    return response.data;
  },

  /**
   * Get template by ID
   */
  getById: async (id: string): Promise<NotificationTemplate> => {
    const response = await api.get(`/notifications/templates/${id}/`);
    return response.data;
  },

  /**
   * Create template
   */
  create: async (data: Partial<NotificationTemplate>): Promise<NotificationTemplate> => {
    const response = await api.post('/notifications/templates/', data);
    return response.data;
  },

  /**
   * Update template
   */
  update: async (
    id: string,
    data: Partial<NotificationTemplate>
  ): Promise<NotificationTemplate> => {
    const response = await api.patch(`/notifications/templates/${id}/`, data);
    return response.data;
  },

  /**
   * Delete template
   */
  delete: async (id: string): Promise<void> => {
    await api.delete(`/notifications/templates/${id}/`);
  },

  /**
   * Live-render a template with given variables (preview)
   */
  renderPreview: async (
    templateId: string,
    context: Record<string, unknown>
  ): Promise<{ subject: string; body_text: string; body_html: string }> => {
    const response = await api.post(`/notifications/templates/${templateId}/preview/`, {
      context,
    });
    return response.data;
  },
};

/**
 * Message Log Service - Staff only
 */
export const messageLogService = {
  /**
   * Get all message logs
   */
  getAll: async (params?: {
    page?: number;
    user_id?: string;
    channel?: string;
    status?: string;
    template_key?: string;
  }): Promise<PaginatedResult<MessageLog>> => {
    const response = await api.get('/notifications/message-logs/', { params });
    return response.data;
  },

  /**
   * Get message log by ID
   */
  getById: async (id: string): Promise<MessageLog> => {
    const response = await api.get(`/notifications/message-logs/${id}/`);
    return response.data;
  },

  /**
   * Resend a failed message (Priority 3 gap)
   */
  resendMessage: async (
    messageLogId: string
  ): Promise<SuccessResponse & { new_message_id?: string }> => {
    const response = await api.post(
      `/notifications/message-logs/${messageLogId}/resend/`
    );
    return response.data;
  },

  /**
   * Retry all FAILED message logs (bulk retry)
   */
  retryAllFailed: async (filters?: {
    channel?: string;
    failed_since?: string;
  }): Promise<SuccessResponse & { retried: number; skipped: number }> => {
    const response = await api.post(`/notifications/message-logs/retry-failed/`, filters || {});
    return response.data;
  },
};

/**
 * Announcement Service - Broadcast messages to students
 */
export interface AnnouncementItem {
  id: string;
  title: string;
  message: string;
  target_audience: 'all' | 'foundation' | 'skills' | 'professional';
  target_audience_display: string;
  channels: string[];
  author?: string;
  author_name?: string;
  author_display: string;
  created_at: string;
  updated_at: string;
}

export const announcementService = {
  getAll: async (): Promise<AnnouncementItem[]> => {
    const response = await api.get('/notifications/announcements/');
    const data = response.data;
    if (data && typeof data === 'object' && 'results' in data) {
      return data.results || [];
    }
    return Array.isArray(data) ? data : [];
  },

  create: async (data: {
    title: string;
    message: string;
    target_audience: string;
    channels: string[];
  }): Promise<AnnouncementItem> => {
    const response = await api.post<AnnouncementItem>('/notifications/announcements/', data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/notifications/announcements/${id}/`);
  },
};

export default notificationService;
