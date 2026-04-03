import {
  ContextAnalysis,
  ContextMetrics,
  ContextTool,
  ContextWarning,
  ContextOptimizerConfig,
} from "./types.js";

const DEFAULT_CONFIG: ContextOptimizerConfig = {
  warningThreshold: 70,
  criticalThreshold: 90,
  maxToolsBeforeWarning: 15,
  maxFileRefsBeforeWarning: 50,
  staleEntryMinutes: 30,
};

export class ContextAnalyzer {
  private config: ContextOptimizerConfig;

  constructor(config?: Partial<ContextOptimizerConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  analyze(
    sessionId: string,
    metrics: ContextMetrics,
    tools: ContextTool[],
  ): ContextAnalysis {
    const warnings = this.detectWarnings(metrics, tools);
    const tips = this.generateTips(metrics, tools, warnings);

    return {
      metrics,
      tools,
      warnings,
      tips,
      analyzedAt: new Date().toISOString(),
      sessionId,
    };
  }

  private detectWarnings(
    metrics: ContextMetrics,
    tools: ContextTool[],
  ): ContextWarning[] {
    const warnings: ContextWarning[] = [];

    if (metrics.usedPercentage >= this.config.criticalThreshold) {
      warnings.push({
        type: "capacity",
        severity: "critical",
        message: "Context capacity is critically high",
        details: `Session is at ${metrics.usedPercentage}% of context window. New tool calls may fail.`,
        tokenImpact: metrics.totalTokens - metrics.availableTokens,
      });
    } else if (metrics.usedPercentage >= this.config.warningThreshold) {
      warnings.push({
        type: "capacity",
        severity: "warning",
        message: "Context capacity is approaching limit",
        details: `Session is at ${metrics.usedPercentage}% of context window.`,
        tokenImpact: metrics.totalTokens - metrics.availableTokens,
      });
    }

    if (tools.length > this.config.maxToolsBeforeWarning) {
      const heavyTools = tools.filter((t) => t.impact === "high");
      warnings.push({
        type: "bloat",
        severity: "warning",
        message: "Excessive tool calls detected",
        details: `${tools.length} tools called. ${heavyTools.length} are high-impact and consuming significant context.`,
        tokenImpact: tools.reduce((sum, t) => sum + t.tokenCost, 0),
      });
    }

    if (metrics.fileReferences > this.config.maxFileRefsBeforeWarning) {
      warnings.push({
        type: "redundancy",
        severity: "warning",
        message: "Too many file references in context",
        details: `${metrics.fileReferences} files referenced. Consider summarizing or removing unused references.`,
        tokenImpact: metrics.fileReferences * 200,
      });
    }

    if (metrics.memoryEntries > 20) {
      warnings.push({
        type: "bloat",
        severity: "info",
        message: "Memory entries may be bloating context",
        details: `${metrics.memoryEntries} memory entries stored. Review for stale or redundant entries.`,
        tokenImpact: metrics.memoryEntries * 100,
      });
    }

    const staleTools = tools.filter((t) => {
      const lastUsed = new Date(t.lastUsed).getTime();
      const staleThreshold =
        Date.now() - this.config.staleEntryMinutes * 60 * 1000;
      return lastUsed < staleThreshold;
    });

    if (staleTools.length > 0) {
      warnings.push({
        type: "stale",
        severity: "info",
        message: "Stale tool references detected",
        details: `${staleTools.length} tools haven't been used in ${this.config.staleEntryMinutes} minutes.`,
        tokenImpact: staleTools.reduce((sum, t) => sum + t.tokenCost, 0),
      });
    }

    return warnings;
  }

  private generateTips(
    metrics: ContextMetrics,
    tools: ContextTool[],
    warnings: ContextWarning[],
  ): import("./types.js").OptimizationTip[] {
    const tips: import("./types.js").OptimizationTip[] = [];
    let tipId = 1;

    const capacityWarnings = warnings.filter((w) => w.type === "capacity");
    if (capacityWarnings.length > 0) {
      tips.push({
        id: `tip-${tipId++}`,
        title: "Reduce context usage",
        description:
          "Your session is running low on context capacity. Consider summarizing earlier conversation or starting a fresh session.",
        action: "Use /compact to summarize the conversation history",
        estimatedSavings: Math.floor(metrics.totalTokens * 0.3),
        category: "context",
        priority: "high",
      });
    }

    const heavyTools = tools.filter((t) => t.impact === "high");
    if (heavyTools.length > 3) {
      tips.push({
        id: `tip-${tipId++}`,
        title: "Consolidate heavy tool calls",
        description: `You've made ${heavyTools.length} high-impact tool calls. Batch similar operations together.`,
        action: "Combine multiple read operations into a single tool call",
        estimatedSavings: heavyTools.reduce((s, t) => s + t.tokenCost, 0) * 0.4,
        category: "tools",
        priority: "medium",
      });
    }

    if (metrics.fileReferences > 20) {
      tips.push({
        id: `tip-${tipId++}`,
        title: "Clean up file references",
        description:
          "Many files are referenced in context. Remove references to files you're no longer working with.",
        action: "Use /clear to remove unused file references",
        estimatedSavings: (metrics.fileReferences - 10) * 150,
        category: "files",
        priority: "medium",
      });
    }

    if (metrics.memoryEntries > 15) {
      tips.push({
        id: `tip-${tipId++}`,
        title: "Prune memory entries",
        description:
          "Memory is accumulating. Review and remove entries that are no longer relevant.",
        action: "Use /memory prune to remove stale entries",
        estimatedSavings: (metrics.memoryEntries - 10) * 80,
        category: "memory",
        priority: "low",
      });
    }

    const redundantTools = tools.filter((t) => t.callCount > 5);
    if (redundantTools.length > 0) {
      tips.push({
        id: `tip-${tipId++}`,
        title: "Reduce repeated tool calls",
        description: `Tools like ${redundantTools[0].name} were called ${redundantTools[0].callCount} times. Cache results when possible.`,
        action: "Store tool results and reuse them instead of re-calling",
        estimatedSavings: redundantTools.reduce(
          (s, t) => s + t.tokenCost * (t.callCount - 1),
          0,
        ),
        category: "tools",
        priority: "medium",
      });
    }

    if (metrics.messageCount > 30) {
      tips.push({
        id: `tip-${tipId++}`,
        title: "Session is getting long",
        description:
          "Long sessions accumulate context overhead. Consider checkpointing progress and starting fresh.",
        action: "Summarize key decisions and continue in a new session",
        estimatedSavings: Math.floor(metrics.totalTokens * 0.2),
        category: "context",
        priority: "low",
      });
    }

    return tips.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }
}
