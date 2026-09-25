import { defineStore } from 'pinia';
import { load, save } from '@/utils/storage';
import { DEFAULT_THEME, THEME_STORAGE_KEY, type ThemeName } from '@/config/theme.config';

export const useThemeStore = defineStore('theme', {
  state: () => ({ name: load<ThemeName>(THEME_STORAGE_KEY, DEFAULT_THEME) }),
  actions: {
    setTheme(t: ThemeName) {
      this.name = t;
      save(THEME_STORAGE_KEY, t);
    },
  },
});
