/**
 * OpenSIN Coordinator — Type Definitions
 *
 * Core types for task scheduling, dispatch, and agent monitoring
 * within the OpenSIN coordination framework.
 */

/** Unique task identifier */
export type TaskId = string

/** Unique agent identifier */
export type AgentId = string

/** Task status */
export type TaskStatus = 'pending' | 'scheduled' | 'dispatched' | 'running' | 'completed' | 'failed' | 'cancelled'

/** Task priority level */
export type TaskPriority = 'critical' | 'high' | 'normal' | 'low' | 'background'

/** Task definition */
export interface Task {
  id: TaskId
  type: string
  description: string
  priority: TaskPriority
  status: TaskStatus
  assignedAgent: AgentId | null
  createdAt: number
  scheduledAt: number | null
  startedAt: number | null
  completedAt: number | null
  deadline: number | null
  dependencies: TaskId[]
  payload: Record<string, unknown>
  result: unknown
  error: string | null
  retries: number
  maxRetries: number
  metadata: Record<string, unknown>
}

/** Agent state */
export interface AgentState {
  id: AgentId
  name: string
  status: 'idle' | 'busy' | 'offline' | 'error'
  capabilities: string[]
  currentTask: TaskId | null
  completedTasks: number
  failedTasks: number
  lastHeartbeat: number
  metadata: Record<string, unknown>
}

/** Schedule entry */
export interface ScheduleEntry {
  taskId: TaskId
  scheduledTime: number
  priority: TaskPriority
  agentId?: AgentId
  cronExpression?: string
  recurring: boolean
}

/** Dispatch result */
export interface DispatchResult {
  taskId: TaskId
  agentId: AgentId
  dispatchedAt: number
  status: 'success' | 'failed'
  error?: string
}

/** Monitor metrics */
export interface AgentMetrics {
  agentId: AgentId
  tasksCompleted: number
  tasksFailed: number
  avgCompletionTime: number
  currentLoad: number
  uptime: number
  lastActivity: number
}

/** Coordinator configuration */
export interface CoordinatorConfig {
  maxConcurrentTasks: number
  maxRetries: number
  defaultPriority: TaskPriority
  heartbeatIntervalMs: number
  staleThresholdMs: number
  schedulingStrategy: 'fifo' | 'priority' | 'fair_share' | 'deadline'
  enableAutoRetry: boolean
  retryBackoffMs: number
}

/** Coordinator event */
export type CoordinatorEvent =
  | { type: 'task_created'; task: Task; timestamp: number }
  | { type: 'task_scheduled'; taskId: TaskId; scheduledAt: number; timestamp: number }
  | { type: 'task_dispatched'; taskId: TaskId; agentId: AgentId; timestamp: number }
  | { type: 'task_started'; taskId: TaskId; agentId: AgentId; timestamp: number }
  | { type: 'task_completed'; taskId: TaskId; agentId: AgentId; duration: number; timestamp: number }
  | { type: 'task_failed'; taskId: TaskId; agentId: AgentId; error: string; timestamp: number }
  | { type: 'task_cancelled'; taskId: TaskId; timestamp: number }
  | { type: 'agent_registered'; agentId: AgentId; timestamp: number }
  | { type: 'agent_offline'; agentId: AgentId; timestamp: number }
  | { type: 'heartbeat'; agentId: AgentId; timestamp: number }
