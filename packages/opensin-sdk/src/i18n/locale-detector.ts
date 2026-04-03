import { Locale } from "./types.js";

const LOCALE_MAP: Record<string, Locale> = {
  en: "en",
  de: "de",
  es: "es",
  fr: "fr",
  ja: "ja",
  zh: "zh",
  ko: "ko",
  "zh-CN": "zh",
  "zh-TW": "zh",
  "de-DE": "de",
  "es-ES": "es",
  "fr-FR": "fr",
  "ja-JP": "ja",
  "ko-KR": "ko",
};

export class LocaleDetector {
  static detectFromNavigator(): Locale {
    if (typeof navigator === "undefined") {
      return "en";
    }
    const lang = navigator.language;
    const short = lang.split("-")[0];
    return LOCALE_MAP[lang] || LOCALE_MAP[short] || "en";
  }

  static detectFromURL(searchParams: URLSearchParams): Locale | null {
    const lang = searchParams.get("lang") || searchParams.get("locale");
    if (!lang) return null;
    return LOCALE_MAP[lang] || LOCALE_MAP[lang.split("-")[0]] || null;
  }

  static detectFromCookie(): Locale | null {
    if (typeof document === "undefined") return null;
    const match = document.cookie.match(/(?:^|; )locale=([^;]*)/);
    if (!match) return null;
    const lang = decodeURIComponent(match[1]);
    return LOCALE_MAP[lang] || LOCALE_MAP[lang.split("-")[0]] || null;
  }

  static detect(fallback: Locale = "en"): Locale {
    return this.detectFromURL(new URLSearchParams(window.location.search)) ||
      this.detectFromCookie() ||
      this.detectFromNavigator() ||
      fallback;
  }

  static persist(locale: Locale): void {
    if (typeof document !== "undefined") {
      document.cookie = `locale=${locale}; path=/; max-age=31536000`;
    }
  }
}
