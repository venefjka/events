import type { UserRecord, FilterState } from '@/types';
import type { FilterProfileContext, FilterSectionKey } from './types';
import { categories } from '@/constants/categories';

export const DEFAULT_TIMEZONE_RANGE: [number, number] = [-12, 14];

export const createDefaultFilters = (
  profile?: Pick<FilterProfileContext, 'profileCity' | 'profileCityTitle' | 'profileSelectedCity'>
): FilterState => ({
  categoryId: '',
  subcategoryId: '',
  priceTo: null,
  cityQuery: profile?.profileCityTitle || profile?.profileCity || '',
  selectedCity: profile?.profileSelectedCity ?? null,
  maxParticipants: null,
  registrationType: 'any',
  onlyAvailable: false,
  level: 'any',
  gender: 'any',
  format: 'offline',
  ageFrom: null,
  ageTo: null,
  ageAny: true,
  dateFrom: '',
  dateTo: '',
  timeFrom: '',
  timeTo: '',
  timeZoneRange: [...DEFAULT_TIMEZONE_RANGE],
});

export const getFilterProfileContext = (currentUser?: UserRecord | null): FilterProfileContext => {
  const profileCity = currentUser?.cityPlace?.settlement?.trim() ?? '';
  const profileCityTitle = [
    currentUser?.cityPlace?.settlement,
    currentUser?.cityPlace?.region,
    currentUser?.cityPlace?.country,
  ]
    .filter(Boolean)
    .join(', ');

  return {
    profileCity,
    profileCityTitle,
    profileSelectedCity: currentUser?.cityPlace
      ? {
          ...currentUser.cityPlace,
          title: currentUser.cityPlace.title ?? profileCityTitle,
        }
      : null,
  };
};

export const createFilterDraft = (
  filters: FilterState,
  profile: FilterProfileContext
): FilterState => ({
  ...filters,
  cityQuery:
    filters.format === 'offline' && !filters.selectedCity && !filters.cityQuery?.trim()
      ? profile.profileCityTitle || profile.profileCity
      : filters.cityQuery,
  selectedCity:
    filters.format === 'offline' && !filters.selectedCity
      ? profile.profileSelectedCity
      : filters.selectedCity,
});

export const getFilterSectionTitle = (key: FilterSectionKey): string => {
  switch (key) {
    case 'category':
      return 'Категория';
    case 'format':
      return 'Формат';
    case 'schedule':
      return 'Дата и время';
    case 'participation':
      return 'Условия участия';
    case 'preferences':
      return 'Предпочтения';
    default:
      return 'Фильтр';
  }
};

const shortenDate = (value?: string) => {
  if (!value) return '';
  const [day, month] = value.split('.');
  return day && month ? `${day}.${month}` : value;
};

const shortCity = (filters: FilterState) => {
  const city = filters.selectedCity?.settlement || filters.cityQuery || '';
  return city.split(',')[0].trim();
};

const shortenText = (value: string, maxLength = 18) =>
  value.length > maxLength ? `${value.slice(0, maxLength - 1)}…` : value;

export const getCategoryFilterSummary = (filters: FilterState) => {
  const category = categories.find((item) => item.id === filters.categoryId);
  const subcategory = category?.subcategories.find((item) => item.id === filters.subcategoryId);

  if (subcategory?.name) return shortenText(subcategory.name);
  if (category?.name) return shortenText(category.name);
  return 'Все';
};

export const getFormatFilterSummary = (filters: FilterState) => {
  if (filters.format === 'online') {
    const [minOffset, maxOffset] = filters.timeZoneRange;
    if (
      minOffset === DEFAULT_TIMEZONE_RANGE[0] &&
      maxOffset === DEFAULT_TIMEZONE_RANGE[1]
    ) {
      return 'Онлайн';
    }
    return `Онлайн · UTC${minOffset}…${maxOffset}`;
  }

  const city = shortCity(filters);
  return city ? `Оффлайн · ${shortenText(city)}` : 'Оффлайн';
};

export const getScheduleFilterSummary = (filters: FilterState) => {
  const dateFrom = shortenDate(filters.dateFrom);
  const dateTo = shortenDate(filters.dateTo);
  const hasDates = Boolean(dateFrom || dateTo);
  const hasTimes = Boolean(filters.timeFrom || filters.timeTo);

  if (!hasDates && !hasTimes) return 'Любое';

  const parts: string[] = [];

  if (hasDates) {
    if (dateFrom && dateTo && dateFrom !== dateTo) {
      parts.push(`${dateFrom}–${dateTo}`);
    } else {
      parts.push(dateFrom || dateTo);
    }
  }

  if (hasTimes) {
    if (filters.timeFrom && filters.timeTo) {
      parts.push(`${filters.timeFrom}–${filters.timeTo}`);
    } else {
      parts.push(filters.timeFrom || filters.timeTo);
    }
  }

  return parts.join(' · ');
};

export const getParticipationFilterSummary = (filters: FilterState) => {
  const parts: string[] = [];

  if (filters.priceTo != null) {
    parts.push(`до ${filters.priceTo} ₽`);
  }
  if (filters.registrationType === 'yes') {
    parts.push('по заявке');
  }
  if (filters.registrationType === 'no') {
    parts.push('свободно');
  }
  if (filters.maxParticipants != null) {
    parts.push(`до ${filters.maxParticipants}`);
  }
  if (filters.onlyAvailable) {
    parts.push('есть места');
  }

  return parts.length ? parts.slice(0, 2).join(' · ') : 'Любые';
};

export const getPreferencesFilterSummary = (filters: FilterState) => {
  const parts: string[] = [];

  if (filters.gender === 'male') parts.push('муж.');
  if (filters.gender === 'female') parts.push('жен.');

  if (!filters.ageAny && (filters.ageFrom != null || filters.ageTo != null)) {
    if (filters.ageFrom != null && filters.ageTo != null) {
      parts.push(`${filters.ageFrom}–${filters.ageTo}`);
    } else {
      parts.push(`${filters.ageFrom ?? filters.ageTo}+`);
    }
  }

  if (filters.level === 'beginner') parts.push('новички');
  if (filters.level === 'intermediate') parts.push('любители');
  if (filters.level === 'advanced') parts.push('профи');

  return parts.length ? parts.slice(0, 2).join(' · ') : 'Любые';
};

export const isFilterSectionActive = (filters: FilterState, key: FilterSectionKey) => {
  switch (key) {
    case 'category':
      return Boolean(filters.categoryId || filters.subcategoryId);
    case 'format':
      return (
        filters.format === 'online' ||
        Boolean(filters.cityQuery?.trim()) ||
        filters.timeZoneRange[0] !== DEFAULT_TIMEZONE_RANGE[0] ||
        filters.timeZoneRange[1] !== DEFAULT_TIMEZONE_RANGE[1]
      );
    case 'schedule':
      return Boolean(filters.dateFrom || filters.dateTo || filters.timeFrom || filters.timeTo);
    case 'participation':
      return Boolean(
        filters.priceTo != null ||
          filters.registrationType !== 'any' ||
          filters.maxParticipants != null ||
          filters.onlyAvailable
      );
    case 'preferences':
      return Boolean(
        filters.gender !== 'any' ||
          filters.level !== 'any' ||
          !filters.ageAny ||
          filters.ageFrom != null ||
          filters.ageTo != null
      );
    default:
      return false;
  }
};

export const applySectionDefaults = (
  section: FilterSectionKey | null,
  target: FilterState,
  defaults: FilterState
): FilterState => {
  if (!section) {
      return target;
  }

  switch (section) {
      case 'category':
          return {
              ...target,
              categoryId: defaults.categoryId,
              subcategoryId: defaults.subcategoryId,
          };
      case 'format':
          return {
              ...target,
              format: defaults.format,
              cityQuery: defaults.cityQuery,
              selectedCity: defaults.selectedCity,
              timeZoneRange: defaults.timeZoneRange,
          };
      case 'schedule':
          return {
              ...target,
              dateFrom: defaults.dateFrom,
              dateTo: defaults.dateTo,
              timeFrom: defaults.timeFrom,
              timeTo: defaults.timeTo,
          };
      case 'participation':
          return {
              ...target,
              priceTo: defaults.priceTo,
              registrationType: defaults.registrationType,
              maxParticipants: defaults.maxParticipants,
              onlyAvailable: defaults.onlyAvailable,
          };
      case 'preferences':
          return {
              ...target,
              gender: defaults.gender,
              level: defaults.level,
              ageAny: defaults.ageAny,
              ageFrom: defaults.ageFrom,
              ageTo: defaults.ageTo,
          };
      default:
          return target;
  }
};