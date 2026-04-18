import React, { useMemo } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Camera, QrCode, ScanEye, ScanFace, ShieldCheck, User } from 'lucide-react-native';
import { ActivityCard } from '@/components/cards/ActivityCard';
import { ExpandableTabBar } from '@/components/ui/ExpandableTabs';
import { EmptyState } from '@/components/ui/EmptyState';
import { Header } from '@/components/ui/Header';
import { useActivities } from '@/contexts/ActivitiesContext';
import { useActivityParticipation } from '@/contexts/ActivityParticipationContext';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/themes/useTheme';

type QrMode = 'participant' | 'organizer';

const modeItems = [
  {
    id: 'participant' as const,
    label: 'Участник',
    renderIcon: ({ color, size }: { color: string; size: number }) => (
      <ScanFace size={size} color={color} />
    ),
  },
  {
    id: 'organizer' as const,
    label: 'Организатор',
    renderIcon: ({ color, size }: { color: string; size: number }) => (
      <ScanEye size={size} color={color} />
    ),
  },
];

export default function QRHubScreen() {
  const { mode } = useLocalSearchParams<{ mode?: QrMode }>();
  const resolvedModeParam = Array.isArray(mode) ? mode[0] : mode;
  const activeMode: QrMode = resolvedModeParam === 'organizer' ? 'organizer' : 'participant';
  const { currentUser } = useAuth();
  const { allActivities } = useActivities();
  const { getUserActivityIdsByStatus } = useActivityParticipation();
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const participantActivityIds = useMemo(() => {
    if (!currentUser) return new Set<string>();
    return new Set(getUserActivityIdsByStatus(currentUser.id, ['accepted']));
  }, [currentUser, getUserActivityIdsByStatus]);

  const participantActivities = useMemo(() => {
    const now = Date.now();

    return allActivities.filter((item) => {
      const endAt = new Date(item.endAt || item.startAt).getTime();
      const isUpcomingOrOngoing = !Number.isNaN(endAt) && endAt >= now;

      return item.status === 'active' && isUpcomingOrOngoing && participantActivityIds.has(item.id);
    });
  }, [allActivities, participantActivityIds]);

  const organizerActivities = useMemo(() => {
    const now = Date.now();

    return allActivities.filter((item) => {
      const endAt = new Date(item.endAt || item.startAt).getTime();
      const isUpcomingOrOngoing = !Number.isNaN(endAt) && endAt >= now;

      return item.status === 'active' && isUpcomingOrOngoing && item.organizer.id === currentUser?.id;
    });
  }, [allActivities, currentUser?.id]);

  const displayedActivities =
    activeMode === 'participant' ? participantActivities : organizerActivities;

  const emptyState =
    activeMode === 'participant'
      ? {
          icon: <QrCode size={theme.spacing.iconSizeXXLarge} color={theme.colors.textSecondary} />,
          title: 'Нет доступных QR',
          description:
            'Здесь появятся предстоящие и текущие активности, на которые вы зарегистрированы',
        }
      : {
          icon: <Camera size={theme.spacing.iconSizeXXLarge} color={theme.colors.textSecondary} />,
          title: 'Нет событий для сканирования',
          description:
            'Здесь появятся ваши предстоящие и текущие мероприятия, где можно отмечать участников',
        };

  if (!currentUser) {
    return null;
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <SafeAreaView edges={['top']} style={styles.headerSafeArea}>
        <Header title="QR-код" />
      </SafeAreaView>

      <View style={styles.contentSafeArea}>
        {displayedActivities.length > 0 ? (
          <FlatList
            data={displayedActivities}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <ActivityCard
                activity={item}
                mode="list"
                showCTA={false}
                onPress={() =>
                  router.push(
                    activeMode === 'participant'
                      ? `/my-qr?activityId=${item.id}`
                      : `/qr-scan?activityId=${item.id}`
                  )
                }
              />
            )}
            ListHeaderComponent={
              <View style={styles.listHeader}>
                <Text style={[styles.listDescription, { color: theme.colors.textSecondary }]}>
                  {activeMode === 'participant'
                    ? 'Выберите событие и покажите экран организатору для отметки посещения'
                    : 'Выберите своё мероприятие, чтобы начать отмечать участников'}
                </Text>
              </View>
            }
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <View style={styles.emptyWrap}>
            <EmptyState
              icon={emptyState.icon}
              title={emptyState.title}
              description={emptyState.description}
            />
          </View>
        )}
      </View>

      <View
        style={[
          styles.modeTabsWrap,
          {
            borderTopColor: theme.colors.border,
            borderTopWidth: theme.spacing.borderWidth,
            backgroundColor: theme.colors.background,
          },
        ]}
      >
        <ExpandableTabBar<QrMode>
          items={modeItems}
          activeId={activeMode}
          onChange={(nextMode) => router.replace(`/qr?mode=${nextMode}`)}
          circleSize={theme.spacing.iconButtonHeight}
          iconSize={theme.spacing.iconSize}
        />
      </View>
    </View>
  );
}

const createStyles = (theme: ReturnType<typeof useTheme>) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    headerSafeArea: {
      zIndex: 10,
    },
    contentSafeArea: {
      flex: 1,
      backgroundColor: theme.colors.surface
    },
    listHeader: {
      paddingBottom: theme.spacing.lg,
    },
    listDescription: {
      ...theme.typography.body,
      lineHeight: 22,
    },
    listContent: {
      gap: theme.spacing.sm,
      paddingHorizontal: theme.spacing.screenPaddingHorizontal,
      paddingTop: theme.spacing.xxl,
    },
    emptyWrap: {
      flex: 1,
      justifyContent: 'center',
      paddingHorizontal: theme.spacing.screenPaddingHorizontal,
    },
    modeTabsWrap: {
      paddingHorizontal: theme.spacing.screenPaddingHorizontal,
      paddingBottom: theme.spacing.md,
      paddingTop: theme.spacing.lg - 1,
    },
  });
