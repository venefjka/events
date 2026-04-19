import { UserPrivacySettings, UserPublic, UserRecord } from '@/types';
import { getAgeFromBirthDate } from '@/utils/validation';

export const defaultUserPrivacySettings = (): UserPrivacySettings => ({
  showAvatar: true,
  showGender: true,
  showCityPlace: true,
  showInterests: true,
  showBirthDate: true,
  showAttendanceHistory: true,
  showReviews: true,
});

export const getUserAge = (birthDate?: string): number | null => {
  if (!birthDate) return null;
  return getAgeFromBirthDate(birthDate);
};

export const getAgeLabel = (count: number) => {
  const lastTwoDigits = count % 100;
  const lastDigit = count % 10;

  if (lastTwoDigits >= 11 && lastTwoDigits <= 14) {
    return 'лет';
  }

  if (lastDigit === 1) {
    return 'год';
  }

  if (lastDigit >= 2 && lastDigit <= 4) {
    return 'года';
  }

  return 'лет';
};

export const buildUserPublic = (
  user: UserRecord,
  viewerId?: string,
  attendanceHistory?: { attended: number; missed: number }
): UserPublic => {
  const privacy = user.privacy ?? defaultUserPrivacySettings();
  const isSelf = viewerId ? user.id === viewerId : false;
  const canShow = (flag: boolean) => isSelf || flag;
  const age = canShow(privacy.showBirthDate) ? getUserAge(user.birthDate) ?? undefined : undefined;

  return {
    id: user.id,
    name: user.name,
    avatar: canShow(privacy.showAvatar) ? user.avatar : undefined,
    rating: user.rating,
    age,
    gender: canShow(privacy.showGender) ? user.gender : undefined,
    cityPlace: canShow(privacy.showCityPlace) ? user.cityPlace : undefined,
    interests: canShow(privacy.showInterests) ? user.interests : undefined,
    attendanceHistory: canShow(privacy.showAttendanceHistory)
      ? attendanceHistory ?? user.attendanceHistory
      : undefined,
  };
};
