import { ActivityFormat, ActivityLevel, IsoDateString, NotificationType } from './primitives';
import { CityDto } from './shared';

export interface ActivityListQuery {
  limit?: number;
  cursor?: string;
  sort?: 'startAt' | 'createdAt' | 'price';
  order?: 'asc' | 'desc';
  categoryId?: string;
  subcategoryId?: string;
  format?: ActivityFormat;
  city?: CityDto;
  dateFrom?: IsoDateString;
  dateTo?: IsoDateString;
  timeFrom?: string;
  timeTo?: string;
  onlyAvailable?: boolean;
  requiresApproval?: boolean;
  level?: ActivityLevel;
  gender?: 'male' | 'female';
  ageFrom?: number;
  ageTo?: number;
  priceTo?: number;
  maxParticipants?: number;
  timeZoneOffsetFrom?: number;
  timeZoneOffsetTo?: number;
}

export interface RecommendedActivitiesQuery {
  limit?: number;
  cursor?: string;
  city?: CityDto;
  dateFrom?: IsoDateString;
  dateTo?: IsoDateString;
  timeFrom?: string;
  timeTo?: string;
}

export interface UserHistoryQuery {
  tab: 'created' | 'attended' | 'upcoming';
  limit?: number;
  cursor?: string;
  sort?: 'startAt' | 'createdAt';
}

export interface NotificationsQuery {
  limit?: number;
  cursor?: string;
  unreadOnly?: boolean;
  type?: NotificationType;
}

export interface SubscriptionsQuery {
  limit?: number;
  cursor?: string;
  pinnedOnly?: boolean;
  sort?: 'subscribedAt' | 'name';
}
