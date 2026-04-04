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

function resolveLocale(lang: string | null | undefined): Locale | undefined {
  if (!lang) return undefined;
  const s = lang as string;
  const direct = LOCALE_MAP[s];
  if (direct) return direct;
  const base = s.split("-")[0];
  return base ? LOCALE_MAP[base] : undefined;
}

export class LocaleDetector {
  static detectFromNavigator(): Locale {
    if (typeof navigator === "undefined") {
      return "en";
    }
    const lang = navigator.language;
    return resolveLocale(lang) ?? "en";
  }

  static detectFromURL(searchParams: URLSearchParams): Locale | null {
    const lang = searchParams.get("lang") ?? searchParams.get("locale");
    return resolveLocale(lang) ?? null;
  }

  static detectFromCookie(): Locale | null {
    if (typeof document === "undefined") return null;
    const match = document.cookie.match(/(?:^|; )locale=([^;]*)/);
    if (!match || !match[1]) return null;
    const lang = decodeURIComponent(match[1]);
    return resolveLocale(lang) ?? null;
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
