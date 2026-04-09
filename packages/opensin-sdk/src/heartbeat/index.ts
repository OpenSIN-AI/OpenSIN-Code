/**
 * OpenSIN Heartbeat System — Periodic autonomous agent check-in
 *
 * Like OpenClaw's heartbeat, this system wakes the agent at configurable
 * intervals to check for pending tasks, process queues, and execute
 * scheduled work.
 *
 * Features:
 * - Configurable heartbeat interval (default 30 min)
 * - Task queue polling (Supabase-backed)
 * - Graceful shutdown with state checkpointing
 * - Health status reporting
 * - Integration with LoopMode for recurring tasks
 */

import type { LoopMode } from '../loop/index.js';
import type { AgentLoop } from '../agent_loop/agent_loop.js';

export interface HeartbeatConfig {
  intervalMs: number;
  maxConsecutiveErrors: number;
  errorBackoffMs: number;
  maxErrorBackoffMs: number;
  healthReportIntervalMs: number;
  taskQueuePollIntervalMs: number;
  gracefulShutdownTimeoutMs: number;
  autoStart: boolean;
}

export const DEFAULT_HEARTBEAT_CONFIG: HeartbeatConfig = {
  intervalMs: 30 * 60 * 1000,
  maxConsecutiveErrors: 5,
  errorBackoffMs: 5000,
  maxErrorBackoffMs: 300000,
  healthReportIntervalMs: 5 * 60 * 1000,
  taskQueuePollIntervalMs: 60 * 1000,
  gracefulShutdownTimeoutMs: 10000,
  autoStart: true,
};

export type HeartbeatStatus =
  | 'stopped'
  | 'running'
  | 'paused'
  | 'error'
  | 'shutting_down';

export interface HeartbeatState {
  status: HeartbeatStatus;
  beatCount: number;
  lastBeatAt: string | null;
  nextBeatAt: string | null;
  consecutiveErrors: number;
  totalTasksProcessed: number;
  startedAt: string | null;
  lastHealthReportAt: string | null;
  checkpoint: Record<string, unknown> | null;
}

export interface HeartbeatEvent {
  type:
    | 'beat'
    | 'task_processed'
    | 'error'
    | 'health_report'
    | 'shutdown'
    | 'checkpoint'
    | 'paused'
    | 'resumed';
  timestamp: string;
  data: Record<string, unknown>;
}

export type HeartbeatCallback = (event: HeartbeatEvent) => void | Promise<void>;
export type TaskProcessor = (task: QueuedTask) => Promise<TaskResult>;
export type TaskQueuePoller = () => Promise<QueuedTask[]>;

export interface QueuedTask {
  id: string;
  type: string;
  payload: Record<string, unknown>;
  priority: number;
  createdAt: string;
  scheduledFor?: string;
  retries?: number;
  maxRetries?: number;
}

export interface TaskResult {
  taskId: string;
  success: boolean;
  output?: string;
  error?: string;
  durationMs: number;
}

export class HeartbeatSystem {
  private config: HeartbeatConfig;
  private state: HeartbeatState;
  private timer: ReturnType<typeof setInterval> | null = null;
  private healthTimer: ReturnType<typeof setInterval> | null = null;
  private taskPollTimer: ReturnType<typeof setInterval> | null = null;
  private taskProcessor: TaskProcessor | null = null;
  private taskQueuePoller: TaskQueuePoller | null = null;
  private eventCallbacks: HeartbeatCallback[] = [];
  private shuttingDown = false;
  private shutdownHandlersRegistered = false;
  private readonly shutdownHandler = async (): Promise<void> => {
    if (this.shuttingDown) return;
    await this.gracefulShutdown();
  };

  constructor(config?: Partial<HeartbeatConfig>) {
    this.config = { ...DEFAULT_HEARTBEAT_CONFIG, ...config };
    this.state = {
      status: 'stopped',
      beatCount: 0,
      lastBeatAt: null,
      nextBeatAt: null,
      consecutiveErrors: 0,
      totalTasksProcessed: 0,
      startedAt: null,
      lastHealthReportAt: null,
      checkpoint: null,
    };
  }

  setTaskProcessor(processor: TaskProcessor): void {
    this.taskProcessor = processor;
  }

  setTaskQueuePoller(poller: TaskQueuePoller): void {
    this.taskQueuePoller = poller;
  }

  onEvent(callback: HeartbeatCallback): () => void {
    this.eventCallbacks.push(callback);
    return () => {
      this.eventCallbacks = this.eventCallbacks.filter(cb => cb !== callback);
    };
  }

  start(): HeartbeatState {
    if (this.state.status === 'running') {
      return this.state;
    }

    this.state.status = 'running';
    this.state.startedAt = new Date().toISOString();
    this.shuttingDown = false;

    this.scheduleNextBeat();

    if (this.taskQueuePoller) {
      this.taskPollTimer = setInterval(
        () => this.pollTaskQueue(),
        this.config.taskQueuePollIntervalMs,
      );
    }

    if (this.config.healthReportIntervalMs > 0) {
      this.healthTimer = setInterval(
        () => this.emitHealthReport(),
        this.config.healthReportIntervalMs,
      );
    }

    this.registerShutdownHandlers();

    return this.state;
  }

  pause(): HeartbeatState {
    if (this.state.status !== 'running') return this.state;

    this.clearTimers();
    this.state.status = 'paused';
    this.emitEvent('paused', {});
    return this.state;
  }

  resume(): HeartbeatState {
    if (this.state.status !== 'paused') return this.state;

    this.state.status = 'running';
    this.scheduleNextBeat();
    this.emitEvent('resumed', {});
    return this.state;
  }

  stop(): HeartbeatState {
    this.clearTimers();
    this.removeShutdownHandlers();
    this.state.status = 'stopped';
    this.emitEvent('shutdown', { reason: 'manual_stop' });
    return this.state;
  }

  async gracefulShutdown(): Promise<HeartbeatState> {
    this.shuttingDown = true;
    this.state.status = 'shutting_down';
    this.emitEvent('shutdown', { reason: 'graceful', checkpoint: this.state.checkpoint });

    this.clearTimers();
    this.removeShutdownHandlers();

    await this.checkpoint();

    this.state.status = 'stopped';
    return this.state;
  }

  getState(): HeartbeatState {
    return { ...this.state };
  }

  isRunning(): boolean {
    return this.state.status === 'running';
  }

  private scheduleNextBeat(): void {
    if (this.timer) clearInterval(this.timer);

    const intervalMs = this.getEffectiveInterval();

    this.state.nextBeatAt = new Date(Date.now() + intervalMs).toISOString();

    this.timer = setInterval(() => {
      this.beat().catch(err => {
        this.handleError(err instanceof Error ? err : new Error(String(err)));
      });
    }, intervalMs);
  }

  private getEffectiveInterval(): number {
    if (this.state.consecutiveErrors > 0) {
      const backoff =
        this.config.errorBackoffMs *
        Math.pow(2, this.state.consecutiveErrors - 1);
      return Math.min(backoff, this.config.maxErrorBackoffMs);
    }
    return this.config.intervalMs;
  }

  private async beat(): Promise<void> {
    this.state.beatCount++;
    this.state.lastBeatAt = new Date().toISOString();
    this.state.consecutiveErrors = 0;

    this.emitEvent('beat', {
      beatCount: this.state.beatCount,
      tasksProcessed: this.state.totalTasksProcessed,
    });

    if (this.taskQueuePoller) {
      await this.pollTaskQueue();
    }

    await this.checkpoint();

    this.scheduleNextBeat();
  }

  private async pollTaskQueue(): Promise<void> {
    if (!this.taskQueuePoller || !this.taskProcessor) return;

    try {
      const tasks = await this.taskQueuePoller();

      const sorted = tasks.sort((a, b) => b.priority - a.priority);

      for (const task of sorted) {
        try {
          const result = await this.taskProcessor(task);
          this.state.totalTasksProcessed++;

          this.emitEvent('task_processed', {
            taskId: task.id,
            taskType: task.type,
            success: result.success,
            durationMs: result.durationMs,
          });
        } catch (error) {
          this.emitEvent('error', {
            taskId: task.id,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }
    } catch (error) {
      this.emitEvent('error', {
        phase: 'task_poll',
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  private async checkpoint(): Promise<void> {
    this.state.checkpoint = {
      beatCount: this.state.beatCount,
      totalTasksProcessed: this.state.totalTasksProcessed,
      lastBeatAt: this.state.lastBeatAt,
      timestamp: new Date().toISOString(),
    };

    this.emitEvent('checkpoint', { checkpoint: this.state.checkpoint });
  }

  private handleError(error: Error): void {
    this.state.consecutiveErrors++;
    this.emitEvent('error', {
      message: error.message,
      consecutiveErrors: this.state.consecutiveErrors,
    });

    if (this.state.consecutiveErrors >= this.config.maxConsecutiveErrors) {
      this.state.status = 'error';
      this.clearTimers();
      this.emitEvent('shutdown', {
        reason: 'max_consecutive_errors',
        errors: this.state.consecutiveErrors,
      });
    } else {
      this.scheduleNextBeat();
    }
  }

  private emitHealthReport(): void {
    this.state.lastHealthReportAt = new Date().toISOString();
    this.emitEvent('health_report', {
      status: this.state.status,
      beatCount: this.state.beatCount,
      tasksProcessed: this.state.totalTasksProcessed,
      consecutiveErrors: this.state.consecutiveErrors,
      uptimeMs: this.state.startedAt
        ? Date.now() - new Date(this.state.startedAt).getTime()
        : 0,
    });
  }

  private emitEvent(
    type: HeartbeatEvent['type'],
    data: Record<string, unknown>,
  ): void {
    const event: HeartbeatEvent = {
      type,
      timestamp: new Date().toISOString(),
      data,
    };
    for (const cb of this.eventCallbacks) {
      try {
        cb(event);
      } catch { }
    }
  }

  private clearTimers(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    if (this.healthTimer) {
      clearInterval(this.healthTimer);
      this.healthTimer = null;
    }
    if (this.taskPollTimer) {
      clearInterval(this.taskPollTimer);
      this.taskPollTimer = null;
    }
  }

  private registerShutdownHandlers(): void {
    if (this.shutdownHandlersRegistered) return;

    process.on('SIGTERM', this.shutdownHandler);
    process.on('SIGINT', this.shutdownHandler);
    this.shutdownHandlersRegistered = true;
  }

  private removeShutdownHandlers(): void {
    if (!this.shutdownHandlersRegistered) return;

    process.off('SIGTERM', this.shutdownHandler);
    process.off('SIGINT', this.shutdownHandler);
    this.shutdownHandlersRegistered = false;
  }
}

export function createHeartbeatSystem(
  config?: Partial<HeartbeatConfig>,
): HeartbeatSystem {
  return new HeartbeatSystem(config);
}
