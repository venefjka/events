import { ActivityRecord, UserPublic, UserRecord } from '@/types';
import { getDeviceTimeZone } from '@/utils/timezone';

export type ActivityDraft = Omit<
  ActivityRecord,
  'id' | 'organizerId' | 'createdAt' | 'updatedAt'
>;

export const toUserPublicFallback = (fallbackId?: string): UserPublic => ({
  id: fallbackId ?? 'deleted',
  name: 'Deleted User',
  rating: 0,
});

export const buildUserMap = (users: UserRecord[], currentUser: UserRecord | null) => {
  const map = new Map<string, UserRecord>();
  users.forEach((acc) => map.set(acc.id, acc));
  if (currentUser && !map.has(currentUser.id)) {
    map.set(currentUser.id, currentUser);
  }
  return map;
};

export const normalizeActivityRecord = (record: any): ActivityRecord => {
  const startAt = record.startAt ?? record.startTime ?? record.startDate ?? new Date().toISOString();
  const endAt = record.endAt ?? record.endTime ?? record.endDate ?? startAt;
  const timeZone = record.timeZone ?? getDeviceTimeZone() ?? 'UTC';
  const parseAgeRange = (value?: string) => {
    if (!value) return { ageFrom: undefined, ageTo: undefined };
    const numbers = value.match(/\d+/g)?.map((item) => Number(item)).filter((item) => !Number.isNaN(item));
    if (!numbers || numbers.length < 2) return { ageFrom: undefined, ageTo: undefined };
    return { ageFrom: numbers[0], ageTo: numbers[1] };
  };
  const preferences = record.preferences ?? {
    gender: record.preferredGender,
    ageFrom: record.preferredAgeFrom,
    ageTo: record.preferredAgeTo,
    level: record.level,
    maxParticipants: record.maxParticipants,
  };
  const normalizedAgeFrom =
    typeof preferences?.ageFrom === 'number'
      ? preferences.ageFrom
      : preferences?.ageFrom != null
        ? Number(preferences.ageFrom)
        : undefined;
  const normalizedAgeTo =
    typeof preferences?.ageTo === 'number'
      ? preferences.ageTo
      : preferences?.ageTo != null
        ? Number(preferences.ageTo)
        : undefined;
  const parsedAge = parseAgeRange(
    preferences?.ageRange ?? record.preferredAge ?? record.preferences?.ageRange
  );
  preferences.ageFrom = Number.isFinite(normalizedAgeFrom)
    ? normalizedAgeFrom
    : parsedAge.ageFrom;
  preferences.ageTo = Number.isFinite(normalizedAgeTo)
    ? normalizedAgeTo
    : parsedAge.ageTo;
  delete preferences.ageRange;
  if (preferences?.gender === 'any') {
    preferences.gender = undefined;
  }
  if (preferences?.level === 'any') {
    preferences.level = undefined;
  }
  if (record.maxParticipants !== undefined && preferences?.maxParticipants === undefined) {
    preferences.maxParticipants = record.maxParticipants;
  }

  const location =
    record.location ??
    (record.address
      ? {
        latitude: record.latitude ?? 0,
        longitude: record.longitude ?? 0,
        address: record.address,
        settlement: record.settlement,
      }
      : {
        latitude: 0,
        longitude: 0,
        address: 'Online',
      });

  return {
    id: record.id ?? `activity-${Date.now()}`,
    title: record.title ?? '',
    description: record.description ?? '',
    categoryId: record.categoryId ?? record.category?.id ?? '',
    subcategoryId: record.subcategoryId ?? record.subcategory?.id,
    organizerId: record.organizerId ?? record.organizer?.id ?? '',
    format: record.format ?? 'offline',
    location,
    startAt,
    endAt,
    timeZone,
    status: record.status ?? (record.isCancelled ? 'cancelled' : 'active'),
    preferences,
    requiresApproval: Boolean(record.requiresApproval),
    photoUrls: record.photoUrls ?? (record.photoUrl ? [record.photoUrl] : []),
    price: typeof record.price === 'number' ? record.price : record.isFree ? 0 : 0,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
};

export const buildActivity = (newActivity: ActivityDraft, organizerId: string) => ({
  ...newActivity,
  id: `activity-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  organizerId,
  status: 'active' as 'active' | 'cancelled',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});
