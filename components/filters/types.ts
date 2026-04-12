import type React from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { ActivityCategory, FilterState, SubCategory } from '@/types';
import type {
  ApprovalFilterOption,
  GenderOption,
  LevelOption,
} from '@/constants/activityPreferenceOptions';
import type { CitySearchResult } from '@/utils/verifyCity';

export type FilterSectionKey =
  | 'category'
  | 'format'
  | 'schedule'
  | 'participation'
  | 'preferences';

export interface FilterProfileContext {
  profileCity: string;
  profileCityTitle: string;
  profileSelectedCity: FilterState['selectedCity'];
}

export interface FiltersFormController {
  localFilters: FilterState;
  setLocalFilters: Dispatch<SetStateAction<FilterState>>;
  selectedCategoryId: string;
  selectedCategory?: ActivityCategory;
  subcategories: SubCategory[];
  hasLevel: boolean;
  minCategoryDropdownWidth: number;
  genderId: GenderOption;
  levelId: LevelOption;
  registrationId: ApprovalFilterOption;
  isPriceAny: boolean;
  isMaxParticipantsAny: boolean;
  isAgeAny: boolean;
  ageFromValue: number | '';
  ageToValue: number | '';
  startDate?: Date;
  endDate?: Date;
  timeZoneOptions: Array<{ offsetHours: number; label: string }>;
  minTimeZoneValue: string;
  maxTimeZoneValue: string;
  isCalendarOpen: boolean;
  setIsCalendarOpen: React.Dispatch<React.SetStateAction<boolean>>;
  cityError?: string;
  citySuggestions: CitySearchResult[];
  isCityConfirmed: boolean;
  handleCategorySelect: (categoryId: string) => void;
  handleSubcategorySelect: (subcategoryId: string) => void;
  handleFormatChange: (format: FilterState['format']) => void;
  handleCityQueryChange: (text: string) => void;
  handleSelectCity: (place: CitySearchResult) => void;
  handleMinTimeZoneChange: (value: string) => void;
  handleMaxTimeZoneChange: (value: string) => void;
  handleStartDateInput: (text: string) => void;
  handleEndDateInput: (text: string) => void;
  handleStartTimeInput: (text: string) => void;
  handleEndTimeInput: (text: string) => void;
  handlePriceInput: (text: string) => void;
  clearPrice: () => void;
  handleRegistrationTypeChange: (value: ApprovalFilterOption) => void;
  handleMaxParticipantsInput: (text: string) => void;
  clearMaxParticipants: () => void;
  handleOnlyAvailableChange: (value: boolean) => void;
  handleGenderChange: (value: GenderOption) => void;
  applyAgeRange: (fromValue: string, toValue: string) => void;
  handleLevelChange: (value: LevelOption) => void;
  searchCities: (query: string) => Promise<void>;
  validateCitySelection: () => boolean;
  resetUiState: (isCityConfirmed?: boolean) => void;
}

export interface FilterSectionProps {
  controller: FiltersFormController;
}
