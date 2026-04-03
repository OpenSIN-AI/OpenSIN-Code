export interface LiveStatusSnapshot {
  sessionId: string
  modelId: string
  tokensIn: number
  tokensOut: number
  totalTokens: number
  costUsd: number
  turnDurationMs: number
  isStreaming: boolean
  timestamp: number
}

export interface TokenUsageDelta {
  inputTokens: number
  outputTokens: number
  totalTokens: number
}

export interface CostInfo {
  inputPerToken: number
  outputPerToken: number
  totalCost: number
  currency: string
}

export interface LiveStatusConfig {
  showTurnDuration: boolean
  showCost: boolean
  showModelInfo: boolean
  updateIntervalMs: number
}

export interface StatusDisplayOptions {
  showTokens: boolean
  showCost: boolean
  showModel: boolean
  showDuration: boolean
}
