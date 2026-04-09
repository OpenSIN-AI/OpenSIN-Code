import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { HeartbeatSystem, createHeartbeatSystem } from '../heartbeat/index'
import type { HeartbeatEvent, QueuedTask, TaskResult } from '../heartbeat/index'

describe('HeartbeatSystem', () => {
  let heartbeat: HeartbeatSystem

  beforeEach(() => {
    vi.useFakeTimers()
    heartbeat = createHeartbeatSystem({
      intervalMs: 1000,
      healthReportIntervalMs: 0,
      taskQueuePollIntervalMs: 0,
      autoStart: false,
      maxConsecutiveErrors: 3,
      errorBackoffMs: 100,
      maxErrorBackoffMs: 1000,
      gracefulShutdownTimeoutMs: 5000,
    })
  })

  afterEach(() => {
    heartbeat.stop()
    vi.useRealTimers()
  })

  it('should start in stopped state', () => {
    const state = heartbeat.getState()
    expect(state.status).toBe('stopped')
    expect(state.beatCount).toBe(0)
  })

  it('should transition to running on start', () => {
    const state = heartbeat.start()
    expect(state.status).toBe('running')
    expect(state.startedAt).toBeTruthy()
  })

  it('should not double-start', () => {
    heartbeat.start()
    const state = heartbeat.start()
    expect(state.status).toBe('running')
  })

  it('should pause and resume', () => {
    heartbeat.start()
    const paused = heartbeat.pause()
    expect(paused.status).toBe('paused')

    const resumed = heartbeat.resume()
    expect(resumed.status).toBe('running')
  })

  it('should stop cleanly', () => {
    heartbeat.start()
    const stopped = heartbeat.stop()
    expect(stopped.status).toBe('stopped')
  })

  it('should emit beat events', () => {
    const events: HeartbeatEvent[] = []
    heartbeat.onEvent(e => events.push(e))

    void (heartbeat as any).beat()

    const beatEvents = events.filter(e => e.type === 'beat')
    expect(beatEvents.length).toBeGreaterThanOrEqual(1)
    expect(beatEvents[0].data.beatCount).toBe(1)
  })

  it('should process tasks from queue poller', async () => {
    const processedTasks: string[] = []
    const mockTasks: QueuedTask[] = [
      { id: 't1', type: 'test', payload: {}, priority: 1, createdAt: new Date().toISOString() },
      { id: 't2', type: 'test', payload: {}, priority: 2, createdAt: new Date().toISOString() },
    ]

    heartbeat.setTaskQueuePoller(async () => mockTasks)
    heartbeat.setTaskProcessor(async (task) => {
      processedTasks.push(task.id)
      return { taskId: task.id, success: true, durationMs: 10 }
    })

    await (heartbeat as any).beat()

    expect(processedTasks.length).toBe(2)
    expect(processedTasks[0]).toBe('t2')
  })

  it('should increment beatCount on each beat', () => {
    void (heartbeat as any).beat()
    void (heartbeat as any).beat()
    void (heartbeat as any).beat()

    const state = heartbeat.getState()
    expect(state.beatCount).toBeGreaterThanOrEqual(2)
  })

  it('should track total tasks processed', async () => {
    heartbeat.setTaskQueuePoller(async () => [
      { id: 't1', type: 'test', payload: {}, priority: 1, createdAt: new Date().toISOString() },
    ])
    heartbeat.setTaskProcessor(async (task) => ({
      taskId: task.id, success: true, durationMs: 5,
    }))

    await (heartbeat as any).beat()

    expect(heartbeat.getState().totalTasksProcessed).toBeGreaterThanOrEqual(1)
  })

  it('should report isRunning correctly', () => {
    expect(heartbeat.isRunning()).toBe(false)
    heartbeat.start()
    expect(heartbeat.isRunning()).toBe(true)
    heartbeat.stop()
    expect(heartbeat.isRunning()).toBe(false)
  })

  it('should allow unsubscribing from events', () => {
    const events: HeartbeatEvent[] = []
    const unsub = heartbeat.onEvent(e => events.push(e))

    void (heartbeat as any).beat()
    unsub()
    void (heartbeat as any).beat()

    const beatCount = events.filter(e => e.type === 'beat').length
    expect(beatCount).toBe(1)
  })

  it('should process tasks in priority order (highest first)', async () => {
    const order: number[] = []
    heartbeat.setTaskQueuePoller(async () => [
      { id: 'low', type: 'test', payload: {}, priority: 1, createdAt: new Date().toISOString() },
      { id: 'high', type: 'test', payload: {}, priority: 10, createdAt: new Date().toISOString() },
      { id: 'mid', type: 'test', payload: {}, priority: 5, createdAt: new Date().toISOString() },
    ])
    heartbeat.setTaskProcessor(async (task) => {
      order.push(task.priority)
      return { taskId: task.id, success: true, durationMs: 5 }
    })

    await (heartbeat as any).beat()

    expect(order).toEqual([10, 5, 1])
  })
})

describe('createHeartbeatSystem', () => {
  it('should create instance with defaults', () => {
    const hb = createHeartbeatSystem()
    expect(hb.getState().status).toBe('stopped')
    hb.stop()
  })

  it('should accept partial config overrides', () => {
    const hb = createHeartbeatSystem({ intervalMs: 60000 })
    expect(hb.getState().status).toBe('stopped')
    hb.stop()
  })
})
