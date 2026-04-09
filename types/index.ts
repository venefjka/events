export type Gender = 'male' | 'female' | 'notgiven';
export type SubcategoryId = string;

export interface CityPlace {
    settlement: string;
    region: string;
    country: string;
    latitude: number;
    longitude: number;
    title?: string;
}

export interface UserPublic {
    id: string;
    name: string;
    avatar?: string;
    rating: number;
    age?: number;
    gender?: Gender;
    cityPlace?: CityPlace;
    attendanceHistory?: {
        attended: number;
        missed: number;
    };
    reviews?: Review[];
    interests?: SubcategoryId[];
}

export interface UserPrivacySettings {
    showAvatar: boolean;
    showGender: boolean;
    showCityPlace: boolean;
    showInterests: boolean;
    showBirthDate: boolean;
    showAttendanceHistory: boolean;
    showReviews: boolean;
}

export interface RememberedUser {
    id: string;
    name: string;
    email: string;
    avatar?: string;
    lastLoginAt?: string;
}

export interface UserRecord extends UserPublic {
    avatar?: string;
    email: string;
    password: string;
    birthDate: string;
    rating: number;
    gender: Gender;
    cityPlace: CityPlace;
    interests: SubcategoryId[];
    qrCode: string;
    privacy: UserPrivacySettings;
}

export interface Review {
    id: string;
    fromUserId: string;
    fromUserName: string;
    rating: number;
    text: string;
    date: string;
    activityId: string;
}

export type ActivityFormat = 'online' | 'offline';

export interface ActivityPreferences {
    gender?: 'male' | 'female';
    ageFrom?: number;
    ageTo?: number;
    level?: 'beginner' | 'intermediate' | 'advanced';
    maxParticipants?: number;
}

export interface ActivityRecord {
    id: string;
    title: string;
    description: string;
    categoryId: string;
    subcategoryId?: SubcategoryId;
    organizerId: string;
    format?: 'online' | 'offline';
    location: Location;
    startAt: string;
    endAt: string;
    timeZone: string;
    status: 'active' | 'cancelled';
    preferences?: ActivityPreferences;
    requiresApproval: boolean;
    photoUrls?: string[];
    price: number;
    createdAt?: string;
    updatedAt?: string;
}

export interface ActivityView extends ActivityRecord {
    category: ActivityCategory;
    subcategory?: SubCategory;
    organizer: UserPublic;
    currentParticipants: UserPublic[];
    pendingRequests: UserPublic[];
    attendedUsers: string[];
    ratings?: ActivityRating[];
}

export type Activity = ActivityView;

export interface Location {
    latitude: number;
    longitude: number;
    address: string;
    name?: string;
    settlement?: string;
}

export type CategoryIconName =
    | 'sport'
    | 'creative'
    | 'education'
    | 'games'
    | 'music'
    | 'food'
    | 'nature'
    | 'cinema';

export interface ActivityCategory {
    id: string;
    name: string;
    icon: CategoryIconName;
    subcategories: SubCategory[];
    hasLevel?: boolean;
}

export interface SubCategory {
    id: string;
    name: string;
    hasLevel?: boolean;
}

export interface Notification {
    id: string;
    type:
    | 'request'
    | 'system'
    | 'reminder'
    | 'social'
    | 'request_approved'
    | 'request_rejected'
    | 'rate_request';
    title: string;
    message: string;
    timestamp: string;
    read: boolean;
    activityId?: string;
    userId?: string;
    actionRequired?: boolean;
    requestUserId?: string;
    activityTitle?: string;
}

export interface FilterState {
    categoryId?: string;
    subcategoryId?: string;
    maxParticipants: number | null;
    registrationType: 'any' | 'yes' | 'no';
    onlyAvailable: boolean;
    level: 'any' | 'beginner' | 'intermediate' | 'advanced';
    gender: 'any' | 'male' | 'female';
    format: 'online' | 'offline';
    city: string;
    ageFrom: number | null;
    ageTo: number | null;
    ageAny: boolean;
    timeSegment: TimeSegment | null;
    dateFrom: string;
    dateTo: string;
    timeZoneRange: [number, number];
}

export type TimeSegment = 'morning' | 'afternoon' | 'evening' | 'now' | 'night';

export interface ActivityRating {
    id: string;
    userId: string;
    activityId: string;
    rating: number;
    comment?: string;
    timestamp: string;
}

export type ParticipationStatus = 'pending' | 'accepted' | 'attended' | 'rejected' | 'missed';

export interface ActivityParticipation {
    activityId: string;
    userId: string;
    status: ParticipationStatus;
    createdAt: string;
}

export interface Subscription {
    userId: string;
    subscribedAt: string;
    isPinned: boolean;
}
