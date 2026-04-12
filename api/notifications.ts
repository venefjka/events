import type { NotificationDto } from '@/types/dto';
import type { PaginatedResponse } from '@/types/shared';
import type { NotificationsQuery, RequestConfig, UpdateNotificationRequest } from './types';
import { apiRequest } from './client';
import { buildQueryString } from './helpers';

export const notificationsApi = {
  list: (query?: NotificationsQuery, config?: RequestConfig) =>
    apiRequest<PaginatedResponse<NotificationDto>>(
      `/me/notifications${buildQueryString(query as Record<string, unknown> | undefined)}`,
      { method: 'GET', signal: config?.signal },
      config?.authToken
    ),

  update: (notificationId: string, payload: UpdateNotificationRequest, config?: RequestConfig) =>
    apiRequest<NotificationDto>(
      `/notifications/${notificationId}`,
      { method: 'PATCH', body: payload, signal: config?.signal },
      config?.authToken
    ),

  readAll: (config?: RequestConfig) =>
    apiRequest<void>('/notifications/read-all', { method: 'POST', signal: config?.signal }, config?.authToken),

  remove: (notificationId: string, config?: RequestConfig) =>
    apiRequest<void>(
      `/notifications/${notificationId}`,
      { method: 'DELETE', signal: config?.signal },
      config?.authToken
    ),
};
