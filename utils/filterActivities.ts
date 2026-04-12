import { Activity, FilterState } from '../types';
import {
  getDateKeyInTimeZone,
  getDateTimePartsInTimeZone,
  getMinutesOfDayInTimeZone,
  getTimeZoneOffsetMinutes,
  parseDateInput,
  parseTimeParts,
} from '@/utils/date';

const MINUTES_IN_DAY = 1440;

const toDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getDayIndexInTimeZone = (date: Date, timeZone?: string) => {
  const parts = getDateTimePartsInTimeZone(date, timeZone);
  if (!parts) return null;
  return Date.UTC(parts.year, parts.month - 1, parts.day) / 86400000;
};

const splitTimeRange = (startMinutes: number, endMinutes: number): Array<[number, number]> => {
  if (startMinutes <= endMinutes) {
    return [[startMinutes, endMinutes]];
  }

  return [
    [startMinutes, MINUTES_IN_DAY - 1],
    [0, endMinutes],
  ];
};

const rangesOverlap = ([startA, endA]: [number, number], [startB, endB]: [number, number]) => {
  return startA <= endB && startB <= endA;
};

const matchesTimeWindow = ({
  activityStartMinutes,
  activityEndMinutes,
  activityDaySpan,
  filterFromMinutes,
  filterToMinutes,
}: {
  activityStartMinutes: number | null;
  activityEndMinutes: number | null;
  activityDaySpan: number | null;
  filterFromMinutes: number | null;
  filterToMinutes: number | null;
}) => {
  if (filterFromMinutes == null && filterToMinutes == null) {
    return true;
  }

  if (activityStartMinutes == null) {
    return true;
  }

  if (activityDaySpan != null && activityDaySpan > 1) {
    return true;
  }

  const normalizedFilterStart = filterFromMinutes ?? 0;
  const normalizedFilterEnd = filterToMinutes ?? MINUTES_IN_DAY - 1;
  const filterRanges = splitTimeRange(normalizedFilterStart, normalizedFilterEnd);

  const normalizedActivityEnd = activityEndMinutes ?? activityStartMinutes;
  const activityRanges = activityDaySpan === 1
    ? splitTimeRange(activityStartMinutes, normalizedActivityEnd)
    : [[activityStartMinutes, normalizedActivityEnd] as [number, number]];

  return activityRanges.some((activityRange) =>
    filterRanges.some((filterRange) => rangesOverlap(activityRange, filterRange))
  );
};

const normalizeLocationPart = (value?: string | null) => value?.trim().toLowerCase() ?? '';

const matchesLocationPart = (
  activityValue: string | undefined,
  filterValue: string | undefined,
  fallbackText?: string
) => {
  const normalizedFilter = normalizeLocationPart(filterValue);
  if (!normalizedFilter) {
    return true;
  }

  const normalizedActivity = normalizeLocationPart(activityValue);
  if (normalizedActivity) {
    return normalizedActivity === normalizedFilter;
  }

  const normalizedFallback = normalizeLocationPart(fallbackText);
  return Boolean(normalizedFallback) && normalizedFallback.includes(normalizedFilter);
};

/**
 * Фильтрует активности по заданным фильтрам.
 */
export const filterActivities = (
  activities: Activity[],
  filters: FilterState
): Activity[] => {
  const startDate = parseDateInput(filters.dateFrom ?? '');
  const endDate = parseDateInput(filters.dateTo ?? '');
  const filterStartKey = startDate ? toDateKey(startDate) : null;
  const filterEndKey = endDate ? toDateKey(endDate) : null;
  const timeFrom = parseTimeParts(filters.timeFrom ?? '');
  const timeTo = parseTimeParts(filters.timeTo ?? '');
  const filterFromMinutes = timeFrom ? timeFrom.hours * 60 + timeFrom.minutes : null;
  const filterToMinutes = timeTo ? timeTo.hours * 60 + timeTo.minutes : null;

  return activities.filter((activity) => {
    if (filters.categoryId && activity.category.id !== filters.categoryId) {
      return false;
    }

    if (filters.subcategoryId && activity.subcategoryId !== filters.subcategoryId) {
      return false;
    }

    if (activity.format !== filters.format) {
      return false;
    }

    if (filters.priceTo != null && activity.price > filters.priceTo) {
      return false;
    }

    const currentCount = activity.currentParticipants.length;

    if (filters.maxParticipants != null) {
      const limit = activity.preferences?.maxParticipants ?? 0;
      if (limit <= 0 || limit > filters.maxParticipants) {
        return false;
      }
    }

    const maxParticipants = activity.preferences?.maxParticipants ?? 0;
    if (filters.onlyAvailable && maxParticipants > 0 && currentCount >= maxParticipants) {
      return false;
    }

    if (filters.registrationType !== 'any') {
      const requiresApproval = Boolean(activity.requiresApproval);
      if (filters.registrationType === 'yes' && !requiresApproval) {
        return false;
      }
      if (filters.registrationType === 'no' && requiresApproval) {
        return false;
      }
    }

    if (filters.level !== 'any') {
      const level = activity.preferences?.level;
      if (level && level !== filters.level) {
        return false;
      }
    }

    if (filters.gender !== 'any') {
      const gender = activity.preferences?.gender;
      if (gender && gender !== filters.gender) {
        return false;
      }
    }

    const filterAgeAny = filters.ageAny || (filters.ageFrom == null && filters.ageTo == null);
    if (!filterAgeAny) {
      const filterFrom = filters.ageFrom ?? Number.NEGATIVE_INFINITY;
      const filterTo = filters.ageTo ?? Number.POSITIVE_INFINITY;
      const activityFrom = activity.preferences?.ageFrom;
      const activityTo = activity.preferences?.ageTo;

      if (activityFrom != null || activityTo != null) {
        const minAge = activityFrom ?? Number.NEGATIVE_INFINITY;
        const maxAge = activityTo ?? Number.POSITIVE_INFINITY;
        if (maxAge < filterFrom || minAge > filterTo) {
          return false;
        }
      }
    }

    const selectedCity = filters.selectedCity;
    if (selectedCity) {
      if (activity.format !== 'offline') {
        return false;
      }

      if (!matchesLocationPart(activity.location.settlement, selectedCity.settlement, activity.location.address)) {
        return false;
      }

      if (!matchesLocationPart(activity.location.region, selectedCity.region, activity.location.address)) {
        return false;
      }

      if (!matchesLocationPart(activity.location.country, selectedCity.country, activity.location.address)) {
        return false;
      }
    }

    const activityStart = new Date(activity.startAt);
    const activityEnd = new Date(activity.endAt || activity.startAt);
    const activityStartKey = getDateKeyInTimeZone(activityStart, activity.timeZone);
    const activityEndKey = getDateKeyInTimeZone(activityEnd, activity.timeZone) ?? activityStartKey;

    if (filterStartKey || filterEndKey) {
      if (!activityStartKey || !activityEndKey) {
        return false;
      }

      if (filterStartKey && activityEndKey < filterStartKey) {
        return false;
      }

      if (filterEndKey && activityStartKey > filterEndKey) {
        return false;
      }
    }

    if (filterFromMinutes != null || filterToMinutes != null) {
      const activityStartMinutes = getMinutesOfDayInTimeZone(activityStart, activity.timeZone);
      const activityEndMinutes = getMinutesOfDayInTimeZone(activityEnd, activity.timeZone);
      const activityStartDayIndex = getDayIndexInTimeZone(activityStart, activity.timeZone);
      const activityEndDayIndex = getDayIndexInTimeZone(activityEnd, activity.timeZone);
      const activityDaySpan =
        activityStartDayIndex != null && activityEndDayIndex != null
          ? Math.max(0, activityEndDayIndex - activityStartDayIndex)
          : null;

      if (
        !matchesTimeWindow({
          activityStartMinutes,
          activityEndMinutes,
          activityDaySpan,
          filterFromMinutes,
          filterToMinutes,
        })
      ) {
        return false;
      }
    }

    if (activity.format === 'online') {
      const [minOffset, maxOffset] = filters.timeZoneRange;
      const offsetHours = getTimeZoneOffsetMinutes(activityStart, activity.timeZone) / 60;
      if (offsetHours < minOffset || offsetHours > maxOffset) {
        return false;
      }
    }

    return true;
  });
};
