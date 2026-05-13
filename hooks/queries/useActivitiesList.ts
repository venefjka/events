import { useQuery } from '@tanstack/react-query';
import { activitiesRepository } from '@/repositories/activities.repository';
import type { ActivityListQuery } from '@/types/queries';
import { queryKeys } from './queryKeys';
import { activityListQueryOptions } from './queryOptions';

export const useActivitiesList = (query?: ActivityListQuery, enabled = true) =>
  useQuery({
    queryKey: queryKeys.activities.list(query),
    queryFn: () => activitiesRepository.list(query),
    enabled,
    ...activityListQueryOptions,
  });
