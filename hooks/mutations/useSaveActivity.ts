import { useMutation, useQueryClient } from '@tanstack/react-query';
import { activitiesRepository } from '@/repositories/activities.repository';
import { queryKeys } from '@/hooks/queries/queryKeys';

export const useSaveActivity = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ activityId, saved }: { activityId: string; saved: boolean }) =>
      saved ? activitiesRepository.unsave(activityId) : activitiesRepository.save(activityId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.activities.saved() });
      queryClient.invalidateQueries({ queryKey: queryKeys.activities.details(variables.activityId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.activities.all });
    },
  });
};
