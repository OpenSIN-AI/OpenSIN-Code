/**
 * OpenSIN Coordinator Monitor — Agent Progress Monitoring
 *
 * Monitors agent progress, tracks task metrics, and generates
 * reports on coordinator system health and throughput.
 */

import { EventEmitter } from 'events';
import type {
  Task,
  AgentDescriptor,
  MonitorReport,
  CoordinatorConfig,
  TaskStatus,
} from './types.js';

export class CoordinatorMonitor extends EventEmitter {
  private config: CoordinatorConfig;
  private tasks: Map<string, Task>;
  private agents: Map<string, AgentDescriptor>;
  private monitorTimer: ReturnType<typeof setInterval> | null;
  private taskDurations: number[];
  private waitTimes: number[];
  private throughputWindow: { timestamp: number; count: number }[];

  constructor(config: CoordinatorConfig) {
    super();
    this.config = config;
    this.tasks = new Map();
    this.agents = new Map();
    this.monitorTimer = null;
    this.taskDurations = [];
    this.waitTimes = [];
    this.throughputWindow = [];
  }

  syncTasks(tasks: Map<string, Task>): void {
    this.tasks = tasks;
  }

  syncAgents(agents: Map<string, AgentDescriptor>): void {
    this.agents = agents;
  }

  start(): void {
    if (!this.config.enableMonitoring) return;
    if (this.monitorTimer) return;

    this.monitorTimer = setInterval(() => {
      this.checkTimeouts();
      this.updateMetrics();
      const report = this.generateReport();
      this.emit('report', report);
    }, this.config.monitorIntervalMs);
  }

  stop(): void {
    if (this.monitorTimer) {
      clearInterval(this.monitorTimer);
      this.monitorTimer = null;
    }
  }

  generateReport(): MonitorReport {
    const taskArray = Array.from(this.tasks.values());
    const agentArray = Array.from(this.agents.values());

    const runningTasks = taskArray.filter((t) => t.status === 'running').length;
    const pendingTasks = taskArray.filter((t) => t.status === 'pending' || t.status === 'queued').length;
    const completedTasks = taskArray.filter((t) => t.status === 'completed').length;
    const failedTasks = taskArray.filter((t) => t.status === 'failed').length;

    const activeAgents = agentArray.filter((a) => a.status !== 'offline').length;
    const idleAgents = agentArray.filter((a) => a.status === 'idle').length;
    const offlineAgents = agentArray.filter((a) => a.status === 'offline').length;

    const avgDuration = this.taskDurations.length > 0
      ? this.taskDurations.reduce((a, b) => a + b, 0) / this.taskDurations.length
      : 0;

    const avgWait = this.waitTimes.length > 0
      ? this.waitTimes.reduce((a, b) => a + b, 0) / this.waitTimes.length
      : 0;

    const now = Date.now();
    const recentThroughput = this.throughputWindow.filter((w) => now - w.timestamp < 60_000);
    const throughput = recentThroughput.reduce((sum, w) => sum + w.count, 0);

    return {
      timestamp: now,
      totalTasks: taskArray.length,
      runningTasks,
      pendingTasks,
      completedTasks,
      failedTasks,
      activeAgents,
      idleAgents,
      offlineAgents,
      avgTaskDurationMs: Math.round(avgDuration),
      avgWaitTimeMs: Math.round(avgWait),
      throughput,
    };
  }

  getAgentStatus(agentId: string): { status: string; currentTask?: string; load: number } | null {
    const agent = this.agents.get(agentId);
    if (!agent) return null;

    return {
      status: agent.status,
      currentTask: agent.currentTaskId,
      load: agent.load,
    };
  }

  getTaskStatus(taskId: string): { status: string; agentId?: string; duration?: number } | null {
    const task = this.tasks.get(taskId);
    if (!task) return null;

    const duration = task.startedAt ? Date.now() - task.startedAt : undefined;

    return {
      status: task.status,
      agentId: task.assignedAgentId,
      duration,
    };
  }

  getAgentsByStatus(status: string): AgentDescriptor[] {
    return Array.from(this.agents.values()).filter((a) => a.status === status);
  }

  getTasksByStatus(status: TaskStatus): Task[] {
    return Array.from(this.tasks.values()).filter((t) => t.status === status);
  }

  private checkTimeouts(): void {
    const now = Date.now();
    for (const [, task] of this.tasks) {
      if (task.status === 'running' && task.startedAt) {
        const elapsed = now - task.startedAt;
        if (elapsed > this.config.taskTimeoutMs) {
          this.emit('task_timeout', {
            taskId: task.id,
            agentId: task.assignedAgentId,
            elapsedMs: elapsed,
            timeoutMs: this.config.taskTimeoutMs,
          });
        }
      }
    }
  }

  private updateMetrics(): void {
    const now = Date.now();

    for (const [, task] of this.tasks) {
      if (task.status === 'completed' && task.startedAt && task.completedAt) {
        const duration = task.completedAt - task.startedAt;
        if (!this.taskDurations.includes(duration)) {
          this.taskDurations.push(duration);
          if (this.taskDurations.length > 1000) {
            this.taskDurations = this.taskDurations.slice(-500);
          }
        }
      }

      if (task.status === 'completed' && task.createdAt && task.startedAt) {
        const waitTime = task.startedAt - task.createdAt;
        if (!this.waitTimes.includes(waitTime)) {
          this.waitTimes.push(waitTime);
          if (this.waitTimes.length > 1000) {
            this.waitTimes = this.waitTimes.slice(-500);
          }
        }
      }
    }

    const completedCount = Array.from(this.tasks.values()).filter(
      (t) => t.status === 'completed' && t.completedAt && now - (t.completedAt || 0) < 60_000
    ).length;

    if (completedCount > 0) {
      this.throughputWindow.push({ timestamp: now, count: completedCount });
      this.throughputWindow = this.throughputWindow.filter(
        (w) => now - w.timestamp < 60_000
      );
    }
  }

  dispose(): void {
    this.stop();
    this.tasks.clear();
    this.agents.clear();
    this.taskDurations = [];
    this.waitTimes = [];
    this.throughputWindow = [];
  }
}
