import type { ActivityDetailDto, ActivityListItemDto } from '@/types/dto';
import type { PaginatedResponse } from '@/types/shared';
import type {
  ActivityListQuery,
  CreateActivitiesBatchRequest,
  CreateActivityRequest,
  MyActivitiesQuery,
  RecommendedActivitiesQuery,
  RequestConfig,
  UpdateActivityRequest,
} from './types';
import { apiRequest } from './client';
import { buildQueryString } from './helpers';

export const activitiesApi = {
  list: (query?: ActivityListQuery, config?: RequestConfig) =>
    apiRequest<PaginatedResponse<ActivityListItemDto>>(
      `/activities${buildQueryString(query as Record<string, unknown> | undefined)}`,
      { method: 'GET', signal: config?.signal },
      config?.authToken
    ),

  recommended: (query?: RecommendedActivitiesQuery, config?: RequestConfig) =>
    apiRequest<PaginatedResponse<ActivityListItemDto>>(
      `/activities/recommended${buildQueryString(query as Record<string, unknown> | undefined)}`,
      { method: 'GET', signal: config?.signal },
      config?.authToken
    ),

  myActivities: (query: MyActivitiesQuery, config?: RequestConfig) =>
    apiRequest<PaginatedResponse<ActivityListItemDto>>(
      `/me/my-activities${buildQueryString(query as unknown as Record<string, unknown>)}`,
      { method: 'GET', signal: config?.signal },
      config?.authToken
    ),

  getById: (activityId: string, config?: RequestConfig) =>
    apiRequest<ActivityDetailDto>(
      `/activities/${activityId}`,
      { method: 'GET', signal: config?.signal },
      config?.authToken
    ),

  create: (payload: CreateActivityRequest, config?: RequestConfig) =>
    apiRequest<ActivityDetailDto>(
      '/activities',
      { method: 'POST', body: payload, signal: config?.signal },
      config?.authToken
    ),

  createBatch: (payload: CreateActivitiesBatchRequest, config?: RequestConfig) =>
    apiRequest<ActivityDetailDto[]>(
      '/activities/batch',
      { method: 'POST', body: payload, signal: config?.signal },
      config?.authToken
    ),

  update: (activityId: string, payload: UpdateActivityRequest, config?: RequestConfig) =>
    apiRequest<ActivityDetailDto>(
      `/activities/${activityId}`,
      { method: 'PATCH', body: payload, signal: config?.signal },
      config?.authToken
    ),

  remove: (activityId: string, config?: RequestConfig) =>
    apiRequest<void>(`/activities/${activityId}`, { method: 'DELETE', signal: config?.signal }, config?.authToken),

  cancel: (activityId: string, config?: RequestConfig) =>
    apiRequest<ActivityDetailDto>(
      `/activities/${activityId}/cancel`,
      { method: 'POST', signal: config?.signal },
      config?.authToken
    ),
};
