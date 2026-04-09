﻿import createContextHook from '@nkzw/create-context-hook';
import { Notification } from '../types';
import { useAuth } from './AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useMutation } from '@tanstack/react-query';

export const [NotificationsProvider, useNotifications] = createContextHook(() => {
  const { currentUser } = useAuth();

  const buildMockNotifications = (userId: string): Notification[] => {
    const now = Date.now();
    return [
      {
        id: `seed-${userId}-request`,
        userId,
        type: 'request',
        title: 'Заявка на участие',
        message: 'Пользователь хочет присоединиться к вашей активности.',
        timestamp: new Date(now - 1000 * 60 * 30).toISOString(),
        read: false,
        activityId: 'a-1',
        actionRequired: true,
        requestUserId: 'u-2',
      },
      {
        id: `seed-${userId}-reminder`,
        userId,
        type: 'reminder',
        title: 'Напоминание',
        message: 'Через 2 часа начинается мероприятие.',
        timestamp: new Date(now - 1000 * 60 * 60 * 3).toISOString(),
        read: false,
      },
      {
        id: `seed-${userId}-welcome`,
        userId,
        type: 'system',
        title: 'Добро пожаловать',
        message: 'Мы подготовили подборку событий рядом с вами.',
        timestamp: new Date(now - 1000 * 60 * 60 * 8).toISOString(),
        read: false,
      },
    ];
  };

  const seedNotificationsIfEmpty = async (userId: string) => {
    const stored = await AsyncStorage.getItem(`notifications-${userId}`);
    if (stored && JSON.parse(stored).length > 0) {
      return stored;
    }
    const seededFlag = await AsyncStorage.getItem(`notifications-seeded-${userId}`);
    if (seededFlag) {
      return stored ?? '[]';
    }
    const seeded = buildMockNotifications(userId);
    await AsyncStorage.setItem(`notifications-${userId}`, JSON.stringify(seeded));
    await AsyncStorage.setItem(`notifications-seeded-${userId}`, 'true');
    return JSON.stringify(seeded);
  };
  
  const notificationsQuery = useQuery({
    queryKey: ['notifications', currentUser?.id],
    queryFn: async () => {
      // TODO(backend): GET /notifications?userId=...
      // Use pagination, unread filter, and avoid fetching for other users.
      if (!currentUser) return [];
      const stored = await seedNotificationsIfEmpty(currentUser.id);
      return stored ? JSON.parse(stored) : [];
    },
    enabled: !!currentUser,
  });

  const saveNotificationsMutation = useMutation({
    mutationFn: async (notifications: Notification[]) => {
      // TODO(backend): PUT /notifications/bulk or PATCH /notifications/:id
      // Send only changed IDs instead of full list.
      if (!currentUser) return;
      await AsyncStorage.setItem(
        `notifications-${currentUser.id}`,
        JSON.stringify(notifications)
      );
    },
    onSuccess: () => {
      notificationsQuery.refetch();
    },
  });

  const notifications: Notification[] = notificationsQuery.data || [];

  const addNotification = async (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    if (!notification.userId) return;
    
    const newNotification: Notification = {
      ...notification,
      id: `notification-${Date.now()}-${Math.random()}`,
      timestamp: new Date().toISOString(),
      read: false,
    };
    
    const targetUserId = notification.userId;
    const stored = await AsyncStorage.getItem(`notifications-${targetUserId}`);
    const existingNotifications = stored ? JSON.parse(stored) : [];
    const updatedNotifications = [newNotification, ...existingNotifications];
    
    await AsyncStorage.setItem(
      `notifications-${targetUserId}`,
      JSON.stringify(updatedNotifications)
    );
    
    if (currentUser?.id === targetUserId) {
      notificationsQuery.refetch();
    }
  };

  const markAsRead = (notificationId: string) => {
    const updatedNotifications = notifications.map((n: Notification) =>
      n.id === notificationId ? { ...n, read: true } : n
    );
    saveNotificationsMutation.mutate(updatedNotifications);
  };

  const markAllAsRead = () => {
    const updatedNotifications = notifications.map((n: Notification) => ({ ...n, read: true }));
    saveNotificationsMutation.mutate(updatedNotifications);
  };

  const clearNotification = (notificationId: string) => {
    const updatedNotifications = notifications.filter((n: Notification) => n.id !== notificationId);
    saveNotificationsMutation.mutate(updatedNotifications);
  };

  const unreadCount = notifications.filter((n: Notification) => !n.read).length;

  return {
    notifications,
    addNotification,
    markAsRead,
    markAllAsRead,
    clearNotification,
    unreadCount,
  };
});


