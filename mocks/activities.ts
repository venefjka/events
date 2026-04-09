import { Image } from 'react-native';
import { ActivityRecord, UserRecord } from '../types';
import { defaultUserPrivacySettings } from '../utils/user';

const baseCity = {
  settlement: 'Москва',
  region: 'Москва',
  country: 'Россия',
  latitude: 55.751244,
  longitude: 37.618423,
};

export const mockUser: UserRecord = {
  id: 'u-1',
  name: 'Александр',
  email: 'aleksandr@example.com',
  password: 'password123',
  avatar: 'https://i.pravatar.cc/150?img=12',
  birthDate: '1992-05-12',
  cityPlace: baseCity,
  rating: 4.8,
  gender: 'male',
  interests: ['running', 'photography', 'board-games'],
  qrCode: 'user-1-qr',
  attendanceHistory: {
    attended: 30,
    missed: 2,
  },
  reviews: [],
  privacy: defaultUserPrivacySettings(),
};

const userMaria: UserRecord = {
  id: 'u-2',
  name: 'Мария',
  email: 'maria@example.com',
  password: 'password123',
  avatar: 'https://i.pravatar.cc/150?img=32',
  birthDate: '1995-03-18',
  cityPlace: baseCity,
  rating: 4.7,
  gender: 'female',
  interests: ['yoga', 'hiking'],
  qrCode: 'user-2-qr',
  attendanceHistory: { attended: 12, missed: 1 },
  reviews: [],
  privacy: defaultUserPrivacySettings(),
};

const userIvan: UserRecord = {
  id: 'u-3',
  name: 'Иван',
  email: 'ivan@example.com',
  password: 'password123',
  avatar: 'https://i.pravatar.cc/150?img=15',
  birthDate: '1990-11-01',
  cityPlace: baseCity,
  rating: 4.3,
  gender: 'male',
  interests: ['video-games', 'movies'],
  qrCode: 'user-3-qr',
  attendanceHistory: { attended: 20, missed: 4 },
  reviews: [],
  privacy: defaultUserPrivacySettings(),
};

const userElena: UserRecord = {
  id: 'u-4',
  name: 'Елена',
  email: 'elena@example.com',
  password: 'password123',
  avatar: 'https://i.pravatar.cc/150?img=20',
  birthDate: '1998-07-11',
  cityPlace: baseCity,
  rating: 4.9,
  gender: 'female',
  interests: ['painting', 'photography'],
  qrCode: 'user-4-qr',
  attendanceHistory: { attended: 5, missed: 0 },
  reviews: [],
  privacy: defaultUserPrivacySettings(),
};

export const mockUsers: UserRecord[] = [mockUser, userMaria, userIvan, userElena];

const buildFixedTimes = (startIso: string, endIso: string) => {
  const start = new Date(startIso);
  const end = new Date(endIso);
  return { start, end };
};

const localPhotoUri = (moduleId: number) => Image.resolveAssetSource(moduleId).uri;

const mirelePhoto = localPhotoUri(require('./mirele.jpg'));
const mafiaPhoto = localPhotoUri(require('./mafia.webp'));
const photoshootPhoto = localPhotoUri(require('./photoshoot.jpg'));
const yogaPhoto = localPhotoUri(require('./yoga.jpg'));

export const mockActivityRecords: ActivityRecord[] = [
  {
    id: 'a-1',
    title: 'Концерт Mirele',
    description: 'Лайв-сет, тёплый звук и вечер атмосферы.',
    categoryId: 'music',
    subcategoryId: 'concerts',
    organizerId: userIvan.id,
    status: 'active',
    format: 'offline',
    location: {
      latitude: 55.833,
      longitude: 37.618,
      address: 'Проспект Мира, 119, стр.23, Москва',
      name: 'Клуб «Море музыки»',
      settlement: 'Москва',
    },
    startAt: buildFixedTimes('2026-03-14T19:00:00+03:00', '2026-03-14T20:30:00+03:00').start.toISOString(),
    endAt: buildFixedTimes('2026-03-14T19:00:00+03:00', '2026-03-14T20:30:00+03:00').end.toISOString(),
    timeZone: 'Europe/Moscow',
    preferences: {
      ageFrom: 16,
      ageTo: 35,
      maxParticipants: 120,
    },
    requiresApproval: false,
    photoUrls: [mirelePhoto],
    price: 1200,
  },

  {
    id: 'a-2',
    title: 'Играем в Мафию',
    description: 'Собираемся в кафе на вечернюю партию.',
    categoryId: 'games',
    subcategoryId: 'mafia',
    organizerId: mockUser.id,
    status: 'active',
    format: 'offline',
    location: {
      latitude: 55.761,
      longitude: 37.663,
      address: 'Нижний Сусальный переулок, 5, стр.1, Москва',
      name: 'Кофейня «Место»',
      settlement: 'Москва',
    },
    startAt: buildFixedTimes('2026-03-15T18:30:00+03:00', '2026-03-15T20:30:00+03:00').start.toISOString(),
    endAt: buildFixedTimes('2026-03-15T18:30:00+03:00', '2026-03-15T20:30:00+03:00').end.toISOString(),
    timeZone: 'Europe/Moscow',
    preferences: {
      level: 'intermediate',
      maxParticipants: 10,
    },
    requiresApproval: true,
    photoUrls: [mafiaPhoto],
    price: 500,
  },

  {
    id: 'a-3',
    title: 'Фото-прогулка по Москве',
    description: 'Практикуем городскую фотографию и композицию.',
    categoryId: 'creative',
    subcategoryId: 'photography',
    organizerId: userElena.id,
    status: 'active',
    format: 'offline',
    location: {
      latitude: 55.795,
      longitude: 37.674,
      address: 'Сокольники, Москва',
      name: 'Сокольники',
      settlement: 'Москва',
    },
    startAt: buildFixedTimes('2026-03-17T11:00:00+03:00', '2026-03-17T13:00:00+03:00').start.toISOString(),
    endAt: buildFixedTimes('2026-03-17T11:00:00+03:00', '2026-03-17T13:00:00+03:00').end.toISOString(),
    timeZone: 'Europe/Moscow',
    preferences: {
      ageFrom: 20,
      ageTo: 40,
      maxParticipants: 6,
    },
    requiresApproval: false,
    photoUrls: [photoshootPhoto],
    price: 0,
  },

  {
    id: 'a-4',
    title: 'Утренняя йога в парке',
    description: 'Практика на свежем воздухе, мягкий темп.',
    categoryId: 'sport',
    subcategoryId: 'yoga',
    organizerId: mockUser.id,
    status: 'active',
    format: 'offline',
    location: {
      latitude: 55.730,
      longitude: 37.603,
      address: 'Парк Горького, Москва',
      name: 'Парк Горького',
      settlement: 'Москва',
    },
    startAt: buildFixedTimes('2026-03-18T08:00:00+03:00', '2026-03-18T09:00:00+03:00').start.toISOString(),
    endAt: buildFixedTimes('2026-03-18T08:00:00+03:00', '2026-03-18T09:00:00+03:00').end.toISOString(),
    timeZone: 'Europe/Moscow',
    preferences: {
      level: 'beginner',
      maxParticipants: 0,
    },
    requiresApproval: false,
    photoUrls: [yogaPhoto],
    price: 300,
  },
];
