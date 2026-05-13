import { useQuery } from '@tanstack/react-query';
import { participationRepository } from '@/repositories/participation.repository';
import type { ActivityJoinRequestsQuery } from '@/types/queries';
import { queryKeys } from './queryKeys';

export const useActivityJoinRequests = (
  activityId?: string,
  query?: ActivityJoinRequestsQuery,
  enabled = true
) =>
  useQuery({
    queryKey: queryKeys.participation.joinRequests(activityId, query),
    queryFn: () => participationRepository.joinRequests(activityId!, query),
    enabled: Boolean(activityId) && enabled,
  });
