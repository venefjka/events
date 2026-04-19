import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { Asterisk, CalendarPlus2, CircleUserRound, Star } from 'lucide-react-native';
import { Header } from '@/components/ui/Header';
import { EmptyState } from '@/components/ui/EmptyState';
import { ExpandableTabBar } from '@/components/ui/ExpandableTabs';
import { UserActivityFeedList } from '@/components/user-activity/UserActivityFeedList';
import { useActivities } from '@/contexts/ActivitiesContext';
import { useActivityParticipation } from '@/contexts/ActivityParticipationContext';
import { useActivityRatings } from '@/contexts/ActivityRatingsContext';
import { useAuth } from '@/contexts/AuthContext';
import { useUserActivityFeed } from '@/contexts/UserActivityFeedContext';
import { useUsers } from '@/contexts/UsersContext';
import { createCommonStyles } from '@/styles/common';
import { UserPublic, UserRecord } from '@/types';
import {
  buildUserActivityFeedItems,
  getUserActivityFeedCategory,
  type UserActivityFeedCategory,
} from '@/utils/userActivityFeed';
import { buildUserPublic } from '@/utils/user';
import type { Theme } from '@/themes/theme';
import { useTheme } from '@/themes/useTheme';

export default function UserHistoryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const userId = typeof id === 'string' ? id : '';
  const { currentUser } = useAuth();
  const { getUserById } = useUsers();
  const { allActivities } = useActivities();
  const { getUserParticipationRecords, participationUpdatedAt } = useActivityParticipation();
  const { activityRatings } = useActivityRatings();
  const { feedEvents, isLoading } = useUserActivityFeed();
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const commonStyles = useMemo(() => createCommonStyles(theme), [theme]);
  const [activeFilter, setActiveFilter] = useState<UserActivityFeedCategory>('all');

  const filterOptions = useMemo(
    () => [
      {
        id: 'all' as UserActivityFeedCategory,
        label: 'Вся',
        renderIcon: ({ size, color }: { size: number; color: string }) => (
          <Asterisk size={size * 1.2} color={color} />
        ),
      },
      {
        id: 'organizer' as UserActivityFeedCategory,
        label: 'Организатор',
        renderIcon: ({ size, color }: { size: number; color: string }) => (
          <CalendarPlus2 size={size} color={color} />
        ),
      },
      {
        id: 'participant' as UserActivityFeedCategory,
        label: 'Участник',
        renderIcon: ({ size, color }: { size: number; color: string }) => (
          <CircleUserRound size={size} color={color} />
        ),
      },
      {
        id: 'ratings' as UserActivityFeedCategory,
        label: 'Оценки',
        renderIcon: ({ size, color }: { size: number; color: string }) => (
          <Star size={size} color={color} />
        ),
      },
    ],
    []
  );

  const userRecord = getUserById(userId);
  const baseUser = userRecord ?? null;

  if (!baseUser || !currentUser) {
    return (
      <SafeAreaView style={commonStyles.container} edges={['top', 'bottom']}>
        <Header showBackButton title="История активности" borderBottom={false} />
        <View style={commonStyles.emptyContainer}>
          <EmptyState
            title="Пользователь не найден"
            description="Не удалось открыть историю для этого профиля."
          />
        </View>
      </SafeAreaView>
    );
  }

  const isOwnProfile = baseUser.id === currentUser.id;
  const displayUser: UserRecord | UserPublic = isOwnProfile
    ? (userRecord ?? currentUser)
    : userRecord
      ? buildUserPublic(userRecord, currentUser.id)
      : baseUser;

  const canViewParticipationHistory = Boolean(
    isOwnProfile || (userRecord && userRecord.privacy?.showAttendanceHistory)
  );

  const feedItems = useMemo(
    () =>
      buildUserActivityFeedItems({
        userId,
        canViewParticipationHistory,
        events: feedEvents,
        activities: allActivities,
        participationRecords: getUserParticipationRecords(userId),
        activityRatings,
      }),
    [
      activityRatings,
      allActivities,
      canViewParticipationHistory,
      displayUser.id,
      feedEvents,
      getUserParticipationRecords,
      participationUpdatedAt,
      userId,
    ]
  );

  const filteredFeed = useMemo(
    () =>
      feedItems.filter(
        (item) => activeFilter === 'all' || getUserActivityFeedCategory(item.type) === activeFilter
      ),
    [activeFilter, feedItems]
  );

  const isEmpty = filteredFeed.length === 0;
  const emptyDescription =
    canViewParticipationHistory || activeFilter === 'organizer' || activeFilter === 'all'
      ? 'Пока нет событий для выбранного фильтра'
      : 'История участника скрыта настройками конфиденциальности';

  return (
    <SafeAreaView style={commonStyles.container} edges={['top']}>
      <Header showBackButton title="История активности" borderBottom={false} />

      <View style={styles.filtersWrap}>
        <ExpandableTabBar
          items={filterOptions.filter(
            (option) => canViewParticipationHistory || option.id === 'all' || option.id === 'organizer'
          )}
          activeId={activeFilter}
          onChange={setActiveFilter}
          gap={theme.spacing.sm}
          circleSize={44}
          iconSize={18}
          activePillWidth={0.55}
          containerStyle={styles.filters}
        />
      </View>

      <ScrollView
        style={[commonStyles.content, { backgroundColor: theme.colors.surface }]}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyText, { color: theme.colors.textSecondary, ...theme.typography.body }]}>
              Загружаем историю...
            </Text>
          </View>
        ) : isEmpty ? (
          <View style={styles.emptyState}>
            <EmptyState
              title="Событий пока нет"
              description={emptyDescription}
            />
          </View>
        ) : (
          <UserActivityFeedList items={filteredFeed} style={{
            backgroundColor: theme.colors.background,
            paddingHorizontal: theme.spacing.screenPaddingHorizontal,
            paddingTop: theme.spacing.md,
            paddingBottom: theme.spacing.xs,
            borderRadius: theme.spacing.radiusLarge,
          }} />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    filtersWrap: {
      paddingHorizontal: theme.spacing.screenPaddingHorizontal,
      paddingBottom: theme.spacing.md,
    },
    filters: {
      flexGrow: 0,
    },
    content: {
      paddingBottom: theme.spacing.xxxl,
      gap: theme.spacing.md,
    },
    emptyState: {
      paddingTop: theme.spacing.xxl,
    },
    emptyText: {
      textAlign: 'center',
    },
  });
