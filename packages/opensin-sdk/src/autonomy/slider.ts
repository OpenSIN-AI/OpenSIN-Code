import { AutonomyLevel, AutonomyConfig, AdminAutonomyPolicy, AutonomyChangeEvent, AutonomyState } from "./types.js";
import { resolvePermissions } from "./permissions.js";

export class AutonomySlider {
  #state: AutonomyState;
  #listeners: Array<(event: AutonomyChangeEvent) => void> = [];

  constructor(options?: { defaultLevel?: AutonomyLevel; adminPolicy?: AdminAutonomyPolicy }) {
    this.#state = {
      sessionLevels: new Map(),
      projectLevels: new Map(),
      adminPolicy: options?.adminPolicy ?? null,
      defaultLevel: options?.defaultLevel ?? AutonomyLevel.Assist,
    };
  }

  get defaultLevel(): AutonomyLevel {
    return this.#state.defaultLevel;
  }

  get adminPolicy(): AdminAutonomyPolicy | null {
    return this.#state.adminPolicy;
  }

  setAdminPolicy(policy: AdminAutonomyPolicy): void {
    const previous = this.#state.adminPolicy;
    this.#state.adminPolicy = policy;

    if (previous && previous.maxLevel !== policy.maxLevel) {
      this.#enforcePolicy();
    }
  }

  getSessionLevel(sessionId: string): AutonomyLevel {
    return this.#state.sessionLevels.get(sessionId) ?? this.#state.defaultLevel;
  }

  setSessionLevel(sessionId: string, level: AutonomyLevel): AutonomyLevel {
    const previous = this.getSessionLevel(sessionId);
    const effectiveLevel = this.#applyAdminCap(level);

    if (effectiveLevel !== level) {
      throw new Error(
        `Autonomy level "${level}" exceeds admin maximum "${this.#state.adminPolicy?.maxLevel}"`,
      );
    }

    this.#state.sessionLevels.set(sessionId, effectiveLevel);

    this.#emit({
      sessionId,
      previousLevel: previous,
      newLevel: effectiveLevel,
      timestamp: Date.now(),
    });

    return effectiveLevel;
  }

  getProjectLevel(projectPath: string): AutonomyLevel {
    return this.#state.projectLevels.get(projectPath) ?? this.#state.defaultLevel;
  }

  setProjectLevel(projectPath: string, level: AutonomyLevel): AutonomyLevel {
    const previous = this.getProjectLevel(projectPath);
    const effectiveLevel = this.#applyAdminCap(level);

    if (effectiveLevel !== level) {
      throw new Error(
        `Autonomy level "${level}" exceeds admin maximum "${this.#state.adminPolicy?.maxLevel}"`,
      );
    }

    this.#state.projectLevels.set(projectPath, effectiveLevel);

    this.#emit({
      projectPath,
      previousLevel: previous,
      newLevel: effectiveLevel,
      timestamp: Date.now(),
    });

    return effectiveLevel;
  }

  getEffectiveLevel(sessionId?: string, projectPath?: string): AutonomyLevel {
    if (sessionId && this.#state.sessionLevels.has(sessionId)) {
      return this.#state.sessionLevels.get(sessionId)!;
    }
    if (projectPath && this.#state.projectLevels.has(projectPath)) {
      return this.#state.projectLevels.get(projectPath)!;
    }
    return this.#state.defaultLevel;
  }

  getConfig(sessionId?: string, projectPath?: string): AutonomyConfig {
    const level = this.getEffectiveLevel(sessionId, projectPath);
    return {
      level,
      permissions: resolvePermissions(level),
      updatedAt: Date.now(),
    };
  }

  getPermissions(sessionId?: string, projectPath?: string): ReturnType<typeof resolvePermissions> {
    const level = this.getEffectiveLevel(sessionId, projectPath);
    return resolvePermissions(level);
  }

  onChange(listener: (event: AutonomyChangeEvent) => void): () => void {
    this.#listeners.push(listener);
    return () => {
      this.#listeners = this.#listeners.filter((l) => l !== listener);
    };
  }

  serialize(): Record<string, unknown> {
    return {
      defaultLevel: this.#state.defaultLevel,
      sessionLevels: Object.fromEntries(this.#state.sessionLevels),
      projectLevels: Object.fromEntries(this.#state.projectLevels),
      adminPolicy: this.#state.adminPolicy,
    };
  }

  static deserialize(data: Record<string, unknown>): AutonomySlider {
    const slider = new AutonomySlider({
      defaultLevel: (data["defaultLevel"] as AutonomyLevel) ?? AutonomyLevel.Assist,
      adminPolicy: data["adminPolicy"] as AdminAutonomyPolicy | undefined,
    });

    if (data["sessionLevels"]) {
      for (const [sessionId, level] of Object.entries(data["sessionLevels"] as Record<string, string>)) {
        slider.#state.sessionLevels.set(sessionId, level as AutonomyLevel);
      }
    }

    if (data["projectLevels"]) {
      for (const [path, level] of Object.entries(data["projectLevels"] as Record<string, string>)) {
        slider.#state.projectLevels.set(path, level as AutonomyLevel);
      }
    }

    return slider;
  }

  #applyAdminCap(level: AutonomyLevel): AutonomyLevel {
    if (!this.#state.adminPolicy?.enforced) return level;

    const order = [AutonomyLevel.Assist, AutonomyLevel.Collaborate, AutonomyLevel.Autonomous];
    const requestedIndex = order.indexOf(level);
    const maxIndex = order.indexOf(this.#state.adminPolicy.maxLevel);

    if (requestedIndex > maxIndex) {
      return this.#state.adminPolicy.maxLevel;
    }

    return level;
  }

  #enforcePolicy(): void {
    for (const [sessionId, level] of this.#state.sessionLevels) {
      const capped = this.#applyAdminCap(level);
      if (capped !== level) {
        this.#state.sessionLevels.set(sessionId, capped);
      }
    }

    for (const [projectPath, level] of this.#state.projectLevels) {
      const capped = this.#applyAdminCap(level);
      if (capped !== level) {
        this.#state.projectLevels.set(projectPath, capped);
      }
    }
  }

  #emit(event: AutonomyChangeEvent): void {
    for (const listener of this.#listeners) {
      listener(event);
    }
  }
}
