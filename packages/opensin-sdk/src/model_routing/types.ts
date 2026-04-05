export interface ModelConfig {
  id: string
  name: string
  provider: string
  inputCostPerMTok: number
  outputCostPerMTok: number
  contextLimit: number
  maxOutputTokens: number
  capabilities: string[]
}

export type TaskComplexity = 'trivial' | 'simple' | 'moderate' | 'complex' | 'expert'

export interface RoutingDecision {
  modelId: string
  complexity: TaskComplexity
  reason: string
  estimatedCost: number
  fallbackModelId?: string
}

export interface RoutingConfig {
  trivialMaxChars: number
  simpleMaxWords: number
  cheapModel: ModelConfig
  defaultModel: ModelConfig
  expertModel: ModelConfig
  enableFallback: boolean
  maxRetries: number
}

export interface ModelUsageRecord {
  modelId: string
  inputTokens: number
  outputTokens: number
  cost: number
  duration: number
  success: boolean
  error?: string
  timestamp: number
}
