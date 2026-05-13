import React, { useMemo, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { Asterisk, CalendarPlus2, CircleUserRound, Star } from 'lucide-react-native';
import { Header } from '@/components/ui/Header';
import { EmptyState } from '@/components/ui/EmptyState';
import { ExpandableTabBar } from '@/components/ui/ExpandableTabs';
import { UserHistoryList } from '@/components/UserHistoryList';
import { useUserHistory } from '@/hooks/queries/useUserHistory';
import { useUserProfile } from '@/hooks/queries/useUserProfile';
import { createCommonStyles } from '@/styles/common';
import type { Theme } from '@/themes/theme';
import { useTheme } from '@/themes/useTheme';

type HistoryTab = 'all' | 'organizer' | 'participant' | 'ratings';

export default function UserHistoryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const userId = typeof id === 'string' ? id : '';
  const [activeTab, setActiveTab] = useState<HistoryTab>('all');
  const profileQuery = useUserProfile(userId);
  const historyQuery = useUserHistory(
    userId,
    { tab: activeTab, limit: 50 },
    Boolean(userId && activeTab)
  );
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const commonStyles = useMemo(() => createCommonStyles(theme), [theme]);
  const events = activeTab ? historyQuery.data?.items ?? [] : [];
  const userGender = profileQuery.data?.gender;

  const tabItems = useMemo(
    () => [
      {
        id: 'all' as const,
        label: 'Вся',
        renderIcon: ({ size, color }: { size: number; color: string }) => (
          <Asterisk size={size * 1.2} color={color} />
        ),
      },
      {
        id: 'organizer' as const,
        label: 'Организатор',
        renderIcon: ({ size, color }: { size: number; color: string }) => (
          <CalendarPlus2 size={size} color={color} />
        ),
      },
      {
        id: 'participant' as const,
        label: 'Участник',
        renderIcon: ({ size, color }: { size: number; color: string }) => (
          <CircleUserRound size={size} color={color} />
        ),
      },
      {
        id: 'ratings' as const,
        label: 'Оценки',
        renderIcon: ({ size, color }: { size: number; color: string }) => (
          <Star size={size} color={color} />
        ),
      },
    ],
    []
  );

  return (
    <SafeAreaView style={commonStyles.container} edges={['top']}>
      <Header showBackButton title="История активности" borderBottom={false} />

      <View style={styles.filtersWrap}>
        <ExpandableTabBar<HistoryTab>
          items={tabItems}
          activeId={activeTab}
          onChange={setActiveTab}
          gap={theme.spacing.sm}
          circleSize={44}
          iconSize={18}
          activePillWidth={0.55}
          containerStyle={styles.filters}
        />
      </View>

      <FlatList
        style={[commonStyles.content, { backgroundColor: theme.colors.surface }]}
        contentContainerStyle={[
          styles.content,
          events.length === 0 && styles.emptyContent,
          { paddingTop: theme.spacing.md },
        ]}
        data={events}
        keyExtractor={(item) => `${item.type}-${item.occurredAt}-${item.activity.id}`}
        renderItem={({ item }) => <UserHistoryList items={[item]} userGender={userGender} />}
        ListEmptyComponent={
          <EmptyState
            title={historyQuery.isLoading ? 'Загружаем...' : 'Событий пока нет'}
            description="История активности пользователя на платформе не содержит записей"
          />
        }
      />
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
      paddingHorizontal: theme.spacing.screenPaddingHorizontal,
    },
    emptyContent: {
      flexGrow: 1,
      justifyContent: 'center',
    },
  });
