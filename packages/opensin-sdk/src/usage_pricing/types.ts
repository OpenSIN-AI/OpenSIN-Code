export interface PricingTier {
  model: string
  inputPerMTok: number
  outputPerMTok: number
  cacheReadPerMTok?: number
  cacheWritePerMTok?: number
}

export interface UsageRecord {
  model: string
  inputTokens: number
  outputTokens: number
  cacheReadTokens?: number
  cacheWriteTokens?: number
  cost: number
  duration: number
  timestamp: number
}

export interface UsageSummary {
  totalCost: number
  totalInputTokens: number
  totalOutputTokens: number
  totalTokens: number
  requestCount: number
  avgCostPerRequest: number
  avgTokensPerRequest: number
  modelBreakdown: Record<string, { cost: number; tokens: number; requests: number }>
}

export const PRICING_TIERS: Record<string, PricingTier> = {
  'openai/gpt-4o': { model: 'gpt-4o', inputPerMTok: 2.5, outputPerMTok: 10 },
  'openai/gpt-4o-mini': { model: 'gpt-4o-mini', inputPerMTok: 0.15, outputPerMTok: 0.6 },
  'openai/o1': { model: 'o1', inputPerMTok: 15, outputPerMTok: 60 },
  'openai/o1-mini': { model: 'o1-mini', inputPerMTok: 1.1, outputPerMTok: 4.4 },
  'openai/gpt-5.4': { model: 'gpt-5.4', inputPerMTok: 2.5, outputPerMTok: 10 },
  'google/antigravity-claude-sonnet-4-6': { model: 'claude-sonnet-4-6', inputPerMTok: 3, outputPerMTok: 15 },
  'google/antigravity-gemini-3.1-pro': { model: 'gemini-3.1-pro', inputPerMTok: 1.25, outputPerMTok: 5 },
  'google/antigravity-gemini-3-flash': { model: 'gemini-3-flash', inputPerMTok: 0.0375, outputPerMTok: 0.3 },
  'nvidia-nim/qwen-3.5-122b': { model: 'qwen-3.5-122b', inputPerMTok: 1.2, outputPerMTok: 1.2 },
  'nvidia-nim/qwen-3.5-397b': { model: 'qwen-3.5-397b', inputPerMTok: 3, outputPerMTok: 3 },
}
