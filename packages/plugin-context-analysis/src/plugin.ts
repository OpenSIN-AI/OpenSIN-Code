import type { TurnTokenUsage, SessionTokenStats, CostEstimate, AnalysisConfig } from './types.js';

const DEFAULT_CONFIG: AnalysisConfig = {
  inputCostPer1K: 0.0025,
  outputCostPer1K: 0.01,
  model: 'gpt-4',
  currency: 'USD',
};

export function estimateCost(
  inputTokens: number,
  outputTokens: number,
  config: Partial<AnalysisConfig> = {}
): CostEstimate {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const inputCost = (inputTokens / 1000) * cfg.inputCostPer1K;
  const outputCost = (outputTokens / 1000) * cfg.outputCostPer1K;
  return {
    inputCost: Math.round(inputCost * 10000) / 10000,
    outputCost: Math.round(outputCost * 10000) / 10000,
    totalCost: Math.round((inputCost + outputCost) * 10000) / 10000,
    currency: cfg.currency,
    model: cfg.model,
  };
}

export class ContextAnalysisPlugin {
  private config: AnalysisConfig;
  private turns: TurnTokenUsage[] = [];
  private sessionId: string;
  private turnCounter = 0;

  constructor(sessionId?: string, config?: Partial<AnalysisConfig>) {
    this.sessionId = sessionId ?? 'session-' + Date.now();
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  recordTurn(inputTokens: number, outputTokens: number): TurnTokenUsage {
    this.turnCounter++;
    const turn: TurnTokenUsage = {
      turnId: this.turnCounter,
      inputTokens,
      outputTokens,
      totalTokens: inputTokens + outputTokens,
      timestamp: new Date().toISOString(),
    };
    this.turns.push(turn);
    return turn;
  }

  getTokenUsage(): SessionTokenStats {
    const totalInput = this.turns.reduce((s, t) => s + t.inputTokens, 0);
    const totalOutput = this.turns.reduce((s, t) => s + t.outputTokens, 0);
    const total = totalInput + totalOutput;
    const count = this.turns.length;
    const maxTurn = this.turns.length > 0
      ? Math.max(...this.turns.map(t => t.totalTokens))
      : 0;
    return {
      sessionId: this.sessionId,
      totalInputTokens: totalInput,
      totalOutputTokens: totalOutput,
      totalTokens: total,
      turnCount: count,
      avgTokensPerTurn: count > 0 ? Math.round(total / count) : 0,
      maxTokensInTurn: maxTurn,
      turns: [...this.turns],
    };
  }

  getCostEstimate(): CostEstimate {
    const stats = this.getTokenUsage();
    return estimateCost(stats.totalInputTokens, stats.totalOutputTokens, this.config);
  }

  getTurnCost(turnId: number): CostEstimate | null {
    const turn = this.turns.find(t => t.turnId === turnId);
    if (!turn) return null;
    return estimateCost(turn.inputTokens, turn.outputTokens, this.config);
  }

  reset(): void {
    this.turns = [];
    this.turnCounter = 0;
  }

  getConfig(): AnalysisConfig { return { ...this.config }; }
  setConfig(config: Partial<AnalysisConfig>): void { this.config = { ...this.config, ...config }; }

  getManifest() {
    return {
      id: 'context-analysis', name: 'Context Analysis Plugin', version: '0.1.0',
      description: 'Token usage tracking and cost estimation for OpenSIN CLI', author: 'OpenSIN-AI', license: 'MIT',
    };
  }
}
