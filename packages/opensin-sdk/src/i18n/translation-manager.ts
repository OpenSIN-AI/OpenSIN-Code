import { Locale, TranslationEntry } from "./types.js";

export class TranslationManager {
  private customTranslations: Map<Locale, TranslationEntry> = new Map();

  addTranslation(locale: Locale, translations: TranslationEntry): void {
    const existing = this.customTranslations.get(locale) || {};
    this.customTranslations.set(locale, { ...existing, ...translations });
  }

  getTranslation(locale: Locale, key: string): string | null {
    const translations = this.customTranslations.get(locale);
    if (!translations) return null;

    const keys = key.split(".");
    let value: unknown = translations;
    for (const k of keys) {
      if (value && typeof value === "object" && k in value) {
        value = (value as Record<string, unknown>)[k];
      } else {
        return null;
      }
    }
    return typeof value === "string" ? value : null;
  }

  getSupportedLocales(): Locale[] {
    return Array.from(this.customTranslations.keys());
  }

  exportTranslations(locale: Locale): TranslationEntry | null {
    return this.customTranslations.get(locale) || null;
  }
}
