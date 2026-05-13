import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useNotifications } from '@/hooks/queries/useNotifications';
import { useApproveJoinRequest } from '@/hooks/mutations/useApproveJoinRequest';
import { useRejectJoinRequest } from '@/hooks/mutations/useRejectJoinRequest';
import { useMarkNotificationRead } from '@/hooks/mutations/useMarkNotificationRead';
import { useTheme } from '@/themes/useTheme';
import { createCommonStyles } from '@/styles/common';
import { Header } from '@/components/ui/Header';
import { EmptyState } from '@/components/ui/EmptyState';
import { Bell, BellRing, CheckCircle, Clock, Megaphone, Star, UserPlus, XCircle } from 'lucide-react-native';

export default function NotificationsScreen() {
  const notificationsQuery = useNotifications();
  const approveJoinRequest = useApproveJoinRequest();
  const rejectJoinRequest = useRejectJoinRequest();
  const markAsRead = useMarkNotificationRead();
  const theme = useTheme();
  const commonStyles = createCommonStyles(theme);

  const notifications = notificationsQuery.data?.items ?? [];

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

      <View style={[styles.content, { backgroundColor: theme.colors.surface }]}>
        {notifications.length === 0 ? (
          <View style={styles.emptyWrap}>
            <EmptyState
              icon={<Bell size={theme.spacing.iconSizeXXLarge} color={theme.colors.textSecondary} />}
              title="Нет уведомлений"
              description="Здесь будут отображаться важные обновления"
            />
          </View>
        ) : (
          <ScrollView style={styles.notificationsList} showsVerticalScrollIndicator={false}>
            {notifications.map((notification) => (
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
                  notification.activityId && (
                    <View style={styles.notificationActions}>
                      <TouchableOpacity
                        style={styles.rejectButton}
                        onPress={() => {
                          if (notification.activityId && notification.requestUserId) {
                            rejectJoinRequest.mutate({
                              activityId: notification.activityId,
                              userId: notification.requestUserId,
                            });
                            markAsRead.mutate(notification.id);
                          }
                        }}
                      >
                        <Text style={styles.rejectButtonText}>Отклонить</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.approveButton}
                        onPress={() => {
                          if (notification.activityId && notification.requestUserId) {
                            approveJoinRequest.mutate({
                              activityId: notification.activityId,
                              userId: notification.requestUserId,
                            });
                            markAsRead.mutate(notification.id);
                          }
                        }}
                      >
                        <Text style={styles.approveButtonText}>Принять</Text>
                      </TouchableOpacity>
                    </View>
                  )}
              </View>
            ))}
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
  },
  notificationsList: {
    flex: 1,
  },
  emptyWrap: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
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


