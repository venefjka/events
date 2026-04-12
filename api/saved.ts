import type { ActivityListItemDto } from '@/types/dto';
import type { PaginatedResponse } from '@/types/shared';
import type { RequestConfig } from './types';
import { apiRequest } from './client';
import { buildQueryString } from './helpers';

export interface SavedActivitiesQuery {
  limit?: number;
  cursor?: string;
  sort?: 'savedAt' | 'startAt' | 'createdAt';
}

export interface JoinedActivitiesQuery {
  limit?: number;
  cursor?: string;
  status?: 'pending' | 'accepted' | 'attended' | 'rejected' | 'missed';
}

export const savedActivitiesApi = {
  listSaved: (query?: SavedActivitiesQuery, config?: RequestConfig) =>
    apiRequest<PaginatedResponse<ActivityListItemDto>>(
      `/me/saved-activities${buildQueryString(query as Record<string, unknown> | undefined)}`,
      { method: 'GET', signal: config?.signal },
      config?.authToken
    ),

  save: (activityId: string, config?: RequestConfig) =>
    apiRequest<void>(
      `/me/saved-activities/${activityId}`,
      { method: 'POST', signal: config?.signal },
      config?.authToken
    ),

  unsave: (activityId: string, config?: RequestConfig) =>
    apiRequest<void>(
      `/me/saved-activities/${activityId}`,
      { method: 'DELETE', signal: config?.signal },
      config?.authToken
    ),

  // todo лишний?
  listJoined: (query?: JoinedActivitiesQuery, config?: RequestConfig) =>
    apiRequest<PaginatedResponse<ActivityListItemDto>>(
      `/me/joined-activities${buildQueryString(query as Record<string, unknown> | undefined)}`,
      { method: 'GET', signal: config?.signal },
      config?.authToken
    ),
};
