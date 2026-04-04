/**
 * OpenSIN Assistant Orchestrator
 *
 * Central coordinator for multi-assistant task execution. Manages the
 * assistant registry, routes tasks to appropriate assistants, and provides
 * lifecycle management hooks.
 */

import type {
  AssistantId,
  AssistantConfig,
  AssistantState,
  AssistantStatus,
  TaskAssignment,
  TaskDescription,
  OrchestrationConfig,
  OrchestrationEvent,
  SpawnOptions,
  PauseOptions,
  ResumeOptions,
  KillOptions,
  Orchestrator,
  OrchestratorEvents,
} from './types.js'
import { AssistantLifecycle } from './lifecycle.js'
import { TaskRouter, createDefaultRouter } from './routing.js'

const DEFAULT_CONFIG: OrchestrationConfig = {
  maxConcurrentAssistants: 10,
  defaultTimeoutMs: 300_000,
  enableAutoScaling: true,
  routingStrategy: 'scored',
  healthCheckIntervalMs: 30_000,
  staleThresholdMs: 60_000,
}

export class OpenSINOrchestrator implements Orchestrator, OrchestratorEvents {
  readonly config: OrchestrationConfig
  readonly registry: AssistantRegistryImpl
  readonly router: TaskRouter
  readonly lifecycle: AssistantLifecycle

  private assistants: Map<AssistantId, AssistantState> = new Map()
  private tasks: Map<string, TaskAssignment> = new Map()
  private eventHandlers: Map<string, Set<(event: OrchestrationEvent) => void>> = new Map()
  private healthCheckTimer: ReturnType<typeof setInterval> | null = null
  private _shutdown = false

  constructor(config?: Partial<OrchestrationConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config }
    this.registry = new AssistantRegistryImpl(this.assistants)
    this.router = createDefaultRouter(this.config.routingStrategy)
    this.lifecycle = new AssistantLifecycle()
    this.startHealthChecks()
  }

  // --- Lifecycle Management ---

  async spawn(options: SpawnOptions): Promise<AssistantState> {
    if (this._shutdown) {
      throw new Error('OpenSIN Orchestrator is shut down')
    }

    const activeCount = this.registry.countByStatus('busy') + this.registry.countByStatus('idle')
    if (activeCount >= this.config.maxConcurrentAssistants) {
      throw new Error(
        `Maximum concurrent assistants (${this.config.maxConcurrentAssistants}) reached`
      )
    }

    const state: AssistantState = {
      config: options.config,
      status: 'idle',
      lifecycleState: 'initializing',
      currentTaskId: null,
      taskHistory: [],
      createdAt: Date.now(),
      lastActiveAt: Date.now(),
      metadata: options.context ?? {},
    }

    this.assistants.set(options.config.id, state)
    this.lifecycle.transition(options.config.id, 'initializing', 'ready', 'spawn')

    this.emitEvent({
      type: 'assistant_spawned',
      assistantId: options.config.id,
      config: options.config,
      timestamp: Date.now(),
    })

    return state
  }

  async pause(assistantId: AssistantId, options?: PauseOptions): Promise<void> {
    const state = this.assistants.get(assistantId)
    if (!state) {
      throw new Error(`Assistant ${assistantId} not found`)
    }

    if (state.status === 'paused') {
      return
    }

    if (options?.graceful && state.currentTaskId) {
      state.status = 'paused'
      this.lifecycle.transition(assistantId, state.lifecycleState, 'paused', 'pause_requested')
    } else {
      state.status = 'paused'
      this.lifecycle.transition(assistantId, state.lifecycleState, 'paused', 'pause')
    }

    if (options?.saveState) {
      state.metadata._pausedState = { timestamp: Date.now() }
    }

    this.emitEvent({
      type: 'assistant_paused',
      assistantId,
      timestamp: Date.now(),
    })
  }

  async resume(assistantId: AssistantId, options?: ResumeOptions): Promise<void> {
    const state = this.assistants.get(assistantId)
    if (!state) {
      throw new Error(`Assistant ${assistantId} not found`)
    }

    if (state.status !== 'paused') {
      throw new Error(`Assistant ${assistantId} is not paused (status: ${state.status})`)
    }

    state.status = 'idle'
    state.lastActiveAt = Date.now()
    this.lifecycle.transition(assistantId, 'paused', 'ready', 'resume')

    this.emitEvent({
      type: 'assistant_resumed',
      assistantId,
      timestamp: Date.now(),
    })
  }

  async kill(assistantId: AssistantId, options?: KillOptions): Promise<void> {
    const state = this.assistants.get(assistantId)
    if (!state) {
      return
    }

    const reason = options?.reason ?? 'killed_by_orchestrator'

    if (options?.cleanup) {
      this.lifecycle.transition(assistantId, state.lifecycleState, 'stopping', reason)
    }

    state.status = 'terminated'
    this.lifecycle.transition(assistantId, state.lifecycleState, 'terminated', reason)

    if (state.currentTaskId) {
      const task = this.tasks.get(state.currentTaskId)
      if (task) {
        task.status = 'failed'
      }
    }

    this.assistants.delete(assistantId)

    this.emitEvent({
      type: 'assistant_killed',
      assistantId,
      reason,
      timestamp: Date.now(),
    })
  }

  // --- Task Routing and Assignment ---

  async assignTask(task: TaskDescription): Promise<TaskAssignment> {
    const available = this.registry.findByStatus('idle')

    if (available.length === 0) {
      if (this.config.enableAutoScaling) {
        return this.scaleAndAssign(task)
      }
      throw new Error('No available assistants and auto-scaling is disabled')
    }

    const decision = await this.router.route(task, available)

    const assistant = this.assistants.get(decision.selectedAssistantId)
    if (!assistant) {
      throw new Error(`Selected assistant ${decision.selectedAssistantId} not found`)
    }

    const assignment: TaskAssignment = {
      taskId: task.id,
      assistantId: assistant.config.id,
      assignedAt: Date.now(),
      priority: task.priority,
      description: task.description,
      context: task.context,
      expectedOutput: task.expectedOutput,
      status: 'pending',
    }

    this.tasks.set(task.id, assignment)
    assistant.status = 'busy'
    assistant.currentTaskId = task.id
    assistant.taskHistory.push(task.id)
    assistant.lastActiveAt = Date.now()

    this.emitEvent({
      type: 'task_assigned',
      taskId: task.id,
      assistantId: assistant.config.id,
      timestamp: Date.now(),
    })

    this.emitEvent({
      type: 'routing_decision',
      decision,
      timestamp: Date.now(),
    })

    return assignment
  }

  getTaskStatus(taskId: string): TaskAssignment | undefined {
    return this.tasks.get(taskId)
  }

  getAllTasks(): TaskAssignment[] {
    return Array.from(this.tasks.values())
  }

  // --- Event System ---

  on(event: string, handler: (event: OrchestrationEvent) => void): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set())
    }
    this.eventHandlers.get(event)!.add(handler)
  }

  off(event: string, handler: (event: OrchestrationEvent) => void): void {
    this.eventHandlers.get(event)?.delete(handler)
  }

  emit(event: string, data: unknown): void {
    this.eventHandlers.get(event)?.forEach((handler) => handler(data as OrchestrationEvent))
  }

  // --- Shutdown ---

  async shutdown(): Promise<void> {
    this._shutdown = true

    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer)
      this.healthCheckTimer = null
    }

    const activeIds = Array.from(this.assistants.keys())
    await Promise.all(
      activeIds.map((id) => this.kill(id, { force: true, reason: 'orchestrator_shutdown', cleanup: true }))
    )

    this.tasks.clear()
    this.eventHandlers.clear()
  }

  // --- Internal ---

  private async scaleAndAssign(task: TaskDescription): Promise<TaskAssignment> {
    const newId = `assistant-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    const config: AssistantConfig = {
      id: newId,
      role: task.requiredRole ?? 'worker',
      tools: task.requiredTools,
    }

    await this.spawn({ config, context: task.context })
    return this.assignTask(task)
  }

  private startHealthChecks(): void {
    this.healthCheckTimer = setInterval(() => {
      const now = Date.now()
      for (const [id, state] of this.assistants) {
        if (
          state.status !== 'terminated' &&
          now - state.lastActiveAt > this.config.staleThresholdMs
        ) {
          state.status = 'error'
          this.emitEvent({
            type: 'task_failed',
            taskId: state.currentTaskId ?? 'unknown',
            assistantId: id,
            error: 'Assistant became stale',
            timestamp: now,
          })
        }
      }
    }, this.config.healthCheckIntervalMs)

    if (this.healthCheckTimer.unref) {
      this.healthCheckTimer.unref()
    }
  }

  private emitEvent(event: OrchestrationEvent): void {
    this.emit('orchestration_event', event)
  }
}

class AssistantRegistryImpl {
  constructor(private store: Map<AssistantId, AssistantState>) {}

  async register(config: AssistantConfig): Promise<AssistantState> {
    const state: AssistantState = {
      config,
      status: 'idle',
      lifecycleState: 'ready',
      currentTaskId: null,
      taskHistory: [],
      createdAt: Date.now(),
      lastActiveAt: Date.now(),
      metadata: {},
    }
    this.store.set(config.id, state)
    return state
  }

  async deregister(id: AssistantId): Promise<void> {
    this.store.delete(id)
  }

  get(id: AssistantId): AssistantState | undefined {
    return this.store.get(id)
  }

  getAll(): AssistantState[] {
    return Array.from(this.store.values())
  }

  findByRole(role: string): AssistantState[] {
    return this.getAll().filter((a) => a.config.role === role)
  }

  findByStatus(status: AssistantStatus): AssistantState[] {
    return this.getAll().filter((a) => a.status === status)
  }

  count(): number {
    return this.store.size
  }

  countByStatus(status: AssistantStatus): number {
    return this.findByStatus(status).length
  }
}

// Named export for the orchestrator class
export const Orchestrator = OpenSINOrchestrator
