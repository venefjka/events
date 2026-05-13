import { useQuery } from '@tanstack/react-query';
import { participationRepository } from '@/repositories/participation.repository';
import type { ActivityParticipantsQuery } from '@/types/queries';
import { queryKeys } from './queryKeys';

export const useActivityParticipants = (activityId?: string, query?: ActivityParticipantsQuery, enabled = true) =>
  useQuery({
    queryKey: queryKeys.participation.participants(activityId, query),
    queryFn: () => participationRepository.participants(activityId!, query),
    enabled: Boolean(activityId) && enabled,
  });
