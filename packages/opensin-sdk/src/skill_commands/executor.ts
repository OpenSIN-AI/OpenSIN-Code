import {
  SkillDefinition,
  SkillInvocation,
  SkillResult,
  SkillExecutionMode,
  SkillFallbackResult,
} from "./types.js";
import { SkillRegistry, getSkillRegistry } from "./registry.js";
import { FallbackEngine, getFallbackEngine } from "./fallback.js";

let instance: SkillExecutor | null = null;

export class SkillExecutor {
  private registry: SkillRegistry;
  private fallbackEngine: FallbackEngine;
  private executionHistory: Map<string, SkillResult[]> = new Map();
  private maxHistoryPerSkill = 50;

  constructor(
    registry?: SkillRegistry,
    fallbackEngine?: FallbackEngine
  ) {
    this.registry = registry || getSkillRegistry();
    this.fallbackEngine = fallbackEngine || getFallbackEngine();
  }

  async execute(
    invocation: SkillInvocation,
    mode: SkillExecutionMode = "hybrid"
  ): Promise<SkillResult> {
    const startTime = Date.now();
    const skill = this.registry.getById(invocation.skillId);

    if (!skill) {
      return {
        success: false,
        output: "",
        error: `Skill not found: ${invocation.skillId}`,
        executionTimeMs: Date.now() - startTime,
        usedFallback: false,
      };
    }

    const validation = this.registry.validateParameters(
      invocation.skillId,
      invocation.parameters
    );

    if (!validation.valid) {
      return {
        success: false,
        output: "",
        error: `Parameter validation failed: ${validation.errors.join("; ")}`,
        executionTimeMs: Date.now() - startTime,
        usedFallback: false,
      };
    }

    const paramsWithDefaults = this.registry.applyDefaults(
      invocation.skillId,
      invocation.parameters
    );

    if (mode === "fallback") {
      return this.executeWithFallback(skill, paramsWithDefaults, invocation.context);
    }

    try {
      const result = await this.executeDirect(skill, paramsWithDefaults, invocation.context);
      this.recordHistory(invocation.skillId, result);
      return result;
    } catch (error) {
      if (mode === "hybrid") {
        const fallbackResult = await this.executeWithFallback(
          skill,
          paramsWithDefaults,
          invocation.context
        );
        return {
          success: fallbackResult.success,
          output: fallbackResult.output,
          error: fallbackResult.originalError,
          executionTimeMs: fallbackResult.executionTimeMs,
          usedFallback: true,
        };
      }

      const result: SkillResult = {
        success: false,
        output: "",
        error: error instanceof Error ? error.message : String(error),
        executionTimeMs: Date.now() - startTime,
        usedFallback: false,
      };
      this.recordHistory(invocation.skillId, result);
      return result;
    }
  }

  async executeBySlashCommand(
    command: string,
    args: Record<string, unknown>,
    context?: string,
    mode: SkillExecutionMode = "hybrid"
  ): Promise<SkillResult> {
    const skill = this.registry.getBySlashCommand(command);
    if (!skill) {
      return {
        success: false,
        output: "",
        error: `Unknown slash command: ${command}`,
        executionTimeMs: 0,
        usedFallback: false,
      };
    }

    const invocation: SkillInvocation = {
      skillId: skill.id,
      parameters: args,
      context,
      invokedAt: new Date().toISOString(),
    };

    return this.execute(invocation, mode);
  }

  getHistory(skillId: string): SkillResult[] {
    return this.executionHistory.get(skillId) || [];
  }

  clearHistory(skillId?: string): void {
    if (skillId) {
      this.executionHistory.delete(skillId);
    } else {
      this.executionHistory.clear();
    }
  }

  private async executeDirect(
    skill: SkillDefinition,
    params: Record<string, unknown>,
    context?: string
  ): Promise<SkillResult> {
    const startTime = Date.now();
    const enrichedPrompt = this.buildEnrichedPrompt(skill, params, context);

    const timeout = skill.timeoutMs || 30000;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await this.invokeSkillServer(skill, enrichedPrompt, controller.signal);
      clearTimeout(timeoutId);

      const result: SkillResult = {
        success: true,
        output: response,
        executionTimeMs: Date.now() - startTime,
        usedFallback: false,
      };

      return result;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  private async executeWithFallback(
    skill: SkillDefinition,
    params: Record<string, unknown>,
    context?: string
  ): Promise<SkillFallbackResult> {
    const startTime = Date.now();

    try {
      const directResult = await this.executeDirect(skill, params, context);
      return {
        success: directResult.success,
        output: directResult.output,
        fallbackReason: "",
        executionTimeMs: directResult.executionTimeMs,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return this.fallbackEngine.executeFallback(
        skill,
        params,
        context,
        errorMessage
      );
    }
  }

  private buildEnrichedPrompt(
    skill: SkillDefinition,
    params: Record<string, unknown>,
    context?: string
  ): string {
    const parts = [skill.systemPrompt, "", "## Parameters"];

    for (const [key, value] of Object.entries(params)) {
      parts.push(`- ${key}: ${JSON.stringify(value)}`);
    }

    if (context) {
      parts.push("", "## Context", context);
    }

    return parts.join("\n");
  }

  private async invokeSkillServer(
    skill: SkillDefinition,
    prompt: string,
    signal: AbortSignal
  ): Promise<string> {
    const response = await fetch("http://localhost:8000/skills/execute", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        skillId: skill.id,
        prompt,
        parameters: {},
      }),
      signal,
    });

    if (!response.ok) {
      throw new Error(`Skill server error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.output || "";
  }

  private recordHistory(skillId: string, result: SkillResult): void {
    const history = this.executionHistory.get(skillId) || [];
    history.push(result);
    if (history.length > this.maxHistoryPerSkill) {
      history.shift();
    }
    this.executionHistory.set(skillId, history);
  }
}

export function getSkillExecutor(
  registry?: SkillRegistry,
  fallbackEngine?: FallbackEngine
): SkillExecutor {
  if (!instance) {
    instance = new SkillExecutor(registry, fallbackEngine);
  }
  return instance;
}

export function resetSkillExecutor(): void {
  instance = null;
}
