import React, { useCallback, useMemo, useRef, useState } from 'react';
import { useWindowDimensions } from 'react-native';
import { categories } from '@/constants/categories';
import { parseMaxParticipantsInput } from '@/constants/activityPreferenceOptions';
import { parseDateInput } from '@/utils/date';
import { formatDateInput, formatTimeInput } from '@/utils/formatInput';
import { getUtcOffsetOptions } from '@/utils/timezone';
import { verifyCityByNominatim, type CitySearchResult } from '@/utils/verifyCity';
import { useTheme } from '@/themes/useTheme';
import type { FilterState } from '@/types';
import type { FilterProfileContext, FiltersFormController } from './types';

interface UseFiltersFormControllerParams {
  localFilters: FilterState;
  setLocalFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  profile: FilterProfileContext;
}

export const useFiltersFormController = ({
  localFilters,
  setLocalFilters,
  profile,
}: UseFiltersFormControllerParams): FiltersFormController => {
  const theme = useTheme();
  const { width: windowWidth } = useWindowDimensions();
  const [isCalendarOpen, setIsCalendarOpen] = useState(true);
  const [cityError, setCityError] = useState<string | undefined>(undefined);
  const [citySuggestions, setCitySuggestions] = useState<CitySearchResult[]>([]);
  const [isCityConfirmed, setIsCityConfirmed] = useState(
    Boolean(localFilters.selectedCity || (localFilters.format === 'offline' && profile.profileSelectedCity))
  );
  const citySearchRequestId = useRef(0);

  const timeZoneOptions = useMemo(() => getUtcOffsetOptions(), []);
  const selectedCategoryId = localFilters.categoryId ?? '';
  const selectedCategory = categories.find((cat) => cat.id === selectedCategoryId);
  const subcategories = selectedCategory?.subcategories ?? [];
  const selectedSubcategory = subcategories.find((sub) => sub.id === localFilters.subcategoryId);
  const hasLevel = selectedSubcategory?.hasLevel ?? selectedCategory?.hasLevel ?? true;
  const minCategoryDropdownWidth = Math.max(
    0,
    windowWidth - theme.spacing.screenPaddingHorizontal * 2
  );

  const genderId = localFilters.gender ?? 'any';
  const levelId = localFilters.level ?? 'any';
  const registrationId = localFilters.registrationType ?? 'any';
  const isPriceAny = localFilters.priceTo == null;
  const isMaxParticipantsAny = localFilters.maxParticipants == null;
  const isAgeAny = Boolean(localFilters.ageAny);
  const ageFromValue = localFilters.ageFrom ?? '';
  const ageToValue = localFilters.ageTo ?? '';
  const startDate = useMemo(() => parseDateInput(localFilters.dateFrom ?? ''), [localFilters.dateFrom]);
  const endDate = useMemo(() => parseDateInput(localFilters.dateTo ?? ''), [localFilters.dateTo]);
  const minTimeZoneValue = String(localFilters.timeZoneRange[0]);
  const maxTimeZoneValue = String(localFilters.timeZoneRange[1]);

  const handleStartDateInput = useCallback((text: string) => {
    const nextValue = formatDateInput(text);
    setLocalFilters((prev) => {
      const nextStartDate = parseDateInput(nextValue);
      const currentEndDate = parseDateInput(prev.dateTo ?? '');

      if (nextStartDate && currentEndDate && nextStartDate > currentEndDate) {
        return {
          ...prev,
          dateFrom: nextValue,
          dateTo: nextValue,
        };
      }

      return {
        ...prev,
        dateFrom: nextValue,
      };
    });
  }, [setLocalFilters]);

  const handleEndDateInput = useCallback((text: string) => {
    const nextValue = formatDateInput(text);
    setLocalFilters((prev) => {
      const currentStartDate = parseDateInput(prev.dateFrom ?? '');
      const nextEndDate = parseDateInput(nextValue);

      if (currentStartDate && nextEndDate && nextEndDate < currentStartDate) {
        return {
          ...prev,
          dateFrom: nextValue,
          dateTo: nextValue,
        };
      }

      return {
        ...prev,
        dateTo: nextValue,
      };
    });
  }, [setLocalFilters]);

  const handleStartTimeInput = useCallback((text: string) => {
    setLocalFilters((prev) => ({
      ...prev,
      timeFrom: formatTimeInput(text),
    }));
  }, [setLocalFilters]);

  const handleEndTimeInput = useCallback((text: string) => {
    setLocalFilters((prev) => ({
      ...prev,
      timeTo: formatTimeInput(text),
    }));
  }, [setLocalFilters]);

  const searchCities = useCallback(async (query: string) => {
    const normalizedQuery = query.trim();
    const requestId = ++citySearchRequestId.current;

    if (!normalizedQuery) {
      setCitySuggestions([]);
      setCityError(undefined);
      return;
    }

    if (normalizedQuery.length < 2) {
      setCitySuggestions([]);
      setCityError(undefined);
      return;
    }

    try {
      const places = await verifyCityByNominatim(normalizedQuery);
      if (requestId !== citySearchRequestId.current) {
        return;
      }

      setCitySuggestions(places);
      if (!places.length) {
        setCityError('Не удалось найти населённый пункт, проверьте написание');
        return;
      }

      setCityError(undefined);
    } catch {
      if (requestId !== citySearchRequestId.current) {
        return;
      }

      setCitySuggestions([]);
      setCityError('Ошибка поиска, попробуйте снова');
    }
  }, []);

  const validateCitySelection = useCallback(() => {
    if (localFilters.format !== 'offline') {
      setCityError(undefined);
      return true;
    }

    const cityQuery = (localFilters.cityQuery ?? '').trim();
    if (!cityQuery) {
      setCityError('Укажите город для оффлайн-событий');
      return false;
    }

    if (cityQuery.length < 2) {
      setCityError('Введите город минимум из 2 символов');
      return false;
    }

    if (!isCityConfirmed) {
      setCityError('Выберите город из списка');
      return false;
    }

    setCityError(undefined);
    return true;
  }, [isCityConfirmed, localFilters.cityQuery, localFilters.format]);

  const applyAgeRange = useCallback((fromValue: string, toValue: string) => {
    const from = fromValue.replace(/\D/g, '').slice(0, 3);
    const to = toValue.replace(/\D/g, '').slice(0, 3);
    const hasRange = Boolean(from || to);

    setLocalFilters((prev) => ({
      ...prev,
      ageAny: !hasRange,
      ageFrom: from ? Number(from) : null,
      ageTo: to ? Number(to) : null,
    }));
  }, [setLocalFilters]);

  const handleSelectCity = useCallback((place: CitySearchResult) => {
    setLocalFilters((prev) => ({
      ...prev,
      cityQuery: place.title,
      selectedCity: {
        settlement: place.settlement,
        region: place.region ?? '',
        country: place.country,
        latitude: place.lat,
        longitude: place.lon,
        title: place.title,
      },
    }));
    setIsCityConfirmed(true);
    setCitySuggestions([]);
    setCityError(undefined);
  }, [setLocalFilters]);

  const handleFormatChange = useCallback((format: FilterState['format']) => {
    const nextSelectedCity =
      format === 'online' ? null : (localFilters.selectedCity ?? profile.profileSelectedCity);
    const nextCityQuery =
      format === 'online'
        ? ''
        : (localFilters.cityQuery?.trim() ||
            nextSelectedCity?.title ||
            profile.profileCityTitle ||
            profile.profileCity);

    setLocalFilters((prev) => ({
      ...prev,
      format,
      cityQuery: nextCityQuery,
      selectedCity: nextSelectedCity,
    }));

    if (format === 'online') {
      setCityError(undefined);
      setCitySuggestions([]);
      setIsCityConfirmed(false);
      return;
    }

    setCityError(undefined);
    setIsCityConfirmed(Boolean(nextSelectedCity));
  }, [
    localFilters.cityQuery,
    localFilters.selectedCity,
    profile.profileCity,
    profile.profileCityTitle,
    profile.profileSelectedCity,
    setLocalFilters,
  ]);

  const handleCityQueryChange = useCallback((text: string) => {
    setLocalFilters((prev) => ({
      ...prev,
      cityQuery: text,
      selectedCity: null,
    }));
    setIsCityConfirmed(false);
    setCitySuggestions([]);
    setCityError(undefined);
  }, [setLocalFilters]);

  const handleMinTimeZoneChange = useCallback((value: string) => {
    const offset = Number(value);
    setLocalFilters((prev) => {
      const [, max] = prev.timeZoneRange;
      return {
        ...prev,
        timeZoneRange: [offset, Math.max(offset, max)],
      };
    });
  }, [setLocalFilters]);

  const handleMaxTimeZoneChange = useCallback((value: string) => {
    const offset = Number(value);
    setLocalFilters((prev) => {
      const [min] = prev.timeZoneRange;
      return {
        ...prev,
        timeZoneRange: [Math.min(min, offset), offset],
      };
    });
  }, [setLocalFilters]);

  const handlePriceInput = useCallback((text: string) => {
    const numeric = text.replace(/\D/g, '').slice(0, 6);
    if (!numeric) {
      setLocalFilters((prev) => ({ ...prev, priceTo: null }));
      return;
    }

    setLocalFilters((prev) => ({ ...prev, priceTo: parseInt(numeric, 10) || null }));
  }, [setLocalFilters]);

  const clearPrice = useCallback(() => {
    setLocalFilters((prev) => ({ ...prev, priceTo: null }));
  }, [setLocalFilters]);

  const handleRegistrationTypeChange = useCallback((value: typeof registrationId) => {
    setLocalFilters((prev) => ({ ...prev, registrationType: value }));
  }, [setLocalFilters]);

  const handleMaxParticipantsInput = useCallback((text: string) => {
    const parsed = parseMaxParticipantsInput(text);
    if (!parsed) {
      setLocalFilters((prev) => ({ ...prev, maxParticipants: null }));
      return;
    }

    setLocalFilters((prev) => ({ ...prev, maxParticipants: parsed }));
  }, [setLocalFilters]);

  const clearMaxParticipants = useCallback(() => {
    setLocalFilters((prev) => ({ ...prev, maxParticipants: null }));
  }, [setLocalFilters]);

  const handleOnlyAvailableChange = useCallback((value: boolean) => {
    setLocalFilters((prev) => ({ ...prev, onlyAvailable: value }));
  }, [setLocalFilters]);

  const handleGenderChange = useCallback((value: typeof genderId) => {
    setLocalFilters((prev) => ({ ...prev, gender: value }));
  }, [setLocalFilters]);

  const handleLevelChange = useCallback((value: typeof levelId) => {
    setLocalFilters((prev) => ({ ...prev, level: value }));
  }, [setLocalFilters]);

  const handleCategorySelect = useCallback((categoryId: string) => {
    setLocalFilters((prev) => ({
      ...prev,
      categoryId,
      subcategoryId: '',
    }));
  }, [setLocalFilters]);

  const handleSubcategorySelect = useCallback((subcategoryId: string) => {
    setLocalFilters((prev) => ({
      ...prev,
      subcategoryId,
    }));
  }, [setLocalFilters]);

  const resetUiState = useCallback((confirmed = false) => {
    setCitySuggestions([]);
    setCityError(undefined);
    setIsCityConfirmed(confirmed);
  }, []);

  return {
    localFilters,
    setLocalFilters,
    selectedCategoryId,
    selectedCategory,
    subcategories,
    hasLevel,
    minCategoryDropdownWidth,
    genderId,
    levelId,
    registrationId,
    isPriceAny,
    isMaxParticipantsAny,
    isAgeAny,
    ageFromValue,
    ageToValue,
    startDate,
    endDate,
    timeZoneOptions,
    minTimeZoneValue,
    maxTimeZoneValue,
    isCalendarOpen,
    setIsCalendarOpen,
    cityError,
    citySuggestions,
    isCityConfirmed,
    handleCategorySelect,
    handleSubcategorySelect,
    handleFormatChange,
    handleCityQueryChange,
    handleSelectCity,
    handleMinTimeZoneChange,
    handleMaxTimeZoneChange,
    handleStartDateInput,
    handleEndDateInput,
    handleStartTimeInput,
    handleEndTimeInput,
    handlePriceInput,
    clearPrice,
    handleRegistrationTypeChange,
    handleMaxParticipantsInput,
    clearMaxParticipants,
    handleOnlyAvailableChange,
    handleGenderChange,
    applyAgeRange,
    handleLevelChange,
    searchCities,
    validateCitySelection,
    resetUiState,
  };
};
