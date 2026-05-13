import { useQuery } from '@tanstack/react-query';
import { activitiesRepository } from '@/repositories/activities.repository';
import type { RecommendedActivitiesQuery } from '@/types/queries';
import { queryKeys } from './queryKeys';
import { activityListQueryOptions } from './queryOptions';

export const useRecommendedActivities = (query?: RecommendedActivitiesQuery, enabled = true) =>
  useQuery({
    queryKey: queryKeys.activities.recommended(query),
    queryFn: () => activitiesRepository.recommended(query),
    enabled,
    ...activityListQueryOptions,
  });
