import type {
  ActivityJoinRequestsQuery,
  ActivityParticipantsQuery,
  ActivityRatingsListQuery,
  ActivityRatingsQuery,
  ActivityListQuery,
  JoinParticipationQuery,
  MyActivitiesQuery,
  NotificationsQuery,
  RecommendedActivitiesQuery,
  SubscriptionsQuery,
  UserActivityFeedQuery,
  UserHistoryQuery,
} from '@/types/queries';
import type {
  ApproveJoinRequestRequest,
  CreateActivitiesBatchRequest,
  CreateActivityRatingRequest,
  CreateActivityRequest,
  CreateSubscriptionRequest,
  CreateUserActivityFeedEventRequest,
  LoginRequest,
  MarkAttendanceRequest,
  RegisterRequest,
  ScanAttendanceRequest,
  UpdateActivityRequest,
  UpdateMeRequest,
  UpdateNotificationRequest,
  UpdatePrivacyRequest,
  UpdateSubscriptionRequest,
  UploadFileRequest,
} from '@/types/requests';
import type { ResolveQrTokenRequestDto } from '@/types/dto';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface ApiRequestOptions {
  method: HttpMethod;
  headers?: Record<string, string>;
  body?: unknown;
  signal?: AbortSignal;
}

export interface RequestConfig {
  authToken?: string;
  signal?: AbortSignal;
}

export type {
  ActivityJoinRequestsQuery,
  ActivityParticipantsQuery,
  ActivityRatingsListQuery,
  ActivityRatingsQuery,
  ActivityListQuery,
  JoinParticipationQuery,
  MyActivitiesQuery,
  NotificationsQuery,
  RecommendedActivitiesQuery,
  SubscriptionsQuery,
  UserActivityFeedQuery,
  UserHistoryQuery,
  ApproveJoinRequestRequest,
  CreateActivitiesBatchRequest,
  CreateActivityRatingRequest,
  CreateActivityRequest,
  CreateSubscriptionRequest,
  CreateUserActivityFeedEventRequest,
  LoginRequest,
  MarkAttendanceRequest,
  RegisterRequest,
  ResolveQrTokenRequestDto,
  ScanAttendanceRequest,
  UpdateActivityRequest,
  UpdateMeRequest,
  UpdateNotificationRequest,
  UpdatePrivacyRequest,
  UpdateSubscriptionRequest,
  UploadFileRequest,
};
