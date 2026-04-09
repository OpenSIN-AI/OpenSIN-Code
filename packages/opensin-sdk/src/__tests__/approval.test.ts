import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { ApprovalHooks, createApprovalHooks, DEFAULT_RULES } from '../approval/index'
import type { ApprovalEvent, ApprovalRule, ApprovalRequest } from '../approval/index'

describe('ApprovalHooks', () => {
  let hooks: ApprovalHooks

  beforeEach(() => {
    vi.useFakeTimers()
    hooks = createApprovalHooks()
  })

  afterEach(() => {
    hooks.destroy()
    vi.useRealTimers()
  })

  it('should auto-approve safe operations', async () => {
    const result = await hooks.evaluateAction('read_file', { path: '/test.txt' })
    expect(result.approved).toBe(true)
    expect(result.riskLevel).toBe('auto')
  })

  it('should auto-approve search/list operations', async () => {
    const result = await hooks.evaluateAction('grep', { pattern: 'test' })
    expect(result.approved).toBe(true)
    expect(result.riskLevel).toBe('auto')
  })

  it('should notify on write operations', async () => {
    const result = await hooks.evaluateAction('write_file', { path: '/test.txt', content: 'hello' })
    expect(result.approved).toBe(true)
    expect(result.riskLevel).toBe('notify')
    expect(result.requestId).toBeTruthy()
  })

  it('should require approval for destructive operations', async () => {
    const result = await hooks.evaluateAction('delete_file', { path: '/test.txt' })
    expect(result.approved).toBe(false)
    expect(result.riskLevel).toBe('approve')
    expect(result.requestId).toBeTruthy()
  })

  it('should require approval for network operations', async () => {
    const result = await hooks.evaluateAction('deploy_production', { env: 'prod' })
    expect(result.approved).toBe(false)
    expect(result.riskLevel).toBe('approve')
  })

  it('should require approval for financial operations', async () => {
    const result = await hooks.evaluateAction('payment_charge', { amount: 100 })
    expect(result.approved).toBe(false)
    expect(result.riskLevel).toBe('approve')
  })

  it('should require approval for auth operations', async () => {
    const result = await hooks.evaluateAction('token_rotate', { service: 'aws' })
    expect(result.approved).toBe(false)
    expect(result.riskLevel).toBe('approve')
  })

  it('should auto-approve unknown actions', async () => {
    const result = await hooks.evaluateAction('custom_unknown_action', {})
    expect(result.approved).toBe(true)
    expect(result.riskLevel).toBe('auto')
  })

  it('should resolve approval requests', async () => {
    await hooks.evaluateAction('delete_file', { path: '/test.txt' })
    const pending = hooks.getPendingRequests()
    expect(pending.length).toBe(1)

    const resolved = hooks.resolveRequest({
      requestId: pending[0].id,
      decision: 'approve',
      resolvedBy: 'admin',
      reason: 'Confirmed safe',
    })

    expect(resolved).not.toBeNull()
    expect(resolved!.status).toBe('approved')
    expect(resolved!.resolvedBy).toBe('admin')
  })

  it('should reject approval requests', async () => {
    await hooks.evaluateAction('delete_file', { path: '/test.txt' })
    const pending = hooks.getPendingRequests()

    const resolved = hooks.resolveRequest({
      requestId: pending[0].id,
      decision: 'reject',
      resolvedBy: 'admin',
      reason: 'Too risky',
    })

    expect(resolved!.status).toBe('rejected')
  })

  it('should track audit log', async () => {
    await hooks.evaluateAction('delete_file', { path: '/test.txt' })
    const pending = hooks.getPendingRequests()

    hooks.resolveRequest({
      requestId: pending[0].id,
      decision: 'approve',
      resolvedBy: 'admin',
    })

    const log = hooks.getAuditLog()
    expect(log.length).toBe(1)
    expect(log[0].status).toBe('approved')
  })

  it('should send notifications via channel', async () => {
    const notifications: ApprovalRequest[] = []
    hooks.setNotificationChannel(async (req) => {
      notifications.push(req)
    })

    await hooks.evaluateAction('deploy_production', { env: 'prod' })
    expect(notifications.length).toBe(1)
    expect(notifications[0].action).toBe('deploy_production')
  })

  it('should add custom rules', async () => {
    hooks.addRule({
      id: 'custom-block',
      name: 'Block test actions',
      actionPatterns: ['test_block_*'],
      riskLevel: 'approve',
      conditions: [],
      timeoutMs: 60000,
      timeoutAction: 'reject',
      enabled: true,
      metadata: {},
    })

    const result = await hooks.evaluateAction('test_block_action', {})
    expect(result.approved).toBe(false)
    expect(result.riskLevel).toBe('approve')
  })

  it('should remove rules', () => {
    expect(hooks.removeRule('auto-safe-ops')).toBe(true)
    expect(hooks.removeRule('nonexistent')).toBe(false)
  })

  it('should update rules', () => {
    const updated = hooks.updateRule('auto-safe-ops', { enabled: false })
    expect(updated?.enabled).toBe(false)
  })

  it('should list rules', () => {
    const all = hooks.listRules()
    expect(all.length).toBe(DEFAULT_RULES.length)

    const enabled = hooks.listRules(true)
    expect(enabled.length).toBe(DEFAULT_RULES.length)
  })

  it('should emit events', async () => {
    const events: ApprovalEvent[] = []
    hooks.onEvent(e => events.push(e))

    await hooks.evaluateAction('delete_file', { path: '/test.txt' })
    const created = events.find(e => e.type === 'request_created')
    expect(created).toBeDefined()
  })

  it('should allow unsubscribing from events', async () => {
    const events: ApprovalEvent[] = []
    const unsub = hooks.onEvent(e => events.push(e))

    await hooks.evaluateAction('delete_file', { path: '/test.txt' })
    unsub()
    await hooks.evaluateAction('delete_file', { path: '/test2.txt' })

    expect(events.length).toBe(1)
  })

  it('should expire pending requests', () => {
    hooks.createTask && null

    const request: ApprovalRequest = {
      id: 'test-1',
      ruleId: 'approve-destructive-ops',
      action: 'delete_file',
      input: {},
      riskLevel: 'approve',
      status: 'pending',
      requestedAt: new Date(Date.now() - 700000).toISOString(),
      resolvedAt: null,
      resolvedBy: null,
      timeoutMs: 600000,
      expiresAt: new Date(Date.now() - 100000).toISOString(),
    }

    const pending = hooks.getPendingRequests()
    expect(pending.length).toBe(0)
  })
})

describe('DEFAULT_RULES', () => {
  it('should have 6 default rules', () => {
    expect(DEFAULT_RULES.length).toBe(6)
  })

  it('should have unique ids', () => {
    const ids = DEFAULT_RULES.map(r => r.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('should cover all risk levels', () => {
    const levels = new Set(DEFAULT_RULES.map(r => r.riskLevel))
    expect(levels.has('auto')).toBe(true)
    expect(levels.has('notify')).toBe(true)
    expect(levels.has('approve')).toBe(true)
  })
})

describe('createApprovalHooks', () => {
  it('should create with default rules', () => {
    const hooks = createApprovalHooks()
    expect(hooks.listRules().length).toBe(DEFAULT_RULES.length)
    hooks.destroy()
  })

  it('should create with custom rules', () => {
    const custom: ApprovalRule[] = [{
      id: 'test-only',
      name: 'Test Rule',
      actionPatterns: ['*'],
      riskLevel: 'auto',
      conditions: [],
      timeoutMs: 0,
      timeoutAction: 'approve',
      enabled: true,
      metadata: {},
    }]
    const hooks = createApprovalHooks(custom)
    expect(hooks.listRules().length).toBe(1)
    hooks.destroy()
  })
})
