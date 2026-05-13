import { useQuery } from '@tanstack/react-query';
import { activitiesRepository } from '@/repositories/activities.repository';
import type { MyActivitiesQuery } from '@/types/queries';
import { queryKeys } from './queryKeys';
import { activityListQueryOptions } from './queryOptions';

export const useMyActivitiesList = (query: MyActivitiesQuery, enabled = true) =>
  useQuery({
    queryKey: queryKeys.activities.my(query),
    queryFn: () => activitiesRepository.myActivities(query),
    enabled,
    ...activityListQueryOptions,
  });
