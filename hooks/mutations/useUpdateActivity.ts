import { useMutation, useQueryClient } from '@tanstack/react-query';
import { activitiesRepository } from '@/repositories/activities.repository';
import type { UpdateActivityRequest } from '@/types/requests';
import { invalidateActivityData } from './invalidate';

export const useUpdateActivity = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ activityId, payload }: { activityId: string; payload: UpdateActivityRequest }) =>
      activitiesRepository.update(activityId, payload),
    onSuccess: (activity) => invalidateActivityData(queryClient, activity.id),
  });
};
