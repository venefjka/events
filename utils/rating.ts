/**
 * Утилиты для расчета рейтинга пользователей
 */

const CONFIDENCE_MULTIPLIER = 5;
const BASE_RATING = 4.5;

/**
 * Рассчитывает рейтинг организатора по формуле Байеса
 * Формула: Рейтинг = (C*R0 + (Сумма всех оценок)) / (C + n)
 * где C - доверительный множитель (5), R0 - базовый рейтинг (4.5), n - количество оценок
 */
export const calculateOrganizerRating = (ratings: number[]): number => {
  if (ratings.length === 0) {
    return BASE_RATING;
  }

  const sumRatings = ratings.reduce((sum, rating) => sum + rating, 0);
  const numerator = CONFIDENCE_MULTIPLIER * BASE_RATING + sumRatings;
  const denominator = CONFIDENCE_MULTIPLIER + ratings.length;

  return numerator / denominator;
};

/**
 * Рассчитывает средний рейтинг активности
 */
export const calculateActivityRating = (ratings: number[]): number => {
  if (ratings.length === 0) {
    return 0;
  }

  const sum = ratings.reduce((acc, rating) => acc + rating, 0);
  return sum / ratings.length;
};

/**
 * Получает оценку за посещение/пропуск/отмену
 */
export const getAttendanceRating = (type: 'attended' | 'missed' | 'cancelled'): number => {
  switch (type) {
    case 'attended':
      return 5;
    case 'missed':
      return 2;
    case 'cancelled':
      return 2;
    default:
      return 0;
  }
};

/**
 * Форматирует рейтинг для отображения
 */
export const formatRating = (rating: number, decimals: number = 1): string => {
  return rating.toFixed(decimals);
};
