export type Locale = 'en' | 'de' | 'es' | 'fr' | 'ja' | 'zh' | 'ko';

export interface TranslationEntry {
  [key: string]: string | TranslationEntry;
}

export interface TranslationBundle {
  [locale: string]: TranslationEntry;
}

export interface LocaleInfo {
  code: Locale;
  name: string;
  nativeName: string;
  direction: 'ltr' | 'rtl';
}

export interface I18nConfig {
  defaultLocale: Locale;
  supportedLocales: Locale[];
  fallbackLocale: Locale;
}
