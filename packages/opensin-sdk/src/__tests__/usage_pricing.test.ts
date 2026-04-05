import { describe, it, expect, beforeEach } from 'vitest'
import { UsagePricing, createPricing } from '../usage_pricing/pricing.js'

describe('UsagePricing', () => {
  let p: UsagePricing
  beforeEach(() => { p = createPricing() })

  it('should estimate cost', () => { expect(p.estimateCost('openai/gpt-4o', 1000, 500)).toBeCloseTo(0.0075, 4) })
  it('should return 0 for unknown model', () => { expect(p.estimateCost('unknown', 1000, 500)).toBe(0) })

  it('should summarize usage', () => {
    p.recordUsage({ model: 'openai/gpt-4o', inputTokens: 1000, outputTokens: 500, cost: 0.0075, duration: 500, timestamp: Date.now() })
    p.recordUsage({ model: 'openai/gpt-4o-mini', inputTokens: 500, outputTokens: 200, cost: 0.000195, duration: 200, timestamp: Date.now() })
    const s = p.getSummary()
    expect(s.totalCost).toBeCloseTo(0.007695, 5)
    expect(s.requestCount).toBe(2)
    expect(Object.keys(s.modelBreakdown)).toHaveLength(2)
  })

  it('should filter by model', () => {
    p.recordUsage({ model: 'a', inputTokens: 100, outputTokens: 50, cost: 0.001, duration: 100, timestamp: Date.now() })
    p.recordUsage({ model: 'b', inputTokens: 200, outputTokens: 100, cost: 0.002, duration: 200, timestamp: Date.now() })
    expect(p.getRecords('a')).toHaveLength(1)
  })

  it('should format costs and tokens', () => {
    expect(p.formatCost(5.50)).toBe('$5.50')
    expect(p.formatTokens(5_000_000)).toBe('5.0M')
  })

  it('should support custom pricing', () => {
    p.setCustomPricing('custom/m', { model: 'c', inputPerMTok: 100, outputPerMTok: 200 })
    expect(p.estimateCost('custom/m', 1_000_000, 1_000_000)).toBe(300)
  })

  it('should clear', () => {
    p.recordUsage({ model: 't', inputTokens: 100, outputTokens: 50, cost: 0.001, duration: 100, timestamp: Date.now() })
    p.clear()
    expect(p.getSummary().requestCount).toBe(0)
  })
})
