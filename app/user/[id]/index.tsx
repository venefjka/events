import { router, useLocalSearchParams } from 'expo-router';
import { Edit, Lock, UserMinus, UserPlus } from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ProfileHero } from '@/components/profile/ProfileHero';
import { ReviewCard } from '@/components/profile/ReviewCard';
import { UserActivityFeedList } from '@/components/user-activity/UserActivityFeedList';
import { EmptyState } from '@/components/ui/EmptyState';
import { Header } from '@/components/ui/Header';
import { PhotoViewerModal } from '@/components/ui/PhotoViewerModal';
import { renderCategoryIcon } from '@/components/ui/CategoryIcon';
import { categories } from '@/constants/categories';
import { useActivities } from '@/contexts/ActivitiesContext';
import { useActivityParticipation } from '@/contexts/ActivityParticipationContext';
import { useActivityRatings } from '@/contexts/ActivityRatingsContext';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscriptions } from '@/contexts/SubscriptionsContext';
import { useUserActivityFeed } from '@/contexts/UserActivityFeedContext';
import { useUsers } from '@/contexts/UsersContext';
import { createCommonStyles } from '@/styles/common';
import type { UserPublic, UserRecord } from '@/types';
import type { Theme } from '@/themes/theme';
import { useTheme } from '@/themes/useTheme';
import { buildUserActivityFeedItems } from '@/utils/userActivityFeed';
import { buildUserPublic, getAgeLabel, getUserAge } from '@/utils/user';

const isUserRecord = (
  value: UserRecord | UserPublic | null | undefined
): value is UserRecord => Boolean(value && 'email' in value && 'birthDate' in value);

export default function UserProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const userId = Array.isArray(id) ? id[0] : id;
  const { currentUser } = useAuth();
  const { allActivities } = useActivities();
  const { getAttendanceHistory, getUserParticipationRecords, participationUpdatedAt } = useActivityParticipation();
  const { activityRatings, getReviewsForOrganizer, getUserRating } = useActivityRatings();
  const { subscribe, unsubscribe, isSubscribed } = useSubscriptions();
  const { feedEvents } = useUserActivityFeed();
  const { getUserById } = useUsers();
  const [isPhotoViewerVisible, setIsPhotoViewerVisible] = useState(false);
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const commonStyles = useMemo(() => createCommonStyles(theme), [theme]);

  const baseUser = useMemo(() => {
    if (!userId) return null;
    const knownUser = getUserById(userId);
    if (knownUser) return knownUser;
    if (currentUser?.id === userId) return currentUser;
    return null;
  }, [currentUser, getUserById, userId]);

  const resolvedProfile = useMemo(() => {
    if (!baseUser || !currentUser) return null;

    const isOwnProfile = baseUser.id === currentUser.id;
    const displayUser: UserRecord | UserPublic = isOwnProfile
      ? (isUserRecord(baseUser) ? baseUser : currentUser)
      : isUserRecord(baseUser)
        ? buildUserPublic(baseUser, currentUser.id, baseUser.attendanceHistory)
        : baseUser;

    const attendanceHistory = isOwnProfile
      ? currentUser.attendanceHistory ?? getAttendanceHistory(displayUser.id)
      : displayUser.attendanceHistory;
    const attendanceTotal = attendanceHistory ? attendanceHistory.attended + attendanceHistory.missed : 0;
    const attendanceRate =
      attendanceTotal > 0 ? Math.round((attendanceHistory!.attended / attendanceTotal) * 100) : 100;

    const canViewParticipationHistory = Boolean(
      isOwnProfile || (isUserRecord(baseUser) && baseUser.privacy?.showAttendanceHistory)
    );
    const canViewReviews = Boolean(
      isOwnProfile || (isUserRecord(baseUser) && baseUser.privacy?.showReviews)
    );

    const recentFeedItems = buildUserActivityFeedItems({
      userId: displayUser.id,
      canViewParticipationHistory,
      events: feedEvents,
      activities: allActivities,
      participationRecords: getUserParticipationRecords(displayUser.id),
      activityRatings,
    }).slice(0, 1);

    const selectedInterestGroups = Array.isArray(displayUser.interests)
      ? categories
        .map((category) => {
          const selectedSubcategories = category.subcategories.filter((subcategory) =>
            displayUser.interests?.includes(subcategory.id)
          );

          if (selectedSubcategories.length === 0) return null;
          return { category, selectedSubcategories };
        })
        .filter((group): group is NonNullable<typeof group> => Boolean(group))
      : [];

    return {
      displayUser,
      isOwnProfile,
      attendanceRate,
      reviews: canViewReviews ? getReviewsForOrganizer(displayUser.id) : [],
      subscribed: isSubscribed(displayUser.id),
      userAge: isOwnProfile ? getUserAge(currentUser.birthDate) : displayUser.age,
      ratingValue:
        typeof displayUser.rating === 'number' ? displayUser.rating : getUserRating(displayUser.id),
      canViewParticipationHistory,
      recentFeedItems,
      selectedInterestGroups,
    };
  }, [
    activityRatings,
    allActivities,
    baseUser,
    currentUser,
    feedEvents,
    getAttendanceHistory,
    getReviewsForOrganizer,
    getUserParticipationRecords,
    getUserRating,
    isSubscribed,
    participationUpdatedAt,
  ]);

  if (!resolvedProfile || !currentUser) {
    return (
      <SafeAreaView style={commonStyles.container} edges={['top', 'bottom']}>
        <Header showBackButton title="" />
        <View style={commonStyles.emptyContainer}>
          <EmptyState
            title="Профиль не найден"
            description="Возможно, пользователь больше недоступен или ссылка устарела."
          />
        </View>
      </SafeAreaView>
    );
  }

  const {
    displayUser,
    isOwnProfile,
    attendanceRate,
    reviews,
    subscribed,
    userAge,
    ratingValue,
    canViewParticipationHistory,
    recentFeedItems,
    selectedInterestGroups,
  } = resolvedProfile;

  const ageAndLocation = [
    typeof userAge === 'number' ? `${userAge} ${getAgeLabel(userAge)}` : null,
    displayUser.cityPlace?.settlement ?? null,
  ]
    .filter(Boolean)
    .join(', ');

  const handleSubscribe = () => {
    if (subscribed) {
      unsubscribe(displayUser.id);
      return;
    }

    subscribe(displayUser.id);
  };

  const handleEditProfile = () => {
    Alert.alert('Редактирование', 'Экран редактирования профиля пока не подключен.');
  };

  const handleOpenHistory = () => {
    router.push(`/user/${displayUser.id}/history`);
  };

  const handleOpenProfilePhoto = () => {
    if (!displayUser.avatar) return;
    setIsPhotoViewerVisible(true);
  };

  return (
    <View style={commonStyles.container}>
      <SafeAreaView edges={['top']} style={styles.headerSafeArea}>
        <Header
          showBackButton
          title=""
          rightButtons={
            isOwnProfile
              ? [
                {
                  icon: <Edit size={theme.spacing.iconSizeMedium} />,
                  onPress: handleEditProfile,
                  variant: 'surface',
                },
              ]
              : [
                {
                  icon: subscribed
                    ? <UserMinus size={theme.spacing.iconSizeMedium} />
                    : <UserPlus size={theme.spacing.iconSizeMedium} />,
                  onPress: handleSubscribe,
                  variant: 'surface',
                },
              ]
          }
        />
      </SafeAreaView>

      <ScrollView
        style={commonStyles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <ProfileHero
          name={displayUser.name}
          avatarUri={displayUser.avatar}
          subtitle={ageAndLocation}
          ratingValue={ratingValue}
          attendanceRate={attendanceRate}
          onPress={displayUser.avatar ? handleOpenProfilePhoto : undefined}
        />

        <View style={styles.contentContainer}>
          {selectedInterestGroups.length > 0 ? (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text, ...theme.typography.h4 }]}>
                Интересы
              </Text>
              <View style={styles.interestGroups}>
                {selectedInterestGroups.map(({ category, selectedSubcategories }, index) => (
                  <View key={category.id}>
                    <View style={styles.interestGroup}>
                      <View style={styles.interestGroupHeader}>
                        <View style={styles.interestLead}>
                          <View style={styles.interestIconWrap}>
                            {renderCategoryIcon(category, theme.spacing.iconSizeSmall)}
                          </View>
                          <Text
                            style={[styles.interestGroupTitle, { color: theme.colors.text, ...theme.typography.bodyBold }]}
                          >
                            {category.name}
                          </Text>
                        </View>
                      </View>
                      <Text style={[styles.interestLine, { color: theme.colors.textSecondary, ...theme.typography.body }]}>
                        {selectedSubcategories.map((subcategory) => subcategory.name).join(' · ')}
                      </Text>
                    </View>
                    {index < selectedInterestGroups.length - 1 ? (
                      <View style={[styles.interestDivider, { backgroundColor: theme.colors.border }]} />
                    ) : null}
                  </View>
                ))}
              </View>
            </View>
          ) : null}

          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text, ...theme.typography.h4 }]}>
                Последняя активность
              </Text>
              {canViewParticipationHistory ? (
                <TouchableOpacity onPress={handleOpenHistory} activeOpacity={0.7}>
                  <Text style={{ color: theme.colors.textSecondary, ...theme.typography.captionBold }}>
                    Вся история
                  </Text>
                </TouchableOpacity>
              ) : null}
            </View>

            {canViewParticipationHistory ? (
              recentFeedItems.length > 0 ? (
                <UserActivityFeedList items={recentFeedItems} />
              ) : (
                <Text style={[styles.emptySectionText, { color: theme.colors.textSecondary, ...theme.typography.caption }]}>
                  Пока нет посещённых активностей для предпросмотра.
                </Text>
              )
            ) : (
              <View style={[styles.lockedCard, { backgroundColor: theme.colors.surface }]}>
                <Lock size={theme.spacing.iconSizeMedium} color={theme.colors.textSecondary} />
                <Text style={[styles.lockedText, { color: theme.colors.textSecondary, ...theme.typography.caption }]}>
                  История посещений скрыта настройками конфиденциальности.
                </Text>
              </View>
            )}
          </View>

          {reviews.length > 0 ? (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text, ...theme.typography.h4 }]}>
                Отзывы о пользователе
              </Text>
              <View style={styles.reviewsList}>
                {reviews.map((review) => (
                  <ReviewCard
                    key={review.id}
                    review={review}
                    activity={allActivities.find((activity) => activity.id === review.activityId) ?? null}
                  />
                ))}
              </View>
            </View>
          ) : null}
        </View>
      </ScrollView>
      <PhotoViewerModal
        visible={isPhotoViewerVisible}
        photos={displayUser.avatar ? [displayUser.avatar] : []}
        initialIndex={0}
        onClose={() => setIsPhotoViewerVisible(false)}
      />
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    headerSafeArea: {
      zIndex: 10,
    },
    scrollContent: {
      paddingBottom: theme.spacing.xl,
    },
    contentContainer: {
      paddingHorizontal: theme.spacing.screenPaddingHorizontal,
      gap: theme.spacing.xl,
      marginTop: theme.spacing.sm,
    },
    section: {
      gap: theme.spacing.sm,
    },
    sectionHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: theme.spacing.md,
    },
    sectionTitle: {
      marginBottom: theme.spacing.xs,
    },
    interestGroups: {
      gap: theme.spacing.sm,
    },
    interestGroup: {
      gap: theme.spacing.xs,
      paddingVertical: theme.spacing.sm,
    },
    interestGroupHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: theme.spacing.md,
    },
    interestIconWrap: {
      width: theme.spacing.xxl,
      height: theme.spacing.xxl,
      borderRadius: theme.spacing.radiusRound,
      alignItems: 'center',
      justifyContent: 'center',
    },
    interestLead: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
    },
    interestGroupTitle: {},
    interestLine: {
      lineHeight: 22,
      paddingLeft: theme.spacing.xxl + theme.spacing.sm,
    },
    interestDivider: {
      height: StyleSheet.hairlineWidth,
      marginTop: theme.spacing.sm,
    },
    emptySectionText: {
      lineHeight: 20,
    },
    lockedCard: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: theme.spacing.md,
      borderRadius: theme.spacing.radiusLarge,
      padding: theme.spacing.md,
    },
    lockedText: {
      flex: 1,
    },
    reviewsList: {
      gap: theme.spacing.md,
    },
  });
