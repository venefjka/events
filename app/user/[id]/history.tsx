import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useActivities } from '@/contexts/ActivitiesContext';
import { useActivityParticipation } from '@/contexts/ActivityParticipationContext';
import { UserPublic, UserRecord } from '@/types';
import { buildUserPublic } from '@/utils/user';
import { useTheme } from '@/themes/useTheme';
import { renderCategoryIcon } from '@/components/ui/СategoryIcon';

type HistoryTab = 'created' | 'attended' | 'upcoming';

// todo: сделать с нуля

export default function UserHistoryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { currentUser, localUsers } = useAuth();
  const { allActivities } = useActivities();
  const { getUserActivityIdsByStatus, participationUpdatedAt } = useActivityParticipation();
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState<HistoryTab>('created');

  const userId = typeof id === 'string' ? id : '';
  const userRecord = localUsers.find((user) => user.id === userId);
  const fallbackUser = allActivities
    .flatMap((activity) => [activity.organizer, ...activity.currentParticipants])
    .find((user) => user.id === userId);

  const baseUser = userRecord ?? fallbackUser ?? null;

  if (!baseUser || !currentUser) {
    router.back();
    return null;
  }

  const isOwnProfile = baseUser.id === currentUser.id;
  const displayUser: UserRecord | UserPublic = isOwnProfile
    ? (userRecord ?? currentUser)
    : userRecord
      ? buildUserPublic(userRecord, currentUser.id)
      : baseUser;

  const canViewParticipationHistory =
    isOwnProfile || (userRecord && userRecord.privacy?.showAttendanceHistory);

  const historyQuery = useQuery({
    queryKey: ['userHistory', userId, activeTab, participationUpdatedAt, allActivities.length],
    queryFn: async () => {
      // TODO(backend): GET /users/:id/history?tab=created|attended|upcoming
      const now = new Date();

      if (activeTab === 'created') {
        return allActivities.filter((activity) => activity.organizer.id === displayUser.id);
      }

      if (!canViewParticipationHistory) {
        return [];
      }

      if (activeTab === 'attended') {
        const attendedIds = new Set(getUserActivityIdsByStatus(userId, ['attended']));
        return allActivities.filter((activity) => {
          if (!attendedIds.has(activity.id)) return false;
          return new Date(activity.startAt) < now;
        });
      }

      const upcomingIds = new Set(getUserActivityIdsByStatus(userId, ['accepted', 'pending']));
      return allActivities.filter((activity) => {
        if (!upcomingIds.has(activity.id)) return false;
        return new Date(activity.startAt) > now;
      });
    },
    enabled: Boolean(userId) && (activeTab === 'created' || canViewParticipationHistory),
  });

  const activities = historyQuery.data ?? [];
  const sortedActivities = useMemo(() => {
    const sorted = [...activities];
    sorted.sort((a, b) => {
      const aDate = new Date(a.startAt).getTime();
      const bDate = new Date(b.startAt).getTime();
      if (activeTab === 'upcoming') return aDate - bDate;
      return bDate - aDate;
    });
    return sorted;
  }, [activities, activeTab]);

  const isEmpty = sortedActivities.length === 0;

  const emptyText =
    activeTab === 'created'
      ? 'Нет созданных мероприятий'
      : activeTab === 'attended'
        ? 'Нет посещенных мероприятий'
        : 'Нет предстоящих мероприятий';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={20} color="#000" />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={styles.title}>
            {'История активности'}
          </Text>
          <Text style={styles.subtitle}>{displayUser.name}</Text>
        </View>
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'created' && styles.tabActive]}
          onPress={() => setActiveTab('created')}
        >
          <Text style={[styles.tabText, activeTab === 'created' && styles.tabTextActive]}>
            {'Созданные'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'attended' && styles.tabActive]}
          onPress={() => setActiveTab('attended')}
          disabled={!canViewParticipationHistory}
        >
          <Text style={[styles.tabText, activeTab === 'attended' && styles.tabTextActive]}>
            {'Посещенные'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'upcoming' && styles.tabActive]}
          onPress={() => setActiveTab('upcoming')}
          disabled={!canViewParticipationHistory}
        >
          <Text style={[styles.tabText, activeTab === 'upcoming' && styles.tabTextActive]}>
            {'Предстоящие'}
          </Text>
        </TouchableOpacity>
      </View>

      {!canViewParticipationHistory && activeTab !== 'created' && (
        <View style={styles.lockedBanner}>
          <Text style={styles.lockedText}>
            {'История посещений закрыта настройками конфиденциальности'}
          </Text>
        </View>
      )}

      <ScrollView style={styles.content}>
        {historyQuery.isLoading && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              {'Загружаем историю...'}
            </Text>
          </View>
        )}

        {!historyQuery.isLoading && isEmpty && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>{emptyText}</Text>
          </View>
        )}

        {!historyQuery.isLoading &&
          sortedActivities.map((activity) => (
            <TouchableOpacity
              key={activity.id}
              style={styles.activityCard}
              onPress={() => router.push(`/activity/${activity.id}`)}
            >
              <View style={styles.activityIcon}>
                {renderCategoryIcon(activity.category, theme.spacing.iconSizeXLarge)}
              </View>
              <View style={styles.activityInfo}>
                <Text style={styles.activityTitle}>{activity.title}</Text>
                <Text style={styles.activityTime}>
                  {new Date(activity.startAt).toLocaleString('ru', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
                <Text style={styles.activityLocation}>{activity.location.address}</Text>
              </View>
            </TouchableOpacity>
          ))}
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 12,
    paddingTop: 8,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 12,
    gap: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
    backgroundColor: '#f5f5f5',
  },
  tabActive: {
    backgroundColor: '#000',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  tabTextActive: {
    color: '#fff',
  },
  lockedBanner: {
    marginHorizontal: 20,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    marginBottom: 8,
  },
  lockedText: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyStateText: {
    fontSize: 15,
    color: '#999',
  },
  activityCard: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#f9f9f9',
    marginBottom: 8,
  },
  activityIcon: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  activityInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  activityTime: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  activityLocation: {
    fontSize: 13,
    color: '#999',
  },
});
