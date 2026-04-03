import { SupportedLocale } from './types';

const LOCALE_MAP: Record<string, SupportedLocale> = {
  en: 'en', 'en-us': 'en', 'en-gb': 'en',
  de: 'de', 'de-de': 'de', 'de-at': 'de', 'de-ch': 'de',
  es: 'es', 'es-es': 'es', 'es-mx': 'es', 'es-ar': 'es',
  fr: 'fr', 'fr-fr': 'fr', 'fr-ca': 'fr', 'fr-be': 'fr',
  ja: 'ja', 'ja-jp': 'ja',
  zh: 'zh', 'zh-cn': 'zh', 'zh-tw': 'zh', 'zh-hk': 'zh',
  ko: 'ko', 'ko-kr': 'ko',
};

export function detectLocale(): SupportedLocale {
  if (typeof navigator !== 'undefined' && navigator.language) {
    const browserLang = navigator.language.toLowerCase();
    if (LOCALE_MAP[browserLang]) {
      return LOCALE_MAP[browserLang];
    }
    const baseLang = browserLang.split('-')[0];
    if (LOCALE_MAP[baseLang]) {
      return LOCALE_MAP[baseLang];
    }
  }

  if (typeof document !== 'undefined') {
    const stored = document.cookie.match(/opensin_locale=([^;]+)/);
    if (stored) {
      const locale = stored[1] as SupportedLocale;
      if (['en', 'de', 'es', 'fr', 'ja', 'zh', 'ko'].includes(locale)) {
        return locale;
      }
    }
  }

  if (typeof localStorage !== 'undefined') {
    const stored = localStorage.getItem('opensin_locale');
    if (stored && ['en', 'de', 'es', 'fr', 'ja', 'zh', 'ko'].includes(stored)) {
      return stored as SupportedLocale;
    }
  }

  return 'en';
}

export function setLocalePreference(locale: SupportedLocale): void {
  if (typeof document !== 'undefined') {
    document.cookie = `opensin_locale=${locale};path=/;max-age=31536000`;
  }
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('opensin_locale', locale);
  }
  if (typeof document !== 'undefined' && document.documentElement) {
    document.documentElement.lang = locale;
  }
}
