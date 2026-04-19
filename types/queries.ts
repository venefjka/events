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

export interface MyActivitiesQuery extends ActivityListQuery {
  tab: 'upcoming' | 'attended' | 'created';
}

export interface UserHistoryQuery {
  tab: 'created' | 'attended' | 'upcoming';
  limit?: number;
  cursor?: string;
  sort?: 'startAt' | 'createdAt';
}

export interface JoinParticipationQuery {   // todo лишний?
  activityIds?: string[];
  userId?: string;
  statuses?: Array<'pending' | 'accepted' | 'attended' | 'rejected' | 'missed'>;
}

export interface ActivityParticipantsQuery {
  limit?: number;
  cursor?: string;
  status?: 'pending' | 'accepted' | 'attended' | 'rejected' | 'missed';
}

export interface ActivityJoinRequestsQuery {
  limit?: number;
  cursor?: string;
}

export interface ActivityRatingsQuery {   // todo лишний?
  activityIds?: string[];
}

export interface ActivityRatingsListQuery {
  limit?: number;
  cursor?: string;
  sort?: 'createdAt' | 'rating';
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

export type UserActivityFeedCategoryQuery = 'all' | 'organizer' | 'participant' | 'ratings';

export interface UserActivityFeedQuery {
  limit?: number;
  cursor?: string;
  category?: Exclude<UserActivityFeedCategoryQuery, 'all'>;
  includeHiddenParticipation?: boolean;
}
