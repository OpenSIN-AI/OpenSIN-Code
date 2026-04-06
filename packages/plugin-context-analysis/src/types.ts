export interface TurnTokenUsage {
  turnId: number;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  timestamp: string;
}

export interface SessionTokenStats {
  sessionId: string;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalTokens: number;
  turnCount: number;
  avgTokensPerTurn: number;
  maxTokensInTurn: number;
  turns: TurnTokenUsage[];
}

export interface CostEstimate {
  inputCost: number;
  outputCost: number;
  totalCost: number;
  currency: string;
  model: string;
}

export interface AnalysisConfig {
  inputCostPer1K: number;
  outputCostPer1K: number;
  model: string;
  currency: string;
}
