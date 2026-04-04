/**
 * OpenSIN Work Dispatcher — Agent Work Dispatch
 *
 * Dispatches tasks to appropriate agents based on capabilities,
 * load, and scheduling decisions.
 */

import { randomUUID } from 'crypto';
import type {
  Task,
  AgentDescriptor,
  DispatchResult,
  TaskStatus,
  CoordinatorConfig,
} from './types.js';
import { TaskScheduler } from './scheduler.js';

export class WorkDispatcher {
  private scheduler: TaskScheduler;
  private agents: Map<string, AgentDescriptor>;
  private tasks: Map<string, Task>;
  private dispatchHistory: DispatchResult[];
  private config: CoordinatorConfig;

  constructor(config: CoordinatorConfig) {
    this.scheduler = new TaskScheduler(config.scheduleStrategy);
    this.agents = new Map();
    this.tasks = new Map();
    this.dispatchHistory = [];
    this.config = config;
  }

  registerAgent(agent: AgentDescriptor): void {
    this.agents.set(agent.id, { ...agent, load: 0, completedTasks: 0, failedTasks: 0 });
  }

  unregisterAgent(agentId: string): void {
    this.agents.delete(agentId);
  }

  submitTask(task: Task): boolean {
    if (this.tasks.size >= this.config.maxQueueSize) {
      return false;
    }

    this.tasks.set(task.id, { ...task, status: 'pending' });
    this.scheduler.enqueue(task.id);
    return true;
  }

  async dispatchNext(): Promise<DispatchResult | null> {
    const taskId = this.scheduler.dequeue();
    if (!taskId) return null;

    const task = this.tasks.get(taskId);
    if (!task) return null;

    if (task.dependencies.length > 0) {
      const unmetDeps = task.dependencies.filter((depId) => {
        const dep = this.tasks.get(depId);
        return !dep || dep.status !== 'completed';
      });

      if (unmetDeps.length > 0) {
        this.scheduler.enqueue(taskId);
        return null;
      }
    }

    const agentList = Array.from(this.agents.values());
    const compatibleAgents = agentList.filter((a) => {
      const hasCapabilities = task.metadata?.requiredCapabilities
        ? (task.metadata.requiredCapabilities as string[]).every((cap) => a.capabilities.includes(cap))
        : true;
      const hasCapacity = a.load < a.maxConcurrentTasks;
      return hasCapabilities && hasCapacity && a.status !== 'offline';
    });

    if (compatibleAgents.length === 0) {
      this.scheduler.enqueue(taskId);
      return {
        success: false,
        taskId,
        agentId: '',
        dispatchedAt: Date.now(),
        error: 'No compatible agents available',
      };
    }

    const selectedAgentId = this.scheduler.selectAgentForTask(compatibleAgents, task);
    if (!selectedAgentId) {
      this.scheduler.enqueue(taskId);
      return {
        success: false,
        taskId,
        agentId: '',
        dispatchedAt: Date.now(),
        error: 'No agents with available capacity',
      };
    }

    const agent = this.agents.get(selectedAgentId);
    if (!agent) {
      this.scheduler.enqueue(taskId);
      return {
        success: false,
        taskId,
        agentId: selectedAgentId,
        dispatchedAt: Date.now(),
        error: 'Agent not found',
      };
    }

    task.status = 'running';
    task.assignedAgentId = selectedAgentId;
    task.startedAt = Date.now();

    agent.load++;
    agent.currentTaskId = taskId;

    this.scheduler.scheduleTask(task, selectedAgentId);

    const result: DispatchResult = {
      success: true,
      taskId,
      agentId: selectedAgentId,
      dispatchedAt: Date.now(),
    };

    this.dispatchHistory.push(result);
    return result;
  }

  completeTask(taskId: string, result?: unknown): void {
    const task = this.tasks.get(taskId);
    if (!task) return;

    task.status = 'completed';
    task.completedAt = Date.now();
    task.result = result;

    if (task.assignedAgentId) {
      const agent = this.agents.get(task.assignedAgentId);
      if (agent) {
        agent.load = Math.max(0, agent.load - 1);
        agent.completedTasks++;
        if (agent.currentTaskId === taskId) {
          agent.currentTaskId = undefined;
        }
      }
    }

    this.scheduler.updateScheduleEntry(taskId, {
      status: 'completed',
      completedAt: Date.now(),
      actualDurationMs: task.startedAt ? Date.now() - task.startedAt : undefined,
    });
  }

  failTask(taskId: string, error: string): void {
    const task = this.tasks.get(taskId);
    if (!task) return;

    task.error = error;

    if (this.config.enableAutoRetry && task.retryCount < task.maxRetries) {
      task.retryCount++;
      task.status = 'pending';
      task.assignedAgentId = undefined;
      task.startedAt = undefined;
      this.scheduler.enqueue(taskId);
      return;
    }

    task.status = 'failed';
    task.completedAt = Date.now();

    if (task.assignedAgentId) {
      const agent = this.agents.get(task.assignedAgentId);
      if (agent) {
        agent.load = Math.max(0, agent.load - 1);
        agent.failedTasks++;
        if (agent.currentTaskId === taskId) {
          agent.currentTaskId = undefined;
        }
      }
    }

    this.scheduler.updateScheduleEntry(taskId, {
      status: 'failed',
      completedAt: Date.now(),
    });
  }

  cancelTask(taskId: string): void {
    const task = this.tasks.get(taskId);
    if (!task) return;

    task.status = 'cancelled';
    task.completedAt = Date.now();

    const queueIdx = this.scheduler.getQueue().indexOf(taskId);
    if (queueIdx !== -1) {
      this.scheduler.dequeue();
    }

    if (task.assignedAgentId) {
      const agent = this.agents.get(task.assignedAgentId);
      if (agent) {
        agent.load = Math.max(0, agent.load - 1);
        if (agent.currentTaskId === taskId) {
          agent.currentTaskId = undefined;
        }
      }
    }
  }

  getAgent(agentId: string): AgentDescriptor | undefined {
    return this.agents.get(agentId);
  }

  getTask(taskId: string): Task | undefined {
    return this.tasks.get(taskId);
  }

  getDispatchHistory(): ReadonlyArray<DispatchResult> {
    return [...this.dispatchHistory];
  }

  getPendingCount(): number {
    return this.scheduler.getQueueLength();
  }

  getRunningCount(): number {
    let count = 0;
    for (const [, task] of this.tasks) {
      if (task.status === 'running') count++;
    }
    return count;
  }
}
