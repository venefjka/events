import type { UserActivityFeedEventDto } from '@/types/dto';
import type { PaginatedResponse } from '@/types/shared';
import type {
  CreateUserActivityFeedEventRequest,
  RequestConfig,
  UserActivityFeedQuery,
} from './types';
import { apiRequest } from './client';
import { buildQueryString } from './helpers';

export const userActivityFeedApi = {
  listByUser: (userId: string, query?: UserActivityFeedQuery, config?: RequestConfig) =>
    apiRequest<PaginatedResponse<UserActivityFeedEventDto>>(
      `/users/${userId}/activity-feed${buildQueryString(query as Record<string, unknown> | undefined)}`,
      { method: 'GET', signal: config?.signal },
      config?.authToken
    ),

  listMine: (query?: UserActivityFeedQuery, config?: RequestConfig) =>
    apiRequest<PaginatedResponse<UserActivityFeedEventDto>>(
      `/me/activity-feed${buildQueryString(query as Record<string, unknown> | undefined)}`,
      { method: 'GET', signal: config?.signal },
      config?.authToken
    ),

  createEvent: (payload: CreateUserActivityFeedEventRequest, config?: RequestConfig) =>
    apiRequest<UserActivityFeedEventDto>(
      '/activity-feed/events',
      { method: 'POST', body: payload, signal: config?.signal },
      config?.authToken
    ),
};
