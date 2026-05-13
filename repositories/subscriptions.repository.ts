import { subscriptionsApi } from '@/api/subscriptions';
import { authRepository } from '@/repositories/authRepository';
import type { SubscriptionsQuery } from '@/types/queries';
import type { CreateSubscriptionRequest, UpdateSubscriptionRequest } from '@/types/requests';

const authConfig = async () => ({ authToken: (await authRepository.getAccessToken()) ?? undefined });

export const subscriptionsRepository = {
  list: async (query?: SubscriptionsQuery) => subscriptionsApi.list(query, await authConfig()),
  subscribe: async (payload: CreateSubscriptionRequest) => subscriptionsApi.create(payload, await authConfig()),
  unsubscribe: async (userId: string) => subscriptionsApi.remove(userId, await authConfig()),
  update: async (userId: string, payload: UpdateSubscriptionRequest) =>
    subscriptionsApi.update(userId, payload, await authConfig()),
};
