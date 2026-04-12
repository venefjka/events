import {
  ActivityFormat,
  ActivityStatus,
  Gender,
  Id,
  IanaTimeZone,
  IsoDateString,
  IsoDateTimeString,
  SubcategoryId,
} from './primitives';
import { ActivityPreferencesDto, CityDto, LocationDto, UserPrivacySettings } from './shared';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  birthDate: IsoDateString;
  gender: Gender;
  city: CityDto;
  interests: SubcategoryId[];
  privacy?: Partial<UserPrivacySettings>;
}

export interface UpdateMeRequest {
  name?: string;
  avatarFileId?: Id | null;
  birthDate?: IsoDateString;
  gender?: Gender;
  city?: CityDto;
  interests?: SubcategoryId[];
}

export interface UpdatePrivacyRequest {
  showAvatar?: boolean;
  showGender?: boolean;
  showCity?: boolean;
  showInterests?: boolean;
  showBirthDate?: boolean;
  showAttendanceHistory?: boolean;
  showReviews?: boolean;
}

export interface CreateActivityRequest {
  title: string;
  description: string;
  categoryId: string;
  subcategoryId?: string;
  format: ActivityFormat;
  location: LocationDto;
  startAt: IsoDateTimeString;
  endAt: IsoDateTimeString;
  timeZone: IanaTimeZone;
  preferences?: ActivityPreferencesDto;
  requiresApproval: boolean;
  photoFileIds?: Id[];
  price: number;
}

export interface CreateActivitiesBatchRequest {
  activities: CreateActivityRequest[];
}

export interface UpdateActivityRequest {
  title?: string;
  description?: string;
  format?: ActivityFormat;
  location?: LocationDto;
  startAt?: IsoDateTimeString;
  endAt?: IsoDateTimeString;
  timeZone?: IanaTimeZone;
  preferences?: ActivityPreferencesDto;
  requiresApproval?: boolean;
  photoFileIds?: Id[];
  price?: number;
  status?: ActivityStatus;
}

export interface RequestJoinActivityRequest {
  activityId: Id;
}

export interface ApproveJoinRequestRequest {
  activityId: Id;
  userId: Id;
}

export interface RejectJoinRequestRequest {
  activityId: Id;
  userId: Id;
}

export interface MarkAttendanceRequest {
  activityId: Id;
  userId: Id;
}

export interface CreateActivityRatingRequest {
  activityId: Id;
  rating: number;
  comment?: string;
}

export interface UpdateNotificationRequest {
  read?: boolean;
}

export interface ReadAllNotificationsRequest {
  userId?: Id;
}

export interface CreateSubscriptionRequest {
  userId: Id;
}

export interface UpdateSubscriptionRequest {
  isPinned?: boolean;
}

export interface ScanAttendanceRequest {
  token: string;
}

export interface UploadFileRequest {
  name: string;
  mimeType: string;
  uri: string;
}
