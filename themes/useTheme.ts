import { useTheme as useThemeContext } from '@/contexts/ThemeContext';

/**
 * Хук для использования темы в компонентах
 * @returns Объект темы с цветами, типографикой и отступами
 */
export const useTheme = () => {
  const { theme } = useThemeContext();
  return theme;
};
