import { SupportedLocale } from './types';

const RTL_LOCALES: SupportedLocale[] = [];

export function isRTLLocale(locale: SupportedLocale): boolean {
  return RTL_LOCALES.includes(locale);
}

export function applyTextDirection(locale: SupportedLocale): void {
  if (typeof document === 'undefined') return;
  const direction = isRTLLocale(locale) ? 'rtl' : 'ltr';
  document.documentElement.dir = direction;
  document.body.style.direction = direction;
}

export function mirrorCSSForRTL(): void {
  if (typeof document === 'undefined') return;
  const style = document.createElement('style');
  style.textContent = `
    [dir="rtl"] .opensin-mirror { transform: scaleX(-1); }
    [dir="rtl"] .opensin-flip { transform: scaleX(-1); }
    [dir="rtl"] { text-align: start; }
  `;
  document.head.appendChild(style);
}
