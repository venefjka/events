import type {
  ActivityJoinRequestDto,
  ActivityParticipantDto,
} from '@/types/dto';
import type { PaginatedResponse } from '@/types/shared';
import type {
  ActivityJoinRequestsQuery,
  ActivityParticipantsQuery,
  ApproveJoinRequestRequest,
  RequestConfig,
} from './types';
import { apiRequest } from './client';
import { buildQueryString } from './helpers';

export const participationApi = {
  listParticipants: (activityId: string, query?: ActivityParticipantsQuery, config?: RequestConfig) =>
    apiRequest<PaginatedResponse<ActivityParticipantDto>>(
      `/activities/${activityId}/participants${buildQueryString(query as Record<string, unknown> | undefined)}`,
      { method: 'GET', signal: config?.signal },
      config?.authToken
    ),

  listJoinRequests: (activityId: string, query?: ActivityJoinRequestsQuery, config?: RequestConfig) =>
    apiRequest<PaginatedResponse<ActivityJoinRequestDto>>(
      `/activities/${activityId}/join-requests${buildQueryString(query as Record<string, unknown> | undefined)}`,
      { method: 'GET', signal: config?.signal },
      config?.authToken
    ),

  join: (activityId: string, config?: RequestConfig) =>
    apiRequest<void>(`/activities/${activityId}/join`, { method: 'POST', signal: config?.signal }, config?.authToken),

  requestJoin: (activityId: string, config?: RequestConfig) =>
    apiRequest<void>(
      `/activities/${activityId}/join-requests/me`,
      { method: 'POST', signal: config?.signal },
      config?.authToken
    ),

  cancelJoinRequest: (activityId: string, config?: RequestConfig) =>
    apiRequest<void>(
      `/activities/${activityId}/join-requests/me`,
      { method: 'DELETE', signal: config?.signal },
      config?.authToken
    ),

  approveJoinRequest: (payload: ApproveJoinRequestRequest, config?: RequestConfig) =>
    apiRequest<void>(
      `/activities/${payload.activityId}/join-requests/${payload.userId}/approve`,
      { method: 'POST', signal: config?.signal },
      config?.authToken
    ),

  rejectJoinRequest: (payload: ApproveJoinRequestRequest, config?: RequestConfig) =>
    apiRequest<void>(
      `/activities/${payload.activityId}/join-requests/${payload.userId}/reject`,
      { method: 'POST', signal: config?.signal },
      config?.authToken
    ),

  leave: (activityId: string, config?: RequestConfig) =>
    apiRequest<void>(
      `/activities/${activityId}/participants/me`,
      { method: 'DELETE', signal: config?.signal },
      config?.authToken
    ),
};
