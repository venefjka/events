import { getApprovalItems, getGenderItems, getLevelItems } from '@/constants/activityPreferenceOptions';
import type { Activity, UserPublic } from '@/types';
import {
  formatActivityDate,
  formatDateOnly,
  formatTimeOnly,
  formatTimeZoneOffset,
  getRelativeTime,
} from '@/utils/date';

export interface ActivityParticipationCriterion {
  label: string;
  value: string;
}

export interface ActivityDetailState {
  isOrganizer: boolean;
  isParticipant: boolean;
  isPending: boolean;
  isSaved: boolean;
  isCancelled: boolean;
  isPast: boolean;
  photoUrls: string[];
  photoUri?: string;
  maxParticipants: number;
  isUnlimited: boolean;
  spotsLeft: number | null;
  isFull: boolean;
  placeTitle: string;
  timeZoneLabel?: string;
  relativeTime: string;
  participants: UserPublic[];
  participantsSheetUsers: UserPublic[];
  participantPreview: UserPublic[];
  ageLabel: string | null;
  participationCriteria: ActivityParticipationCriterion[];
  dateTimeSummary: string;
  footerMeta: string;
  joinButtonTitle: string;
  participantsCountLabel: string;
  locationSummary: string;
  priceSummary: string;
  shareMessage: string;
}

export const getActivityAgeLabel = (activity: Activity) => {
  const ageFrom = activity.preferences?.ageFrom;
  const ageTo = activity.preferences?.ageTo;

  if (ageFrom == null && ageTo == null) return null;
  if (ageFrom != null && ageTo != null) return `${ageFrom}-${ageTo} лет`;
  if (ageFrom != null) return `от ${ageFrom} лет`;

  return `до ${ageTo} лет`;
};

export const getActivityDetailState = (
  activity: Activity,
  currentUserId: string,
  savedActivities: string[]
): ActivityDetailState => {
  const isOrganizer = activity.organizer.id === currentUserId;
  const isParticipant = activity.currentParticipants.some((user) => user.id === currentUserId);
  const isPending = activity.pendingRequests.some((user) => user.id === currentUserId);
  const isSaved = savedActivities.includes(activity.id);
  const isCancelled = activity.status === 'cancelled';
  const isPast = new Date(activity.startAt) < new Date();
  const photoUrls = activity.photoUrls?.filter(Boolean) ?? [];
  const photoUri = photoUrls[0];
  const maxParticipants = activity.preferences?.maxParticipants ?? 0;
  const isUnlimited = maxParticipants <= 0;
  const spotsLeft = isUnlimited ? null : Math.max(0, maxParticipants - activity.currentParticipants.length);
  const isFull = !isUnlimited && spotsLeft === 0;
  const placeTitle = activity.location.name || activity.location.address;
  const timeZoneLabel =
    activity.format === 'online' ? formatTimeZoneOffset(activity.startAt, activity.timeZone) : undefined;
  const relativeTime = isPast ? 'Событие уже прошло' : getRelativeTime(activity.startAt);
  const participants = activity.currentParticipants.filter(
    (participant) => participant.id !== activity.organizer.id
  );
  const participantsSheetUsers = [activity.organizer, ...participants];
  const participantPreview = participants.slice(0, 3);
  const ageLabel = getActivityAgeLabel(activity);

  const endTime = activity.endAt ? formatTimeOnly(activity.endAt, activity.timeZone) : null;
  const endDateLabel = activity.endAt ? formatActivityDate(activity.endAt, activity.timeZone) : null;
  const hasSameStartEndDate = activity.endAt
    ? formatDateOnly(activity.startAt, activity.timeZone) === formatDateOnly(activity.endAt, activity.timeZone)
    : false;
  const dateTimeSummary = `${formatActivityDate(activity.startAt, activity.timeZone)}${
    activity.endAt ? ` — ${hasSameStartEndDate ? endTime : endDateLabel}` : ''
  }`;

  const levelLabel = activity.preferences?.level
    ? getLevelItems().find((item) => item.id === activity.preferences?.level)?.label
    : null;
  const genderLabel = activity.preferences?.gender
    ? getGenderItems().find((item) => item.id === activity.preferences?.gender)?.label
    : null;
  const approvalLabel = getApprovalItems().find(
    (item) => item.id === (activity.requiresApproval ? 'yes' : 'no')
  )?.label;

  const participationCriteria: ActivityParticipationCriterion[] = [
    {
      label: 'Тип регистрации',
      value: approvalLabel ?? (activity.requiresApproval ? 'По заявке' : 'Свободная'),
    },
    ...(levelLabel ? [{ label: 'Уровень', value: levelLabel }] : []),
    ...(ageLabel ? [{ label: 'Возраст', value: ageLabel }] : []),
    ...(genderLabel ? [{ label: 'Пол', value: genderLabel }] : []),
  ];

  const footerMeta = isOrganizer
    ? 'Вы организатор'
    : isParticipant
      ? 'Вы участвуете'
      : '';

  const joinButtonTitle = isCancelled
    ? 'Активность отменена'
    : isPast
      ? 'Событие завершено'
      : isFull
        ? 'Cвободных мест нет'
        : activity.requiresApproval
          ? 'Подать заявку'
          : 'Присоединиться';

  return {
    isOrganizer,
    isParticipant,
    isPending,
    isSaved,
    isCancelled,
    isPast,
    photoUrls,
    photoUri,
    maxParticipants,
    isUnlimited,
    spotsLeft,
    isFull,
    placeTitle,
    timeZoneLabel,
    relativeTime,
    participants,
    participantsSheetUsers,
    participantPreview,
    ageLabel,
    participationCriteria,
    dateTimeSummary,
    footerMeta,
    joinButtonTitle,
    participantsCountLabel: isUnlimited
      ? `${activity.currentParticipants.length}/∞`
      : `${activity.currentParticipants.length}/${maxParticipants}`,
    locationSummary: [activity.location.settlement, placeTitle, timeZoneLabel].filter(Boolean).join(', '),
    priceSummary: activity.price > 0 ? `от ${activity.price} ₽` : 'от 0 ₽',
    shareMessage: `${activity.title}\n${formatActivityDate(activity.startAt, activity.timeZone)}\n${
      activity.location.address
    }`,
  };
};
