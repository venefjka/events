import { useQuery } from '@tanstack/react-query';
import { activitiesRepository } from '@/repositories/activities.repository';
import type { ActivityListQuery } from '@/types/queries';
import { queryKeys } from './queryKeys';
import { activityListQueryOptions } from './queryOptions';

export const useSavedActivities = (query?: ActivityListQuery, enabled = true) =>
  useQuery({
    queryKey: queryKeys.activities.saved(query),
    queryFn: () => activitiesRepository.saved(query),
    enabled,
    ...activityListQueryOptions,
  });
