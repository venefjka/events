import type { SubscriptionDto } from '@/types/dto';
import type { PaginatedResponse } from '@/types/shared';
import type {
  CreateSubscriptionRequest,
  RequestConfig,
  SubscriptionsQuery,
  UpdateSubscriptionRequest,
} from './types';
import { apiRequest } from './client';
import { buildQueryString } from './helpers';

export const subscriptionsApi = {
  list: (query?: SubscriptionsQuery, config?: RequestConfig) =>
    apiRequest<PaginatedResponse<SubscriptionDto>>(
      `/me/subscriptions${buildQueryString(query as Record<string, unknown> | undefined)}`,
      { method: 'GET', signal: config?.signal },
      config?.authToken
    ),

  create: (payload: CreateSubscriptionRequest, config?: RequestConfig) =>
    apiRequest<SubscriptionDto>(
      '/subscriptions',
      { method: 'POST', body: payload, signal: config?.signal },
      config?.authToken
    ),

  remove: (userId: string, config?: RequestConfig) =>
    apiRequest<void>(`/subscriptions/${userId}`, { method: 'DELETE', signal: config?.signal }, config?.authToken),

  update: (userId: string, payload: UpdateSubscriptionRequest, config?: RequestConfig) =>
    apiRequest<SubscriptionDto>(
      `/subscriptions/${userId}`,
      { method: 'PATCH', body: payload, signal: config?.signal },
      config?.authToken
    ),
};
