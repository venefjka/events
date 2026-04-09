import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useNotifications } from '@/contexts/NotificationsContext';
import { useActivities } from '@/contexts/ActivitiesContext';
import { useActivityParticipation } from '@/contexts/ActivityParticipationContext';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/themes/useTheme';
import { createCommonStyles } from '@/styles/common';
import { Header } from '@/components/ui/Header';
import { EmptyState } from '@/components/ui/EmptyState';
import { Bell, BellRing, CheckCircle, Clock, Megaphone, Star, UserPlus, XCircle } from 'lucide-react-native';

export default function NotificationsScreen() {
  const { currentUser } = useAuth();
  const { notifications, markAsRead } = useNotifications();
  const { allActivities } = useActivities();
  const { approveJoinRequest, rejectJoinRequest } = useActivityParticipation();
  const theme = useTheme();
  const commonStyles = createCommonStyles(theme);

  const userNotifications = notifications.filter(n => n.userId === currentUser?.id);

  const getNotificationIcon = (type: string) => {
    const iconProps = { size: 20, color: theme.colors.text };
    switch (type) {
      case 'request':
        return <UserPlus {...iconProps} />;
      case 'request_approved':
        return <CheckCircle {...iconProps} />;
      case 'request_rejected':
        return <XCircle {...iconProps} />;
      case 'system':
        return <Megaphone {...iconProps} />;
      case 'reminder':
        return <Clock {...iconProps} />;
      case 'social':
        return <Star {...iconProps} />;
      default:
        return <BellRing {...iconProps} />;
    }
  };

  return (
    <SafeAreaView style={[commonStyles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
      <Header title="Уведомления" />

      <ScrollView style={[styles.notificationsList, { backgroundColor: theme.colors.surface }]} showsVerticalScrollIndicator={false}>
        {userNotifications.length === 0 && (
          <EmptyState
            icon={<Bell />}
            title="Нет уведомлений"
            description="Здесь будут отображаться важные обновления"
          />
        )}

        {userNotifications.map((notification) => {
          const activity = notification.activityId
            ? allActivities.find((a) => a.id === notification.activityId)
            : null;

          return (
            <View
              key={notification.id}
              style={[styles.notificationItem, styles.notificationUnread]}
            >
              <TouchableOpacity
                style={styles.notificationMain}
                onPress={() => {
                  if (notification.activityId) {
                    router.push(`/activity/${notification.activityId}`);
                  }
                }}
              >
                <View style={styles.notificationIcon}>
                  {getNotificationIcon(notification.type)}
                </View>
                <View style={styles.notificationContent}>
                  <Text style={styles.notificationTitle}>{notification.title}</Text>
                  <Text style={styles.notificationMessage}>{notification.message}</Text>
                  <Text style={styles.notificationTime}>
                    {new Date(notification.timestamp).toLocaleString('ru', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                </View>
              </TouchableOpacity>

              {notification.type === 'request' &&
                notification.actionRequired &&
                !notification.read &&
                activity && (
                  <View style={styles.notificationActions}>
                    <TouchableOpacity
                      style={styles.rejectButton}
                      onPress={() => {
                        if (notification.activityId && notification.requestUserId) {
                          rejectJoinRequest(notification.activityId, notification.requestUserId);
                          markAsRead(notification.id);
                        }
                      }}
                    >
                      <Text style={styles.rejectButtonText}>Отклонить</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.approveButton}
                      onPress={() => {
                        if (notification.activityId && notification.requestUserId) {
                          approveJoinRequest(notification.activityId, notification.requestUserId);
                          markAsRead(notification.id);
                        }
                      }}
                    >
                      <Text style={styles.approveButtonText}>Принять</Text>
                    </TouchableOpacity>
                  </View>
                )}
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  notificationsList: {
    flex: 1,
  },
  notificationItem: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  notificationMain: {
    flexDirection: 'row',
  },
  notificationUnread: {
    backgroundColor: '#ffffff',
  },
  notificationIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  notificationMessage: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 6,
  },
  notificationTime: {
    fontSize: 13,
    color: '#999',
  },
  notificationActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    paddingLeft: 56,
  },
  approveButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#000',
    alignItems: 'center',
  },
  approveButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  rejectButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
  },
  rejectButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
});


