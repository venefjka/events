import { useMutation, useQueryClient } from '@tanstack/react-query';
import { participationRepository } from '@/repositories/participation.repository';
import { invalidateActivityData } from './invalidate';

export const useLeaveActivity = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (activityId: string) => participationRepository.leave(activityId),
    onSuccess: (_data, activityId) => invalidateActivityData(queryClient, activityId),
  });
};
