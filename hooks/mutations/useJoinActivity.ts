import { useMutation, useQueryClient } from '@tanstack/react-query';
import { participationRepository } from '@/repositories/participation.repository';
import { invalidateActivityData } from './invalidate';

export const useJoinActivity = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ activityId, requiresApproval }: { activityId: string; requiresApproval?: boolean }) =>
      requiresApproval ? participationRepository.requestJoin(activityId) : participationRepository.join(activityId),
    onSuccess: (_data, variables) => invalidateActivityData(queryClient, variables.activityId),
  });
};
