import { PersonSummary } from '@/components/activity-detail/PeopleSummarySection';
import { categories } from '@/constants/categories';
import { ActivityCategory, UserSnippetDto, ActivityDetailDto, UserProfileDto, CreateActivityRequest, UpdateActivityRequest } from '@/types';
import { getDeviceTimeZone, getTimeZoneFromLocation, getDefaultUtcOffsetOption, getUtcOffsetOptionByTimeZone } from '@/utils/timezone';
import { getDateTimePartsInTimeZone, buildDateTimeWithTimeZone } from '@/utils/date';
import { filesRepository } from '@/repositories/files.repository';
import { getFileNameFromUri, getFileUrl, getMimeTypeFromUri, isRemoteUri } from '@/utils/files';

export const isImportedActivity = (activity: any): boolean => {
  return activity?.source === 'KudaGo';
};

export const toPersonSummary = (user: UserSnippetDto): PersonSummary => ({
  id: user.id,
  name: user.name,
  avatarUrl: getFileUrl(user.avatarFileId),
  rating: user.rating,
  isDeleted: user.isDeleted,
});

export const KUDAGO_ORGANIZER_SUMMARY: PersonSummary = {
  id: 'KudaGo',
  name: 'KudaGo',
};

export const getAgeRangeLabel = (ageFrom?: number | null, ageTo?: number | null) => {
  if (ageFrom == null && ageTo == null) return null;
  if (ageFrom != null && ageTo != null) return `${ageFrom}-${ageTo} лет`;
  if (ageFrom != null) return `от ${ageFrom} лет`;
  return `до ${ageTo} лет`;
};

export const getActivityCategory = (activity?: { categoryId?: string | null } | null): ActivityCategory => {
  return categories.find((category) => category.id === activity?.categoryId) ?? categories[0];
};

export type ActivityFormData = Record<string, any>;

const formatDateParts = (parts: { year: number; month: number; day: number }) =>
  `${String(parts.day).padStart(2, '0')}.${String(parts.month).padStart(2, '0')}.${parts.year}`;

const formatTimeParts = (parts: { hour: number; minute: number }) =>
  `${String(parts.hour).padStart(2, '0')}:${String(parts.minute).padStart(2, '0')}`;

export const createActivityInitialData = (currentUser: UserProfileDto): ActivityFormData => {
  const defaultTimeZoneOption = getDefaultUtcOffsetOption();

  return {
    categoryId: '',
    subcategoryId: '',
    title: '',
    description: '',
    photoUrl: undefined as string | undefined,
    photoUrls: [] as string[],
    photoFileIds: [] as string[],
    address: '',
    format: 'offline',
    status: 'active',
    location: {
      latitude: currentUser.city.latitude,
      longitude: currentUser.city.longitude,
      settlement: currentUser.city.settlement,
      region: currentUser.city.region,
      country: currentUser.city.country,
    },
    timeZone: defaultTimeZoneOption.id,
    timeZoneLabel: defaultTimeZoneOption.label,
    timeZoneVerified: true,
    startDate: '',
    endDate: '',
    endRepeatDate: '',
    startTime: '',
    endTime: '',
    duration: 'oneDay',
    isRepeating: 'no',
    repeat: 'weekly',
    maxParticipants: '',
    maxParticipantsAny: true,
    preferredGender: 'any',
    preferredAge: '',
    preferredAgeFrom: '',
    preferredAgeTo: '',
    preferredAgeAny: true,
    level: 'any',
    requiresApproval: false,
    isFree: true,
    price: 0,
  };
};

export const activityDetailToFormData = (activity: ActivityDetailDto): ActivityFormData => {
  const start = getDateTimePartsInTimeZone(new Date(activity.startAt), activity.timeZone);
  const end = getDateTimePartsInTimeZone(new Date(activity.endAt), activity.timeZone);
  const timeZoneOption = getUtcOffsetOptionByTimeZone(activity.timeZone, new Date(activity.startAt));
  const sameDate = Boolean(
    start &&
    end &&
    start.year === end.year &&
    start.month === end.month &&
    start.day === end.day
  );
  const maxParticipants = activity.preferences?.maxParticipants;
  const photoFileIds = activity.photoFileIds.map(String);
  const photoUrls = photoFileIds.map((fileId) => getFileUrl(fileId)).filter(Boolean) as string[];

  return {
    activityId: activity.id,
    categoryId: activity.categoryId,
    subcategoryId: activity.subcategoryId ?? '',
    title: activity.title,
    description: activity.description,
    photoUrl: photoUrls[0],
    photoUrls,
    photoFileIds,
    address: activity.location.address,
    format: activity.format,
    status: activity.status,
    location: {
      latitude: activity.location.latitude,
      longitude: activity.location.longitude,
      settlement: activity.location.settlement ?? '',
      region: activity.location.region ?? '',
      country: activity.location.country ?? '',
    },
    timeZone: activity.timeZone,
    timeZoneLabel: timeZoneOption?.label ?? activity.timeZone,
    timeZoneVerified: true,
    startDate: start ? formatDateParts(start) : '',
    endDate: end ? formatDateParts(end) : '',
    endRepeatDate: '',
    startTime: start ? formatTimeParts(start) : '',
    endTime: end ? formatTimeParts(end) : '',
    duration: sameDate ? 'oneDay' : 'period',
    isRepeating: 'no',
    repeat: 'weekly',
    maxParticipants: maxParticipants == null ? '' : String(maxParticipants),
    maxParticipantsAny: maxParticipants == null,
    preferredGender: activity.preferences?.gender ?? 'any',
    preferredAge: '',
    preferredAgeFrom: activity.preferences?.ageFrom ? String(activity.preferences.ageFrom) : '',
    preferredAgeTo: activity.preferences?.ageTo ? String(activity.preferences.ageTo) : '',
    preferredAgeAny: !(activity.preferences?.ageFrom || activity.preferences?.ageTo),
    level: activity.preferences?.level ?? 'any',
    requiresApproval: activity.requiresApproval,
    isFree: !activity.price,
    price: activity.price || 0,
  };
};

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

const getSelectedPhotoFileIds = async (data: ActivityFormData) => {
  const selectedPhotoUris = Array.isArray(data.photoUrls)
    ? data.photoUrls.filter((uri: unknown): uri is string => typeof uri === 'string' && uri.trim().length > 0)
    : [];
  const existingPhotoFileIds = Array.isArray(data.photoFileIds)
    ? data.photoFileIds
      .map((fileId: unknown) => {
        if (typeof fileId !== 'string' && typeof fileId !== 'number') return null;
        return String(fileId);
      })
      .filter((fileId: string | null): fileId is string => {
      if (!fileId) return false;
      const fileUrl = getFileUrl(fileId);
      return Boolean(fileUrl && selectedPhotoUris.includes(fileUrl));
    })
    : [];
  const uploadedPhotoFileIds = await Promise.all(
    selectedPhotoUris
      .filter((uri) => !isRemoteUri(uri))
      .map(async (uri, index) => {
        const file = await filesRepository.upload({
          uri,
          name: getFileNameFromUri(uri, `activity-photo-${index + 1}`),
          mimeType: getMimeTypeFromUri(uri),
        });
        return file.id;
      })
  );

  return [...existingPhotoFileIds, ...uploadedPhotoFileIds];
};

const buildBasePayload = async (data: ActivityFormData, currentUser: UserProfileDto) => {
  const category = categories.find((cat) => cat.id === data.categoryId);
  if (!category) {
    throw new Error('Choose a category before saving the activity.');
  }

  const subcategory = category.subcategories.find((sub) => sub.id === data.subcategoryId);
  const locationTimeZone = data.format === 'online'
    ? undefined
    : getTimeZoneFromLocation(data.location?.latitude, data.location?.longitude);
  const timeZone = data.format === 'online'
    ? data.timeZone ?? getDeviceTimeZone() ?? 'UTC'
    : locationTimeZone ?? getDeviceTimeZone() ?? 'UTC';
  const startDateTime = buildDateTimeWithTimeZone(data.startDate, data.startTime, timeZone);
  const endDateTime = buildDateTimeWithTimeZone(data.endDate, data.endTime, timeZone);

  if (!startDateTime || !endDateTime) {
    throw new Error('Invalid date or time.');
  }

  const location = data.format === 'online'
    ? {
      latitude: 0,
      longitude: 0,
      address: 'Online',
    }
    : {
      latitude: data.location?.latitude ?? 0,
      longitude: data.location?.longitude ?? 0,
      address: data.address || 'Address not set',
      settlement: data.location?.settlement || currentUser.city.settlement,
      region: data.location?.region || currentUser.city.region,
      country: data.location?.country || currentUser.city.country,
    };
  const maxParticipantsValue = data.maxParticipantsAny
    ? null
    : Math.max(2, Number(data.maxParticipants) || 2);

  return {
    payload: {
      title: String(data.title || '').trim(),
      description: String(data.description || '').trim(),
      categoryId: category.id,
      subcategoryId: subcategory?.id,
      format: data.format,
      location,
      timeZone,
      preferences: {
        gender: data.preferredGender === 'any' ? undefined : data.preferredGender,
        ageFrom: data.preferredAgeAny ? undefined : Number(data.preferredAgeFrom) || undefined,
        ageTo: data.preferredAgeAny ? undefined : Number(data.preferredAgeTo) || undefined,
        level: data.level === 'any' ? undefined : data.level,
        maxParticipants: maxParticipantsValue,
      },
      requiresApproval: Boolean(data.requiresApproval),
      photoFileIds: await getSelectedPhotoFileIds(data),
      price: data.isFree ? 0 : Number(data.price) || 0,
    },
    startDateTime,
    endDateTime,
    timeZone,
  };
};

export const buildCreateActivityPayloads = async (
  data: ActivityFormData,
  currentUser: UserProfileDto
): Promise<CreateActivityRequest[]> => {
  const { payload, startDateTime, endDateTime, timeZone } = await buildBasePayload(data, currentUser);
  const shouldRepeat = data.isRepeating === 'yes' && data.endRepeatDate?.trim();
  const repeatEndDateTime = shouldRepeat
    ? buildDateTimeWithTimeZone(data.endRepeatDate, data.startTime, timeZone)
    : null;
  const scheduleDates = shouldRepeat
    ? buildScheduleDates(startDateTime, repeatEndDateTime ?? startDateTime, data.repeat)
    : [startDateTime];
  const durationMs = Math.max(0, endDateTime.getTime() - startDateTime.getTime());

  return scheduleDates.map((date) => {
    const start = new Date(date);
    start.setHours(startDateTime.getHours(), startDateTime.getMinutes(), 0, 0);
    const end = new Date(start.getTime() + durationMs);
    return {
      ...payload,
      startAt: start.toISOString(),
      endAt: end.toISOString(),
    };
  });
};

export const buildUpdateActivityPayload = async (
  data: ActivityFormData,
  currentUser: UserProfileDto
): Promise<UpdateActivityRequest> => {
  const { payload, startDateTime, endDateTime } = await buildBasePayload(data, currentUser);

  return {
    ...payload,
    startAt: startDateTime.toISOString(),
    endAt: endDateTime.toISOString(),
    status: data.status,
  };
};
