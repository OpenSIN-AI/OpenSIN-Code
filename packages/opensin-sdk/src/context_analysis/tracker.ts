/**
 * OpenSIN Context Analysis — Token usage tracking
 * 
 * Provides detailed token usage analysis for AI sessions.
 */

import type { TokenUsage, TurnRecord, SessionStats } from './types';

// Approximate cost per 1K tokens (OpenAI GPT-4 pricing as reference)
const COST_PER_1K_INPUT = 0.01;
const COST_PER_1K_OUTPUT = 0.03;

export class TokenTracker {
  private turns: TurnRecord[] = [];
  private startTime: number;

  constructor() {
    this.startTime = Date.now();
  }

  recordTurn(record: Omit<TurnRecord, 'turnNumber'>): void {
    this.turns.push({ ...record, turnNumber: this.turns.length + 1 });
  }

  getTurns(): TurnRecord[] {
    return [...this.turns];
  }

  getSessionStats(): SessionStats {
    const totalInput = this.turns.reduce((s, t) => s + t.tokens.input, 0);
    const totalOutput = this.turns.reduce((s, t) => s + t.tokens.output, 0);
    const totalTokens = totalInput + totalOutput;
    const turns = this.turns.length || 1;

    return {
      totalTurns: this.turns.length,
      totalTokens: { input: totalInput, output: totalOutput, total: totalTokens },
      averageTokensPerTurn: {
        input: Math.round(totalInput / turns),
        output: Math.round(totalOutput / turns),
        total: Math.round(totalTokens / turns),
      },
      totalDuration: this.turns.reduce((s, t) => s + t.duration, 0),
      totalToolCalls: this.turns.reduce((s, t) => s + t.toolCalls, 0),
      estimatedCost: (totalInput / 1000) * COST_PER_1K_INPUT + (totalOutput / 1000) * COST_PER_1K_OUTPUT,
    };
  }

  getFormattedReport(): string {
    const stats = this.getSessionStats();
    return [
      `# Session Token Analysis`,
      ``,
      `## Summary`,
      `- Turns: ${stats.totalTurns}`,
      `- Total Tokens: ${stats.totalTokens.total.toLocaleString()}`,
      `  - Input: ${stats.totalTokens.input.toLocaleString()}`,
      `  - Output: ${stats.totalTokens.output.toLocaleString()}`,
      `- Avg Tokens/Turn: ${stats.averageTokensPerTurn.total.toLocaleString()}`,
      `- Tool Calls: ${stats.totalToolCalls}`,
      `- Estimated Cost: $${stats.estimatedCost.toFixed(4)}`,
    ].join('\n');
  }

  reset(): void {
    this.turns = [];
    this.startTime = Date.now();
  }
}
