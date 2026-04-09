import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { CronScheduler, createCronScheduler, parseCronExpression, getNextExecution } from '../cron/index'
import type { CronEvent, CronTask } from '../cron/index'

describe('parseCronExpression', () => {
  it('should parse every-minute expression', () => {
    const result = parseCronExpression('* * * * *')
    expect(result).not.toBeNull()
    expect(result!.minute.length).toBe(60)
    expect(result!.hour.length).toBe(24)
  })

  it('should parse specific minute', () => {
    const result = parseCronExpression('30 * * * *')
    expect(result).not.toBeNull()
    expect(result!.minute).toEqual([30])
  })

  it('should parse range expression', () => {
    const result = parseCronExpression('1-5 * * * *')
    expect(result).not.toBeNull()
    expect(result!.minute).toEqual([1, 2, 3, 4, 5])
  })

  it('should parse step expression', () => {
    const result = parseCronExpression('*/15 * * * *')
    expect(result).not.toBeNull()
    expect(result!.minute).toEqual([0, 15, 30, 45])
  })

  it('should parse full daily cron', () => {
    const result = parseCronExpression('0 9 * * *')
    expect(result).not.toBeNull()
    expect(result!.minute).toEqual([0])
    expect(result!.hour).toEqual([9])
  })

  it('should parse day-of-week', () => {
    const result = parseCronExpression('0 9 * * 1')
    expect(result).not.toBeNull()
    expect(result!.dayOfWeek).toEqual([1])
  })

  it('should return null for invalid expressions', () => {
    expect(parseCronExpression('')).toBeNull()
    expect(parseCronExpression('too many fields here')).toBeNull()
    expect(parseCronExpression('a b c d e')).toBeNull()
    expect(parseCronExpression('60 * * * *')).toBeNull()
  })

  it('should parse comma-separated values', () => {
    const result = parseCronExpression('0,15,30,45 * * * *')
    expect(result).not.toBeNull()
    expect(result!.minute).toEqual([0, 15, 30, 45])
  })
})

describe('getNextExecution', () => {
  it('should find next minute for * * * * *', () => {
    const parsed = parseCronExpression('* * * * *')
    const now = new Date('2026-01-01T12:00:00Z')
    const next = getNextExecution(parsed, now)
    expect(next).not.toBeNull()
    expect(next!.getTime()).toBeGreaterThan(now.getTime())
  })

  it('should find next 9am for 0 9 * * *', () => {
    const parsed = parseCronExpression('0 9 * * *')
    const now = new Date('2026-01-01T08:00:00Z')
    const next = getNextExecution(parsed, now)
    expect(next).not.toBeNull()
    expect(next!.getHours()).toBe(9)
    expect(next!.getMinutes()).toBe(0)
  })

  it('should return null for invalid parsed input', () => {
    expect(getNextExecution(null)).toBeNull()
  })

  it('should skip to next day if time has passed', () => {
    const parsed = parseCronExpression('0 9 * * *')
    const now = new Date('2026-01-01T10:00:00Z')
    const next = getNextExecution(parsed, now)
    expect(next).not.toBeNull()
    expect(next!.getDate()).toBeGreaterThan(now.getDate())
  })
})

describe('CronScheduler', () => {
  let scheduler: CronScheduler

  beforeEach(() => {
    vi.useFakeTimers()
    scheduler = createCronScheduler(undefined, 1000)
  })

  afterEach(() => {
    scheduler.stop()
    vi.useRealTimers()
  })

  it('should create a cron task', () => {
    const task = scheduler.createTask({
      name: 'Daily Summary',
      cronExpression: '0 9 * * *',
      prompt: 'Generate daily summary',
      enabled: true,
      timeoutMs: 60000,
      retryOnFailure: false,
      maxRetries: 0,
      metadata: {},
    })

    expect(task.id).toBeTruthy()
    expect(task.name).toBe('Daily Summary')
    expect(task.cronExpression).toBe('0 9 * * *')
    expect(task.enabled).toBe(true)
    expect(task.executionCount).toBe(0)
    expect(task.nextExecutionAt).not.toBeNull()
  })

  it('should reject invalid cron expressions', () => {
    expect(() =>
      scheduler.createTask({
        name: 'Bad',
        cronExpression: 'invalid',
        prompt: 'test',
        enabled: true,
        timeoutMs: 60000,
        retryOnFailure: false,
        maxRetries: 0,
        metadata: {},
      })
    ).toThrow('Invalid cron expression')
  })

  it('should list tasks', () => {
    scheduler.createTask({
      name: 'Task 1', cronExpression: '0 9 * * *', prompt: 'p1',
      enabled: true, timeoutMs: 60000, retryOnFailure: false, maxRetries: 0, metadata: {},
    })
    scheduler.createTask({
      name: 'Task 2', cronExpression: '0 18 * * *', prompt: 'p2',
      enabled: false, timeoutMs: 60000, retryOnFailure: false, maxRetries: 0, metadata: {},
    })

    expect(scheduler.listTasks().length).toBe(2)
    expect(scheduler.listTasks(true).length).toBe(1)
  })

  it('should get task by id', () => {
    const task = scheduler.createTask({
      name: 'Test', cronExpression: '* * * * *', prompt: 'p',
      enabled: true, timeoutMs: 60000, retryOnFailure: false, maxRetries: 0, metadata: {},
    })
    expect(scheduler.getTask(task.id)).toBeDefined()
    expect(scheduler.getTask('nonexistent')).toBeUndefined()
  })

  it('should update tasks', () => {
    const task = scheduler.createTask({
      name: 'Test', cronExpression: '0 9 * * *', prompt: 'p',
      enabled: true, timeoutMs: 60000, retryOnFailure: false, maxRetries: 0, metadata: {},
    })

    const updated = scheduler.updateTask(task.id, { name: 'Updated', enabled: false })
    expect(updated?.name).toBe('Updated')
    expect(updated?.enabled).toBe(false)
  })

  it('should delete tasks', () => {
    const task = scheduler.createTask({
      name: 'Test', cronExpression: '* * * * *', prompt: 'p',
      enabled: true, timeoutMs: 60000, retryOnFailure: false, maxRetries: 0, metadata: {},
    })
    expect(scheduler.deleteTask(task.id)).toBe(true)
    expect(scheduler.getTask(task.id)).toBeUndefined()
  })

  it('should enable/disable tasks', () => {
    const task = scheduler.createTask({
      name: 'Test', cronExpression: '* * * * *', prompt: 'p',
      enabled: true, timeoutMs: 60000, retryOnFailure: false, maxRetries: 0, metadata: {},
    })

    const disabled = scheduler.disableTask(task.id)
    expect(disabled?.enabled).toBe(false)

    const enabled = scheduler.enableTask(task.id)
    expect(enabled?.enabled).toBe(true)
  })

  it('should execute tasks via executor', async () => {
    const calls: string[] = []
    const exec = scheduler as unknown as { executeTask(task: CronTask): Promise<void> }

    scheduler.setExecutor(async (prompt) => {
      calls.push(prompt)
      return `Result: ${prompt}`
    })

    const task = scheduler.createTask({
      name: 'Test', cronExpression: '* * * * *', prompt: 'hello',
      enabled: true, timeoutMs: 60000, retryOnFailure: false, maxRetries: 0, metadata: {},
    })

    await exec.executeTask(task)
    expect(calls).toEqual(['hello'])
    expect(task.executionCount).toBe(1)
    expect(task.lastExecutedAt).not.toBeNull()
  })

  it('should emit events', () => {
    const events: CronEvent[] = []
    scheduler.onEvent(e => events.push(e))

    const task = scheduler.createTask({
      name: 'Test', cronExpression: '0 9 * * *', prompt: 'p',
      enabled: true, timeoutMs: 60000, retryOnFailure: false, maxRetries: 0, metadata: {},
    })

    const created = events.find(e => e.type === 'task_created')
    expect(created).toBeDefined()
    expect(created!.taskId).toBe(task.id)
  })

  it('should track executions', async () => {
    scheduler.setExecutor(async (prompt) => `result: ${prompt}`)

    const exec = scheduler as unknown as { executeTask(task: CronTask): Promise<void> }

    const task = scheduler.createTask({
      name: 'Test', cronExpression: '* * * * *', prompt: 'p',
      enabled: true, timeoutMs: 60000, retryOnFailure: false, maxRetries: 0, metadata: {},
    })

    await exec.executeTask(task)

    const executions = scheduler.getExecutions(task.id)
    expect(executions.length).toBe(1)
    expect(executions[0].status).toBe('completed')
    expect(executions[0].result).toContain('result')
  })

  it('should handle executor errors', async () => {
    scheduler.setExecutor(async () => { throw new Error('boom') })
    const exec = scheduler as unknown as { executeTask(task: CronTask): Promise<void> }

    const task = scheduler.createTask({
      name: 'Test', cronExpression: '* * * * *', prompt: 'p',
      enabled: true, timeoutMs: 60000, retryOnFailure: false, maxRetries: 0, metadata: {},
    })

    await exec.executeTask(task)

    const executions = scheduler.getExecutions(task.id)
    expect(executions[0].status).toBe('failed')
  })

  it('should start and stop', () => {
    expect(scheduler.isRunning()).toBe(false)
    scheduler.start()
    expect(scheduler.isRunning()).toBe(true)
    scheduler.stop()
    expect(scheduler.isRunning()).toBe(false)
  })
})
