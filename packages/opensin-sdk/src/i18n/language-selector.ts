import { Locale, LocaleInfo } from "./types.js";
import { I18nEngine } from "./engine.js";

export class LanguageSelector {
  private engine: I18nEngine;
  private onChangeCallback?: (locale: Locale) => void;

  constructor(engine: I18nEngine) {
    this.engine = engine;
  }

  onChange(callback: (locale: Locale) => void): void {
    this.onChangeCallback = callback;
  }

  setLocale(locale: Locale): void {
    this.engine.setLocale(locale);
    this.onChangeCallback?.(locale);
  }

  getCurrentLocale(): Locale {
    return this.engine.getLocale();
  }

  getAvailableLocales(): LocaleInfo[] {
    return this.engine.getAllLocales();
  }

  getCurrentLocaleInfo(): LocaleInfo {
    return this.engine.getLocaleInfo();
  }
}
