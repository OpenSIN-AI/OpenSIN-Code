import {
  ContextAnalysis,
  ContextMetrics,
  ContextTool,
  OptimizationTip,
  ContextOptimizerConfig,
} from "./types.js";
import { ContextAnalyzer } from "./analyzer.js";

export class ContextOptimizer {
  private analyzer: ContextAnalyzer;
  private history: ContextAnalysis[] = [];

  constructor(config?: Partial<ContextOptimizerConfig>) {
    this.analyzer = new ContextAnalyzer(config);
  }

  analyze(
    sessionId: string,
    metrics: ContextMetrics,
    tools: ContextTool[],
  ): ContextAnalysis {
    const analysis = this.analyzer.analyze(sessionId, metrics, tools);
    this.history.push(analysis);
    return analysis;
  }

  getHistory(): ContextAnalysis[] {
    return [...this.history];
  }

  getLatestAnalysis(): ContextAnalysis | null {
    return this.history.length > 0
      ? this.history[this.history.length - 1]
      : null;
  }

  getTopTips(count: number = 3): OptimizationTip[] {
    const latest = this.getLatestAnalysis();
    if (!latest) return [];
    return latest.tips.slice(0, count);
  }

  getTotalPotentialSavings(): number {
    const latest = this.getLatestAnalysis();
    if (!latest) return 0;
    return latest.tips.reduce((sum, tip) => sum + tip.estimatedSavings, 0);
  }

  shouldCompact(minThreshold: number = 80): boolean {
    const latest = this.getLatestAnalysis();
    if (!latest) return false;
    return latest.metrics.usedPercentage >= minThreshold;
  }

  clearHistory(): void {
    this.history = [];
  }

  exportReport(): string {
    const latest = this.getLatestAnalysis();
    if (!latest) return "No context analysis available.";

    const lines: string[] = [];
    lines.push("=== Context Optimization Report ===\n");
    lines.push(`Session: ${latest.sessionId}`);
    lines.push(`Analyzed: ${latest.analyzedAt}\n`);

    lines.push("--- Metrics ---");
    lines.push(
      `Context Usage: ${latest.metrics.usedPercentage.toFixed(1)}%`,
    );
    lines.push(`Total Tokens: ${latest.metrics.totalTokens.toLocaleString()}`);
    lines.push(
      `Available: ${latest.metrics.availableTokens.toLocaleString()}`,
    );
    lines.push(`Messages: ${latest.metrics.messageCount}`);
    lines.push(`Tool Calls: ${latest.metrics.toolCallCount}`);
    lines.push(`File References: ${latest.metrics.fileReferences}`);
    lines.push(`Memory Entries: ${latest.metrics.memoryEntries}\n`);

    if (latest.warnings.length > 0) {
      lines.push("--- Warnings ---");
      for (const w of latest.warnings) {
        const icon =
          w.severity === "critical"
            ? "🔴"
            : w.severity === "warning"
              ? "🟡"
              : "ℹ️";
        lines.push(`${icon} [${w.type.toUpperCase()}] ${w.message}`);
        lines.push(`   ${w.details}\n`);
      }
    }

    if (latest.tips.length > 0) {
      lines.push("--- Optimization Tips ---");
      for (const tip of latest.tips) {
        lines.push(
          `${tip.priority === "high" ? "⚡" : tip.priority === "medium" ? "💡" : "📌"} ${tip.title}`,
        );
        lines.push(`   ${tip.description}`);
        lines.push(`   Action: ${tip.action}`);
        lines.push(
          `   Estimated savings: ~${tip.estimatedSavings.toLocaleString()} tokens\n`,
        );
      }
    }

    const totalSavings = this.getTotalPotentialSavings();
    if (totalSavings > 0) {
      lines.push(
        `Total potential savings: ~${totalSavings.toLocaleString()} tokens`,
      );
    }

    return lines.join("\n");
  }
}
