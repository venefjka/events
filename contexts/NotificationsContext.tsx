import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect } from 'react';
import { Notification } from '../types';
import { useAuth } from './AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useMutation } from '@tanstack/react-query';

export const [NotificationsProvider, useNotifications] = createContextHook(() => {
  const { currentUser } = useAuth();
  
  const notificationsQuery = useQuery({
    queryKey: ['notifications', currentUser?.id],
    queryFn: async () => {
      if (!currentUser) return [];
      const stored = await AsyncStorage.getItem(`notifications-${currentUser.id}`);
      return stored ? JSON.parse(stored) : [];
    },
    enabled: !!currentUser,
  });

  const saveNotificationsMutation = useMutation({
    mutationFn: async (notifications: Notification[]) => {
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
