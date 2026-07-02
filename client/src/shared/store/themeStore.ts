import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ThemeState = {
  isDarkMode: boolean;
  setDarkMode: (isDark: boolean) => void;
  loadTheme: () => Promise<void>;
};

export const useThemeStore = create<ThemeState>((set) => ({
  isDarkMode: true, // Default to dark mode
  setDarkMode: (isDark) => {
    set({ isDarkMode: isDark });
    AsyncStorage.setItem('darkMode', String(isDark));
  },
  loadTheme: async () => {
    try {
      const value = await AsyncStorage.getItem('darkMode');
      if (value !== null) {
        set({ isDarkMode: value === 'true' });
      }
    } catch (e) {
      console.error('Failed to load theme:', e);
    }
  },
}));
