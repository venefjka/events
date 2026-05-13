import { notificationsApi } from '@/api/notifications';
import { authRepository } from '@/repositories/authRepository';
import type { NotificationsQuery } from '@/types/queries';
import type { UpdateNotificationRequest } from '@/types/requests';

const authConfig = async () => ({ authToken: (await authRepository.getAccessToken()) ?? undefined });

export const notificationsRepository = {
  list: async (query?: NotificationsQuery) => notificationsApi.list(query, await authConfig()),
  update: async (notificationId: string, payload: UpdateNotificationRequest) =>
    notificationsApi.update(notificationId, payload, await authConfig()),
  markRead: async (notificationId: string) =>
    notificationsApi.update(notificationId, { read: true }, await authConfig()),
  markAllRead: async () => notificationsApi.readAll(await authConfig()),
  remove: async (notificationId: string) => notificationsApi.remove(notificationId, await authConfig()),
};
