import { ActivityFormat } from './primitives';
import { CityDto } from './shared';
import type {
  ApprovalFilterOption,
  GenderOption,
  LevelOption,
  SourceFilterOption,
} from '@/constants/activityPreferenceOptions';

export interface FilterState {
  categoryId?: string;
  subcategoryId?: string;
  priceTo: number | null;
  cityQuery: string;
  selectedCity: CityDto | null;
  maxParticipants: number | null;
  registrationType: ApprovalFilterOption;
  onlyAvailable: boolean;
  level: LevelOption;
  gender: GenderOption;
  format: ActivityFormat;
  ageFrom: number | null;
  ageTo: number | null;
  ageAny: boolean;
  dateFrom: string;
  dateTo: string;
  timeFrom: string;
  timeTo: string;
  sourceFilter: SourceFilterOption;
}

export interface UserHistoryState {
  activeCategory: 'all' | 'organizer' | 'participant' | 'ratings';
}
