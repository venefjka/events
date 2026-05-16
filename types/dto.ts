import {
  ActivityFormat,
  ActivityStatus,
  Gender,
  Id,
  IanaTimeZone,
  IsoDateTimeString,
  NotificationType,
  ParticipationStatus,
  SubcategoryId,
} from './primitives';
import {
  ActivityPolicyFlagsDto,
  ActivityPreferencesDto,
  ActivityRatingsSummary,
  AttendanceHistoryDto,
  CityDto,
  LocationDto,
} from './shared';

export interface ReviewDto {
  id: Id;
  fromUserId: Id;
  fromUserName: string;
  rating: number;
  text: string;
  date: IsoDateTimeString;
  activityId: Id;
}

export interface UserSnippetDto {
  id: Id;
  name: string;
  avatarFileId?: Id | null;
  rating?: number;
  isDeleted?: boolean;
}

export interface UserProfileDto {
  id: Id;
  name: string;
  birthDate?: string | null;
  avatarFileId?: Id | null;
  rating: number;
  age?: number;
  gender: Gender;
  city: CityDto;
  interests: SubcategoryId[];
  attendanceHistory?: AttendanceHistoryDto;
  reviewsPreview?: ReviewDto[];
  showBirthDate: boolean;
  isCurrentUser: boolean;
  isSubscribed: boolean | null;
}

export interface ActivityListItemDto {
  id: Id;
  title: string;
  startAt: IsoDateTimeString;
  endAt: IsoDateTimeString;
  timeZone: IanaTimeZone;
  format: ActivityFormat;
  status: ActivityStatus;
  location: LocationDto;
  categoryId: string;
  subcategoryId: SubcategoryId | null;
  photoFileIds?: Id[];
  coverPhotoFileId?: Id | null;
  organizer: UserSnippetDto | null;
  source: 'User' | 'KudaGo';
  kudagoUrl?: string | null;
  participantsCount: number;
  pendingRequestsCount?: number;
  requiresApproval: boolean;
  preferences?: ActivityPreferencesDto;
  price: number;
}

export interface ActivityParticipantsPreviewDto {
  participantsCount: number;
  participantsPreview: UserSnippetDto[];
}

export interface ActivityDetailDto {
  id: Id;
  title: string;
  description: string;
  startAt: IsoDateTimeString;
  endAt: IsoDateTimeString;
  timeZone: IanaTimeZone;
  format: ActivityFormat;
  status: ActivityStatus;
  location: LocationDto;
  categoryId: string;
  subcategoryId?: SubcategoryId | null;
  photoFileIds: Id[];
  coverPhotoFileId?: Id | null;
  organizer: UserSnippetDto | null;
  source: 'User' | 'KudaGo';
  kudagoUrl?: string | null;
  participantsCount: number;
  participantsPreview: UserSnippetDto[];
  pendingRequestsCount?: number;
  price: number;
  requiresApproval: boolean;
  preferences?: ActivityPreferencesDto;
  isSaved: boolean;
  participationStatus: ParticipationStatus | null;
  isFull: boolean;
  spotsLeft?: number | null;
  policyFlags: ActivityPolicyFlagsDto;
  ratingsSummary?: ActivityRatingsSummary;
}

export interface ActivityParticipantDto {
  user: UserSnippetDto;
  participationStatus: ParticipationStatus;
  joinedAt: IsoDateTimeString;
  isOrganizer: boolean;
}

export interface ActivityJoinRequestDto {
  user: UserSnippetDto;
  requestCreatedAt: IsoDateTimeString;
  participationStatus: 'pending';
}

export interface ActivityRatingDto {
  id: Id;
  user: UserSnippetDto;
  rating: number;
  comment?: string;
  createdAt: IsoDateTimeString;
}

export interface NotificationDto {
  id: Id;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: IsoDateTimeString;
  read: boolean;
  activityId: Id | null;
  actionRequired: boolean;
  requestUserId: Id | null;
  activityTitle: string | null;
}

export interface FileDto {
  id: Id;
  originalName: string;
  mimeType: string;
  size: number;
}

export interface SubscriptionDto {
  userId: Id;
  subscribedAt: IsoDateTimeString;
  isPinned: boolean;
  user: UserSnippetDto;
}

export interface AuthTokensDto {
  accessToken: string;
  refreshToken: string;
  expiresAt: IsoDateTimeString;
}

export interface AuthSessionDto {
  user: UserProfileDto;
  tokens: AuthTokensDto;
}

export interface RememberedUserDto {
  id: Id;
  name: string;
  email: string;
  avatarFileId?: Id | null;
  lastLoginAt?: IsoDateTimeString;
}

export interface IssueQrTokenResponseDto {
  token: string;
  expiresAt: IsoDateTimeString;
}

export interface ScanAttendanceResponseDto {
  user: UserSnippetDto;
  status: 'attended';
}

export type HistoryEventType = 'organized' | 'cancelled' | 'joined' | 'attended' | 'missed' | 'rated';

export interface HistoryEventDto {
  type: HistoryEventType;
  occurredAt: IsoDateTimeString;
  activity: ActivityListItemDto;
  rating?: number | null;
  ratingComment?: string | null;
}
