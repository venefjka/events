import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createTheme, Theme } from '../themes/theme';
import { ColorScheme } from '@/themes/colors';

const THEME_STORAGE_KEY = '@wedo_theme_preference';

export const [ThemeProvider, useTheme] = createContextHook(() => {
  const systemColorScheme = useColorScheme();
  const [themePreference, setThemePreference] = useState<ColorScheme | 'system'>('system');
  const [isReady, setIsReady] = useState(false);

  // Загрузка сохраненной темы
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const saved = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (saved && (saved === 'light' || saved === 'dark' || saved === 'system')) {
          setThemePreference(saved as ColorScheme | 'system');
        }
      } catch (error) {
        console.error('Error loading theme:', error);
      } finally {
        setIsReady(true);
      }
    };
    loadTheme();
  }, []);

  // Определение текущей темы
  const currentScheme: ColorScheme = 
    themePreference === 'system' 
      ? (systemColorScheme || 'light')
      : themePreference;

  const theme: Theme = createTheme(currentScheme);

  // Сохранение предпочтения темы
  const setTheme = async (scheme: ColorScheme | 'system') => {
    try {
      setThemePreference(scheme);
      await AsyncStorage.setItem(THEME_STORAGE_KEY, scheme);
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  };

  return {
    theme,
    themePreference,
    setTheme,
    isReady,
  };
});
