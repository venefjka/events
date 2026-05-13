import { useQuery } from '@tanstack/react-query';
import { notificationsRepository } from '@/repositories/notifications.repository';
import type { NotificationsQuery } from '@/types/queries';
import { queryKeys } from './queryKeys';

export const useNotifications = (query?: NotificationsQuery) =>
  useQuery({
    queryKey: queryKeys.notifications.list(query),
    queryFn: () => notificationsRepository.list(query),
  });
