import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { AgentOrchestrator, createOrchestrator } from '../orchestrator/index'

describe('AgentOrchestrator', () => {
  let orchestrator: AgentOrchestrator

  beforeEach(() => {
    vi.useFakeTimers()
    orchestrator = createOrchestrator({
      heartbeat: {
        intervalMs: 1000,
        healthReportIntervalMs: 0,
        taskQueuePollIntervalMs: 0,
        autoStart: false,
        maxConsecutiveErrors: 3,
        errorBackoffMs: 100,
        maxErrorBackoffMs: 1000,
        gracefulShutdownTimeoutMs: 5000,
      },
      cronCheckIntervalMs: 1000,
    })
  })

  afterEach(async () => {
    await orchestrator.stop()
    vi.useRealTimers()
  })

  it('should start in idle state', () => {
    const state = orchestrator.getState()
    expect(state.status).toBe('idle')
    expect(state.heartbeatStatus).toBe('stopped')
    expect(state.cronTaskCount).toBe(0)
  })

  it('should start all subsystems', () => {
    const state = orchestrator.start()
    expect(state.status).toBe('running')
    expect(state.heartbeatStatus).toBe('running')
  })

  it('should pause all subsystems', () => {
    orchestrator.start()
    const state = orchestrator.pause()
    expect(state.status).toBe('paused')
  })

  it('should resume all subsystems', () => {
    orchestrator.start()
    orchestrator.pause()
    const state = orchestrator.resume()
    expect(state.status).toBe('running')
  })

  it('should stop all subsystems', async () => {
    orchestrator.start()
    const state = await orchestrator.stop()
    expect(state.status).toBe('idle')
  })

  it('should auto-approve safe actions', async () => {
    const result = await orchestrator.evaluateAction('read_file', { path: '/test.txt' })
    expect(result.approved).toBe(true)
  })

  it('should block destructive actions', async () => {
    const result = await orchestrator.evaluateAction('delete_file', { path: '/test.txt' })
    expect(result.approved).toBe(false)
    expect(result.riskLevel).toBe('approve')
  })

  it('should resolve approval requests', async () => {
    await orchestrator.evaluateAction('delete_file', { path: '/test.txt' })
    const pending = orchestrator.getApproval().getPendingRequests()
    expect(pending.length).toBe(1)

    const resolved = orchestrator.resolveApproval({
      requestId: pending[0].id,
      decision: 'approve',
      resolvedBy: 'admin',
    })
    expect(resolved).not.toBeNull()
    expect(resolved!.status).toBe('approved')
  })

  it('should route models with failover and smart routing', () => {
    const result = orchestrator.routeModel('Hello world', { requiresToolUse: true })
    expect(result.selectedModel).toBeDefined()
    expect(result.selectedModel.id).toBe('openai/gpt-5.4')
    expect(result.routingDecision).toBeDefined()
  })

  it('should route to fast chain when preferSpeed', () => {
    const result = orchestrator.routeModel('Quick', { preferSpeed: true })
    expect(result.selectedModel.id).toBe('google/antigravity-gemini-3-flash')
  })

  it('should add cron tasks', () => {
    const task = orchestrator.addCronTask({
      name: 'Daily Report',
      cronExpression: '0 9 * * *',
      prompt: 'Generate daily report',
      enabled: true,
      timeoutMs: 60000,
      retryOnFailure: false,
      maxRetries: 0,
      metadata: {},
    })
    expect(task.id).toBeTruthy()
    expect(orchestrator.getState().cronTaskCount).toBe(1)
  })

  it('should add approval rules', async () => {
    orchestrator.addApprovalRule({
      id: 'custom-block',
      name: 'Block custom',
      actionPatterns: ['custom_*'],
      riskLevel: 'approve',
      conditions: [],
      timeoutMs: 60000,
      timeoutAction: 'reject',
      enabled: true,
      metadata: {},
    })

    const result = await orchestrator.evaluateAction('custom_action', {})
    expect(result.approved).toBe(false)
  })

  it('should report model failures', () => {
    orchestrator.reportModelFailure('openai/gpt-5.4', 'rate_limit')
    const health = orchestrator.getFailover().getModelHealth('openai/gpt-5.4')
    expect(health!.failures).toBe(1)
  })

  it('should report model successes', () => {
    orchestrator.reportModelFailure('openai/gpt-5.4', 'error')
    orchestrator.reportModelSuccess('openai/gpt-5.4')
    const health = orchestrator.getFailover().getModelHealth('openai/gpt-5.4')
    expect(health!.failures).toBe(0)
  })

  it('should expose all subsystems', () => {
    expect(orchestrator.getHeartbeat()).toBeDefined()
    expect(orchestrator.getCron()).toBeDefined()
    expect(orchestrator.getFailover()).toBeDefined()
    expect(orchestrator.getApproval()).toBeDefined()
    expect(orchestrator.getRouter()).toBeDefined()
    expect(orchestrator.getPermissionEvaluator()).toBeDefined()
  })

  it('should emit orchestrator events', () => {
    const events: import('../orchestrator/index').OrchestratorEvent[] = []
    orchestrator.onEvent(e => events.push(e))

    orchestrator.start()
    const started = events.find(e => e.type === 'started')
    expect(started).toBeDefined()
  })

  it('should allow unsubscribing from events', () => {
    const events: import('../orchestrator/index').OrchestratorEvent[] = []
    const unsub = orchestrator.onEvent(e => events.push(e))

    orchestrator.start()
    unsub()
    orchestrator.pause()

    const hasPaused = events.some(e => e.type === 'paused')
    expect(hasPaused).toBe(false)
  })

  it('should track uptime', () => {
    orchestrator.start()
    const state = orchestrator.getState()
    expect(state.uptimeMs).toBeGreaterThanOrEqual(0)
  })

  it('should track pending approvals count', async () => {
    await orchestrator.evaluateAction('delete_file', { path: '/a.txt' })
    await orchestrator.evaluateAction('deploy_production', { env: 'prod' })

    const state = orchestrator.getState()
    expect(state.pendingApprovals).toBe(2)
  })
})

describe('createOrchestrator', () => {
  it('should create instance with defaults', () => {
    const orch = createOrchestrator()
    expect(orch.getState().status).toBe('idle')
  })

  it('should accept config overrides', () => {
    const orch = createOrchestrator({
      cronCheckIntervalMs: 5000,
    })
    expect(orch.getState().status).toBe('idle')
  })
})
