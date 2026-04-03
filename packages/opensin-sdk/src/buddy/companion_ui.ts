import { BuddyState, BuddyEmotion, BuddyAppearance, BuddyReaction, BuddyTip } from "./types.js";
import { BuddyEngine } from "./buddy_engine.js";

const EMOTION_EMOJI: Record<BuddyEmotion, string> = {
  happy: "\u{1F60A}",
  sad: "\u{1F622}",
  excited: "\u{1F929}",
  focused: "\u{1F9D0}",
  tired: "\u{1F634}",
  curious: "\u{1F914}",
  proud: "\u{1F60E}",
  worried: "\u{1F61F}",
  neutral: "\u{1F610}",
};

const SHAPE_RENDERERS: Record<BuddyAppearance["shape"], (color: string, size: number) => string> = {
  blob: (color, size) => `<div class="buddy-blob" style="background:${color};width:${size}px;height:${size}px;border-radius:50% 50% 50% 50% / 60% 60% 40% 40%;"></div>`,
  cube: (color, size) => `<div class="buddy-cube" style="background:${color};width:${size}px;height:${size}px;border-radius:8px;"></div>`,
  sphere: (color, size) => `<div class="buddy-sphere" style="background:radial-gradient(circle at 30% 30%,${color}dd,${color});width:${size}px;height:${size}px;border-radius:50%;"></div>`,
  star: (color, size) => `<div class="buddy-star" style="color:${color};font-size:${size}px;">\u2605</div>`,
  diamond: (color, size) => `<div class="buddy-diamond" style="background:${color};width:${size}px;height:${size}px;transform:rotate(45deg);border-radius:4px;"></div>`,
};

const SIZE_MAP: Record<BuddyAppearance["size"], number> = {
  tiny: 24,
  small: 40,
  medium: 60,
  large: 80,
};

export class CompanionUI {
  private engine: BuddyEngine;
  private container: HTMLElement | null = null;
  private visible: boolean = false;

  constructor(engine: BuddyEngine) {
    this.engine = engine;
  }

  mount(container: HTMLElement): void {
    this.container = container;
    this.visible = true;
    this.render();
    this.engine.subscribe(() => this.render());
  }

  unmount(): void {
    this.visible = false;
    if (this.container) {
      this.container.innerHTML = "";
    }
  }

  toggle(): void {
    if (this.visible) {
      this.unmount();
    } else if (this.container) {
      this.mount(this.container);
    }
  }

  private render(): void {
    if (!this.container || !this.visible) return;
    const state = this.engine.getState();
    this.container.innerHTML = this.buildHTML(state);
  }

  private buildHTML(state: BuddyState): string {
    const pixelSize = SIZE_MAP[state.appearance.size];
    const shapeHTML = SHAPE_RENDERERS[state.appearance.shape](state.appearance.color, pixelSize);
    const accessoryBadges = state.appearance.accessories
      .filter((a) => a !== "none")
      .map((a) => `<span class="buddy-accessory-badge">${this.accessoryIcon(a)}</span>`)
      .join("");

    const recentReactions = state.reactions.slice(-3).reverse();
    const reactionsHTML = recentReactions
      .map(
        (r) =>
          `<div class="buddy-reaction"><span class="buddy-reaction-emoji">${EMOTION_EMOJI[r.emotion]}</span><span class="buddy-reaction-msg">${r.message}</span></div>`
      )
      .join("");

    const recentTips = state.tips.slice(-2).reverse();
    const tipsHTML = recentTips
      .map((t) => `<div class="buddy-tip"><span class="buddy-tip-icon">\u{1F4A1}</span><span>${t.text}</span></div>`)
      .join("");

    const xpNeeded = state.level * 50;
    const xpPercent = Math.round((state.xp / xpNeeded) * 100);

    return `
      <div class="buddy-companion">
        <div class="buddy-header">
          <span class="buddy-name">${state.name}</span>
          <span class="buddy-level">Lv.${state.level}</span>
        </div>
        <div class="buddy-body">
          ${shapeHTML}
          <div class="buddy-emotion">${EMOTION_EMOJI[state.emotion]}</div>
          ${accessoryBadges ? `<div class="buddy-accessories">${accessoryBadges}</div>` : ""}
        </div>
        <div class="buddy-stats">
          <div class="buddy-stat"><span class="buddy-stat-label">\u2764\uFE0F</span><div class="buddy-bar"><div class="buddy-bar-fill" style="width:${state.happiness}%"></div></div></div>
          <div class="buddy-stat"><span class="buddy-stat-label">\u26A1</span><div class="buddy-bar"><div class="buddy-bar-fill" style="width:${state.energy}%"></div></div></div>
          <div class="buddy-stat"><span class="buddy-stat-label">\u2728</span><div class="buddy-bar"><div class="buddy-bar-fill" style="width:${xpPercent}%"></div></div></div>
        </div>
        ${reactionsHTML ? `<div class="buddy-reactions">${reactionsHTML}</div>` : ""}
        ${tipsHTML ? `<div class="buddy-tips">${tipsHTML}</div>` : ""}
      </div>
    `;
  }

  private accessoryIcon(accessory: string): string {
    const icons: Record<string, string> = {
      glasses: "\u{1F453}",
      hat: "\u{1F3A9}",
      bowtie: "\u{1F380}",
      crown: "\u{1F451}",
      headphones: "\u{1F3A7}",
      scarf: "\u{1F9E3}",
    };
    return icons[accessory] ?? "";
  }
}
