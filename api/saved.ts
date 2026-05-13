import type { ActivityListItemDto } from '@/types/dto';
import type { ActivityListQuery } from '@/types/queries';
import type { PaginatedResponse } from '@/types/shared';
import type { RequestConfig } from './types';
import { apiRequest } from './client';
import { buildQueryString } from './helpers';

export const savedActivitiesApi = {
  listSaved: (query?: ActivityListQuery, config?: RequestConfig) =>
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
};
