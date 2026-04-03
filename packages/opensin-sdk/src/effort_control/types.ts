export enum EffortLevel {
  Minimal = "minimal",
  Low = "low",
  Medium = "medium",
  High = "high",
  Maximum = "maximum",
}

export interface EffortProfile {
  reasoningDepth: number;
  tokenBudget: number;
  maxTokens: number;
  responseQuality: number;
  toolUseLimit: number;
  description: string;
  icon: string;
}

export interface EffortConfig {
  level: EffortLevel;
  profile: EffortProfile;
  sessionOverrides?: Map<string, EffortLevel>;
  skillOverrides?: Map<string, EffortLevel>;
  updatedAt: number;
}

export interface EffortState {
  currentLevel: EffortLevel;
  sessionLevels: Map<string, EffortLevel>;
  skillOverrides: Map<string, EffortLevel>;
  defaultLevel: EffortLevel;
}

export interface EffortFrontmatter {
  effort?: EffortLevel;
  min_effort?: EffortLevel;
  max_tokens?: number;
  reasoning_depth?: number;
}

export interface EffortChangeEvent {
  sessionId?: string;
  previousLevel: EffortLevel;
  newLevel: EffortLevel;
  source: "user" | "skill" | "command" | "frontmatter";
  timestamp: number;
}

export const EFFORT_PROFILES: Record<EffortLevel, EffortProfile> = {
  [EffortLevel.Minimal]: {
    reasoningDepth: 1,
    tokenBudget: 2000,
    maxTokens: 4000,
    responseQuality: 0.3,
    toolUseLimit: 3,
    description: "Fastest responses, minimal reasoning",
    icon: "\u25CB",
  },
  [EffortLevel.Low]: {
    reasoningDepth: 2,
    tokenBudget: 4000,
    maxTokens: 8000,
    responseQuality: 0.5,
    toolUseLimit: 8,
    description: "Quick responses with light reasoning",
    icon: "\u25D0",
  },
  [EffortLevel.Medium]: {
    reasoningDepth: 3,
    tokenBudget: 8000,
    maxTokens: 16000,
    responseQuality: 0.7,
    toolUseLimit: 15,
    description: "Balanced reasoning and quality",
    icon: "\u25D1",
  },
  [EffortLevel.High]: {
    reasoningDepth: 5,
    tokenBudget: 16000,
    maxTokens: 32000,
    responseQuality: 0.85,
    toolUseLimit: 30,
    description: "Deep reasoning, thorough responses",
    icon: "\u25D2",
  },
  [EffortLevel.Maximum]: {
    reasoningDepth: 8,
    tokenBudget: 32000,
    maxTokens: 64000,
    responseQuality: 1.0,
    toolUseLimit: -1,
    description: "Maximum depth, no shortcuts",
    icon: "\u25C9",
  },
};

export const EFFORT_PROFILES: Record<EffortLevel, EffortProfile> = {
  [EffortLevel.Minimal]: {
    reasoningDepth: 1,
    tokenBudget: 2000,
    maxTokens: 4000,
    responseQuality: 0.3,
    toolUseLimit: 3,
    description: "Fastest responses, minimal reasoning",
    icon: "\u25CB",
  },
  [EffortLevel.Low]: {
    reasoningDepth: 2,
    tokenBudget: 4000,
    maxTokens: 8000,
    responseQuality: 0.5,
    toolUseLimit: 8,
    description: "Quick responses with light reasoning",
    icon: "\u25D0",
  },
  [EffortLevel.Medium]: {
    reasoningDepth: 3,
    tokenBudget: 8000,
    maxTokens: 16000,
    responseQuality: 0.7,
    toolUseLimit: 15,
    description: "Balanced reasoning and quality",
    icon: "\u25D1",
  },
  [EffortLevel.High]: {
    reasoningDepth: 5,
    tokenBudget: 16000,
    maxTokens: 32000,
    responseQuality: 0.85,
    toolUseLimit: 30,
    description: "Deep reasoning, thorough responses",
    icon: "\u25D2",
  },
  [EffortLevel.Maximum]: {
    reasoningDepth: 8,
    tokenBudget: 32000,
    maxTokens: 64000,
    responseQuality: 1.0,
    toolUseLimit: -1,
    description: "Maximum depth, no shortcuts",
    icon: "\u25C9",
  },
};

export const EFFORT_CONFIGS: Record<EffortLevel, EffortConfig> = {
  [EffortLevel.Minimal]: {
    level: EffortLevel.Minimal,
    profile: EFFORT_PROFILES[EffortLevel.Minimal],
    updatedAt: Date.now(),
  },
  [EffortLevel.Low]: {
    level: EffortLevel.Low,
    profile: EFFORT_PROFILES[EffortLevel.Low],
    updatedAt: Date.now(),
  },
  [EffortLevel.Medium]: {
    level: EffortLevel.Medium,
    profile: EFFORT_PROFILES[EffortLevel.Medium],
    updatedAt: Date.now(),
  },
  [EffortLevel.High]: {
    level: EffortLevel.High,
    profile: EFFORT_PROFILES[EffortLevel.High],
    updatedAt: Date.now(),
  },
  [EffortLevel.Maximum]: {
    level: EffortLevel.Maximum,
    profile: EFFORT_PROFILES[EffortLevel.Maximum],
    updatedAt: Date.now(),
  },
};
