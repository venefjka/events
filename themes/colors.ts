export const lightColors = {
  // Основные цвета
  primary: '#000000',
  secondary: '#666666',
  tertiary: '#999999',
  
  // Фон
  background: '#FFFFFF',
  surface: '#F9F9F9',
  surfaceVariant: '#F5F5F5',
  
  // Текст
  text: '#000000',
  textSecondary: '#666666',
  textTertiary: '#999999',
  textInverse: '#FFFFFF',
  
  // Границы
  border: '#E5E5E5',
  borderLight: '#F5F5F5',
  
  // Состояния
  disabled: '#CCCCCC',
  error: '#FF3B30',
  success: '#34C759',
  warning: '#FF9500',
  info: '#007AFF',
  ratingPoor: '#D96B5F',
  ratingFair: '#E39A53',
  ratingGood: '#E7C65A',
  ratingVeryGood: '#A9C95F',
  ratingExcellent: '#5E9D74',
  
  // Акценты
  accent: '#000000',
  accentLight: '#333333',
  categorySport: '#2E7D32',
  categoryCreative: '#D97706',
  categoryEducation: '#2563EB',
  categoryGames: '#7C3AED',
  categoryMusic: '#DB2777',
  categoryFood: '#B45309',
  categoryNature: '#15803D',
  categoryCinema: '#334155',
  
  // Разделители
  divider: '#E5E5E5',
  dividerLight: '#F5F5F5',
  
  // Overlay
  overlay: 'rgba(0, 0, 0, 0.5)',
  overlayLight: 'rgba(0, 0, 0, 0.1)',
};

export const darkColors = {
  // Основные цвета
  primary: '#FFFFFF',
  secondary: '#CCCCCC',
  tertiary: '#999999',
  
  // Фон
  background: '#000000',
  surface: '#1C1C1E',
  surfaceVariant: '#2C2C2E',
  
  // Текст
  text: '#FFFFFF',
  textSecondary: '#CCCCCC',
  textTertiary: '#999999',
  textInverse: '#000000',
  
  // Границы
  border: '#38383A',
  borderLight: '#2C2C2E',
  
  // Состояния
  disabled: '#666666',
  error: '#FF453A',
  success: '#32D74B',
  warning: '#FF9F0A',
  info: '#0A84FF',
  ratingPoor: '#D96B5F',
  ratingFair: '#E39A53',
  ratingGood: '#E7C65A',
  ratingVeryGood: '#A9C95F',
  ratingExcellent: '#5E9D74',
  
  // Акценты
  accent: '#FFFFFF',
  accentLight: '#CCCCCC',
  categorySport: '#5CD65C',
  categoryCreative: '#F59E0B',
  categoryEducation: '#60A5FA',
  categoryGames: '#A78BFA',
  categoryMusic: '#F472B6',
  categoryFood: '#FBBF24',
  categoryNature: '#4ADE80',
  categoryCinema: '#94A3B8',
  
  // Разделители
  divider: '#38383A',
  dividerLight: '#2C2C2E',
  
  // Overlay
  overlay: 'rgba(0, 0, 0, 0.7)',
  overlayLight: 'rgba(255, 255, 255, 0.1)',
};

export type ColorScheme = 'light' | 'dark';

export const getColors = (scheme: ColorScheme) => {
  return scheme === 'light' ? lightColors : darkColors;
};
