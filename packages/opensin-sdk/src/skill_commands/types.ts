export type SkillParameterType =
  | "string"
  | "number"
  | "boolean"
  | "path"
  | "file"
  | "enum"
  | "json";

export interface SkillParameter {
  name: string;
  description: string;
  type: SkillParameterType;
  required: boolean;
  defaultValue?: unknown;
  enumValues?: string[];
  validationPattern?: string;
}

export interface SkillDefinition {
  id: string;
  name: string;
  description: string;
  slashCommand: string;
  parameters: SkillParameter[];
  systemPrompt: string;
  category: string;
  version: string;
  author?: string;
  tags?: string[];
  timeoutMs?: number;
  requiresApproval: boolean;
  _meta?: Record<string, unknown> | null;
}

export interface SkillInvocation {
  skillId: string;
  parameters: Record<string, unknown>;
  context?: string;
  sessionId?: string;
  invokedAt: string;
  _meta?: Record<string, unknown> | null;
}

export interface SkillResult {
  success: boolean;
  output: string;
  artifacts?: string[];
  error?: string;
  executionTimeMs: number;
  usedFallback: boolean;
  _meta?: Record<string, unknown> | null;
}

export interface SkillFallbackResult {
  success: boolean;
  output: string;
  fallbackReason: string;
  originalError?: string;
  executionTimeMs: number;
}

export interface SkillRegistryConfig {
  skillsPath?: string[];
  cacheEnabled: boolean;
  cacheTtlMs: number;
  maxSkills: number;
}

export interface SkillCommand {
  name: string;
  description: string;
  usage: string;
  parameters: SkillParameter[];
}

export interface SlashCommandParseResult {
  isCommand: boolean;
  skillName: string;
  rawArgs: string;
  parsedArgs: Record<string, unknown>;
  matchedSkill?: SkillDefinition;
}

export type SkillExecutionMode = "direct" | "fallback" | "hybrid";
