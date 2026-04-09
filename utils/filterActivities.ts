import { Activity, FilterState, TimeSegment } from '../types';
import { getTimeZoneOffsetMinutes } from '@/utils/date';
import { parseDateInput, toEndOfDay, toStartOfDay } from '@/utils/date';

/**
 * Проверяет, соответствует ли активность временному сегменту
 */
export const matchesTimeSegment = (activity: Activity, segment: TimeSegment): boolean => {
  const activityDate = new Date(activity.startAt);
  const now = new Date();
  const hours = activityDate.getHours();

  switch (segment) {
    case 'morning':
      return hours >= 6 && hours < 12;
    case 'afternoon':
      return hours >= 12 && hours < 17;
    case 'evening':
      return hours >= 17 && hours < 23;
    case 'now': {
      const diffMs = activityDate.getTime() - now.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);
      return diffHours >= 0 && diffHours <= 2;
    }
    case 'night':
      return hours >= 23 || hours < 6;
    default:
      return true;
  }
};

/**
 * Фильтрует активности по заданным фильтрам
 */
export const filterActivities = (
  activities: Activity[],
  filters: FilterState,
  selectedTimeSegment: TimeSegment | null
): Activity[] => {
  return activities.filter((activity) => {
    // Фильтр по категории/подкатегории
    if (filters.categoryId && activity.category.id !== filters.categoryId) {
      return false;
    }
    if (filters.subcategoryId && activity.subcategoryId !== filters.subcategoryId) {
      return false;
    }

    // Фильтр по формату проведения
    if (activity.format !== filters.format) {
      return false;
    }

    // Фильтр по количеству участников
    const currentCount = activity.currentParticipants.length;

    // Фильтрует по максимум участников
    if (filters.maxParticipants != null) {
      const limit = activity.preferences?.maxParticipants ?? 0;
      if (limit <= 0 || limit > filters.maxParticipants) {
        return false;
      }
    }

    // Фильтр по наличию свободных мест
    const maxParticipants = activity.preferences?.maxParticipants ?? 0;
    if (filters.onlyAvailable && maxParticipants > 0 && currentCount >= maxParticipants) {
      return false;
    }

    // Фильтрует по типу регистрации
    if (filters.registrationType !== 'any') {
      const requiresApproval = Boolean(activity.requiresApproval);
      if (filters.registrationType === 'yes' && !requiresApproval) {
        return false;
      }
      if (filters.registrationType === 'no' && requiresApproval) {
        return false;
      }
    }

    // Фильтр по уровню подготовки
    if (filters.level !== 'any') {
      const level = activity.preferences?.level;
      if (level && level !== filters.level) {
        return false;
      }
    }

    // Фильтр по полу
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

    // Фильтр по городу (только оффлайн)
    const cityQuery = filters.city?.trim().toLowerCase();
    if (cityQuery) {
      if (activity.format !== 'offline') {
        return false;
      }
      const city = (activity.location.settlement || activity.location.address || '').toLowerCase();
      if (!city.includes(cityQuery)) {
        return false;
      }
    }

    // Фильтр по временному сегменту
    const timeSegmentToUse = filters.timeSegment ?? selectedTimeSegment;
    if (timeSegmentToUse && !matchesTimeSegment(activity, timeSegmentToUse)) {
      return false;
    }

    // Фильтр по выбранной дате/периоду
    const startDate = parseDateInput(filters.dateFrom ?? '');
    const endDate = parseDateInput(filters.dateTo ?? '');
    if (startDate || endDate) {
      const activityDate = new Date(activity.startAt);
      if (startDate && activityDate < toStartOfDay(startDate)) {
        return false;
      }
      if (endDate && activityDate > toEndOfDay(endDate)) {
        return false;
      }
    }

    // Фильтр по часовому поясу для онлайн-событий
    if (activity.format === 'online') {
      const [minOffset, maxOffset] = filters.timeZoneRange;
      const offsetHours =
        getTimeZoneOffsetMinutes(new Date(activity.startAt), activity.timeZone) / 60;
      if (offsetHours < minOffset || offsetHours > maxOffset) {
        return false;
      }
    }

    return true;
  });
};
