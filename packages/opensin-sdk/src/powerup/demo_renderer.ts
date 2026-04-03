import type { DemoAction, DemoAnimation } from "./types.js";

export class DemoRenderer {
  private activeAnimation: DemoAnimation | null = null;
  private isPlaying = false;
  private isPaused = false;
  private currentActionIndex = 0;
  private animationFrame: number | null = null;
  private highlightElement: HTMLElement | null = null;
  private cursorElement: HTMLElement | null = null;
  private speedMultiplier = 1;
  private onActionComplete?: (action: DemoAction, index: number) => void;
  private onAnimationComplete?: () => void;

  constructor(speedMultiplier: number = 1) {
    this.speedMultiplier = speedMultiplier;
  }

  async play(animation: DemoAnimation): Promise<void> {
    if (this.isPlaying) return;

    this.activeAnimation = animation;
    this.isPlaying = true;
    this.isPaused = false;
    this.currentActionIndex = 0;

    this.createCursor();
    this.createHighlight();

    await this.executeActions();
  }

  pause(): void {
    this.isPaused = true;
  }

  resume(): void {
    this.isPaused = false;
  }

  stop(): void {
    this.isPlaying = false;
    this.isPaused = false;
    this.currentActionIndex = 0;

    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }

    this.removeCursor();
    this.removeHighlight();
    this.activeAnimation = null;
  }

  setSpeed(multiplier: number): void {
    this.speedMultiplier = Math.max(0.25, Math.min(4, multiplier));
  }

  setOnActionComplete(callback: (action: DemoAction, index: number) => void): void {
    this.onActionComplete = callback;
  }

  setOnAnimationComplete(callback: () => void): void {
    this.onAnimationComplete = callback;
  }

  private async executeActions(): Promise<void> {
    if (!this.activeAnimation || !this.isPlaying) return;

    const actions = this.activeAnimation.actions;

    while (this.currentActionIndex < actions.length && this.isPlaying) {
      if (this.isPaused) {
        await this.wait(100);
        continue;
      }

      const action = actions[this.currentActionIndex];
      await this.executeAction(action);

      this.onActionComplete?.(action, this.currentActionIndex);
      this.currentActionIndex++;
    }

    if (this.activeAnimation.loop && this.isPlaying) {
      this.currentActionIndex = 0;
      await this.executeActions();
    } else {
      this.isPlaying = false;
      this.removeCursor();
      this.removeHighlight();
      this.onAnimationComplete?.();
    }
  }

  private async executeAction(action: DemoAction): Promise<void> {
    const duration = (action.duration || 500) / this.speedMultiplier;

    switch (action.type) {
      case "type":
        await this.animateType(action.target, action.text || "", duration);
        break;
      case "click":
        await this.animateClick(action.target, duration);
        break;
      case "hover":
        await this.animateHover(action.target, duration);
        break;
      case "scroll":
        await this.animateScroll(action.target, duration);
        break;
      case "highlight":
        await this.animateHighlight(action.target, duration);
        break;
      case "wait":
        await this.wait(duration);
        break;
      case "navigate":
        await this.animateNavigate(action.target, duration);
        break;
    }
  }

  private async animateType(
    target: string | undefined,
    text: string,
    duration: number
  ): Promise<void> {
    const el = target ? document.querySelector(target) : null;
    if (!el || !(el instanceof HTMLInputElement)) return;

    el.focus();
    const charDelay = duration / Math.max(text.length, 1);

    for (let i = 0; i < text.length; i++) {
      if (!this.isPlaying) return;
      el.value += text[i];
      el.dispatchEvent(new Event("input", { bubbles: true }));
      await this.wait(charDelay);
    }
  }

  private async animateClick(
    target: string | undefined,
    duration: number
  ): Promise<void> {
    if (!target) return;
    const el = document.querySelector(target);
    if (!el) return;

    await this.moveToElement(el, duration * 0.5);

    this.highlightElement?.classList.add("opensin-demo-click");
    await this.wait(200 / this.speedMultiplier);

    (el as HTMLElement).click();
    await this.wait(duration * 0.3);

    this.highlightElement?.classList.remove("opensin-demo-click");
  }

  private async animateHover(
    target: string | undefined,
    duration: number
  ): Promise<void> {
    if (!target) return;
    const el = document.querySelector(target);
    if (!el) return;

    await this.moveToElement(el, duration * 0.5);

    el.dispatchEvent(new MouseEvent("mouseenter", { bubbles: true }));
    await this.wait(duration * 0.5);
  }

  private async animateScroll(
    target: string | undefined,
    duration: number
  ): Promise<void> {
    const el = target ? document.querySelector(target) : null;

    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    } else {
      window.scrollTo({ top: window.scrollY + 500, behavior: "smooth" });
    }

    await this.wait(duration);
  }

  private async animateHighlight(
    target: string | undefined,
    duration: number
  ): Promise<void> {
    if (!target) return;
    const el = document.querySelector(target);
    if (!el) return;

    await this.moveToElement(el, duration * 0.3);
    this.highlightElement?.classList.add("opensin-demo-highlight");

    await this.wait(duration * 0.4);
    this.highlightElement?.classList.remove("opensin-demo-highlight");
  }

  private async animateNavigate(
    target: string | undefined,
    _duration: number
  ): Promise<void> {
    if (!target) return;
    const el = document.querySelector(target);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    await this.wait(300 / this.speedMultiplier);
  }

  private async moveToElement(el: Element, duration: number): Promise<void> {
    const rect = el.getBoundingClientRect();
    const targetX = rect.left + rect.width / 2;
    const targetY = rect.top + rect.height / 2;

    if (this.cursorElement) {
      this.cursorElement.style.transition = `all ${duration}ms ease-in-out`;
      this.cursorElement.style.left = `${targetX}px`;
      this.cursorElement.style.top = `${targetY}px`;
    }

    if (this.highlightElement) {
      this.highlightElement.style.transition = `all ${duration}ms ease-in-out`;
      this.highlightElement.style.left = `${rect.left - 4}px`;
      this.highlightElement.style.top = `${rect.top - 4}px`;
      this.highlightElement.style.width = `${rect.width + 8}px`;
      this.highlightElement.style.height = `${rect.height + 8}px`;
    }

    await this.wait(duration);
  }

  private createCursor(): void {
    this.removeCursor();
    this.cursorElement = document.createElement("div");
    this.cursorElement.id = "opensin-demo-cursor";
    this.cursorElement.style.cssText = `
      position: fixed;
      width: 20px;
      height: 20px;
      border: 2px solid #3b82f6;
      border-radius: 50%;
      background: rgba(59, 130, 246, 0.3);
      pointer-events: none;
      z-index: 2147483647;
      transition: all 0.3s ease;
      left: 0;
      top: 0;
    `;
    document.body.appendChild(this.cursorElement);
  }

  private removeCursor(): void {
    if (this.cursorElement) {
      this.cursorElement.remove();
      this.cursorElement = null;
    }
  }

  private createHighlight(): void {
    this.removeHighlight();
    this.highlightElement = document.createElement("div");
    this.highlightElement.id = "opensin-demo-highlight";
    this.highlightElement.style.cssText = `
      position: fixed;
      border: 2px solid #3b82f6;
      background: rgba(59, 130, 246, 0.15);
      border-radius: 4px;
      pointer-events: none;
      z-index: 2147483646;
      transition: all 0.3s ease;
      left: 0;
      top: 0;
      width: 0;
      height: 0;
    `;
    document.body.appendChild(this.highlightElement);
  }

  private removeHighlight(): void {
    if (this.highlightElement) {
      this.highlightElement.remove();
      this.highlightElement = null;
    }
  }

  private wait(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export function createDemoRenderer(speedMultiplier: number = 1): DemoRenderer {
  return new DemoRenderer(speedMultiplier);
}
