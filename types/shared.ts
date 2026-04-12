import { ActivityLevel } from './primitives';

export interface CityDto {
  settlement: string;
  region: string;
  country: string;
  latitude: number;
  longitude: number;
  title?: string;
}

export interface LocationDto {
  latitude: number;
  longitude: number;
  address: string;
  name?: string;
  settlement?: string;
  region?: string;
  country?: string;
}

export interface ActivityPreferencesDto {
  gender?: 'male' | 'female';
  ageFrom?: number;
  ageTo?: number;
  level?: ActivityLevel;
  maxParticipants?: number;
}

export interface AttendanceHistoryDto {
  attended: number;
  missed: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface UserPrivacySettings {
  showAvatar: boolean;
  showGender: boolean;
  showCity: boolean;
  showInterests: boolean;
  showBirthDate: boolean;
  showAttendanceHistory: boolean;
  showReviews: boolean;
}

export interface UserRatingAggregate {
  rating: number;
  ratingsCount: number;
}

export interface ActivityRatingsSummary {
  averageRating: number;
  ratingsCount: number;
}

export interface AttendanceHistoryAggregate {
  attended: number;
  missed: number;
}

export interface ActivityCounters {
  participantsCount: number;
  pendingRequestsCount: number;
  attendedCount: number;
}

export interface ActivityPolicyFlagsDto {
  canJoin: boolean;
  canLeave: boolean;
  canCancelRequest: boolean;
  canManageRequests: boolean;
  canRate: boolean;
  canEdit: boolean;
  canCancelActivity: boolean;
}

export interface CategoryIconNameMap {
  sport: 'sport';
  creative: 'creative';
  education: 'education';
  games: 'games';
  music: 'music';
  food: 'food';
  nature: 'nature';
  cinema: 'cinema';
}

export type CategoryIconName = keyof CategoryIconNameMap;

export interface SubCategory {
  id: string;
  name: string;
  hasLevel?: boolean;
}

export interface ActivityCategory {
  id: string;
  name: string;
  icon: CategoryIconName;
  subcategories: SubCategory[];
  hasLevel?: boolean;
}
