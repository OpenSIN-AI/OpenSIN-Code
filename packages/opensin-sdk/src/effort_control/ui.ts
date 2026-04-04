import { EffortLevel, EffortProfile, EFFORT_PROFILES } from "./types.js";

export class EffortStatusBar {
  #element: HTMLElement | null = null;
  #currentLevel: EffortLevel = EffortLevel.Medium;

  constructor(container?: HTMLElement) {
    this.#element = container ?? null;
  }

  render(level: EffortLevel): string {
    this.#currentLevel = level;
    const profile = EFFORT_PROFILES[level];
    const indicator = this.#buildIndicator(level, profile);

    if (this.#element) {
      this.#element.textContent = indicator;
      this.#element.title = profile.description;
    }

    return indicator;
  }

  #buildIndicator(level: EffortLevel, profile: EffortProfile): string {
    const levels = [
      EffortLevel.Minimal,
      EffortLevel.Low,
      EffortLevel.Medium,
      EffortLevel.High,
      EffortLevel.Maximum,
    ];
    const currentIndex = levels.indexOf(level);

    const bars = levels
      .map((l, i) => (i <= currentIndex ? "\u2588" : "\u2591"))
      .join("");

    return `${profile.icon} effort:${level} [${bars}]`;
  }

  getTooltip(level: EffortLevel): string {
    const profile = EFFORT_PROFILES[level];
    return [
      `Effort: ${level}`,
      `Reasoning depth: ${profile.reasoningDepth}/8`,
      `Token budget: ${profile.tokenBudget.toLocaleString()}`,
      `Max tokens: ${profile.maxTokens.toLocaleString()}`,
      `Quality: ${(profile.responseQuality * 100).toFixed(0)}%`,
      profile.description,
    ].join("\n");
  }
}

export function renderEffortIndicator(level: EffortLevel): string {
  const profile = EFFORT_PROFILES[level];
  const levels = [
    EffortLevel.Minimal,
    EffortLevel.Low,
    EffortLevel.Medium,
    EffortLevel.High,
    EffortLevel.Maximum,
  ];
  const currentIndex = levels.indexOf(level);
  const bars = levels.map((l, i) => (i <= currentIndex ? "\u2588" : "\u2591")).join("");
  return `${profile.icon} ${level} [${bars}]`;
}

export function renderEffortStatusBar(level: EffortLevel): string {
  const profile = EFFORT_PROFILES[level];
  return `${profile.icon} ${level} — ${profile.description}`;
}

export function renderEffortHelp(): string {
  return [
    "Effort levels control reasoning depth and token budget:",
    "  minimal  — Quick answers, no reasoning",
    "  low      — Brief reasoning, conservative tokens",
    "  medium   — Balanced reasoning and tokens (default)",
    "  high     — Deep reasoning, higher token budget",
    "  maximum  — Full reasoning, maximum token budget",
    "",
    "Usage: /effort <level>",
  ].join("\n");
}

export function renderEffortConfirmation(level: EffortLevel): string {
  const profile = EFFORT_PROFILES[level];
  return `Effort set to "${level}" (${profile.icon})\nToken budget: ${profile.tokenBudget.toLocaleString()} — ${profile.description}`;
}

export function formatEffortForPrompt(level: EffortLevel): string {
  const profile = EFFORT_PROFILES[level];
  return `[Effort: ${level} | Reasoning depth: ${profile.reasoningDepth}/8 | Token budget: ~${profile.tokenBudget.toLocaleString()} | Quality target: ${(profile.responseQuality * 100).toFixed(0)}%]`;
}
