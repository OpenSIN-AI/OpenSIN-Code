import {
  SkillDefinition,
  SkillFallbackResult,
} from "./types.js";

let instance: FallbackEngine | null = null;

export class FallbackEngine {
  private fallbackPrompts: Map<string, string> = new Map();

  registerFallback(skillId: string, fallbackPrompt: string): void {
    this.fallbackPrompts.set(skillId, fallbackPrompt);
  }

  getFallback(skillId: string): string | undefined {
    return this.fallbackPrompts.get(skillId);
  }

  async executeFallback(
    skill: SkillDefinition,
    params: Record<string, unknown>,
    context?: string,
    originalError?: string
  ): Promise<SkillFallbackResult> {
    const startTime = Date.now();
    const fallbackPrompt = this.fallbackPrompts.get(skill.id);

    if (!fallbackPrompt) {
      return {
        success: false,
        output: "",
        fallbackReason: "No fallback prompt registered",
        originalError,
        executionTimeMs: Date.now() - startTime,
      };
    }

    const enrichedPrompt = this.buildFallbackPrompt(skill, params, context, fallbackPrompt);

    try {
      const output = await this.invokeLocalFallback(enrichedPrompt, skill);
      return {
        success: true,
        output,
        fallbackReason: originalError || "Skill server unavailable",
        executionTimeMs: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        output: "",
        fallbackReason: `Fallback execution failed: ${error instanceof Error ? error.message : String(error)}`,
        originalError,
        executionTimeMs: Date.now() - startTime,
      };
    }
  }

  private buildFallbackPrompt(
    skill: SkillDefinition,
    params: Record<string, unknown>,
    context: string | undefined,
    fallbackPrompt: string
  ): string {
    const parts = [
      fallbackPrompt,
      "",
      `## Skill: ${skill.name}`,
      `## Description: ${skill.description}`,
      "",
      "## Parameters",
    ];

    for (const [key, value] of Object.entries(params)) {
      parts.push(`- ${key}: ${JSON.stringify(value)}`);
    }

    if (context) {
      parts.push("", "## Context", context);
    }

    parts.push(
      "",
      "Execute this task using your general capabilities since the specialized skill is unavailable."
    );

    return parts.join("\n");
  }

  private async invokeLocalFallback(
    prompt: string,
    skill: SkillDefinition
  ): Promise<string> {
    const response = await fetch("http://localhost:8000/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: prompt,
        systemPrompt: skill.systemPrompt,
        mode: "fallback",
      }),
    });

    if (!response.ok) {
      throw new Error(`Fallback chat error: ${response.status}`);
    }

    const data = await response.json();
    return data.response || data.output || "";
  }
}

export function getFallbackEngine(): FallbackEngine {
  if (!instance) {
    instance = new FallbackEngine();
  }
  return instance;
}

export function resetFallbackEngine(): void {
  instance = null;
}
