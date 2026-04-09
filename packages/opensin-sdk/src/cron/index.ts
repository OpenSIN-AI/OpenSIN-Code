/**
 * OpenSIN Cron Scheduler — Scheduled recurring task execution
 *
 * Cron-style scheduling for recurring autonomous tasks (daily summaries,
 * weekly reports, periodic health checks). Matches Gemini Scheduled Actions
 * and Claude Code /loop capabilities.
 */

export interface CronTask {
  id: string;
  name: string;
  cronExpression: string;
  prompt: string;
  enabled: boolean;
  maxExecutions?: number;
  executionCount: number;
  lastExecutedAt: string | null;
  nextExecutionAt: string | null;
  createdAt: string;
  metadata: Record<string, unknown>;
  chainId?: string;
  timeoutMs: number;
  retryOnFailure: boolean;
  maxRetries: number;
}

export interface CronExecution {
  id: string;
  taskId: string;
  startedAt: string;
  completedAt: string | null;
  status: 'running' | 'completed' | 'failed' | 'timeout';
  result?: string;
  error?: string;
  durationMs: number;
  attempt: number;
}

export type CronExecutor = (prompt: string, task: CronTask) => Promise<string>;

export interface CronEvent {
  type: 'task_created' | 'task_started' | 'task_completed' | 'task_failed' | 'task_timeout' | 'schedule_updated';
  timestamp: string;
  taskId: string;
  data: Record<string, unknown>;
}

const MONTH_DAYS = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
const DAY_NAMES = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

export function parseCronExpression(expr: string): {
  minute: number[];
  hour: number[];
  dayOfMonth: number[];
  month: number[];
  dayOfWeek: number[];
} | null {
  const parts = expr.trim().split(/\s+/);
  if (parts.length !== 5) return null;

  const parseField = (field: string, min: number, max: number): number[] | null => {
    if (field === '*') return Array.from({ length: max - min + 1 }, (_, i) => min + i);

    const values: number[] = [];
    for (const part of field.split(',')) {
      if (part.includes('/')) {
        const [range, step] = part.split('/');
        const stepNum = parseInt(step, 10);
        if (isNaN(stepNum)) return null;
        const start = range === '*' ? min : parseInt(range, 10);
        if (isNaN(start)) return null;
        for (let i = start; i <= max; i += stepNum) values.push(i);
      } else if (part.includes('-')) {
        const [from, to] = part.split('-').map(n => parseInt(n, 10));
        if (isNaN(from) || isNaN(to)) return null;
        for (let i = from; i <= to; i++) values.push(i);
      } else {
        const num = parseInt(part, 10);
        if (isNaN(num)) return null;
        values.push(num);
      }
    }
    const filtered = values.filter(v => v >= min && v <= max);
    if (values.length > 0 && filtered.length === 0) return null;
    return filtered;
  };

  const minute = parseField(parts[0], 0, 59);
  const hour = parseField(parts[1], 0, 23);
  const dayOfMonth = parseField(parts[2], 1, 31);
  const month = parseField(parts[3], 1, 12);
  const dayOfWeek = parseField(parts[4], 0, 6);

  if (!minute || !hour || !dayOfMonth || !month || !dayOfWeek) return null;

  return { minute, hour, dayOfMonth, month, dayOfWeek };
}

export function getNextExecution(parsed: ReturnType<typeof parseCronExpression>, after: Date = new Date()): Date | null {
  if (!parsed) return null;

  const start = new Date(after.getTime() + 60000);
  start.setSeconds(0, 0);

  for (let monthOffset = 0; monthOffset < 24; monthOffset++) {
    const testMonth = ((start.getMonth() + monthOffset) % 12) + 1;
    if (!parsed.month.includes(testMonth)) continue;

    const year = start.getFullYear() + Math.floor((start.getMonth() + monthOffset) / 12);

    for (const day of parsed.dayOfMonth) {
      if (day > MONTH_DAYS[testMonth - 1]) continue;

      for (const hour of parsed.hour) {
        for (const minute of parsed.minute) {
          const candidate = new Date(year, testMonth - 1, day, hour, minute, 0, 0);
          if (candidate <= after) continue;

          const dow = candidate.getDay();
          if (parsed.dayOfWeek.includes(dow)) {
            return candidate;
          }
        }
      }
    }
  }

  return null;
}

export class CronScheduler {
  private tasks: Map<string, CronTask> = new Map();
  private executions: Map<string, CronExecution> = new Map();
  private executor: CronExecutor | null = null;
  private checkInterval: ReturnType<typeof setInterval> | null = null;
  private eventListeners: ((event: CronEvent) => void)[] = [];
  private checkIntervalMs: number;
  private running = false;

  constructor(executor?: CronExecutor, checkIntervalMs = 60000) {
    this.executor = executor || null;
    this.checkIntervalMs = checkIntervalMs;
  }

  setExecutor(executor: CronExecutor): void {
    this.executor = executor;
  }

  createTask(config: Omit<CronTask, 'id' | 'executionCount' | 'lastExecutedAt' | 'nextExecutionAt' | 'createdAt'>): CronTask {
    const parsed = parseCronExpression(config.cronExpression);
    if (!parsed) throw new Error(`Invalid cron expression: ${config.cronExpression}`);

    const nextExec = getNextExecution(parsed);

    const task: CronTask = {
      ...config,
      id: `cron-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      executionCount: 0,
      lastExecutedAt: null,
      nextExecutionAt: nextExec?.toISOString() || null,
      createdAt: new Date().toISOString(),
    };

    this.tasks.set(task.id, task);
    this.emitEvent('task_created', task.id, { name: task.name, cronExpression: task.cronExpression });

    return task;
  }

  getTask(taskId: string): CronTask | undefined {
    return this.tasks.get(taskId);
  }

  listTasks(enabledOnly = false): CronTask[] {
    const all = Array.from(this.tasks.values());
    return enabledOnly ? all.filter(t => t.enabled) : all;
  }

  updateTask(taskId: string, updates: Partial<CronTask>): CronTask | undefined {
    const task = this.tasks.get(taskId);
    if (!task) return undefined;

    const updated = { ...task, ...updates };

    if (updates.cronExpression && updates.cronExpression !== task.cronExpression) {
      const parsed = parseCronExpression(updates.cronExpression);
      if (!parsed) throw new Error(`Invalid cron expression: ${updates.cronExpression}`);
      updated.nextExecutionAt = getNextExecution(parsed)?.toISOString() || null;
    }

    this.tasks.set(taskId, updated);
    this.emitEvent('schedule_updated', taskId, { updates });

    return updated;
  }

  deleteTask(taskId: string): boolean {
    return this.tasks.delete(taskId);
  }

  enableTask(taskId: string): CronTask | undefined {
    return this.updateTask(taskId, { enabled: true });
  }

  disableTask(taskId: string): CronTask | undefined {
    return this.updateTask(taskId, { enabled: false });
  }

  start(): void {
    if (this.running) return;
    this.running = true;

    this.checkInterval = setInterval(() => {
      this.checkAndExecute().catch(err => {
        this.emitEvent('task_failed', 'scheduler', {
          error: err instanceof Error ? err.message : String(err),
        });
      });
    }, this.checkIntervalMs);
  }

  stop(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    this.running = false;
  }

  isRunning(): boolean {
    return this.running;
  }

  getExecutions(taskId?: string, limit = 50): CronExecution[] {
    let all = Array.from(this.executions.values());
    if (taskId) all = all.filter(e => e.taskId === taskId);
    return all.sort((a, b) => b.startedAt.localeCompare(a.startedAt)).slice(0, limit);
  }

  onEvent(listener: (event: CronEvent) => void): () => void {
    this.eventListeners.push(listener);
    return () => {
      this.eventListeners = this.eventListeners.filter(l => l !== listener);
    };
  }

  private async checkAndExecute(): Promise<void> {
    const now = new Date();

    for (const task of this.tasks.values()) {
      if (!task.enabled) continue;
      if (task.maxExecutions && task.executionCount >= task.maxExecutions) continue;

      if (!task.nextExecutionAt) {
        const parsed = parseCronExpression(task.cronExpression);
        const next = getNextExecution(parsed);
        if (next) {
          task.nextExecutionAt = next.toISOString();
        }
        continue;
      }

      const nextTime = new Date(task.nextExecutionAt);
      if (now >= nextTime) {
        await this.executeTask(task);
      }
    }
  }

  private async executeTask(task: CronTask): Promise<void> {
    if (!this.executor) return;

    const execution: CronExecution = {
      id: `exec-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      taskId: task.id,
      startedAt: new Date().toISOString(),
      completedAt: null,
      status: 'running',
      durationMs: 0,
      attempt: 1,
    };

    this.executions.set(execution.id, execution);
    this.emitEvent('task_started', task.id, { executionId: execution.id });

    const startTime = Date.now();
    let attempts = 0;
    const maxAttempts = task.retryOnFailure ? task.maxRetries + 1 : 1;

    while (attempts < maxAttempts) {
      attempts++;
      execution.attempt = attempts;

      try {
        const result = await Promise.race([
          this.executor(task.prompt, task),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Execution timeout')), task.timeoutMs),
          ),
        ]);

        execution.completedAt = new Date().toISOString();
        execution.status = 'completed';
        execution.result = result;
        execution.durationMs = Date.now() - startTime;

        task.executionCount++;
        task.lastExecutedAt = execution.completedAt;

        this.emitEvent('task_completed', task.id, {
          executionId: execution.id,
          durationMs: execution.durationMs,
          result: result.substring(0, 500),
        });
        break;
      } catch (error) {
        const isTimeout = error instanceof Error && error.message === 'Execution timeout';
        execution.error = error instanceof Error ? error.message : String(error);
        execution.durationMs = Date.now() - startTime;

        if (isTimeout) {
          execution.status = 'timeout';
          this.emitEvent('task_timeout', task.id, { executionId: execution.id });
          break;
        } else if (attempts >= maxAttempts) {
          execution.status = 'failed';
          execution.completedAt = new Date().toISOString();
          this.emitEvent('task_failed', task.id, {
            executionId: execution.id,
            error: execution.error,
            attempts,
          });
        }
      }
    }

    const parsed = parseCronExpression(task.cronExpression);
    task.nextExecutionAt = getNextExecution(parsed)?.toISOString() || null;
  }

  private emitEvent(type: CronEvent['type'], taskId: string, data: Record<string, unknown>): void {
    const event: CronEvent = { type, timestamp: new Date().toISOString(), taskId, data };
    for (const listener of this.eventListeners) {
      try { listener(event); } catch { }
    }
  }
}

export function createCronScheduler(executor?: CronExecutor, checkIntervalMs?: number): CronScheduler {
  return new CronScheduler(executor, checkIntervalMs);
}
