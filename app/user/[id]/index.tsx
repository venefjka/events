import { router, useLocalSearchParams } from 'expo-router';
import { Edit, UserMinus, UserPlus } from 'lucide-react-native';
import SimpleLineIcons from '@expo/vector-icons/SimpleLineIcons';
import React, { useMemo, useState } from 'react';
import { Alert, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ProfileHero } from '@/components/profile/ProfileHero';
import { ReviewCard } from '@/components/profile/ReviewCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { Header } from '@/components/ui/Header';
import { PhotoViewerModal } from '@/components/ui/PhotoViewerModal';
import { UserHistoryList } from '@/components/UserHistoryList';
import { renderCategoryIcon } from '@/components/ui/CategoryIcon';
import { categories } from '@/constants/categories';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscribe } from '@/hooks/mutations/useSubscribe';
import { useUnsubscribe } from '@/hooks/mutations/useUnsubscribe';
import { useUserHistory } from '@/hooks/queries/useUserHistory';
import { useUserProfile } from '@/hooks/queries/useUserProfile';
import { createCommonStyles } from '@/styles/common';
import type { Theme } from '@/themes/theme';
import { useTheme } from '@/themes/useTheme';
import { getAgeLabel } from '@/utils/user';
import { getFileUrl } from '@/utils/files';

export default function UserProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const userId = Array.isArray(id) ? id[0] : id;
  const { currentUser } = useAuth();
  const profileQuery = useUserProfile(userId);
  const recentCreatedQuery = useUserHistory(userId, { tab: 'all', limit: 1 }, Boolean(userId));
  const subscribeMutation = useSubscribe();
  const unsubscribeMutation = useUnsubscribe();
  const [isPhotoViewerVisible, setIsPhotoViewerVisible] = useState(false);
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const commonStyles = useMemo(() => createCommonStyles(theme), [theme]);
  const user = profileQuery.data;
  const isOwnProfile = Boolean(currentUser && user && currentUser.id === user.id);

  const selectedInterestGroups = useMemo(() => {
    const interests = user?.interests ?? [];
    return categories
      .map((category) => {
        const selectedSubcategories = category.subcategories.filter((subcategory) =>
          interests.includes(subcategory.id)
        );

        if (selectedSubcategories.length === 0) return null;
        return { category, selectedSubcategories };
      })
      .filter((group): group is NonNullable<typeof group> => Boolean(group));
  }, [user?.interests]);

  if (!user && !profileQuery.isLoading) {
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

  if (!user) {
    return null;
  }

  const avatarUri = getFileUrl(user.avatarFileId);
  const attendanceHistory = user.attendanceHistory;
  const attendanceTotal = attendanceHistory ? attendanceHistory.attended + attendanceHistory.missed : 0;
  const attendanceRate =
    attendanceTotal > 0 ? Math.round((attendanceHistory!.attended / attendanceTotal) * 100) : 100;
  const ageAndLocation = [
    typeof user.age === 'number' ? `${user.age} ${getAgeLabel(user.age)}` : null,
    user.city?.settlement ?? null,
  ]
    .filter(Boolean)
    .join(', ');
  const recentEvents = recentCreatedQuery.data?.items ?? [];
  const reviews = user.reviewsPreview ?? [];

  const handleSubscribe = () => {
    if (user.isSubscribed) {
      unsubscribeMutation.mutate(user.id);
      return;
    }

    subscribeMutation.mutate({ userId: user.id });
  };

  const handleEditProfile = () => {
    router.push('/profile/edit');
  };

  const handleOpenChat = () => {
    const chatLink = 'https://vk.com/venefjka';
    Linking.openURL(chatLink).catch(() => {
      Alert.alert('Не удалось открыть чат', 'Проверьте ссылку или подключение к интернету.');
    });
  };

  const handleOpenProfilePhoto = () => {
    if (!avatarUri) return;
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
                  icon: user.isSubscribed
                    ? <UserMinus size={theme.spacing.iconSizeMedium} />
                    : <UserPlus size={theme.spacing.iconSizeMedium} />,
                  onPress: handleSubscribe,
                  variant: user.isSubscribed ? 'surface' : 'primary',
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
          name={user.name}
          avatarUri={avatarUri}
          subtitle={ageAndLocation}
          ratingValue={user.rating}
          attendanceRate={attendanceRate}
          onPress={avatarUri ? handleOpenProfilePhoto : undefined}
        />

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleOpenChat}
          style={[
            styles.chatButton,
            {
              backgroundColor: 'rgba(255,255,255,0.12)',
              borderColor: 'rgba(255,255,255,0.24)',
              borderWidth: theme.spacing.borderWidth,
            },
          ]}
        >
          <SimpleLineIcons name="bubbles" size={theme.spacing.iconSizeXLarge * 1.1} color="#fff" />
        </TouchableOpacity>

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
              <TouchableOpacity onPress={() => router.push(`/user/${user.id}/history`)} activeOpacity={0.7}>
                <Text style={{ color: theme.colors.textSecondary, ...theme.typography.captionBold }}>
                  Вся история
                </Text>
              </TouchableOpacity>
            </View>

            {recentEvents.length > 0 ? (
              <View style={styles.recentActivityList}>
                <UserHistoryList items={recentEvents} userGender={user.gender} />
              </View>
            ) : (
              <Text style={[styles.emptySectionText, { color: theme.colors.textSecondary, ...theme.typography.caption }]}>
                {recentCreatedQuery.isLoading ? 'Загружаем активность...' : 'Пока нет активностей для предпросмотра'}
              </Text>
            )}
          </View>

          {reviews.length > 0 ? (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text, ...theme.typography.h4 }]}>
                Отзывы о пользователе
              </Text>
              <View style={styles.reviewsList}>
                {reviews.map((review) => (
                  <ReviewCard key={review.id} review={review} />
                ))}
              </View>
            </View>
          ) : null}
        </View>
      </ScrollView>

      <PhotoViewerModal
        visible={isPhotoViewerVisible}
        photos={avatarUri ? [avatarUri] : []}
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
    },
    chatButton: {
      alignSelf: 'flex-end',
      marginRight: theme.spacing.screenPaddingHorizontal,
      width: theme.spacing.avatarSizeLarge,
      height: theme.spacing.avatarSizeLarge,
      borderRadius: theme.spacing.radiusRound,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: -(theme.spacing.avatarSizeLarge + theme.spacing.xxxl),
      marginBottom: theme.spacing.xxxl * 1.5,
      zIndex: 2,
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
    recentActivityList: {
      gap: theme.spacing.sm,
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
