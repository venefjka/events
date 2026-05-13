import { useMutation, useQueryClient } from '@tanstack/react-query';
import { subscriptionsRepository } from '@/repositories/subscriptions.repository';
import type { CreateSubscriptionRequest } from '@/types/requests';
import { queryKeys } from '@/hooks/queries/queryKeys';

export const useSubscribe = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateSubscriptionRequest) => subscriptionsRepository.subscribe(payload),
    onSuccess: (_data, payload) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.subscriptions.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.users.profile(payload.userId) });
    },
  });
};
