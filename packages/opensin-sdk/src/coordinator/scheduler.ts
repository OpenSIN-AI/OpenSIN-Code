/**
 * OpenSIN Task Scheduler
 *
 * Schedules tasks based on priority, dependencies, and deadlines
 * with support for FIFO, priority, fair-share, and deadline strategies.
 */

import type {
  Task,
  TaskId,
  AgentId,
  TaskPriority,
  ScheduleEntry,
  CoordinatorConfig,
} from './types'

const PRIORITY_WEIGHTS: Record<TaskPriority, number> = {
  critical: 100,
  high: 75,
  normal: 50,
  low: 25,
  background: 10,
}

export class OpenSINScheduler {
  private pendingTasks: Map<TaskId, Task> = new Map()
  private scheduleEntries: Map<TaskId, ScheduleEntry> = new Map()
  private config: CoordinatorConfig
  private timer: ReturnType<typeof setInterval> | null = null

  constructor(config: CoordinatorConfig) {
    this.config = config
  }

  enqueue(task: Task): void {
    this.pendingTasks.set(task.id, task)
  }

  dequeue(): Task | null {
    const candidates = Array.from(this.pendingTasks.values()).filter(
      (t) => t.status === 'pending' && this.areDependenciesMet(t)
    )

    if (candidates.length === 0) return null

    const sorted = this.sortTasks(candidates)
    const selected = sorted[0]!
    this.pendingTasks.delete(selected.id)
    return selected
  }

  schedule(task: Task, scheduledTime: number, recurring = false): void {
    task.status = 'scheduled'
    task.scheduledAt = scheduledTime

    this.scheduleEntries.set(task.id, {
      taskId: task.id,
      scheduledTime,
      priority: task.priority,
      recurring,
    })

    this.pendingTasks.delete(task.id)
  }

  getDueTasks(): Task[] {
    const now = Date.now()
    const due: Task[] = []

    for (const [taskId, entry] of this.scheduleEntries) {
      if (entry.scheduledTime <= now) {
        const task = this.pendingTasks.get(taskId)
        if (task) {
          due.push(task)
        }
        if (!entry.recurring) {
          this.scheduleEntries.delete(taskId)
        }
      }
    }

    return due
  }

  cancel(taskId: TaskId): boolean {
    if (this.pendingTasks.has(taskId)) {
      this.pendingTasks.delete(taskId)
      this.scheduleEntries.delete(taskId)
      return true
    }
    return false
  }

  getPendingCount(): number {
    return this.pendingTasks.size
  }

  getPendingTasks(): Task[] {
    return Array.from(this.pendingTasks.values())
  }

  start(): void {
    this.timer = setInterval(() => {
      this.getDueTasks()
    }, 1000)
    if (this.timer.unref) this.timer.unref()
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
    }
  }

  private sortTasks(tasks: Task[]): Task[] {
    switch (this.config.schedulingStrategy) {
      case 'fifo':
        return tasks.sort((a, b) => a.createdAt - b.createdAt)
      case 'priority':
        return tasks.sort((a, b) => PRIORITY_WEIGHTS[b.priority] - PRIORITY_WEIGHTS[a.priority])
      case 'fair_share':
        return this.fairShareSort(tasks)
      case 'deadline':
        return tasks.sort((a, b) => {
          if (!a.deadline && !b.deadline) return a.createdAt - b.createdAt
          if (!a.deadline) return 1
          if (!b.deadline) return -1
          return a.deadline - b.deadline
        })
      default:
        return tasks.sort((a, b) => a.createdAt - b.createdAt)
    }
  }

  private fairShareSort(tasks: Task[]): Task[] {
    const priorityGroups = new Map<TaskPriority, Task[]>()
    for (const task of tasks) {
      if (!priorityGroups.has(task.priority)) {
        priorityGroups.set(task.priority, [])
      }
      priorityGroups.get(task.priority)!.push(task)
    }

    const result: Task[] = []
    const priorities = (['critical', 'high', 'normal', 'low', 'background'] as TaskPriority[])
      .filter((p) => priorityGroups.has(p))

    let idx = 0
    while (result.length < tasks.length) {
      const priority = priorities[idx % priorities.length]
      const group = priorityGroups.get(priority)!
      if (group.length > 0) {
        result.push(group.shift()!)
      }
      idx++
    }

    return result
  }

  private areDependenciesMet(task: Task): boolean {
    if (task.dependencies.length === 0) return true
    return task.dependencies.every((depId) => {
      const dep = this.pendingTasks.get(depId)
      return !dep
    })
  }
}

export function createScheduler(config: CoordinatorConfig): OpenSINScheduler {
  return new OpenSINScheduler(config)
}
