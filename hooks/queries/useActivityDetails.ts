import { useQuery } from '@tanstack/react-query';
import { activitiesRepository } from '@/repositories/activities.repository';
import { queryKeys } from './queryKeys';

export const useActivityDetails = (activityId?: string) =>
  useQuery({
    queryKey: queryKeys.activities.details(activityId),
    queryFn: () => activitiesRepository.details(activityId!),
    enabled: Boolean(activityId),
  });
