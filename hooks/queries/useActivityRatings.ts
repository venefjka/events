import { useQuery } from '@tanstack/react-query';
import { ratingsRepository } from '@/repositories/ratings.repository';
import type { ActivityRatingsListQuery } from '@/types/queries';
import { queryKeys } from './queryKeys';

export const useActivityRatings = (activityId?: string, query?: ActivityRatingsListQuery) =>
  useQuery({
    queryKey: queryKeys.ratings.byActivity(activityId, query),
    queryFn: () => ratingsRepository.listByActivity(activityId!, query),
    enabled: Boolean(activityId),
  });
