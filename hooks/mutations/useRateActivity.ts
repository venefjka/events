import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ratingsRepository } from '@/repositories/ratings.repository';
import type { CreateActivityRatingRequest } from '@/types/requests';
import { invalidateActivityData } from './invalidate';

export const useRateActivity = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateActivityRatingRequest) => ratingsRepository.create(payload),
    onSuccess: (_data, payload) => invalidateActivityData(queryClient, payload.activityId),
  });
};
