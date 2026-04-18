import React, { useMemo, useState } from 'react';
import {
  Alert,
  ImageBackground,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import {
  Banknote,
  BadgeCheck,
  Bookmark,
  CalendarDays,
  Image as ImageIcon,
  MapPin as MapPinIcon,
  Monitor,
  Pencil,
  Share2,
} from 'lucide-react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useAuth } from '@/contexts/AuthContext';
import { useActivities } from '@/contexts/ActivitiesContext';
import { useActivityParticipation } from '@/contexts/ActivityParticipationContext';
import { useActivityRatings } from '@/contexts/ActivityRatingsContext';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Header } from '@/components/ui/Header';
import { PhotoViewerModal } from '@/components/ui/PhotoViewerModal';
import { renderCategoryIcon } from '@/components/ui/CategoryIcon';
import { getHoursUntilEvent } from '@/utils/date';
import { openExternalMap } from '@/utils/openSideMaps';
import { createCommonStyles } from '@/styles/common';
import type { Theme } from '@/themes/theme';
import { useTheme } from '@/themes/useTheme';
import { getActivityDetailState } from '@/components/activity-detail/helpers';
import { ActivityDetailHero } from '@/components/activity-detail/ActivityDetailHero';
import { PeopleSummarySection } from '@/components/activity-detail/PeopleSummarySection';
import { LocationSection } from '@/components/activity-detail/LocationSection';
import { ParticipantsSheet } from '@/components/activity-detail/ParticipantsSheet';
import { RateActivitySheet } from '@/components/activity-detail/RateActivitySheet';
import { RequestsSheet } from '@/components/activity-detail/RequestsSheet';
import type { HeroChip } from '@/components/activity-detail/ActivityDetailHero';

export default function ActivityDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const activityId = Array.isArray(id) ? id[0] : id;
  const { currentUser } = useAuth();
  const { allActivities, savedActivities, toggleSaveActivity, cancelActivity } = useActivities();
  const { hasUserRated } = useActivityRatings();
  const {
    requestJoinActivity,
    leaveActivity,
    cancelJoinRequest,
    approveJoinRequest,
    rejectJoinRequest,
    getParticipationStatus,
  } = useActivityParticipation();
  const [isParticipantsSheetVisible, setIsParticipantsSheetVisible] = useState(false);
  const [isRequestsSheetVisible, setIsRequestsSheetVisible] = useState(false);
  const [isRateSheetVisible, setIsRateSheetVisible] = useState(false);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const commonStyles = useMemo(() => createCommonStyles(theme), [theme]);

  const activity = useMemo(() => allActivities.find((item) => item.id === activityId), [activityId, allActivities]);

  const detailState = useMemo(
    () => (activity && currentUser ? getActivityDetailState(activity, currentUser.id, savedActivities) : null),
    [activity, currentUser?.id, savedActivities]
  );
  const participationStatus =
    activity && currentUser ? getParticipationStatus(activity.id, currentUser.id) : null;
  const isParticipant = participationStatus === 'accepted' || participationStatus === 'attended';
  const isPending = participationStatus === 'pending';
  const isAttendanceMarked = participationStatus === 'attended';
  const isActivityRated = Boolean(activity && currentUser && hasUserRated(activity.id, currentUser.id));
  const shouldShowFooterAfterEnd =
    isParticipant && (isAttendanceMarked || isActivityRated);

  const heroChips = useMemo<HeroChip[]>(() => {
    if (!activity || !detailState) return [];

    const items: HeroChip[] = [
      {
        label: activity.subcategory?.name ?? activity.category.name,
        icon: renderCategoryIcon(activity.category, theme.spacing.iconSizeSmall - theme.spacing.borderWidthThick),
        selected: true,
      },
      {
        label: activity.format === 'online' ? 'Онлайн' : 'Оффлайн',
        icon:
          activity.format === 'online' ? (
            <Monitor size={theme.spacing.iconSizeXSmall} color="#fff" />
          ) : (
            <MapPinIcon size={theme.spacing.iconSizeXSmall} color="#fff" />
          ),
      },
      {
        label: activity.price > 0 ? `${activity.price} ₽` : 'Бесплатно',
      },
    ];

    if (activity.requiresApproval) {
      items.push({
        label: 'По заявке',
        icon: <BadgeCheck size={theme.spacing.iconSizeXSmall} color="#fff" />,
      });
    }

    if (activity.preferences?.gender) {
      items.push({
        label: activity.preferences.gender === 'male' ? 'Мужчины' : 'Женщины',
        icon: (
          <Ionicons
            name={activity.preferences.gender === 'male' ? 'male' : 'female'}
            size={theme.spacing.iconSizeXSmall}
            color="#fff"
          />
        ),
      });
    }

    if (detailState.ageLabel) {
      items.push({ label: detailState.ageLabel });
    }

    return items;
  }, [activity, detailState?.ageLabel, theme]);

  if (!activity || !currentUser || !detailState) {
    return (
      <SafeAreaView style={commonStyles.container} edges={['top', 'bottom']}>
        <Header showBackButton title="Активность" />
        <View style={commonStyles.emptyContainer}>
          <EmptyState
            icon={
              <ImageIcon
                size={theme.spacing.iconSizeXXLarge}
                color={theme.colors.textSecondary}
              />
            }
            title="Активность не найдена"
            description="Возможно, она была удалена или ссылка больше не актуальна"
          />
        </View>
      </SafeAreaView>
    );
  }

  const handleShare = async () => {
    try {
      await Share.share({
        title: activity.title,
        message: detailState.shareMessage,
      });
    } catch (error) {
      console.log('Share error', error);
    }
  };

  const handleEditActivity = () => {
    Alert.alert('Редактирование', 'Экран редактирования активности пока не подключен.');
  };

  const handleJoin = () => {
    if (
      detailState.isCancelled ||
      detailState.isPast ||
      detailState.isFull ||
      isParticipant ||
      isPending
    ) {
      return;
    }

    void requestJoinActivity(activity.id);
  };

  const handleLeave = () => {
    if (!isParticipant) return;

    const hoursUntilEvent = getHoursUntilEvent(activity.startAt);
    const hasShortNotice = hoursUntilEvent < 2 && hoursUntilEvent > 0;

    Alert.alert(
      hasShortNotice ? 'Отменить с предупреждением' : 'Отменить участие',
      hasShortNotice
        ? 'До начала осталось меньше 2 часов. Отмена может повлиять на ваш рейтинг.'
        : 'Вы уверены, что хотите выйти из этой активности?',
      [
        { text: 'Назад', style: 'cancel' },
        { text: 'Выйти', style: 'destructive', onPress: () => leaveActivity(activity.id) },
      ]
    );
  };

  const handleCancelRequest = () => {
    if (!isPending) return;

    Alert.alert('Отменить заявку', 'Удалить вашу заявку на участие?', [
      { text: 'Нет', style: 'cancel' },
      { text: 'Да', style: 'destructive', onPress: () => cancelJoinRequest(activity.id) },
    ]);
  };

  const handleCancelActivity = () => {
    Alert.alert('Отменить активность', 'Активность будет отменена для всех участников.', [
      { text: 'Назад', style: 'cancel' },
      {
        text: 'Отменить',
        style: 'destructive',
        onPress: () => {
          cancelActivity(activity.id);
          router.back();
        },
      },
    ]);
  };

  const navigateToUser = (userId: string) => router.push(`/user/${userId}`);

  return (
    <View style={commonStyles.container}>
      <SafeAreaView edges={['top']} style={styles.headerSafeArea}>
        <Header
          showBackButton
          title=""
          rightButtons={[
            {
              icon: <Bookmark size={theme.spacing.iconSize} fill={detailState.isSaved ? theme.colors.text : 'none'} />,
              onPress: () => toggleSaveActivity(activity.id),
              variant: 'surface',
            },
            {
              icon: <Share2 size={theme.spacing.iconSize} />,
              onPress: handleShare,
              variant: 'surface',
            },
            ...(detailState.isOrganizer && !detailState.isPast
              ? [
                {
                  icon: <Pencil size={theme.spacing.iconSizeMedium} />,
                  onPress: handleEditActivity,
                  variant: 'primary' as const,
                },
                {
                  icon: <Ionicons name="close" size={theme.spacing.iconSize} />,
                  onPress: handleCancelActivity,
                  variant: 'primary' as const,
                },
              ]
              : []),
          ]}
        />
      </SafeAreaView>

      <ScrollView
        style={commonStyles.content}
        contentContainerStyle={{ paddingBottom: theme.spacing.xxl * 2}}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <ActivityDetailHero
          title={activity.title}
          photoUri={detailState.photoUri}
          relativeTime={detailState.relativeTime}
          isCancelled={detailState.isCancelled}
          heroChips={heroChips}
          onPress={detailState.photoUrls.length > 0 ? () => setSelectedPhotoIndex(0) : undefined}
        />

        <View style={styles.contentContainer}>
          <PeopleSummarySection
            organizer={activity.organizer}
            participantPreview={detailState.participantPreview}
            participantsCountLabel={detailState.participantsCountLabel}
            onOrganizerPress={() => navigateToUser(activity.organizer.id)}
            onParticipantsPress={() => setIsParticipantsSheetVisible(true)}
          />

          <View style={styles.sectionBlock}>
            <Text style={{ color: theme.colors.text, ...theme.typography.h4 }}>Инфо</Text>
            <View style={styles.detailList}>
              <View style={styles.detailRow}>
                <CalendarDays size={theme.spacing.iconSizeMedium} color={theme.colors.textSecondary} />
                <View style={styles.detailRowContent}>
                  <Text style={[styles.detailRowText, { color: theme.colors.text, ...theme.typography.body }]}>
                    {detailState.dateTimeSummary}
                  </Text>
                </View>
              </View>
              <View style={styles.detailRow}>
                {activity.format === 'online' ? (
                  <Monitor size={theme.spacing.iconSizeMedium} color={theme.colors.textSecondary} />
                ) : (
                  <MapPinIcon size={theme.spacing.iconSizeMedium} color={theme.colors.textSecondary} />
                )}
                <View style={styles.detailRowContent}>
                  <Text style={[styles.detailRowText, { color: theme.colors.text, ...theme.typography.body }]}>
                    {detailState.locationSummary}
                  </Text>
                </View>
              </View>
              <View style={styles.detailRow}>
                <Banknote size={theme.spacing.iconSizeMedium} color={theme.colors.textSecondary} />
                <View style={styles.detailRowContent}>
                  <Text style={[styles.detailRowText, { color: theme.colors.text, ...theme.typography.body }]}>
                    {detailState.priceSummary}
                  </Text>
                </View>
              </View>
            </View>
            {activity.description ? (
              <Text style={[styles.description, { color: theme.colors.text, ...theme.typography.body }]}>
                {activity.description}
              </Text>
            ) : null}
            {activity.format === 'offline' ? (
              <LocationSection
                activity={activity}
                onPress={() =>
                  openExternalMap({
                    latitude: activity.location.latitude,
                    longitude: activity.location.longitude,
                    address: activity.location.address,
                    name: activity.location.name,
                    fallbackLabel: activity.title,
                  })
                }
              />
            ) : null}
          </View>

          {detailState.photoUrls.length > 1 ? (
            <View style={styles.sectionBlock}>
              <Text style={{ color: theme.colors.text, ...theme.typography.h4 }}>Фото</Text>
              <ScrollView
                horizontal
                style={styles.fullBleedGallery}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.galleryScrollContent}
              >
                {detailState.photoUrls.map((photoUrl, index) => (
                  <Pressable
                    key={`${photoUrl}-${index}`}
                    onPress={() => setSelectedPhotoIndex(index)}
                    style={styles.galleryImageButton}
                  >
                    <ImageBackground
                      source={{ uri: photoUrl }}
                      resizeMode="cover"
                      style={styles.galleryImage}
                      imageStyle={styles.galleryImageInner}
                    />
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          ) : null}

          <View style={styles.criteriaList}>
            <Text style={{ color: theme.colors.text, ...theme.typography.h4 }}>Детали</Text>
            {detailState.participationCriteria.map((item) => (
              <View key={item.label} style={styles.criteriaRow}>
                <Text style={{ color: theme.colors.textSecondary, ...theme.typography.body }}>{item.label}:</Text>
                <Text style={[styles.criteriaValue, { color: theme.colors.text, ...theme.typography.bodyBold }]}>
                  {item.value}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {(!detailState.isCancelled && (!detailState.isPast || shouldShowFooterAfterEnd)) ? (
        <SafeAreaView
          edges={['bottom']}
          style={[
            styles.footer,
            {
              backgroundColor: theme.colors.background,
              borderTopColor: theme.colors.border,
              paddingHorizontal: theme.spacing.screenPaddingHorizontal,
              paddingTop: theme.spacing.md,
              paddingBottom: theme.spacing.md,
            },
          ]}
        >
          {detailState.footerMeta &&
            <Text style={{ color: theme.colors.textSecondary, ...theme.typography.caption, marginBottom: theme.spacing.sm }}>
              {detailState.footerMeta}
            </Text>
          }

          {detailState.isOrganizer ? (
            <View style={styles.footerButtons}>
              <Button
                title="QR-сканер"
                variant="primary"
                size="medium"
                style={{ flex: 1 }}
                onPress={() => router.push(`/qr-scan?activityId=${activity.id}`)}
              />
              {activity.pendingRequests.length > 0 ? (
                <Button
                  title="Заявки"
                  variant="secondary"
                  size="medium"
                  style={{ flex: 1 }}
                  onPress={() => setIsRequestsSheetVisible(true)}
                />
              ) : null}
            </View>
          ) : isParticipant ? (
            <View style={styles.footerButtons}>
              <Button
                title={isActivityRated ? 'Оценено' : isAttendanceMarked ? 'Оценить' : 'QR-код'}
                variant="primary"
                size="medium"
                style={{ flex: 1 }}
                disabled={isActivityRated}
                onPress={() =>
                  isActivityRated
                    ? undefined
                    : isAttendanceMarked
                      ? setIsRateSheetVisible(true)
                      : router.push(`/my-qr?activityId=${activity.id}`)
                }
              />
              {!isActivityRated && !isAttendanceMarked ? (
                <Button title="Выйти"
                  variant="secondary"
                  size="medium"
                  style={{ flex: 1 }}
                  onPress={handleLeave}
                />
              ) : null}
            </View>
          ) : isPending ? (
            <Button
              title="Отменить заявку"
              variant="secondary"
              size="medium"
              fullWidth
              onPress={handleCancelRequest}
            />
          ) : (
            <Button
              title={detailState.joinButtonTitle}
              variant="primary"
              size="medium"
              fullWidth
              disabled={detailState.isCancelled || detailState.isPast || detailState.isFull}
              onPress={handleJoin}
            />
          )}
        </SafeAreaView>
      ) : null}

      <ParticipantsSheet
        visible={isParticipantsSheetVisible}
        participants={detailState.participantsSheetUsers}
        organizerId={activity.organizer.id}
        onClose={() => setIsParticipantsSheetVisible(false)}
        onParticipantPress={(participantId) => {
          setIsParticipantsSheetVisible(false);
          navigateToUser(participantId);
        }}
      />
      <RateActivitySheet
        visible={isRateSheetVisible}
        activity={activity}
        onClose={() => setIsRateSheetVisible(false)}
      />

      <RequestsSheet
        visible={isRequestsSheetVisible}
        requests={activity.pendingRequests}
        onClose={() => setIsRequestsSheetVisible(false)}
        onReject={(userId) => rejectJoinRequest(activity.id, userId)}
        onApprove={(userId) => approveJoinRequest(activity.id, userId)}
      />

      <PhotoViewerModal
        visible={selectedPhotoIndex !== null}
        photos={detailState.photoUrls}
        initialIndex={selectedPhotoIndex ?? 0}
        onClose={() => setSelectedPhotoIndex(null)}
      />
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    headerSafeArea: {
      zIndex: 10,
    },
    contentContainer: {
      paddingHorizontal: theme.spacing.screenPaddingHorizontal,
      gap: theme.spacing.lg,
      marginTop: -theme.spacing.md,
    },
    detailList: {
      gap: theme.spacing.xs * 2,
    },
    detailRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.md,
    },
    detailRowContent: {
      flex: 1,
      minWidth: 0,
      justifyContent: 'center',
    },
    detailRowText: {
      flex: 1,
      lineHeight: 22,
    },
    sectionBlock: {
      gap: theme.spacing.md,
    },
    fullBleedGallery: {
      marginHorizontal: -theme.spacing.screenPaddingHorizontal,
    },
    description: {
      lineHeight: 22,
    },
    criteriaList: {
      gap: theme.spacing.sm,
    },
    criteriaRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: theme.spacing.sm,
    },
    criteriaValue: {
      flex: 1,
    },
    galleryScrollContent: {
      paddingHorizontal: theme.spacing.screenPaddingHorizontal,
      gap: theme.spacing.md,
    },
    galleryImage: {
      width: theme.spacing.xxxxl * 5 + theme.spacing.xl,
      height: theme.spacing.headerHeightLarge,
      borderRadius: theme.spacing.radiusXLarge,
      overflow: 'hidden',
    },
    galleryImageButton: {
      borderRadius: theme.spacing.radiusXLarge,
      overflow: 'hidden',
    },
    galleryImageInner: {
      borderRadius: theme.spacing.radiusXLarge,
    },
    footer: {
      borderTopWidth: StyleSheet.hairlineWidth,
    },
    footerButtons: {
      flexDirection: 'row',
      gap: theme.spacing.md,
    },
  });
