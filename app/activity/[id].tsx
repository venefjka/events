import React, { useMemo, useState } from 'react';
import { Alert, Linking, Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import {
  BadgeCheck,
  Banknote,
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
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Header, type HeaderButton } from '@/components/ui/Header';
import { PhotoViewerModal } from '@/components/ui/PhotoViewerModal';
import { renderCategoryIcon } from '@/components/ui/CategoryIcon';
import { formatActivityDate, formatTimeOnly, getRelativeTime } from '@/utils/date';
import { createCommonStyles } from '@/styles/common';
import type { Theme } from '@/themes/theme';
import { useTheme } from '@/themes/useTheme';
import { ActivityDetailHero } from '@/components/activity-detail/ActivityDetailHero';
import { LocationSection } from '@/components/activity-detail/LocationSection';
import { ParticipantsSheet } from '@/components/activity-detail/ParticipantsSheet';
import { PeopleSummarySection } from '@/components/activity-detail/PeopleSummarySection';
import { RateActivitySheet } from '@/components/activity-detail/RateActivitySheet';
import { RequestsSheet } from '@/components/activity-detail/RequestsSheet';
import type { HeroChip } from '@/components/activity-detail/ActivityDetailHero';
import { useActivityDetails } from '@/hooks/queries/useActivityDetails';
import { useActivityJoinRequests } from '@/hooks/queries/useActivityJoinRequests';
import { useActivityParticipants } from '@/hooks/queries/useActivityParticipants';
import { useApproveJoinRequest } from '@/hooks/mutations/useApproveJoinRequest';
import { useCancelActivity } from '@/hooks/mutations/useCancelActivity';
import { useCancelJoinRequest } from '@/hooks/mutations/useCancelJoinRequest';
import { useDeclineOrganizership } from '@/hooks/mutations/useDeclineOrganizership';
import { useJoinActivity } from '@/hooks/mutations/useJoinActivity';
import { useLeaveActivity } from '@/hooks/mutations/useLeaveActivity';
import { useRejectJoinRequest } from '@/hooks/mutations/useRejectJoinRequest';
import { useSaveActivity } from '@/hooks/mutations/useSaveActivity';
import { getApprovalItems, getGenderItems, getLevelItems } from '@/constants/activityPreferenceOptions';
import { openExternalMap } from '@/utils/openSideMaps';
import { getFileUrl } from '@/utils/files';
import { CachedImage } from '@/components/ui/CachedImage';
import { KUDAGO_ORGANIZER_SUMMARY, getActivityCategory, getAgeRangeLabel, isImportedActivity, toPersonSummary } from '@/utils/activity';

// todo: refactor

export default function ActivityDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const activityId = Array.isArray(id) ? id[0] : id;
  const { currentUser } = useAuth();
  const activityQuery = useActivityDetails(activityId);
  const activity = activityQuery.data;
  const isOrganizer = Boolean(activity && currentUser && activity.organizer?.id === currentUser.id);
  const isImported = isImportedActivity(activity);

  const participantsQuery = useActivityParticipants(
    activityId,
    { limit: 50 },
    Boolean(activityId && activity && activity.participantsCount > activity.participantsPreview.length)
  );

  const joinActivity = useJoinActivity();
  const leaveActivity = useLeaveActivity();
  const cancelJoinRequest = useCancelJoinRequest();
  const declineOrganizership = useDeclineOrganizership();
  const cancelActivity = useCancelActivity();
  const approveJoinRequest = useApproveJoinRequest();
  const rejectJoinRequest = useRejectJoinRequest();
  const saveActivity = useSaveActivity();

  const [isParticipantsSheetVisible, setIsParticipantsSheetVisible] = useState(false);
  const [isRequestsSheetVisible, setIsRequestsSheetVisible] = useState(false);
  const [isRateSheetVisible, setIsRateSheetVisible] = useState(false);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const commonStyles = useMemo(() => createCommonStyles(theme), [theme]);

  const category = useMemo(() => getActivityCategory(activity), [activity?.categoryId]);
  const subcategory = useMemo(
    () => category.subcategories.find((item) => item.id === activity?.subcategoryId),
    [activity?.subcategoryId, category.subcategories]
  );

  const policyFlags = activity?.policyFlags;
  const canJoinActivity = Boolean(policyFlags?.canJoin);
  const canLeaveActivity = Boolean(policyFlags?.canLeave);
  const canCancelRequest = Boolean(policyFlags?.canCancelRequest);
  const canManageRequests = Boolean(policyFlags?.canManageRequests);
  const canRateActivity = Boolean(policyFlags?.canRate);
  const canEditActivity = Boolean(policyFlags?.canEdit);
  const canCancelActivity = Boolean(policyFlags?.canCancelActivity);
  const canBecomeOrganizer = Boolean(policyFlags?.canBecomeOrganizer);

  const joinRequestsQuery = useActivityJoinRequests(activityId, { limit: 50 }, canManageRequests);
  const isParticipant =
    activity?.participationStatus === 'accepted' || activity?.participationStatus === 'attended';
  const isAttendanceMarked = activity?.participationStatus === 'attended';

  const heroChips = useMemo<HeroChip[]>(() => {
    if (!activity) return [];

    const items: HeroChip[] = [
      {
        label: subcategory?.name ?? category.name,
        icon: renderCategoryIcon(category, theme.spacing.iconSizeSmall - theme.spacing.borderWidthThick),
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

    return items;
  }, [activity, category, subcategory?.name, theme]);

  if (!activity || !currentUser) {
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
            title={activityQuery.isLoading ? 'Загружаем...' : 'Активность не найдена'}
            description="Возможно, она была удалена или ссылка больше не актуальна"
          />
        </View>
      </SafeAreaView>
    );
  }

  const isPast = new Date(activity.endAt).getTime() < Date.now();
  const relativeTime = getRelativeTime(activity.startAt);
  const dateTimeSummary = `${formatActivityDate(activity.startAt, activity.timeZone)} - ${formatTimeOnly(activity.endAt, activity.timeZone)}`;
  const locationSummary =
    activity.format === 'online'
      ? 'Online'
      : activity.location.name || activity.location.address;
  const participantsLabel = activity.preferences?.maxParticipants
    ? `${activity.participantsCount}/${activity.preferences.maxParticipants}`
    : `${activity.participantsCount}/∞`;

  const photoUrls = activity.photoFileIds.map(getFileUrl).filter((uri): uri is string => Boolean(uri));
  const coverPhotoUri = getFileUrl(activity.coverPhotoFileId ?? activity.photoFileIds?.[0]);

  const organizerSummary = activity.organizer ? toPersonSummary(activity.organizer) : KUDAGO_ORGANIZER_SUMMARY;
  const previewParticipants = activity.participantsPreview.map(toPersonSummary).slice(0, 3);

  const sheetParticipantsSource = participantsQuery.data?.items?.length
    ? participantsQuery.data.items.map((item) => item.user)
    : activity.participantsPreview;
  const sheetParticipants = [
    ...(activity.organizer ? [organizerSummary] : []),
    ...sheetParticipantsSource
      .filter((participant) => participant.id !== activity.organizer?.id)
      .map(toPersonSummary),
  ];
  const joinRequests = (joinRequestsQuery.data?.items ?? []).map((item) => toPersonSummary(item.user));
  const ageLabel = getAgeRangeLabel(activity.preferences?.ageFrom, activity.preferences?.ageTo);
  const levelLabel = activity.preferences?.level
    ? getLevelItems().find((item) => item.id === activity.preferences?.level)?.label
    : null;
  const genderLabel = activity.preferences?.gender
    ? getGenderItems().find((item) => item.id === activity.preferences?.gender)?.label
    : null;
  const approvalLabel = getApprovalItems().find(
    (item) => item.id === (activity.requiresApproval ? 'request' : 'free')
  )?.label;
  const participationCriteria = [
    {
      label: 'Тип регистрации',
      value: approvalLabel ?? (activity.requiresApproval ? 'По заявке' : 'Свободная'),
    },
    ...(levelLabel ? [{ label: 'Уровень навыков', value: levelLabel }] : []),
    ...(ageLabel ? [{ label: 'Возраст', value: ageLabel }] : []),
    ...(genderLabel ? [{ label: 'Пол', value: genderLabel }] : []),
  ];
  const footerMeta = isOrganizer ? 'Вы организатор' : isParticipant ? 'Вы участвуете' : '';
  const shouldShowFooter =
    canBecomeOrganizer ||
    canJoinActivity ||
    canLeaveActivity ||
    canCancelRequest ||
    canManageRequests ||
    canRateActivity ||
    isAttendanceMarked;
  const participantActionTitle = canRateActivity ? 'Оценить' : isAttendanceMarked ? 'Оценено' : 'QR-код';
  const isParticipantActionDisabled = isAttendanceMarked && !canRateActivity;
  const joinButtonTitle = isPast
    ? 'Событие завершено'
    : activity.isFull
      ? 'Свободных мест нет'
      : activity.requiresApproval
        ? 'Подать заявку'
        : 'Присоединиться';

  const handleShare = async () => {
    await Share.share({
      title: activity.title,
      message: `${activity.title}\n${dateTimeSummary}`,
    });
  };

  const handleJoin = () => {
    if (!canJoinActivity) return;
    joinActivity.mutate({ activityId: activity.id, requiresApproval: activity.requiresApproval });
  };

  const handleLeave = () => {
    if (!canLeaveActivity) return;

    Alert.alert('Отменить участие', 'Вы уверены, что хотите выйти из этой активности?', [
      { text: 'Назад', style: 'cancel' },
      { text: 'Выйти', style: 'destructive', onPress: () => leaveActivity.mutate(activity.id) },
    ]);
  };

  const handleCancelRequest = () => {
    if (!canCancelRequest) return;
    cancelJoinRequest.mutate(activity.id);
  };

  const handleOrganizerLeaveAction = () => {
    if (!canCancelActivity) return;

    Alert.alert('Передать или отменить', 'Можно передать роль организатора следующему участнику. Если участников нет, активность будет отменена.', [
      { text: 'Назад', style: 'cancel' },
      {
        text: 'Передать',
        onPress: async () => {
          await declineOrganizership.mutateAsync(activity.id);
          router.back();
        },
      },
      {
        text: 'Отменить',
        style: 'destructive',
        onPress: async () => {
          await cancelActivity.mutateAsync(activity.id);
          router.back();
        },
      },
    ]);
  };

  const handleEditActivity = () => {
    router.push(`/activity/${encodeURIComponent(activity.id)}/edit`);
  };

  const handleBecomeOrganizer = () => {
    router.push(`/activity/${encodeURIComponent(activity.id)}/duplicate`);
  };

  const handleOpenSource = async () => {
    if (activity.kudagoUrl) {
      try {
        await Linking.openURL(activity.kudagoUrl);
      } catch (error) {
      }
    } else return;
  };

  const navigateToUser = (person: { id: string; isDeleted?: boolean }) => {
    if (person.isDeleted) return;
    router.push(`/user/${person.id}`);
  };

  const headerRightButtons: HeaderButton[] = [
    {
      icon: <Bookmark size={theme.spacing.iconSize} fill={activity.isSaved ? theme.colors.text : 'none'} />,
      onPress: () => saveActivity.mutate({ activityId: activity.id, saved: activity.isSaved }),
      variant: 'surface',
    },
    {
      icon: <Share2 size={theme.spacing.iconSize} />,
      onPress: () => void handleShare(),
      variant: 'surface',
    },
  ];

  if (canEditActivity) {
    headerRightButtons.push({
      icon: <Pencil size={theme.spacing.iconSizeMedium} />,
      onPress: handleEditActivity,
      variant: 'primary',
    });
  }

  if (canCancelActivity) {
    headerRightButtons.push({
      icon: <Ionicons name="close" size={theme.spacing.iconSize} />,
      onPress: handleOrganizerLeaveAction,
      variant: 'primary',
    });
  }

  return (
    <View style={commonStyles.container}>
      <SafeAreaView edges={['top']} style={styles.headerSafeArea}>
        <Header
          showBackButton
          title=""
          rightButtons={headerRightButtons}
        />
      </SafeAreaView>

      <ScrollView
        style={commonStyles.content}
        contentContainerStyle={{ paddingBottom: theme.spacing.xxl * 2 }}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <ActivityDetailHero
          title={activity.title}
          photoUri={coverPhotoUri}
          relativeTime={relativeTime}
          isCancelled={activity.status === 'cancelled'}
          heroChips={heroChips}
          onPress={photoUrls.length > 0 ? () => setSelectedPhotoIndex(0) : undefined}
        />

        <View style={styles.contentContainer}>
          <PeopleSummarySection
            organizer={organizerSummary}
            participantPreview={previewParticipants}
            participantsCountLabel={participantsLabel}
            onOrganizerPress={isImported ? () => { } : () => navigateToUser(organizerSummary)}
            onParticipantsPress={isImported ? undefined : () => setIsParticipantsSheetVisible(true)}
            organizerLabel={isImported ? 'Источник' : undefined}
            showParticipants={!isImported}
            organizerActionLabel={isImported ? 'Открыть веб-сайт' : undefined}
            onOrganizerActionPress={isImported ? handleOpenSource : undefined}
          />

          <View style={styles.sectionBlock}>
            <Text style={{ color: theme.colors.text, ...theme.typography.h4 }}>Инфо</Text>
            <View style={styles.detailList}>
              <View style={styles.detailRow}>
                <CalendarDays size={theme.spacing.iconSizeMedium} color={theme.colors.textSecondary} />
                <Text style={[styles.detailRowText, { color: theme.colors.text, ...theme.typography.body }]}>
                  {dateTimeSummary}
                </Text>
              </View>
              <View style={styles.detailRow}>
                {activity.format === 'online' ? (
                  <Monitor size={theme.spacing.iconSizeMedium} color={theme.colors.textSecondary} />
                ) : (
                  <MapPinIcon size={theme.spacing.iconSizeMedium} color={theme.colors.textSecondary} />
                )}
                <Text style={[styles.detailRowText, { color: theme.colors.text, ...theme.typography.body }]}>
                  {locationSummary}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Banknote size={theme.spacing.iconSizeMedium} color={theme.colors.textSecondary} />
                <Text style={[styles.detailRowText, { color: theme.colors.text, ...theme.typography.body }]}>
                  {activity.price > 0 ? `от ${activity.price} ₽` : 'Бесплатно'}
                </Text>
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

          {photoUrls.length > 1 ? (
            <View style={styles.sectionBlock}>
              <Text style={{ color: theme.colors.text, ...theme.typography.h4 }}>Фото</Text>
              <ScrollView
                horizontal
                style={styles.fullBleedGallery}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.galleryScrollContent}
              >
                {photoUrls.map((photoUrl, index) => (
                  <Pressable
                    key={`${photoUrl}-${index}`}
                    onPress={() => setSelectedPhotoIndex(index)}
                    style={styles.galleryImageButton}
                  >
                    <View style={styles.galleryImage}>
                      <CachedImage uri={photoUrl} style={styles.galleryImageInner} />
                    </View>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          ) : null}

          <View style={styles.criteriaList}>
            <Text style={{ color: theme.colors.text, ...theme.typography.h4 }}>Детали</Text>
            {participationCriteria.map((item) => (
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

      {shouldShowFooter ? (
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
          {footerMeta ? (
            <Text style={{ color: theme.colors.textSecondary, ...theme.typography.caption, marginBottom: theme.spacing.sm }}>
              {footerMeta}
            </Text>
          ) : null}

          {canBecomeOrganizer ? (
            <Button
              title="Найти компанию"
              variant="primary"
              size="medium"
              fullWidth
              onPress={handleBecomeOrganizer}
            />
          ) : canManageRequests ? (
            <View style={styles.footerButtons}>
              <Button
                title="QR-сканер"
                variant="primary"
                size="medium"
                style={{ flex: 1 }}
                onPress={() => router.push(`/qr-scan?activityId=${activity.id}`)}
              />
              {joinRequests.length > 0 ? (
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
                title={participantActionTitle}
                variant="primary"
                size="medium"
                style={{ flex: 1 }}
                disabled={isParticipantActionDisabled}
                onPress={() =>
                  canRateActivity
                    ? setIsRateSheetVisible(true)
                    : router.push(`/my-qr?activityId=${activity.id}`)
                }
              />
              {canLeaveActivity ? (
                <Button
                  title="Выйти"
                  variant="secondary"
                  size="medium"
                  style={{ flex: 1 }}
                  onPress={handleLeave}
                />
              ) : null}
            </View>
          ) : canCancelRequest ? (
            <Button
              title="Отменить заявку"
              variant="secondary"
              size="medium"
              fullWidth
              onPress={handleCancelRequest}
            />
          ) : (
            <Button
              title={joinButtonTitle}
              variant="primary"
              size="medium"
              fullWidth
              disabled={!canJoinActivity}
              onPress={handleJoin}
            />
          )}
        </SafeAreaView>
      ) : null}

      <ParticipantsSheet
        visible={isParticipantsSheetVisible}
        participants={sheetParticipants}
        organizerId={activity.organizer?.id}
        onClose={() => setIsParticipantsSheetVisible(false)}
        onParticipantPress={(participantId) => {
          const participant = sheetParticipants.find((item) => item.id === participantId);
          if (participant?.isDeleted) return;
          setIsParticipantsSheetVisible(false);
          router.push(`/user/${participantId}`);
        }}
      />

      <RequestsSheet
        visible={isRequestsSheetVisible}
        requests={joinRequests}
        onClose={() => setIsRequestsSheetVisible(false)}
        onReject={(userId) => rejectJoinRequest.mutate({ activityId: activity.id, userId })}
        onApprove={(userId) => approveJoinRequest.mutate({ activityId: activity.id, userId })}
      />

      <RateActivitySheet
        visible={isRateSheetVisible}
        activity={activity}
        onClose={() => setIsRateSheetVisible(false)}
      />

      <PhotoViewerModal
        visible={selectedPhotoIndex !== null}
        photos={photoUrls}
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
      gap: theme.spacing.xxl,
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
      width: '100%',
      height: '100%',
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
