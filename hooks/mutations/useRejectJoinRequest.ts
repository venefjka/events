import { useMutation, useQueryClient } from '@tanstack/react-query';
import { participationRepository } from '@/repositories/participation.repository';
import type { ApproveJoinRequestRequest } from '@/types/requests';
import { invalidateActivityData, invalidateNotifications } from './invalidate';

export const useRejectJoinRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ApproveJoinRequestRequest) => participationRepository.rejectJoinRequest(payload),
    onSuccess: (_data, payload) => {
      invalidateActivityData(queryClient, payload.activityId);
      invalidateNotifications(queryClient);
    },
  });
};
