import { defineStore } from 'pinia';
import { i18n } from '@/i18n';
import { load, save } from '@/utils/storage';
import type { Locale } from '@/models';
export const useAppStore = defineStore('app', {
  state: () => ({ locale: load<Locale>('kyoto.locale', 'en-US') }),
  actions: {
    setLocale(l: Locale) {
      this.locale = l; (i18n.global.locale as any).value = l; save('kyoto.locale', l);
    },
  },
});
