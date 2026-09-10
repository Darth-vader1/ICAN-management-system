import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '../../lib/queryKeys';
import { showToast } from '../../lib/toast';
import { getErrorMessage } from '../../lib/api';
import {
  notificationService,
  notificationTemplateService,
  messageLogService,
} from '../../services/notificationService';
import type {
  Notification,
  NotificationTemplate,
  MessageLog,
} from '../../types/notification';

interface NotificationFilters {
  page?: number;
  is_read?: boolean;
  category?: string;
  [key: string]: unknown;
}

export function useNotifications(filters?: NotificationFilters) {
  return useQuery({
    queryKey: QUERY_KEYS.notifications.list(filters),
    queryFn: () => notificationService.getAll(filters),
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
    throwOnError: false,
  });
}

export function useUnreadNotificationCount() {
  return useQuery({
    queryKey: QUERY_KEYS.notifications.unreadCount(),
    queryFn: () => notificationService.getUnreadCount(),
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
    placeholderData: 0,
    throwOnError: false,
  });
}

interface MarkNotificationReadVariables {
  id: string;
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id }: MarkNotificationReadVariables) => notificationService.markAsRead(id),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.notifications.list() });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.notifications.unreadCount() });
    },
    onError: (error) => {
      showToast.error(getErrorMessage(error));
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => notificationService.markAllAsRead(),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.notifications.list() });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.notifications.unreadCount() });
      showToast.success(`All notifications marked as read (${response.marked_read})`);
    },
    onError: (error) => {
      showToast.error(getErrorMessage(error));
    },
  });
}

interface NotificationTemplateFilters {
  channel?: string;
  is_active?: boolean;
  [key: string]: unknown;
}

export function useNotificationTemplates(filters?: NotificationTemplateFilters) {
  return useQuery({
    queryKey: QUERY_KEYS.notifications.templates.list(),
    queryFn: () => notificationTemplateService.getAll(filters),
    staleTime: 5 * 60 * 1000,
    throwOnError: false,
  });
}

export function useNotificationTemplate(id: string, enabled: boolean = true) {
  return useQuery({
    queryKey: QUERY_KEYS.notifications.templates.detail(id),
    queryFn: () => notificationTemplateService.getById(id),
    staleTime: 5 * 60 * 1000,
    enabled: enabled && Boolean(id),
    throwOnError: false,
  });
}

interface CreateNotificationTemplateVariables {
  data: Partial<NotificationTemplate>;
}

export function useCreateNotificationTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ data }: CreateNotificationTemplateVariables) =>
      notificationTemplateService.create(data),
    onSuccess: (newTemplate) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.notifications.templates.list() });
      queryClient.setQueryData(
        QUERY_KEYS.notifications.templates.detail(newTemplate.id),
        newTemplate
      );
      showToast.success('Notification template created successfully');
    },
    onError: (error) => {
      showToast.error(getErrorMessage(error));
    },
  });
}

interface UpdateNotificationTemplateVariables {
  id: string;
  data: Partial<NotificationTemplate>;
}

export function useUpdateNotificationTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: UpdateNotificationTemplateVariables) =>
      notificationTemplateService.update(id, data),
    onSuccess: (updatedTemplate) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.notifications.templates.list() });
      queryClient.setQueryData(
        QUERY_KEYS.notifications.templates.detail(updatedTemplate.id),
        updatedTemplate
      );
      showToast.success('Notification template updated successfully');
    },
    onError: (error) => {
      showToast.error(getErrorMessage(error));
    },
  });
}

interface DeleteNotificationTemplateVariables {
  id: string;
}

export function useDeleteNotificationTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id }: DeleteNotificationTemplateVariables) =>
      notificationTemplateService.delete(id),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.notifications.templates.list() });
      queryClient.removeQueries({
        queryKey: QUERY_KEYS.notifications.templates.detail(variables.id),
      });
      showToast.success('Notification template deleted successfully');
    },
    onError: (error) => {
      showToast.error(getErrorMessage(error));
    },
  });
}

interface MessageLogFilters {
  page?: number;
  user_id?: string;
  channel?: string;
  status?: string;
  template_key?: string;
  [key: string]: unknown;
}

export function useMessageLogs(filters?: MessageLogFilters) {
  return useQuery({
    queryKey: QUERY_KEYS.notifications.logs.list(filters),
    queryFn: () => messageLogService.getAll(filters),
    staleTime: 5 * 60 * 1000,
    throwOnError: false,
  });
}

interface ResendMessageVariables {
  messageLogId: string;
}

export function useResendMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ messageLogId }: ResendMessageVariables) =>
      messageLogService.resendMessage(messageLogId),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.notifications.logs.list() });
      showToast.success(response.message || `Message ${variables.messageLogId} queued for resend`);
    },
    onError: (error) => {
      showToast.error(getErrorMessage(error));
    },
  });
}
