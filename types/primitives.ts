export type Id = string;
export type IsoDateTimeString = string;
export type IsoDateString = string;
export type IanaTimeZone = string;

export type Gender = 'male' | 'female' | 'notgiven';
export type SubcategoryId = string;
export type ActivityFormat = 'online' | 'offline';
export type ActivityStatus = 'active' | 'cancelled';
export type ActivityLevel = 'beginner' | 'intermediate' | 'advanced';
export type ParticipationStatus = 'pending' | 'accepted' | 'attended' | 'rejected' | 'missed';

export type NotificationType =
  | 'request'
  | 'system'
  | 'reminder'
  | 'social'
  | 'request_approved'
  | 'request_rejected'
  | 'rate_request';
