/**
 * OpenSIN Assistant Orchestration — Type Definitions
 *
 * Defines the core types for multi-assistant coordination, task routing,
 * and lifecycle management within the OpenSIN ecosystem.
 */

/** Unique identifier for an assistant instance */
export type AssistantId = string

/** Current operational status of an assistant */
export type AssistantStatus = 'idle' | 'busy' | 'paused' | 'error' | 'terminated'

/** Role an assistant plays in the orchestration */
export type AssistantRole =
  | 'coordinator'
  | 'worker'
  | 'researcher'
  | 'verifier'
  | 'specialist'
  | 'general'

/** Configuration for spawning an assistant */
export interface AssistantConfig {
  id: AssistantId
  role: AssistantRole
  model?: string
  systemPrompt?: string
  tools?: string[]
  maxTokens?: number
  timeoutMs?: number
  metadata?: Record<string, unknown>
}

/** Runtime state of an assistant */
export interface AssistantState {
  config: AssistantConfig
  status: AssistantStatus
  lifecycleState: LifecycleState
  currentTaskId: string | null
  taskHistory: string[]
  createdAt: number
  lastActiveAt: number
  metadata: Record<string, unknown>
}

/** Assignment of a task to an assistant */
export interface TaskAssignment {
  taskId: string
  assistantId: AssistantId
  assignedAt: number
  priority: number
  description: string
  context?: Record<string, unknown>
  expectedOutput?: string
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled'
}

/** Rule for routing tasks to assistants */
export interface RoutingRule {
  id: string
  name: string
  condition: (task: TaskDescription, availableAssistants: AssistantState[]) => boolean
  score: (task: TaskDescription, assistant: AssistantState) => number
  priority: number
}

/** Result of a routing decision */
export interface RoutingDecision {
  taskId: string
  selectedAssistantId: AssistantId
  reason: string
  alternativeIds: AssistantId[]
  scoredAt: number
}

/** Description of a task to be routed */
export interface TaskDescription {
  id: string
  type: string
  description: string
  requiredRole?: AssistantRole
  requiredTools?: string[]
  priority: number
  context?: Record<string, unknown>
  dependencies?: string[]
}

/** Event emitted by the orchestration system */
export type OrchestrationEvent =
  | { type: 'assistant_spawned'; assistantId: AssistantId; config: AssistantConfig; timestamp: number }
  | { type: 'assistant_paused'; assistantId: AssistantId; timestamp: number }
  | { type: 'assistant_resumed'; assistantId: AssistantId; timestamp: number }
  | { type: 'assistant_killed'; assistantId: AssistantId; reason: string; timestamp: number }
  | { type: 'task_assigned'; taskId: string; assistantId: AssistantId; timestamp: number }
  | { type: 'task_completed'; taskId: string; assistantId: AssistantId; timestamp: number }
  | { type: 'task_failed'; taskId: string; assistantId: AssistantId; error: string; timestamp: number }
  | { type: 'routing_decision'; decision: RoutingDecision; timestamp: number }
  | { type: 'lifecycle_transition'; assistantId: AssistantId; from: LifecycleState; to: LifecycleState; timestamp: number }

/** Configuration for the orchestration system */
export interface OrchestrationConfig {
  maxConcurrentAssistants: number
  defaultTimeoutMs: number
  enableAutoScaling: boolean
  routingStrategy: 'round_robin' | 'least_loaded' | 'role_based' | 'scored'
  healthCheckIntervalMs: number
  staleThresholdMs: number
}

/** Lifecycle states for an assistant */
export type LifecycleState =
  | 'initializing'
  | 'ready'
  | 'running'
  | 'paused'
  | 'stopping'
  | 'stopped'
  | 'error'
  | 'terminated'

/** Transition between lifecycle states */
export interface LifecycleTransition {
  assistantId: AssistantId
  from: LifecycleState
  to: LifecycleState
  reason?: string
  timestamp: number
}

/** Lifecycle event */
export interface LifecycleEvent {
  type: 'transition' | 'error' | 'heartbeat'
  assistantId: AssistantId
  state: LifecycleState
  details?: Record<string, unknown>
  timestamp: number
}

/** Options for spawning an assistant */
export interface SpawnOptions {
  config: AssistantConfig
  context?: Record<string, unknown>
  parentAssistantId?: AssistantId
  waitForReady?: boolean
  timeoutMs?: number
}

/** Options for pausing an assistant */
export interface PauseOptions {
  graceful: boolean
  saveState: boolean
  timeoutMs?: number
}

/** Options for resuming an assistant */
export interface ResumeOptions {
  restoreState: boolean
  timeoutMs?: number
}

/** Options for killing an assistant */
export interface KillOptions {
  force: boolean
  reason?: string
  cleanup: boolean
}

/** Registry of all known assistants */
export interface AssistantRegistry {
  register(config: AssistantConfig): Promise<AssistantState>
  deregister(id: AssistantId): Promise<void>
  get(id: AssistantId): AssistantState | undefined
  getAll(): AssistantState[]
  findByRole(role: AssistantRole): AssistantState[]
  findByStatus(status: AssistantStatus): AssistantState[]
  count(): number
  countByStatus(status: AssistantStatus): number
}

/** Router responsible for task-to-assistant mapping */
export interface TaskRouter {
  addRule(rule: RoutingRule): void
  removeRule(ruleId: string): void
  route(task: TaskDescription, available: AssistantState[]): Promise<RoutingDecision>
  getRules(): RoutingRule[]
}

/** Main orchestrator coordinating assistants and tasks */
export interface Orchestrator {
  config: OrchestrationConfig
  registry: AssistantRegistry
  router: TaskRouter
  spawn(options: SpawnOptions): Promise<AssistantState>
  pause(assistantId: AssistantId, options?: PauseOptions): Promise<void>
  resume(assistantId: AssistantId, options?: ResumeOptions): Promise<void>
  kill(assistantId: AssistantId, options?: KillOptions): Promise<void>
  assignTask(task: TaskDescription): Promise<TaskAssignment>
  getTaskStatus(taskId: string): TaskAssignment | undefined
  getAllTasks(): TaskAssignment[]
  on(event: string, handler: (event: OrchestrationEvent) => void): void
  off(event: string, handler: (event: OrchestrationEvent) => void): void
  shutdown(): Promise<void>
}

/** Event emitter interface for orchestrator */
export interface OrchestratorEvents {
  on(event: 'orchestration_event', handler: (event: OrchestrationEvent) => void): void
  on(event: 'lifecycle_event', handler: (event: LifecycleEvent) => void): void
  on(event: 'error', handler: (error: Error) => void): void
  emit(event: string, data: unknown): void
}
