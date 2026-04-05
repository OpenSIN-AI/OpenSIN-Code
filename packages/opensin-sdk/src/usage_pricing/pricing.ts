import type { PricingTier, UsageRecord, UsageSummary } from './types.js'
import { PRICING_TIERS } from './types.js'

export class UsagePricing {
  private records: UsageRecord[] = []
  private customPricing: Record<string, PricingTier> = {}

  setCustomPricing(model: string, tier: PricingTier): void { this.customPricing[model] = tier }
  getPricing(model: string): PricingTier | undefined { return this.customPricing[model] ?? PRICING_TIERS[model] }

  estimateCost(model: string, inputTokens: number, outputTokens: number): number {
    const pricing = this.getPricing(model)
    if (!pricing) return 0
    return (inputTokens / 1_000_000) * pricing.inputPerMTok + (outputTokens / 1_000_000) * pricing.outputPerMTok
  }

  recordUsage(record: UsageRecord): void { this.records.push(record) }

  getSummary(): UsageSummary {
    const totalCost = this.records.reduce((s, r) => s + r.cost, 0)
    const totalInput = this.records.reduce((s, r) => s + r.inputTokens, 0)
    const totalOutput = this.records.reduce((s, r) => s + r.outputTokens, 0)
    const count = this.records.length
    const modelBreakdown: Record<string, { cost: number; tokens: number; requests: number }> = {}
    for (const r of this.records) {
      if (!modelBreakdown[r.model]) modelBreakdown[r.model] = { cost: 0, tokens: 0, requests: 0 }
      modelBreakdown[r.model].cost += r.cost
      modelBreakdown[r.model].tokens += r.inputTokens + r.outputTokens
      modelBreakdown[r.model].requests += 1
    }
    return { totalCost, totalInputTokens: totalInput, totalOutputTokens: totalOutput, totalTokens: totalInput + totalOutput, requestCount: count, avgCostPerRequest: count > 0 ? totalCost / count : 0, avgTokensPerRequest: count > 0 ? (totalInput + totalOutput) / count : 0, modelBreakdown }
  }

  getRecords(model?: string): UsageRecord[] { return model ? this.records.filter((r) => r.model === model) : [...this.records] }
  clear(): void { this.records = [] }
  formatCost(usd: number): string {
    if (usd < 0.01) return `$${(usd * 100).toFixed(2)}¢`
    if (usd < 1) return `$${usd.toFixed(3)}`
    return `$${usd.toFixed(2)}`
  }
  formatTokens(count: number): string {
    if (count < 1000) return `${count}`
    if (count < 1_000_000) return `${(count / 1000).toFixed(1)}K`
    return `${(count / 1_000_000).toFixed(1)}M`
  }
}

export function createPricing(): UsagePricing { return new UsagePricing() }
