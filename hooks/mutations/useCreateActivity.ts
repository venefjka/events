import { useMutation, useQueryClient } from '@tanstack/react-query';
import { activitiesRepository } from '@/repositories/activities.repository';
import type { CreateActivityRequest } from '@/types/requests';
import { invalidateActivityData } from './invalidate';

export const useCreateActivity = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateActivityRequest) => activitiesRepository.create(payload),
    onSuccess: (activity) => invalidateActivityData(queryClient, activity.id),
  });
};
