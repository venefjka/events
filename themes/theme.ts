import { getColors, ColorScheme } from './colors';
import { typography } from './typography';
import { spacing } from './spacing';

export interface Theme {
  colors: ReturnType<typeof getColors>;
  typography: typeof typography;
  spacing: typeof spacing;
  isDark: boolean;
}

export const createTheme = (scheme: ColorScheme): Theme => ({
  colors: getColors(scheme),
  typography,
  spacing,
  isDark: scheme === 'dark',
});

export const lightTheme = createTheme('light');
export const darkTheme = createTheme('dark');
