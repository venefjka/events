import { useMutation, useQueryClient } from '@tanstack/react-query';
import { activitiesRepository } from '@/repositories/activities.repository';
import { invalidateActivityData } from './invalidate';

export const useCancelActivity = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (activityId: string) => activitiesRepository.cancel(activityId),
    onSuccess: (activity) => invalidateActivityData(queryClient, activity.id),
  });
};
