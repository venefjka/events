import { getAgeFromBirthDate } from '@/utils/validation';

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
