import { useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsRepository } from '@/repositories/notifications.repository';
import { queryKeys } from '@/hooks/queries/queryKeys';
import type { NotificationDto } from '@/types/dto';
import type { PaginatedResponse } from '@/types/shared';

export const useMarkNotificationRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notificationId: string) => notificationsRepository.markRead(notificationId),
    onSuccess: (_data, notificationId) => {
      queryClient.setQueryData<PaginatedResponse<NotificationDto>>(
        queryKeys.notifications.list(),
        (current) => {
          if (!current) return current;

          return {
            ...current,
            items: current.items.map((notification) =>
              notification.id === notificationId
                ? { ...notification, read: true }
                : notification
            ),
          };
        }
      );
    },
  });
};
