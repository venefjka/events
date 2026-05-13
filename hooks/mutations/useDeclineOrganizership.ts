import { useMutation, useQueryClient } from '@tanstack/react-query';
import { activitiesRepository } from '@/repositories/activities.repository';
import { invalidateActivityData } from './invalidate';

export const useDeclineOrganizership = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (activityId: string) => activitiesRepository.declineOrganizership(activityId),
    onSuccess: (_data, activityId) => invalidateActivityData(queryClient, activityId),
  });
};
