import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { FailoverRouter, createFailoverRouter, OPENSIN_MODELS, DEFAULT_CHAINS } from '../model_routing/failover'
import type { FailoverEvent, FailoverChain } from '../model_routing/failover'

describe('FailoverRouter', () => {
  let router: FailoverRouter

  beforeEach(() => {
    router = createFailoverRouter()
  })

  it('should route to first available model in default chain', () => {
    const result = router.route('Hello world')
    expect(result.selectedModel).toBeDefined()
    expect(result.selectedModel.id).toBe('openai/gpt-5.4')
    expect(result.chainId).toBe('default')
    expect(result.attempt).toBe(1)
  })

  it('should use fast chain when preferSpeed is set', () => {
    const result = router.route('Quick task', { preferSpeed: true })
    expect(result.selectedModel.id).toBe('google/antigravity-gemini-3-flash')
  })

  it('should use reasoning chain for reasoning tasks', () => {
    const result = router.route('Analyze this', { requiresReasoning: true })
    expect(result.selectedModel.id).toBe('google/antigravity-claude-opus-4-6-thinking')
  })

  it('should use long-context chain for long context tasks', () => {
    const result = router.route('Long doc', { requiresLongContext: true })
    expect(result.selectedModel.id).toBe('google/antigravity-gemini-3.1-pro')
  })

  it('should skip models on cooldown after failure', () => {
    router.reportFailure('openai/gpt-5.4', 'rate_limit')
    const result = router.route('Hello world')
    expect(result.selectedModel.id).not.toBe('openai/gpt-5.4')
  })

  it('should get fallback model', () => {
    const fallback = router.getFallback('openai/gpt-5.4', 'default', 'error')
    expect(fallback).not.toBeNull()
    expect(fallback!.selectedModel.id).toBe('google/antigravity-claude-sonnet-4-6')
    expect(fallback!.fallbackFrom).toBe('openai/gpt-5.4')
  })

  it('should return null when chain is exhausted', () => {
    const chain = router.getChain('default')!
    const lastModel = chain.models[chain.models.length - 1]
    const fallback = router.getFallback(lastModel.id, 'default', 'error')
    expect(fallback).toBeNull()
  })

  it('should report success and reduce failure count', () => {
    router.reportFailure('openai/gpt-5.4', 'error1')
    const health1 = router.getModelHealth('openai/gpt-5.4')
    expect(health1!.failures).toBe(1)

    router.reportSuccess('openai/gpt-5.4')
    const health2 = router.getModelHealth('openai/gpt-5.4')
    expect(health2!.failures).toBe(0)
    expect(health2!.cooldownUntil).toBeNull()
  })

  it('should list chains', () => {
    const chains = router.listChains()
    expect(chains.length).toBe(4)
  })

  it('should get chain by id', () => {
    const chain = router.getChain('default')
    expect(chain).toBeDefined()
    expect(chain!.name).toBe('Default Chain')
  })

  it('should set active chain', () => {
    router.setActiveChain('fast')
    const result = router.route('Hello')
    expect(result.chainId).toBe('fast')
  })

  it('should add custom chain', () => {
    const customChain: FailoverChain = {
      id: 'custom',
      name: 'Custom Chain',
      models: [OPENSIN_MODELS[0]],
      strategy: 'cost-first',
    }
    router.addChain(customChain)
    expect(router.getChain('custom')).toBeDefined()
  })

  it('should track recent routes', () => {
    router.route('Task 1')
    router.route('Task 2')
    const recent = router.getRecentRoutes(5)
    expect(recent.length).toBe(2)
  })

  it('should emit fallback events', () => {
    const events: FailoverEvent[] = []
    router.onEvent(e => events.push(e))

    router.reportFailure('openai/gpt-5.4', 'test_error')

    const fallback = events.find(e => e.type === 'fallback')
    expect(fallback).toBeDefined()
    expect(fallback!.modelId).toBe('openai/gpt-5.4')
  })

  it('should skip models without vision capability when required', () => {
    const result = router.route('Analyze image', { requiresVision: true })
    expect(result.selectedModel.capabilities).toContain('vision')
  })

  it('should estimate latency based on profile', () => {
    const result = router.route('Hello')
    expect(result.estimatedLatencyMs).toBeGreaterThan(0)
  })

  it('should allow unsubscribing from events', () => {
    const events: FailoverEvent[] = []
    const unsub = router.onEvent(e => events.push(e))

    router.route('test1')
    unsub()
    router.route('test2')

    expect(events.length).toBe(1)
  })
})

describe('OPENSIN_MODELS', () => {
  it('should contain all expected models', () => {
    const ids = OPENSIN_MODELS.map(m => m.id)
    expect(ids).toContain('openai/gpt-5.4')
    expect(ids).toContain('google/antigravity-claude-sonnet-4-6')
    expect(ids).toContain('google/antigravity-gemini-3.1-pro')
    expect(ids).toContain('google/antigravity-claude-opus-4-6-thinking')
    expect(ids).toContain('google/antigravity-gemini-3-flash')
    expect(ids).toContain('nvidia-nim/qwen-3.5-397b')
  })

  it('should have valid config for all models', () => {
    for (const model of OPENSIN_MODELS) {
      expect(model.id).toBeTruthy()
      expect(model.provider).toBeTruthy()
      expect(model.contextLimit).toBeGreaterThan(0)
      expect(model.maxOutputTokens).toBeGreaterThan(0)
      expect(model.capabilities.length).toBeGreaterThan(0)
    }
  })
})

describe('DEFAULT_CHAINS', () => {
  it('should have 4 chains', () => {
    expect(DEFAULT_CHAINS.length).toBe(4)
  })

  it('should have models in every chain', () => {
    for (const chain of DEFAULT_CHAINS) {
      expect(chain.models.length).toBeGreaterThan(0)
    }
  })
})
