/**
 * OpenSIN Context Analysis Types
 */

export interface TokenUsage {
  input: number;
  output: number;
  total: number;
}

export interface TurnRecord {
  turnNumber: number;
  model: string;
  tokens: TokenUsage;
  duration: number;
  toolCalls: number;
}

export interface SessionStats {
  totalTurns: number;
  totalTokens: TokenUsage;
  averageTokensPerTurn: TokenUsage;
  totalDuration: number;
  totalToolCalls: number;
  estimatedCost: number;
}
