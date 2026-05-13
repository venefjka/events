import { ratingsApi } from '@/api/ratings';
import { authRepository } from '@/repositories/authRepository';
import type { ActivityRatingsListQuery } from '@/types/queries';
import type { CreateActivityRatingRequest } from '@/types/requests';

const authConfig = async () => ({ authToken: (await authRepository.getAccessToken()) ?? undefined });

export const ratingsRepository = {
  listByActivity: async (activityId: string, query?: ActivityRatingsListQuery) =>
    ratingsApi.listByActivity(activityId, query, await authConfig()),
  create: async (payload: CreateActivityRatingRequest) => ratingsApi.create(payload, await authConfig()),
};
