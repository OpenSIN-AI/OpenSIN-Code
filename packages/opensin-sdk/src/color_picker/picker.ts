import {
  ColorPickerState,
  ColorPickerConfig,
  SessionColor,
  COLOR_PRESETS,
  DEFAULT_SESSION_COLOR,
} from "./types.js";
import { ThemeApplier } from "./theme_applier.js";

const STORAGE_KEY_PREFIX = "opensin:color:";

export class ColorPicker {
  #state: ColorPickerState;
  #config: ColorPickerConfig;

  constructor(sessionId: string, config?: Partial<ColorPickerConfig>) {
    this.#config = {
      maxHistory: config?.maxHistory ?? 20,
      persistAcrossSessions: config?.persistAcrossSessions ?? true,
      defaultHex: config?.defaultHex ?? DEFAULT_SESSION_COLOR,
    };

    const saved = this.#loadState(sessionId);
    this.#state = saved ?? {
      currentColor: null,
      sessionId,
      history: [],
    };
  }

  get state(): Readonly<ColorPickerState> {
    return { ...this.#state };
  }

  get currentColor(): string {
    return this.#state.currentColor ?? this.#config.defaultHex;
  }

  setColor(hex: string): string {
    const normalized = this.#normalizeHex(hex);
    if (!this.#isValidHex(normalized)) {
      throw new Error(`Invalid hex color: ${hex}. Use format #RRGGBB.`);
    }

    const entry: SessionColor = {
      sessionId: this.#state.sessionId,
      hex: normalized,
      appliedAt: new Date().toISOString(),
    };

    this.#state.currentColor = normalized;
    this.#state.history.unshift(entry);

    if (this.#state.history.length > this.#config.maxHistory) {
      this.#state.history = this.#state.history.slice(0, this.#config.maxHistory);
    }

    this.#saveState();
    ThemeApplier.applyPromptBarColor(normalized);

    return normalized;
  }

  setPreset(name: string): string {
    const preset = COLOR_PRESETS.find(
      (p) => p.name.toLowerCase() === name.toLowerCase(),
    );
    if (!preset) {
      const names = COLOR_PRESETS.map((p) => p.name).join(", ");
      throw new Error(`Unknown preset "${name}". Available: ${names}`);
    }
    return this.setColor(preset.hex);
  }

  reset(): string {
    this.#state.currentColor = null;
    this.#saveState();
    ThemeApplier.resetPromptBarColor();
    return this.#config.defaultHex;
  }

  getPresets() {
    return [...COLOR_PRESETS];
  }

  getHistory(): ReadonlyArray<SessionColor> {
    return [...this.#state.history];
  }

  #normalizeHex(hex: string): string {
    let normalized = hex.trim();
    if (!normalized.startsWith("#")) {
      normalized = `#${normalized}`;
    }
    if (normalized.length === 4) {
      normalized = `#${normalized[1]}${normalized[1]}${normalized[2]}${normalized[2]}${normalized[3]}${normalized[3]}`;
    }
    return normalized.toUpperCase();
  }

  #isValidHex(hex: string): boolean {
    return /^#[0-9A-F]{6}$/.test(hex);
  }

  #storageKey(): string {
    return `${STORAGE_KEY_PREFIX}${this.#state.sessionId}`;
  }

  #loadState(sessionId: string): ColorPickerState | null {
    if (typeof globalThis === "undefined") return null;
    try {
      const raw = globalThis.localStorage?.getItem(this.#storageKey());
      if (!raw) return null;
      const parsed = JSON.parse(raw) as ColorPickerState;
      if (parsed.sessionId !== sessionId) return null;
      return parsed;
    } catch {
      return null;
    }
  }

  #saveState(): void {
    if (typeof globalThis === "undefined") return;
    try {
      globalThis.localStorage?.setItem(this.#storageKey(), JSON.stringify(this.#state));
    } catch {
      // Storage unavailable — state lives in memory only.
    }
  }
}
