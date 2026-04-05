import type { ModelConfig, RoutingConfig, RoutingDecision, TaskComplexity, ModelUsageRecord } from './types.js'

const DEFAULT_CHEAP: ModelConfig = {
  id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini', provider: 'openai',
  inputCostPerMTok: 0.15, outputCostPerMTok: 0.6, contextLimit: 128_000,
  maxOutputTokens: 16_384, capabilities: ['tool_use', 'function_calling', 'json_mode', 'streaming'],
}

const DEFAULT_MODEL: ModelConfig = {
  id: 'openai/gpt-4o', name: 'GPT-4o', provider: 'openai',
  inputCostPerMTok: 2.5, outputCostPerMTok: 10, contextLimit: 128_000,
  maxOutputTokens: 16_384, capabilities: ['tool_use', 'vision', 'code', 'reasoning', 'long_context', 'function_calling', 'json_mode', 'streaming'],
}

const EXPERT_MODEL: ModelConfig = {
  id: 'openai/o1', name: 'o1', provider: 'openai',
  inputCostPerMTok: 15, outputCostPerMTok: 60, contextLimit: 200_000,
  maxOutputTokens: 100_000, capabilities: ['tool_use', 'vision', 'code', 'reasoning', 'long_context', 'function_calling', 'json_mode', 'streaming'],
}

const DEFAULT_CFG: RoutingConfig = {
  trivialMaxChars: 160, simpleMaxWords: 28,
  cheapModel: DEFAULT_CHEAP, defaultModel: DEFAULT_MODEL, expertModel: EXPERT_MODEL,
  enableFallback: true, maxRetries: 2,
}

export class SmartModelRouter {
  private config: RoutingConfig
  private usageHistory: ModelUsageRecord[] = []

  constructor(config?: Partial<RoutingConfig>) {
    this.config = { ...DEFAULT_CFG, ...config }
  }

  getClassification(text: string): TaskComplexity {
    if (text.length <= this.config.trivialMaxChars) return 'trivial'
    const wc = text.split(/\s+/).length
    if (wc <= this.config.simpleMaxWords) return 'simple'
    if (wc <= 200) return 'moderate'
    if (wc <= 1000) return 'complex'
    return 'expert'
  }

  route(text: string, requiresToolUse = false): RoutingDecision {
    const complexity = this.getClassification(text)
    let model: ModelConfig
    let fallback: ModelConfig | undefined

    switch (complexity) {
      case 'trivial': case 'simple':
        model = this.config.cheapModel
        fallback = requiresToolUse ? this.config.defaultModel : undefined
        break
      case 'moderate':
        model = this.config.defaultModel
        fallback = this.config.expertModel
        break
      default:
        model = this.config.expertModel
        break
    }

    if (requiresToolUse && !model.capabilities.includes('tool_use')) {
      model = this.config.defaultModel
      fallback = this.config.expertModel
    }

    return {
      modelId: model.id, complexity,
      reason: `${complexity} task (${text.length} chars, ${text.split(/\s+/).length} words)`,
      estimatedCost: 0, fallbackModelId: fallback?.id,
    }
  }

  shouldFallback(error: Error): boolean {
    if (!this.config.enableFallback) return false
    const msg = error.message.toLowerCase()
    return msg.includes('rate_limit') || msg.includes('context_length') || msg.includes('model_overloaded') || msg.includes('insufficient_quota') || msg.includes('server_error') || msg.includes('5')
  }

  recordUsage(r: ModelUsageRecord): void { this.usageHistory.push(r) }
  getUsageHistory(modelId?: string): ModelUsageRecord[] {
    return modelId ? this.usageHistory.filter((r) => r.modelId === modelId) : [...this.usageHistory]
  }
  getTotalCost(): number { return this.usageHistory.reduce((s, r) => s + r.cost, 0) }
  getTotalTokens(): { input: number; output: number } {
    return this.usageHistory.reduce((a, r) => ({ input: a.input + r.inputTokens, output: a.output + r.outputTokens }), { input: 0, output: 0 })
  }
  getSuccessRate(modelId?: string): number {
    const recs = modelId ? this.usageHistory.filter((r) => r.modelId === modelId) : this.usageHistory
    if (recs.length === 0) return 1
    return recs.filter((r) => r.success).length / recs.length
  }
  getConfig(): RoutingConfig { return { ...this.config } }
}

export function createRouter(config?: Partial<RoutingConfig>): SmartModelRouter {
  return new SmartModelRouter(config)
}
