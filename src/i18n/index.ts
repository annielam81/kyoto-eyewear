import { createI18n } from 'vue-i18n';
import enUS from './en-US';
import zhCN from './zh-CN';
import esUS from './es-US';
import { load } from '@/utils/storage';
import type { Locale } from '@/models';

export const SUPPORTED: { code: Locale; label: string }[] = [
  { code: 'en-US', label: 'EN' },
  { code: 'zh-CN', label: '中文' },
  { code: 'es-US', label: 'ES' },
];
export const i18n = createI18n({
  legacy: false,
  globalInjection: true,
  locale: load<Locale>('kyoto.locale', 'en-US'),
  fallbackLocale: 'en-US',
  messages: { 'en-US': enUS, 'zh-CN': zhCN, 'es-US': esUS },
});
