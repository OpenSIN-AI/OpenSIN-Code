import { describe, it, expect, beforeEach } from 'vitest'
import { SmartModelRouter, createRouter } from '../model_routing/router.js'

describe('SmartModelRouter', () => {
  let router: SmartModelRouter
  beforeEach(() => { router = createRouter() })

  it('should classify trivial tasks', () => {
    expect(router.getClassification('Hi')).toBe('trivial')
    expect(router.getClassification('A'.repeat(100))).toBe('trivial')
  })

  it('should classify simple tasks', () => {
    const text = 'Write a comprehensive Python function that calculates the factorial of a given number using recursion and handles all edge cases properly including negative numbers and zero values'
    expect(router.getClassification(text)).toBe('simple')
  })

  it('should classify moderate tasks', () => { expect(router.getClassification('Write a function that '.repeat(20))).toBe('moderate') })
  it('should classify complex tasks', () => { expect(router.getClassification('Write a function that '.repeat(100))).toBe('complex') })
  it('should classify expert tasks', () => { expect(router.getClassification('Write a function that '.repeat(500))).toBe('expert') })

  it('should route trivial tasks to cheap model', () => {
    const d = router.route('Hi')
    expect(d.modelId).toBe('openai/gpt-4o-mini')
    expect(d.complexity).toBe('trivial')
  })

  it('should route moderate tasks to default model', () => {
    const d = router.route('Write a function that '.repeat(20))
    expect(d.modelId).toBe('openai/gpt-4o')
  })

  it('should route complex tasks to expert model', () => {
    const d = router.route('Write a function that '.repeat(100))
    expect(d.modelId).toBe('openai/o1')
  })

  it('should override to default model when tool use required and cheap lacks it', () => {
    const r = new SmartModelRouter({ cheapModel: { id: 'x', name: 'x', provider: 't', inputCostPerMTok: 0.1, outputCostPerMTok: 0.5, contextLimit: 8000, maxOutputTokens: 4096, capabilities: ['streaming'] } })
    expect(r.route('Hi', true).modelId).toBe('openai/gpt-4o')
  })

  it('should detect fallback errors', () => {
    expect(router.shouldFallback(new Error('rate_limit'))).toBe(true)
    expect(router.shouldFallback(new Error('context_length'))).toBe(true)
    expect(router.shouldFallback(new Error('ok'))).toBe(false)
  })

  it('should track usage', () => {
    router.recordUsage({ modelId: 't', inputTokens: 100, outputTokens: 50, cost: 0.001, duration: 100, success: true, timestamp: Date.now() })
    expect(router.getUsageHistory()).toHaveLength(1)
    expect(router.getTotalCost()).toBe(0.001)
  })

  it('should calculate success rate', () => {
    router.recordUsage({ modelId: 't', inputTokens: 100, outputTokens: 50, cost: 0, duration: 100, success: true, timestamp: Date.now() })
    router.recordUsage({ modelId: 't', inputTokens: 100, outputTokens: 50, cost: 0, duration: 100, success: false, timestamp: Date.now() })
    expect(router.getSuccessRate()).toBe(0.5)
  })
})
