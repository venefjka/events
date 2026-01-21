export interface User {
    id: string;
    name: string;
    email: string;
    password: string;
    avatar: string;
    age: number;
    rating: number;
    gender: 'male' | 'female' | 'other';
    interests: string[];
    createdEventsCount: number;
    joinedEventsCount: number;
    reviews: Review[];
    qrCode: string;
    attendanceHistory: {
        attended: number;
        missed: number;
        cancelled: number;
    };
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

export interface Activity {
    id: string;
    title: string;
    description: string;
    category: ActivityCategory;
    organizer: User;
    location: Location;
    date: string;
    startTime: string;
    endTime?: string;
    maxParticipants: number;
    currentParticipants: User[];
    pendingRequests: User[];
    attendedUsers: string[];
    level: 'beginner' | 'intermediate' | 'advanced';
    preferences: {
        gender?: 'any' | 'male' | 'female' | 'mixed';
        ageRange?: string;
    };
    repeat?: 'daily' | 'weekly' | 'weekends';
    requiresApproval: boolean;
    photoUrl?: string;
    price: number;
    isFree: boolean;
    ratings: ActivityRating[];
}

export interface Location {
    latitude: number;
    longitude: number;
    address: string;
    name?: string;
}

export interface ActivityCategory {
    id: string;
    name: string;
    icon: string;
    subcategories: SubCategory[];
}

export interface SubCategory {
    id: string;
    name: string;
}

export interface Message {
    id: string;
    chatId: string;
    sender: User;
    text: string;
    timestamp: string;
    read: boolean;
}

export interface Chat {
    id: string;
    type: 'activity' | 'personal';
    activity?: Activity;
    participants: User[];
    lastMessage?: Message;
    unreadCount: number;
}

export interface Notification {
    id: string;
    type: 'request' | 'system' | 'reminder' | 'social' | 'request_approved' | 'request_rejected' | 'rate_request';
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
    categories: string[];
    participantsRange: [number, number];
    onlyAvailable: boolean;
    level: ('beginner' | 'intermediate' | 'advanced')[];
    distance: number;
    gender: 'any' | 'male' | 'female' | 'mixed';
    ageGroups: string[];
    timeSegment: TimeSegment | null;
}

export type TimeSegment = 'morning' | 'afternoon' | 'evening' | 'now' | 'night' | 'tomorrow' | 'weekend';

export interface ActivityRating {
    id: string;
    userId: string;
    activityId: string;
    rating: number;
    comment?: string;
    timestamp: string;
}

export interface Subscription {
    userId: string;
    subscribedAt: string;
    isPinned: boolean;
  }