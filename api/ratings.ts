import type { ActivityRatingDto, ActivityRatingsBatchDto } from '@/types/dto';
import type { PaginatedResponse } from '@/types/shared';
import type {
  ActivityRatingsListQuery,
  ActivityRatingsQuery,
  CreateActivityRatingRequest,
  RequestConfig,
} from './types';
import { apiRequest } from './client';
import { buildQueryString } from './helpers';

export const ratingsApi = {
  // todo лишний?
  listByActivityIds: (query?: ActivityRatingsQuery, config?: RequestConfig) =>
    apiRequest<ActivityRatingsBatchDto[]>(
      `/activity-ratings${buildQueryString(query as Record<string, unknown> | undefined)}`,
      { method: 'GET', signal: config?.signal },
      config?.authToken
    ),

  listByActivity: (activityId: string, query?: ActivityRatingsListQuery, config?: RequestConfig) =>
    apiRequest<PaginatedResponse<ActivityRatingDto>>(
      `/activities/${activityId}/ratings${buildQueryString(query as Record<string, unknown> | undefined)}`,
      { method: 'GET', signal: config?.signal },
      config?.authToken
    ),

  create: (payload: CreateActivityRatingRequest, config?: RequestConfig) =>
    apiRequest<ActivityRatingDto>(
      `/activities/${payload.activityId}/ratings`,
      {
        method: 'POST',
        body: { rating: payload.rating, comment: payload.comment },
        signal: config?.signal,
      },
      config?.authToken
    ),
};
