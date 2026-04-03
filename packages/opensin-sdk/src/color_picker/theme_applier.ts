const PROMPT_BAR_SELECTOR = "#prompt-bar";
const PROMPT_BAR_BORDER_SELECTOR = "#prompt-bar, .prompt-bar, [data-prompt-bar]";
const CSS_VAR = "--opensin-prompt-bar-color";
const STYLE_ID = "opensin-color-picker-style";

function getOrCreateStyleEl(): HTMLStyleElement {
  let el = document.getElementById(STYLE_ID) as HTMLStyleElement | null;
  if (!el) {
    el = document.createElement("style");
    el.id = STYLE_ID;
    document.head.appendChild(el);
  }
  return el;
}

export class ThemeApplier {
  static applyPromptBarColor(hex: string): void {
    if (typeof document === "undefined") return;

    const style = getOrCreateStyleEl();
    style.textContent = `
      ${PROMPT_BAR_BORDER_SELECTOR} {
        border-color: ${hex} !important;
        box-shadow: 0 0 0 1px ${hex}40 !important;
      }
      :root {
        ${CSS_VAR}: ${hex};
      }
    `;

    const bar = document.querySelector(PROMPT_BAR_SELECTOR) as HTMLElement | null;
    if (bar) {
      bar.style.setProperty("border-color", hex, "important");
      bar.style.setProperty("box-shadow", `0 0 0 1px ${hex}40`, "important");
    }
  }

  static resetPromptBarColor(): void {
    if (typeof document === "undefined") return;

    const el = document.getElementById(STYLE_ID);
    if (el) el.remove();

    const bar = document.querySelector(PROMPT_BAR_SELECTOR) as HTMLElement | null;
    if (bar) {
      bar.style.removeProperty("border-color");
      bar.style.removeProperty("box-shadow");
    }

    document.documentElement.style.removeProperty(CSS_VAR);
  }
}

export function applyPromptBarColor(hex: string): void {
  ThemeApplier.applyPromptBarColor(hex);
}

export function resetPromptBarColor(): void {
  ThemeApplier.resetPromptBarColor();
}
