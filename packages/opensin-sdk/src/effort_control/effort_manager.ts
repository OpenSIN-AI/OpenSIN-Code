import {
  EffortLevel,
  EffortProfile,
  EffortConfig,
  EffortChangeEvent,
  EffortState,
  EffortFrontmatter,
  EFFORT_PROFILES,
} from "./types.js";

let _instance: EffortManager | null = null;

export class EffortManager {
  #state: EffortState;
  #listeners: Array<(event: EffortChangeEvent) => void> = [];

  constructor(options?: { defaultLevel?: EffortLevel }) {
    this.#state = {
      currentLevel: options?.defaultLevel ?? EffortLevel.Medium,
      sessionLevels: new Map(),
      skillOverrides: new Map(),
      defaultLevel: options?.defaultLevel ?? EffortLevel.Medium,
    };
  }

  get currentLevel(): EffortLevel {
    return this.#state.currentLevel;
  }

  get profile(): EffortProfile {
    return EFFORT_PROFILES[this.#state.currentLevel];
  }

  setLevel(level: EffortLevel, sessionId?: string): EffortLevel {
    const previous = sessionId
      ? this.#state.sessionLevels.get(sessionId) ?? this.#state.currentLevel
      : this.#state.currentLevel;

    if (sessionId) {
      this.#state.sessionLevels.set(sessionId, level);
    } else {
      this.#state.currentLevel = level;
    }

    this.#emit({
      sessionId,
      previousLevel: previous,
      newLevel: level,
      source: "user",
      timestamp: Date.now(),
    });

    return level;
  }

  getEffectiveLevel(sessionId?: string): EffortLevel {
    if (sessionId && this.#state.sessionLevels.has(sessionId)) {
      return this.#state.sessionLevels.get(sessionId)!;
    }
    return this.#state.currentLevel;
  }

  applyFrontmatter(frontmatter: EffortFrontmatter, sessionId?: string): EffortLevel {
    if (frontmatter.effort) {
      this.setLevel(frontmatter.effort, sessionId);
      this.#emit({
        sessionId,
        previousLevel: frontmatter.effort,
        newLevel: frontmatter.effort,
        source: "frontmatter",
        timestamp: Date.now(),
      });
    }
    return this.getEffectiveLevel(sessionId);
  }

  setSkillOverride(skillId: string, level: EffortLevel): void {
    const previous = this.#state.skillOverrides.get(skillId);
    this.#state.skillOverrides.set(skillId, level);

    this.#emit({
      previousLevel: previous ?? this.#state.defaultLevel,
      newLevel: level,
      source: "skill",
      timestamp: Date.now(),
    });
  }

  clearSkillOverride(skillId: string): void {
    this.#state.skillOverrides.delete(skillId);
  }

  getSkillOverride(skillId: string): EffortLevel | undefined {
    return this.#state.skillOverrides.get(skillId);
  }

  getConfig(sessionId?: string): EffortConfig {
    const level = this.getEffectiveLevel(sessionId);
    return {
      level,
      profile: EFFORT_PROFILES[level],
      sessionOverrides: new Map(this.#state.sessionLevels),
      skillOverrides: new Map(this.#state.skillOverrides),
      updatedAt: Date.now(),
    };
  }

  onChange(listener: (event: EffortChangeEvent) => void): () => void {
    this.#listeners.push(listener);
    return () => {
      this.#listeners = this.#listeners.filter((l) => l !== listener);
    };
  }

  reset(sessionId?: string): void {
    if (sessionId) {
      this.#state.sessionLevels.delete(sessionId);
    } else {
      this.#state.currentLevel = this.#state.defaultLevel;
      this.#state.sessionLevels.clear();
      this.#state.skillOverrides.clear();
    }
  }

  serialize(): Record<string, unknown> {
    return {
      currentLevel: this.#state.currentLevel,
      defaultLevel: this.#state.defaultLevel,
      sessionLevels: Object.fromEntries(this.#state.sessionLevels),
      skillOverrides: Object.fromEntries(this.#state.skillOverrides),
    };
  }

  static deserialize(data: Record<string, unknown>): EffortManager {
    const manager = new EffortManager({
      defaultLevel: (data["defaultLevel"] as EffortLevel) ?? EffortLevel.Medium,
    });

    if (data["currentLevel"]) {
      manager.#state.currentLevel = data["currentLevel"] as EffortLevel;
    }

    if (data["sessionLevels"]) {
      for (const [sessionId, level] of Object.entries(data["sessionLevels"] as Record<string, string>)) {
        manager.#state.sessionLevels.set(sessionId, level as EffortLevel);
      }
    }

    if (data["skillOverrides"]) {
      for (const [skillId, level] of Object.entries(data["skillOverrides"] as Record<string, string>)) {
        manager.#state.skillOverrides.set(skillId, level as EffortLevel);
      }
    }

    return manager;
  }

  #emit(event: EffortChangeEvent): void {
    for (const listener of this.#listeners) {
      listener(event);
    }
  }
}

export function getEffortManager(): EffortManager {
  if (_instance === null) {
    _instance = new EffortManager();
  }
  return _instance;
}

export function resetEffortManager(): void {
  _instance = null;
}
