import { ActivityFormat, ActivityLevel } from './primitives';
import { CityDto } from './shared';

export type ActivityRegistrationFilter = 'any' | 'yes' | 'no';

export interface FilterState {
  categoryId?: string;
  subcategoryId?: string;
  priceTo: number | null;
  cityQuery: string;
  selectedCity: CityDto | null;
  maxParticipants: number | null;
  registrationType: ActivityRegistrationFilter;
  onlyAvailable: boolean;
  level: 'any' | ActivityLevel;
  gender: 'any' | 'male' | 'female';
  format: ActivityFormat;
  ageFrom: number | null;
  ageTo: number | null;
  ageAny: boolean;
  dateFrom: string;
  dateTo: string;
  timeFrom: string;
  timeTo: string;
  timeZoneRange: [number, number];
}
