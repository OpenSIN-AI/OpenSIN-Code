export type {
  Lesson,
  LessonStep,
  LessonCategory,
  DemoAnimation,
  DemoAction,
  UserProgress,
  LessonProgress,
  PowerupConfig,
  PowerupState,
  Achievement,
  StepResult,
} from "./types.js";

export { LessonEngine, createLessonEngine } from "./lesson_engine.js";
export { DemoRenderer, createDemoRenderer } from "./demo_renderer.js";
export { ProgressTracker, createProgressTracker } from "./progress_tracker.js";

import { LessonEngine } from "./lesson_engine.js";
import { DemoRenderer } from "./demo_renderer.js";
import { ProgressTracker } from "./progress_tracker.js";
import type { PowerupConfig, PowerupState, Lesson } from "./types.js";

export class Powerup {
  private engine: LessonEngine;
  private renderer: DemoRenderer;
  private tracker: ProgressTracker;
  private isActive = false;
  private currentLesson: Lesson | null = null;

  constructor(userId: string, config?: Partial<PowerupConfig>) {
    this.engine = new LessonEngine();
    this.renderer = new DemoRenderer(config?.animationSpeed || 1);
    this.tracker = new ProgressTracker(userId, config);
  }

  activate(): void {
    this.isActive = true;
  }

  deactivate(): void {
    this.isActive = false;
    this.renderer.clear();
  }

  isActiveState(): boolean {
    return this.isActive;
  }

  getEngine(): LessonEngine {
    return this.engine;
  }

  getRenderer(): DemoRenderer {
    return this.renderer;
  }

  getTracker(): ProgressTracker {
    return this.tracker;
  }

  getState(): PowerupState {
    return {
      isActive: this.isActive,
      currentLesson: this.currentLesson,
      currentStepIndex: 0,
      progress: this.tracker.getProgress(),
      isAnimating: false,
      hintsUsed: 0,
      sessionStartTime: Date.now(),
    };
  }
}

export function activatePowerup(userId: string, config?: Partial<PowerupConfig>): Powerup {
  const powerup = new Powerup(userId, config);
  powerup.activate();
  return powerup;
}

export function deactivatePowerup(powerup: Powerup): void {
  powerup.deactivate();
}

export function isPowerupActive(powerup: Powerup): boolean {
  return powerup.isActiveState();
}
