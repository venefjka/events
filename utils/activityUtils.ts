import { ActivityRecord, UserPublic, UserRecord } from '@/types';
import { getDateTimePartsInTimeZone } from '@/utils/date';
import {
  getDeviceTimeZone,
  getUtcOffsetOptionByTimeZone,
} from '@/utils/timezone';

export type ActivityDraft = Omit<
  ActivityRecord,
  'id' | 'organizerId' | 'createdAt' | 'updatedAt'
>;

export const KUDAGO_ORGANIZER_ID = 'kudago-import';

const formatDatePart = (date: Date, timeZone?: string) => {
  const parts = getDateTimePartsInTimeZone(date, timeZone);
  if (!parts) return '';
  return `${String(parts.day).padStart(2, '0')}.${String(parts.month).padStart(2, '0')}.${parts.year}`;
};

const formatTimePart = (date: Date, timeZone?: string) => {
  const parts = getDateTimePartsInTimeZone(date, timeZone);
  if (!parts) return '';
  return `${String(parts.hour).padStart(2, '0')}:${String(parts.minute).padStart(2, '0')}`;
};

export const toUserPublicFallback = (fallbackId?: string): UserPublic => ({
  id: fallbackId ?? 'deleted',
  name: fallbackId === KUDAGO_ORGANIZER_ID ? 'KudaGo' : 'Deleted User',
  rating: 0,
});

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

  const location = record.location
    ? {
      latitude: record.location.latitude ?? 0,
      longitude: record.location.longitude ?? 0,
      address: record.location.address ?? record.address ?? 'Online',
      name: record.location.name,
      settlement: record.location.settlement ?? record.settlement,
      region: record.location.region ?? record.region,
      country: record.location.country ?? record.country,
    }
    : record.address
      ? {
        latitude: record.latitude ?? 0,
        longitude: record.longitude ?? 0,
        address: record.address,
        settlement: record.settlement,
        region: record.region,
        country: record.country,
      }
      : {
        latitude: 0,
        longitude: 0,
        address: 'Online',
      };

  return {
    id: record.id ?? `activity-${Date.now()}`,
    title: record.title ?? '',
    description: record.description ?? '',
    siteUrl: record.siteUrl,
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

export const buildCreateActivityDraftFromRecord = (record: ActivityRecord) => {
  const timeZone = record.timeZone ?? getDeviceTimeZone() ?? 'UTC';
  const startDate = formatDatePart(new Date(record.startAt), timeZone);
  const endDate = formatDatePart(new Date(record.endAt ?? record.startAt), timeZone);
  const startTime = formatTimePart(new Date(record.startAt), timeZone);
  const endTime = formatTimePart(new Date(record.endAt ?? record.startAt), timeZone);
  const isOneDay = startDate && endDate ? startDate === endDate : true;
  const location = record.location ?? {
    latitude: 0,
    longitude: 0,
    address: record.format === 'online' ? 'Online' : 'Address not set',
  };
  const ageFrom = record.preferences?.ageFrom;
  const ageTo = record.preferences?.ageTo;
  const hasAgeRange = ageFrom != null || ageTo != null;
  const maxParticipants = record.preferences?.maxParticipants;
  const maxParticipantsAny = maxParticipants == null || maxParticipants <= 0;

  return {
    categoryId: record.categoryId ?? '',
    subcategoryId: record.subcategoryId ?? '',
    title: record.title ?? '',
    description: record.description ?? '',
    photoUrl: record.photoUrls?.[0],
    photoUrls: record.photoUrls ?? [],
    address: record.location?.address ?? '',
    format: record.format ?? 'offline',
    status: 'active' as const,
    location: {
      latitude: location.latitude ?? 0,
      longitude: location.longitude ?? 0,
      settlement: location.settlement,
      region: location.region,
      country: location.country,
    },
    timeZone,
    timeZoneLabel: getUtcOffsetOptionByTimeZone(timeZone, new Date(record.startAt))?.label,
    timeZoneVerified: true,
    startDate,
    endDate: isOneDay ? startDate : endDate,
    endRepeatDate: '',
    startTime,
    endTime,
    duration: isOneDay ? ('oneDay' as const) : ('period' as const),
    isRepeating: 'no' as const,
    repeat: 'weekly' as const,
    maxParticipants: maxParticipantsAny ? '' : String(maxParticipants),
    maxParticipantsAny,
    preferredGender: record.preferences?.gender ?? 'any',
    preferredAge: hasAgeRange ? `${ageFrom ?? ''}-${ageTo ?? ''}` : '',
    preferredAgeFrom: ageFrom != null ? String(ageFrom) : '',
    preferredAgeTo: ageTo != null ? String(ageTo) : '',
    preferredAgeAny: !hasAgeRange,
    level: record.preferences?.level ?? 'any',
    requiresApproval: Boolean(record.requiresApproval),
    isFree: record.price <= 0,
    price: record.price > 0 ? record.price : 0,
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
