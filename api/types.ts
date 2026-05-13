import type {
  ActivityJoinRequestsQuery,
  ActivityParticipantsQuery,
  ActivityRatingsListQuery,
  ActivityListQuery,
  MyActivitiesQuery,
  NotificationsQuery,
  RecommendedActivitiesQuery,
  SubscriptionsQuery,
  UserHistoryQuery,
} from '@/types/queries';
import type {
  ApproveJoinRequestRequest,
  CreateActivitiesBatchRequest,
  CreateActivityRatingRequest,
  CreateActivityRequest,
  CreateSubscriptionRequest,
  LoginRequest,
  RegisterRequest,
  ScanAttendanceRequest,
  UpdateActivityRequest,
  UpdateMeRequest,
  UpdateNotificationRequest,
  UpdateSubscriptionRequest,
  UploadFileRequest,
} from '@/types/requests';

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
  ActivityListQuery,
  MyActivitiesQuery,
  NotificationsQuery,
  RecommendedActivitiesQuery,
  SubscriptionsQuery,
  UserHistoryQuery,
  ApproveJoinRequestRequest,
  CreateActivitiesBatchRequest,
  CreateActivityRatingRequest,
  CreateActivityRequest,
  CreateSubscriptionRequest,
  LoginRequest,
  RegisterRequest,
  ScanAttendanceRequest,
  UpdateActivityRequest,
  UpdateMeRequest,
  UpdateNotificationRequest,
  UpdateSubscriptionRequest,
  UploadFileRequest,
};
