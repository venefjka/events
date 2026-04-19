import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Activity,
  ActivityParticipation,
  ActivityRating,
  UserActivityFeedEvent,
  UserActivityFeedEventType,
} from '@/types';

const STORAGE_KEY = 'userActivityFeed';

export type UserActivityFeedCategory = 'all' | 'organizer' | 'participant' | 'ratings';

export type UserActivityFeedItem = {
  id: string;
  type: UserActivityFeedEventType;
  timestamp: string;
  activity: Activity | null;
  title: string;
  subtitle?: string;
  ratingValue?: number;
};

const isUserActivityFeedEventType = (value: unknown): value is UserActivityFeedEventType =>
  value === 'created' ||
  value === 'attended' ||
  value === 'rated' ||
  value === 'cancelled' ||
  value === 'leaved' ||
  value === 'joined' ||
  value === 'missed';

export const getUserActivityFeedCategory = (
  type: UserActivityFeedEventType
): UserActivityFeedCategory => {
  switch (type) {
    case 'created':
    case 'cancelled':
      return 'organizer';
    case 'rated':
      return 'ratings';
    case 'joined':
    case 'attended':
    case 'leaved':
    case 'missed':
      return 'participant';
  }
};

const normalizeUserActivityFeedEvent = (entry: unknown): UserActivityFeedEvent | null => {
  if (!entry || typeof entry !== 'object') return null;

  const record = entry as {
    id?: unknown;
    userId?: unknown;
    activityId?: unknown;
    type?: unknown;
    timestamp?: unknown;
  };

  if (
    typeof record.id !== 'string' ||
    typeof record.userId !== 'string' ||
    typeof record.activityId !== 'string' ||
    typeof record.timestamp !== 'string' ||
    !isUserActivityFeedEventType(record.type)
  ) {
    return null;
  }

  return {
    id: record.id,
    userId: record.userId,
    activityId: record.activityId,
    type: record.type,
    timestamp: record.timestamp,
  };
};

export const loadUserActivityFeed = async (): Promise<UserActivityFeedEvent[]> => {
  const stored = await AsyncStorage.getItem(STORAGE_KEY);
  if (!stored) return [];

  const parsed = JSON.parse(stored);
  if (!Array.isArray(parsed)) return [];

  return parsed
    .map((entry) => normalizeUserActivityFeedEvent(entry))
    .filter((entry): entry is UserActivityFeedEvent => Boolean(entry));
};

export const appendUserActivityFeedEvent = async (
  input: Omit<UserActivityFeedEvent, 'id' | 'timestamp'> & { id?: string; timestamp?: string }
) => {
  const existing = await loadUserActivityFeed();
  const event: UserActivityFeedEvent = {
    id: input.id ?? `feed-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    userId: input.userId,
    activityId: input.activityId,
    type: input.type,
    timestamp: input.timestamp ?? new Date().toISOString(),
  };

  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([event, ...existing]));
  return event;
};

export const buildUserActivityFeedItems = ({
  userId,
  canViewParticipationHistory,
  events,
  activities,
  participationRecords,
  activityRatings,
}: {
  userId: string;
  canViewParticipationHistory: boolean;
  events: UserActivityFeedEvent[];
  activities: Activity[];
  participationRecords: ActivityParticipation[];
  activityRatings: ActivityRating[];
}): UserActivityFeedItem[] => {
  const activityById = new Map(activities.map((activity) => [activity.id, activity]));
  const logged = events.filter((event) => event.userId === userId);
  const loggedKeys = new Set(logged.map((event) => `${event.type}:${event.userId}:${event.activityId}`));
  const itemKeys = new Set<string>();
  const items: UserActivityFeedItem[] = [];

  const pushItem = (
    id: string,
    type: UserActivityFeedEventType,
    activityId: string,
    timestamp: string | undefined,
    subtitle?: string,
    ratingValue?: number
  ) => {
    if (!timestamp) return;

    const compositeKey = `${type}:${userId}:${activityId}`;
    if (itemKeys.has(compositeKey)) return;

    const activity = activityById.get(activityId) ?? null;
    itemKeys.add(compositeKey);
    items.push({
      id,
      type,
      timestamp,
      activity,
      title: activity?.title ?? 'Активность недоступна',
      subtitle,
      ratingValue,
    });
  };

  logged.forEach((event) => {
    const rating =
      event.type === 'rated'
        ? activityRatings.find((item) => item.userId === userId && item.activityId === event.activityId)
        : null;

    pushItem(
      event.id,
      event.type,
      event.activityId,
      event.timestamp,
      event.type === 'rated' ? rating?.comment?.trim() || 'Отзыв не оставлен' : undefined,
      event.type === 'rated' ? rating?.rating : undefined
    );
  });

  activities
    .filter((activity) => activity.organizer.id === userId)
    .forEach((activity) => {
      const key = `created:${userId}:${activity.id}`;
      if (loggedKeys.has(key)) return;
      pushItem(`fallback-${key}`, 'created', activity.id, activity.createdAt);
    });

  if (canViewParticipationHistory) {
    const latestAttendanceByActivity = new Map<string, ActivityParticipation>();
    participationRecords
      .filter((record) => record.userId === userId && record.status === 'attended')
      .forEach((record) => {
        const current = latestAttendanceByActivity.get(record.activityId);
        const currentTime = current ? new Date(current.createdAt).getTime() : 0;
        const nextTime = new Date(record.createdAt).getTime();

        if (!current || nextTime > currentTime) {
          latestAttendanceByActivity.set(record.activityId, record);
        }
      });

    latestAttendanceByActivity.forEach((record) => {
      const key = `attended:${userId}:${record.activityId}`;
      if (loggedKeys.has(key)) return;

      const activity = activityById.get(record.activityId);
      pushItem(
        `fallback-${key}`,
        'attended',
        record.activityId,
        activity?.endAt || activity?.startAt || record.createdAt
      );
    });

    const latestRatingByActivity = new Map<string, ActivityRating>();
    activityRatings
      .filter((rating) => rating.userId === userId)
      .forEach((rating) => {
        const current = latestRatingByActivity.get(rating.activityId);
        const currentTime = current ? new Date(current.timestamp).getTime() : 0;
        const nextTime = new Date(rating.timestamp).getTime();

        if (!current || nextTime > currentTime) {
          latestRatingByActivity.set(rating.activityId, rating);
        }
      });

    latestRatingByActivity.forEach((rating) => {
      const key = `rated:${userId}:${rating.activityId}`;
      if (loggedKeys.has(key)) return;

      pushItem(
        `fallback-${key}`,
        'rated',
        rating.activityId,
        rating.timestamp,
        rating.comment?.trim() || 'Отзыв не оставлен',
        rating.rating
      );
    });
  }

  return items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};
