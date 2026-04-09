import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Обертки для AsyncStorage с типизацией
 */

/**
 * Сохраняет значение в AsyncStorage
 */
export const saveToStorage = async <T>(key: string, value: T): Promise<void> => {
  try {
    const jsonValue = JSON.stringify(value);
    await AsyncStorage.setItem(key, jsonValue);
  } catch (error) {
    console.error(`Error saving ${key} to storage:`, error);
    throw error;
  }
};

/**
 * Загружает значение из AsyncStorage
 */
export const loadFromStorage = async <T>(key: string): Promise<T | null> => {
  try {
    const jsonValue = await AsyncStorage.getItem(key);
    return jsonValue != null ? JSON.parse(jsonValue) : null;
  } catch (error) {
    console.error(`Error loading ${key} from storage:`, error);
    return null;
  }
};

/**
 * Удаляет значение из AsyncStorage
 */
export const removeFromStorage = async (key: string): Promise<void> => {
  try {
    await AsyncStorage.removeItem(key);
  } catch (error) {
    console.error(`Error removing ${key} from storage:`, error);
    throw error;
  }
};

/**
 * Очищает все данные из AsyncStorage
 */
export const clearStorage = async (): Promise<void> => {
  try {
    await AsyncStorage.clear();
  } catch (error) {
    console.error('Error clearing storage:', error);
    throw error;
  }
};

export const clearAllStorageKeys = async (): Promise<void> => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    if (keys.length > 0) {
      await AsyncStorage.multiRemove(Array.from(keys));
    }
  } catch (error) {
    console.error('Error clearing storage keys:', error);
    throw error;
  }
};

/**
 * Получает все ключи из AsyncStorage
 */
export const getAllKeys = async (): Promise<string[]> => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    return Array.from(keys);
  } catch (error) {
    console.error('Error getting all keys:', error);
    return [];
  }
};
