import React from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import { useTheme } from '@/themes/useTheme';
import { Activity, ActivityCategory, UserRecord } from '@/types';
import { ActivityCard } from '@/components/cards/ActivityCard';
import { CardStack } from '@/components/ui/CardStack';
import { buildDateTimeWithTimeZone } from '@/utils/date';
import { getDeviceTimeZone, getTimeZoneFromLocation } from '@/utils/timezone';

interface ActivityPreviewStepProps {
  data: any;
  updateData: (data: any) => void;
  categories: ActivityCategory[];
  currentUser: UserRecord;
  setScrollEnabled?: (enabled: boolean) => void;
}

const DURATION_MS = 300;
const MAX_VISIBLE_ITEMS = 2;

export const ActivityPreviewStep: React.FC<ActivityPreviewStepProps> = ({
  data,
  categories,
  currentUser,
}) => {
  const theme = useTheme();
  const screenWidth = Dimensions.get('window').width;
  const screenHeight = Dimensions.get('window').height;
  const stackContainerWidth = screenWidth - theme.spacing.screenPaddingHorizontal * 2;
  const cardWidth = screenWidth - theme.spacing.screenPaddingHorizontal * 2;
  const cardsGap = theme.spacing.xl;
  const listGap = cardsGap;

  const category = categories.find((cat) => cat.id === data.categoryId);
  const subcategory = category?.subcategories.find((sub) => sub.id === data.subcategoryId);

  const locationTimeZone = data.format === 'online'
    ? undefined
    : getTimeZoneFromLocation(data.location?.latitude, data.location?.longitude);
  const timeZone = data.format === 'online'
    ? data.timeZone ?? getDeviceTimeZone() ?? 'UTC'
    : locationTimeZone ?? getDeviceTimeZone() ?? 'UTC';
  const startDateTime =
    buildDateTimeWithTimeZone(data.startDate ?? '', data.startTime ?? '', timeZone) ?? new Date();
  const endDateValue = data.endDate?.trim() ? data.endDate : data.startDate;
  const endDateTime =
    buildDateTimeWithTimeZone(endDateValue ?? '', data.endTime ?? '', timeZone) ?? startDateTime;
  const durationMs = Math.max(0, endDateTime.getTime() - startDateTime.getTime());
  const maxParticipants = data.maxParticipantsAny ? 0 : Number(data.maxParticipants) || 0;
  const ageFrom = data.preferredAgeAny ? undefined : Number(data.preferredAgeFrom) || undefined;
  const ageTo = data.preferredAgeAny ? undefined : Number(data.preferredAgeTo) || undefined;

  const buildNextDate = (date: Date, repeat: string) => {
    const next = new Date(date);
    if (repeat === 'weekly') {
      next.setDate(next.getDate() + 7);
      return next;
    }
    if (repeat === 'every2weeks') {
      next.setDate(next.getDate() + 14);
      return next;
    }
    if (repeat === 'monthly') {
      const day = next.getDate();
      next.setDate(1);
      next.setMonth(next.getMonth() + 1);
      const lastDay = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
      next.setDate(Math.min(day, lastDay));
      return next;
    }
    next.setDate(next.getDate() + 7);
    return next;
  };

  const buildScheduleDates = (startDate: Date, endDate: Date, repeat: string) => {
    const result: Date[] = [];
    let cursor = new Date(startDate);
    while (cursor <= endDate) {
      result.push(new Date(cursor));
      cursor = buildNextDate(cursor, repeat);
    }
    return result;
  };

  const baseActivity: Activity = {
    id: 'preview-activity',
    title: String(data.title).trim(),
    description: String(data.description || '').trim(),
    categoryId: category?.id ?? categories[0].id,
    subcategoryId: subcategory?.id,
    category: category || categories[0],
    subcategory,
    organizerId: currentUser.id,
    organizer: currentUser,
    format: data.format || 'offline',
    status: data.status,
    location: {
      latitude: data.format === 'online'
        ? 0
        : data.location?.latitude ?? currentUser.cityPlace.latitude,
      longitude: data.format === 'online'
        ? 0
        : data.location?.longitude ?? currentUser.cityPlace.longitude,
      address: data.format === 'online' ? 'Online' : data.address,
      settlement: data.format === 'online'
        ? undefined
        : data.location?.settlement || currentUser.cityPlace.settlement,
    },
    startAt: startDateTime.toISOString(),
    endAt: endDateTime.toISOString(),
    timeZone,
    currentParticipants: [currentUser],
    pendingRequests: [],
    attendedUsers: [],
    preferences: {
      gender: data.preferredGender === 'any' ? undefined : data.preferredGender,
      ageFrom,
      ageTo,
      level: data.level === 'any' ? undefined : data.level,
      maxParticipants,
    },
    requiresApproval: Boolean(data.requiresApproval),
    photoUrls: data.photoUrls?.length ? data.photoUrls : data.photoUrl ? [data.photoUrl] : undefined,
    price: data.isFree ? 0 : Number(data.price) || 0,
    ratings: [],
  };
  const sharedPhotoUri = baseActivity.photoUrls?.[0];

  const shouldRepeat = data.isRepeating === 'yes' && data.endRepeatDate?.trim();
  const repeatEndDateTime = shouldRepeat
    ? buildDateTimeWithTimeZone(data.endRepeatDate ?? '', data.startTime ?? '', timeZone)
    : null;
  const scheduleDates = repeatEndDateTime
    ? buildScheduleDates(startDateTime, repeatEndDateTime, data.repeat)
    : [startDateTime];

  const activities = scheduleDates.map((date, index) => {
    const start = new Date(date);
    start.setHours(startDateTime.getHours(), startDateTime.getMinutes(), 0, 0);
    const end = new Date(start.getTime() + durationMs);
    return {
      ...baseActivity,
      id: `preview-activity-${index}`,
      startAt: start.toISOString(),
      endAt: end.toISOString(),
    };
  });

  if (!activities.length) {
    return <View style={styles.container} />;
  }

  return (
    <View
      style={[styles.container, { paddingHorizontal: theme.spacing.screenPaddingHorizontal }]}
    >
      <CardStack
        data={activities}
        keyExtractor={(activity) => activity.id}
        renderItem={(activity) => (
          <ActivityCard
            activity={activity}
            mode="list"
            onPress={() => { }}
            style={{ width: cardWidth }}
            photoUriOverride={sharedPhotoUri}
          />
        )}
        cardsGap={cardsGap}
        maxVisibleItems={MAX_VISIBLE_ITEMS}
        durationMs={DURATION_MS}
        fastDurationMs={200}
        orientation="vertical"
        containerWidth={stackContainerWidth}
        containerHeight={screenHeight * 0.55}
        showScrollbar={activities.length > 1}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
