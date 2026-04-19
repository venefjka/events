import {
  ActivityFormat,
  ActivityStatus,
  Gender,
  Id,
  IanaTimeZone,
  IsoDateString,
  IsoDateTimeString,
  NotificationType,
  ParticipationStatus,
  SubcategoryId,
} from './primitives';
import { ActivityPreferencesDto, CityDto, LocationDto, UserPrivacySettings } from './shared';

export interface UserEntity {
  id: Id;
  email: string;
  passwordHash: string;
  name: string;
  avatarFileId?: Id | null;
  birthDate: IsoDateString;
  gender: Gender;
  city: CityDto;
  interests: SubcategoryId[];
  privacy: UserPrivacySettings;
  createdAt: IsoDateTimeString;
  updatedAt: IsoDateTimeString;
  deletedAt?: IsoDateTimeString | null;
}

export interface ActivityEntity {
  id: Id;
  organizerId: Id;
  title: string;
  description: string;
  categoryId: string;
  subcategoryId?: SubcategoryId | null;
  format: ActivityFormat;
  location: LocationDto;
  startAt: IsoDateTimeString;
  endAt: IsoDateTimeString;
  timeZone: IanaTimeZone;
  status: ActivityStatus;
  preferences?: ActivityPreferencesDto;
  requiresApproval: boolean;
  photoFileIds: Id[];
  price: number;
  createdAt: IsoDateTimeString;
  updatedAt: IsoDateTimeString;
  cancelledAt?: IsoDateTimeString | null;
}

export interface ParticipationEntity {
  id: Id;
  activityId: Id;
  userId: Id;
  status: ParticipationStatus;
  createdAt: IsoDateTimeString;
  updatedAt: IsoDateTimeString;
  attendanceMarkedAt?: IsoDateTimeString | null;
}

export interface ActivityRatingEntity {
  id: Id;
  activityId: Id;
  userId: Id;
  rating: number;
  comment?: string;
  createdAt: IsoDateTimeString;
  updatedAt: IsoDateTimeString;
}

export interface NotificationEntity {
  id: Id;
  userId: Id;
  type: NotificationType;
  title: string;
  message: string;
  payload?: Record<string, unknown>;
  readAt?: IsoDateTimeString | null;
  createdAt: IsoDateTimeString;
}

export interface SubscriptionEntity {
  followerUserId: Id;
  targetUserId: Id;
  isPinned: boolean;
  createdAt: IsoDateTimeString;
  updatedAt: IsoDateTimeString;
}

export interface QrTokenEntity {
  id: Id;
  token: string;
  userId: Id;
  expiresAt: IsoDateTimeString;
  usedAt?: IsoDateTimeString | null;
  createdAt: IsoDateTimeString;
}

export interface SessionEntity {
  id: Id;
  userId: Id;
  refreshTokenHash: string;
  deviceId?: string | null;
  expiresAt: IsoDateTimeString;
  createdAt: IsoDateTimeString;
  revokedAt?: IsoDateTimeString | null;
}

export interface FileEntity {
  id: Id;
  storageKey: string;
  originalName: string;
  mimeType: string;
  size: number;
  createdAt: IsoDateTimeString;
}

export interface UserActivityFeedEventEntity {
  id: Id;
  userId: Id;
  activityId: Id;
  type:
    | 'created'
    | 'attended'
    | 'rated'
    | 'cancelled'
    | 'leaved'
    | 'joined'
    | 'missed';
  occurredAt: IsoDateTimeString;
  actorUserId?: Id | null;
  metadata?: Record<string, unknown>;
  createdAt: IsoDateTimeString;
}
