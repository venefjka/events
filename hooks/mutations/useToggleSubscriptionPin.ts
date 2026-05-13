import { useMutation, useQueryClient } from '@tanstack/react-query';
import { subscriptionsRepository } from '@/repositories/subscriptions.repository';
import { queryKeys } from '@/hooks/queries/queryKeys';
import type { SubscriptionDto } from '@/types/dto';
import type { PaginatedResponse } from '@/types/shared';

export const useToggleSubscriptionPin = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, isPinned }: { userId: string; isPinned: boolean }) =>
      subscriptionsRepository.update(userId, { isPinned }),
    onSuccess: (_data, { userId, isPinned }) => {
      queryClient.setQueryData<PaginatedResponse<SubscriptionDto>>(
        queryKeys.subscriptions.list(),
        (current) => {
          if (!current) return current;

          return {
            ...current,
            items: current.items.map((subscription) =>
              subscription.userId === userId
                ? { ...subscription, isPinned }
                : subscription
            ),
          };
        }
      );
    },
  });
};
