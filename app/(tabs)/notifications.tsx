import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useNotifications } from '@/contexts/NotificationsContext';
import { useActivities } from '@/contexts/ActivitiesContext';
import { useAuth } from '@/contexts/AuthContext';

export default function NotificationsScreen() {
  const { currentUser } = useAuth();
  const { notifications, markAsRead } = useNotifications();
  const { approveJoinRequest, rejectJoinRequest, allActivities } = useActivities();
  const [activeTab, setActiveTab] = useState<'all' | 'activities'>('all');

  const userNotifications = notifications.filter(n => n.userId === currentUser?.id);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'request':
        return '👋';
      case 'request_approved':
        return '✅';
      case 'request_rejected':
        return '❌';
      case 'system':
        return '📢';
      case 'reminder':
        return '⏰';
      case 'social':
        return '⭐';
      default:
        return '📌';
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Уведомления</Text>
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'all' && styles.tabActive]}
          onPress={() => setActiveTab('all')}
        >
          <Text style={[styles.tabText, activeTab === 'all' && styles.tabTextActive]}>
            Все
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'activities' && styles.tabActive]}
          onPress={() => setActiveTab('activities')}
        >
          <Text
            style={[styles.tabText, activeTab === 'activities' && styles.tabTextActive]}
          >
            Мои активности
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.notificationsList}>
        {userNotifications.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateTitle}>Нет уведомлений</Text>
            <Text style={styles.emptyStateText}>
              Здесь будут отображаться важные обновления
            </Text>
          </View>
        )}

        {userNotifications.map((notification) => {
          const activity = notification.activityId
            ? allActivities.find((a) => a.id === notification.activityId)
            : null;

          return (
            <View
              key={notification.id}
              style={[styles.notificationItem, !notification.read && styles.notificationUnread]}
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
                  <Text style={styles.notificationIconText}>
                    {getNotificationIcon(notification.type)}
                  </Text>
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
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000',
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
  },
  tabActive: {
    backgroundColor: '#000',
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#666',
  },
  tabTextActive: {
    color: '#fff',
  },
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
    backgroundColor: '#fafafa',
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
  notificationIconText: {
    fontSize: 20,
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
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
    paddingHorizontal: 40,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
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
