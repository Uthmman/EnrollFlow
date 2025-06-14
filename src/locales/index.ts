
// src/locales/index.ts
import { en, type LocaleStrings } from './en';
import { am } from './am';
import { ar } from './ar';

export type LanguageCode = 'en' | 'am' | 'ar';

export const locales: Record<LanguageCode, LocaleStrings> = {
  en,
  am,
  ar,
};

export const defaultLang: LanguageCode = 'en';
