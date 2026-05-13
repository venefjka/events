import { useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsRepository } from '@/repositories/notifications.repository';
import { queryKeys } from '@/hooks/queries/queryKeys';
import type { NotificationDto } from '@/types/dto';
import type { PaginatedResponse } from '@/types/shared';

export const useMarkAllNotificationsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: notificationsRepository.markAllRead,
    onSuccess: () => {
      queryClient.setQueryData<PaginatedResponse<NotificationDto>>(
        queryKeys.notifications.list(),
        (current) => {
          if (!current) return current;

          return {
            ...current,
            items: current.items.map((notification) => ({ ...notification, read: true })),
          };
        }
      );
    },
  });
};
