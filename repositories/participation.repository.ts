import { participationApi } from '@/api/participation';
import { authRepository } from '@/repositories/authRepository';
import type { ActivityJoinRequestsQuery, ActivityParticipantsQuery } from '@/types/queries';
import type {
  ApproveJoinRequestRequest,
} from '@/types/requests';

const authConfig = async () => ({ authToken: (await authRepository.getAccessToken()) ?? undefined });

export const participationRepository = {
  participants: async (activityId: string, query?: ActivityParticipantsQuery) =>
    participationApi.listParticipants(activityId, query, await authConfig()),
  joinRequests: async (activityId: string, query?: ActivityJoinRequestsQuery) =>
    participationApi.listJoinRequests(activityId, query, await authConfig()),
  join: async (activityId: string) => participationApi.join(activityId, await authConfig()),
  requestJoin: async (activityId: string) => participationApi.requestJoin(activityId, await authConfig()),
  leave: async (activityId: string) => participationApi.leave(activityId, await authConfig()),
  cancelJoinRequest: async (activityId: string) => participationApi.cancelJoinRequest(activityId, await authConfig()),
  approveJoinRequest: async (payload: ApproveJoinRequestRequest) =>
    participationApi.approveJoinRequest(payload, await authConfig()),
  rejectJoinRequest: async (payload: ApproveJoinRequestRequest) =>
    participationApi.rejectJoinRequest(payload, await authConfig()),
};
