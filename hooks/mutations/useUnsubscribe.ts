import { useMutation, useQueryClient } from '@tanstack/react-query';
import { subscriptionsRepository } from '@/repositories/subscriptions.repository';
import { queryKeys } from '@/hooks/queries/queryKeys';
import type { SubscriptionDto } from '@/types/dto';
import type { PaginatedResponse } from '@/types/shared';

export const useUnsubscribe = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => subscriptionsRepository.unsubscribe(userId),
    onSuccess: (_data, userId) => {
      queryClient.setQueriesData<PaginatedResponse<SubscriptionDto>>(
        { queryKey: queryKeys.subscriptions.all },
        (current) => {
          if (!current) return current;

          return {
            ...current,
            items: current.items.filter((subscription) => subscription.userId !== userId),
          };
        }
      );
      queryClient.invalidateQueries({ queryKey: queryKeys.subscriptions.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.users.profile(userId) });
    },
  });
};
