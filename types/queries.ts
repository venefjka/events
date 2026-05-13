import { ActivityFormat, ActivityLevel, IsoDateString, NotificationType } from './primitives';

export interface ActivityListQuery {
  q?: string;
  limit?: number;
  cursor?: string;
  sort?: 'start_at' | 'created_at' | 'price';
  order?: 'asc' | 'desc';
  categoryId?: string;
  subcategoryId?: string;
  format?: ActivityFormat;
  citySettlement?: string;
  cityRegion?: string;
  cityCountry?: string;
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
}

export interface RecommendedActivitiesQuery extends ActivityListQuery { }

export interface MyActivitiesQuery extends ActivityListQuery {
  tab: 'created' | 'future_created' | 'upcoming' | 'attended' | 'organizer' | 'participant' | 'ratings' | 'all';
}

export interface UserHistoryQuery {
  tab: 'organizer' | 'participant' | 'ratings' | 'all';
  limit?: number;
  cursor?: string;
}

export interface ActivityParticipantsQuery {
  limit?: number;
  cursor?: string;
}

export interface ActivityJoinRequestsQuery {
  limit?: number;
  cursor?: string;
}

export interface ActivityRatingsListQuery {
  limit?: number;
  cursor?: string;
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
  sort?: 'subscribed_at' | 'name';
}
