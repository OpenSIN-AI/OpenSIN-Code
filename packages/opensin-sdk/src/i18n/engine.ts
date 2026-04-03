import { Locale, TranslationEntry, I18nConfig, LocaleInfo } from "./types.js";
import { en } from "./locales/en.js";
import { de } from "./locales/de.js";
import { es } from "./locales/es.js";
import { fr } from "./locales/fr.js";
import { ja } from "./locales/ja.js";
import { zh } from "./locales/zh.js";
import { ko } from "./locales/ko.js";

const LOCALE_INFO: Record<Locale, LocaleInfo> = {
  en: { code: "en", name: "English", nativeName: "English", direction: "ltr" },
  de: { code: "de", name: "German", nativeName: "Deutsch", direction: "ltr" },
  es: { code: "es", name: "Spanish", nativeName: "Español", direction: "ltr" },
  fr: { code: "fr", name: "French", nativeName: "Français", direction: "ltr" },
  ja: { code: "ja", name: "Japanese", nativeName: "日本語", direction: "ltr" },
  zh: { code: "zh", name: "Chinese", nativeName: "中文", direction: "ltr" },
  ko: { code: "ko", name: "Korean", nativeName: "한국어", direction: "ltr" },
};

const TRANSLATIONS: Record<Locale, TranslationEntry> = { en, de, es, fr, ja, zh, ko };

export class I18nEngine {
  private currentLocale: Locale;
  private config: I18nConfig;

  constructor(config?: Partial<I18nConfig>) {
    this.config = {
      defaultLocale: config?.defaultLocale ?? "en",
      supportedLocales: config?.supportedLocales ?? ["en", "de", "es", "fr", "ja", "zh", "ko"],
      fallbackLocale: config?.fallbackLocale ?? "en",
    };
    this.currentLocale = this.config.defaultLocale;
  }

  setLocale(locale: Locale): void {
    if (!this.config.supportedLocales.includes(locale)) {
      throw new Error(`Locale ${locale} is not supported`);
    }
    this.currentLocale = locale;
  }

  getLocale(): Locale {
    return this.currentLocale;
  }

  getLocaleInfo(): LocaleInfo {
    return LOCALE_INFO[this.currentLocale];
  }

  getAllLocales(): LocaleInfo[] {
    return this.config.supportedLocales.map((code) => LOCALE_INFO[code]);
  }

  isRTL(): boolean {
    return LOCALE_INFO[this.currentLocale].direction === "rtl";
  }

  t(key: string): string {
    const keys = key.split(".");
    let value: unknown = TRANSLATIONS[this.currentLocale];

    for (const k of keys) {
      if (value && typeof value === "object" && k in value) {
        value = (value as Record<string, unknown>)[k];
      } else {
        value = this.resolveFallback(keys);
        break;
      }
    }

    if (typeof value === "string") {
      return value;
    }

    return key;
  }

  private resolveFallback(keys: string[]): string {
    let value: unknown = TRANSLATIONS[this.config.fallbackLocale];
    for (const k of keys) {
      if (value && typeof value === "object" && k in value) {
        value = (value as Record<string, unknown>)[k];
      } else {
        return keys.join(".");
      }
    }
    return typeof value === "string" ? value : keys.join(".");
  }

  interpolate(template: string, params: Record<string, string>): string {
    return template.replace(/\{\{(\w+)\}\}/g, (_, key) => params[key] ?? `{{${key}}}`);
  }
}
