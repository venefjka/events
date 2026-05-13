import { activitiesApi } from '@/api/activities';
import { savedActivitiesApi } from '@/api/saved';
import { authRepository } from '@/repositories/authRepository';
import type { ActivityListQuery, MyActivitiesQuery, RecommendedActivitiesQuery } from '@/types/queries';
import type {
  CreateActivitiesBatchRequest,
  CreateActivityRequest,
  UpdateActivityRequest,
} from '@/types/requests';

const authConfig = async () => ({ authToken: (await authRepository.getAccessToken()) ?? undefined });

export const activitiesRepository = {
  list: async (query?: ActivityListQuery) => activitiesApi.list(query, await authConfig()),
  recommended: async (query?: RecommendedActivitiesQuery) => activitiesApi.recommended(query, await authConfig()),
  myActivities: async (query: MyActivitiesQuery) => activitiesApi.myActivities(query, await authConfig()),
  details: async (activityId: string) => activitiesApi.getById(activityId, await authConfig()),
  create: async (payload: CreateActivityRequest) => activitiesApi.create(payload, await authConfig()),
  createBatch: async (payload: CreateActivitiesBatchRequest) => activitiesApi.createBatch(payload, await authConfig()),
  update: async (activityId: string, payload: UpdateActivityRequest) =>
    activitiesApi.update(activityId, payload, await authConfig()),
  cancel: async (activityId: string) => activitiesApi.cancel(activityId, await authConfig()),
  declineOrganizership: async (activityId: string) =>
    activitiesApi.declineOrganizership(activityId, await authConfig()),
  remove: async (activityId: string) => activitiesApi.remove(activityId, await authConfig()),
  saved: async (query?: ActivityListQuery) => savedActivitiesApi.listSaved(query, await authConfig()),
  save: async (activityId: string) => savedActivitiesApi.save(activityId, await authConfig()),
  unsave: async (activityId: string) => savedActivitiesApi.unsave(activityId, await authConfig()),
};
