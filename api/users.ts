import type { UserProfileDto, ActivityListItemDto } from '@/types/dto';
import type { PaginatedResponse } from '@/types/shared';
import type { RequestConfig, UserHistoryQuery } from './types';
import { apiRequest } from './client';
import { buildQueryString } from './helpers';

export const usersApi = {
  getById: (userId: string, config?: RequestConfig) =>
    apiRequest<UserProfileDto>(`/users/${userId}`, { method: 'GET', signal: config?.signal }, config?.authToken),

  getHistory: (userId: string, query: UserHistoryQuery, config?: RequestConfig) =>
    apiRequest<PaginatedResponse<ActivityListItemDto>>(
      `/users/${userId}/history${buildQueryString(query as unknown as Record<string, unknown>)}`,
      { method: 'GET', signal: config?.signal },
      config?.authToken
    ),

  getRating: (userId: string, config?: RequestConfig) =>
    apiRequest<{ rating: number }>(`/users/${userId}/rating`, { method: 'GET', signal: config?.signal }, config?.authToken),

  getAttendanceHistory: (userId: string, config?: RequestConfig) =>
    apiRequest<{ attended: number; missed: number }>(
      `/users/${userId}/attendance-history`,
      { method: 'GET', signal: config?.signal },
      config?.authToken
    ),
};
