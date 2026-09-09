/**
 * Notification types for ICAN Platform
 * Phase 6: Communication System
 */

export enum NotificationType {
  INFO = 'info',
  SUCCESS = 'success',
  WARNING = 'warning',
  ERROR = 'error',
}

export enum NotificationCategory {
  ENROLLMENT = 'enrollment',
  BILLING = 'billing',
  PAYMENT = 'payment',
  ACADEMIC = 'academic',
  ATTENDANCE = 'attendance',
  SYSTEM = 'system',
}

export interface Notification {
  id: string;
  type: NotificationType;
  type_display: string;
  category: NotificationCategory;
  category_display: string;
  title: string;
  message: string;
  action_url: string;
  action_label: string;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

export interface NotificationTemplate {
  id: string;
  key: string;
  channel: 'email' | 'sms' | 'whatsapp';
  channel_display: string;
  subject: string;
  body_text: string;
  body_html: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export enum MessageChannel {
  EMAIL = 'email',
  SMS = 'sms',
  WHATSAPP = 'whatsapp',
}

export enum MessageStatus {
  PENDING = 'pending',
  SENT = 'sent',
  DELIVERED = 'delivered',
  FAILED = 'failed',
  BOUNCED = 'bounced',
}

export interface MessageLog {
  id: string;
  user: string | null;
  user_email: string | null;
  recipient: string;
  channel: MessageChannel;
  channel_display: string;
  template_key: string;
  subject: string;
  body: string;
  status: MessageStatus;
  status_display: string;
  provider: string;
  provider_message_id: string;
  sent_at: string | null;
  delivered_at: string | null;
  failed_at: string | null;
  error_message: string;
  created_at: string;
  updated_at: string;
}

export interface UnreadCountResponse {
  count: number;
}
