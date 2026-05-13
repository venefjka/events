import type { ActivityListQuery } from '@/types/queries';
import type { FilterState } from '@/types/state';
import { buildDateTimeWithTimeZone, getDateTimePartsInTimeZone } from '@/utils/date';
import { getDeviceTimeZone, getTimeZoneFromLocation } from '@/utils/timezone';

const toIsoDate = (value: string) => {
  const trimmed = value.trim();
  const match = trimmed.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  if (!match) {
    return trimmed;
  }

  return `${match[3]}-${match[2]}-${match[1]}`;
};

const DEFAULT_TIME_FILTER_DAYS = 31;

const parseDateInputParts = (value?: string) => {
  const match = value?.trim().match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  if (!match) return null;
  return {
    day: Number(match[1]),
    month: Number(match[2]),
    year: Number(match[3]),
  };
};

const formatDateInputParts = (parts: { year: number; month: number; day: number }) =>
  `${String(parts.day).padStart(2, '0')}.${String(parts.month).padStart(2, '0')}.${parts.year}`;

const addDaysToDateInput = (value: string, days: number) => {
  const parts = parseDateInputParts(value);
  if (!parts) return value;
  const date = new Date(Date.UTC(parts.year, parts.month - 1, parts.day + days, 12, 0, 0, 0));
  return formatDateInputParts({
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate(),
  });
};

const getTodayInTimeZone = (timeZone: string) => {
  const parts = getDateTimePartsInTimeZone(new Date(), timeZone);
  if (!parts) return formatDateInputParts({
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    day: new Date().getDate(),
  });
  return formatDateInputParts(parts);
};

const getFilterTimeZone = (filters: FilterState) => {
  if (filters.format === 'offline') {
    return (
      getTimeZoneFromLocation(filters.selectedCity?.latitude, filters.selectedCity?.longitude) ||
      getDeviceTimeZone() ||
      'UTC'
    );
  }

  return getDeviceTimeZone() || 'UTC';
};

const getUtcScheduleParams = (
  filters: FilterState
): Pick<ActivityListQuery, 'dateFrom' | 'dateTo' | 'timeFrom' | 'timeTo'> => {
  const hasDateFilter = Boolean(filters.dateFrom || filters.dateTo);
  const hasTimeFilter = Boolean(filters.timeFrom || filters.timeTo);
  if (!hasDateFilter && !hasTimeFilter) {
    return {};
  }

  const timeZone = getFilterTimeZone(filters);
  const startDate = filters.dateFrom || filters.dateTo || getTodayInTimeZone(timeZone);
  const endDate = filters.dateTo || filters.dateFrom || addDaysToDateInput(startDate, DEFAULT_TIME_FILTER_DAYS);
  const timeFrom = filters.timeFrom || '00:00';
  const timeTo = filters.timeTo || '00:00';

  const firstWindowStart = buildDateTimeWithTimeZone(startDate, timeFrom, timeZone);
  const lastWindowStart = buildDateTimeWithTimeZone(endDate, timeFrom, timeZone);
  const firstWindowEnd = buildDateTimeWithTimeZone(startDate, timeTo, timeZone);

  if (!firstWindowStart || !lastWindowStart || !firstWindowEnd) {
    return {
      dateFrom: filters.dateFrom ? toIsoDate(filters.dateFrom) : undefined,
      dateTo: filters.dateTo ? toIsoDate(filters.dateTo) : undefined,
      timeFrom: filters.timeFrom || undefined,
      timeTo: filters.timeTo || undefined,
    };
  }

  return {
    dateFrom: firstWindowStart.toISOString().slice(0, 10),
    dateTo: lastWindowStart.toISOString().slice(0, 10),
    timeFrom: firstWindowStart.toISOString().slice(11, 16),
    timeTo: firstWindowEnd.toISOString().slice(11, 16),
  };
};

export const toActivityListQuery = (filters: FilterState, limit = 50, searchQuery = ''): ActivityListQuery => {
  const q = searchQuery.trim();
  const scheduleParams = getUtcScheduleParams(filters);
  const query: ActivityListQuery = {
    q: q || undefined,
    limit,
    categoryId: filters.categoryId || undefined,
    subcategoryId: filters.subcategoryId || undefined,
    format: filters.format,
    dateFrom: scheduleParams.dateFrom,
    dateTo: scheduleParams.dateTo,
    timeFrom: scheduleParams.timeFrom,
    timeTo: scheduleParams.timeTo,
    onlyAvailable: filters.onlyAvailable || undefined,
    requiresApproval:
      filters.registrationType === 'request'
        ? true
        : filters.registrationType === 'free'
          ? false
          : undefined,
    level: filters.level === 'any' ? undefined : filters.level,
    gender: filters.gender === 'any' ? undefined : filters.gender,
    ageFrom: filters.ageAny ? undefined : filters.ageFrom ?? undefined,
    ageTo: filters.ageAny ? undefined : filters.ageTo ?? undefined,
    priceTo: filters.priceTo ?? undefined,
    maxParticipants: filters.maxParticipants ?? undefined,
  };

  if (filters.format === 'offline') {
    query.citySettlement = filters.selectedCity?.settlement || undefined;
    query.cityRegion = filters.selectedCity?.region || undefined;
    query.cityCountry = filters.selectedCity?.country || undefined;
  }

  return query;
};
