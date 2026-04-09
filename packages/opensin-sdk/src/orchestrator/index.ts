/**
 * OpenSIN Agent Orchestrator — Unified integration layer
 *
 * Connects all Sprint 1 systems:
 * - HeartbeatSystem ↔ AgentLoop (periodic autonomous check-in)
 * - CronScheduler ↔ LoopMode (scheduled recurring tasks)
 * - FailoverRouter ↔ SmartModelRouter (multi-provider failover)
 * - ApprovalHooks ↔ PermissionEvaluator (risk-based safety gates)
 *
 * This is the main entry point for building a fully autonomous OpenSIN agent.
 */

import { HeartbeatSystem, createHeartbeatSystem } from '../heartbeat/index.js';
import type { HeartbeatConfig, HeartbeatEvent, TaskProcessor, TaskQueuePoller, QueuedTask, TaskResult } from '../heartbeat/index.js';

import { CronScheduler, createCronScheduler } from '../cron/index.js';
import type { CronTask, CronExecutor, CronEvent } from '../cron/index.js';

import { FailoverRouter, createFailoverRouter } from '../model_routing/failover.js';
import type { FailoverChain, FailoverEvent, FailoverResult } from '../model_routing/failover.js';

import { ApprovalHooks, createApprovalHooks } from '../approval/index.js';
import type { ApprovalRule, ApprovalEvent, ApprovalDecision, RiskLevel } from '../approval/index.js';

import { SmartModelRouter } from '../model_routing/router.js';
import type { RoutingConfig, RoutingDecision } from '../model_routing/types.js';

import { AgentLoop } from '../agent_loop/agent_loop.js';
import type { AgentLoopConfig, LLMCaller, LLMResponse } from '../agent_loop/types.js';

import { LoopMode } from '../loop/index.js';
import type { LoopConfig, LoopState } from '../loop/models.js';

import { PermissionEvaluator } from '../permissions/evaluator.js';
import type { PermissionRule, PermissionCheck, PermissionResult } from '../permissions/types.js';

export interface OrchestratorConfig {
  heartbeat?: Partial<HeartbeatConfig>;
  cronCheckIntervalMs?: number;
  failoverChains?: FailoverChain[];
  approvalRules?: ApprovalRule[];
  routingConfig?: Partial<RoutingConfig>;
  agentLoopConfig?: Partial<AgentLoopConfig>;
  permissionRules?: PermissionRule[];
}

export interface OrchestratorState {
  status: 'idle' | 'running' | 'paused' | 'error' | 'shutting_down';
  heartbeatStatus: import('../heartbeat/index.js').HeartbeatStatus;
  cronTaskCount: number;
  activeChainId: string;
  totalApprovals: number;
  pendingApprovals: number;
  startedAt: string | null;
  uptimeMs: number;
}

export interface OrchestratorEvent {
  type:
    | 'started'
    | 'stopped'
    | 'paused'
    | 'resumed'
    | 'heartbeat_beat'
    | 'cron_execution'
    | 'failover_fallback'
    | 'approval_required'
    | 'approval_resolved'
    | 'error';
  timestamp: string;
  data: Record<string, unknown>;
}

export type OrchestratorCallback = (event: OrchestratorEvent) => void | Promise<void>;

export class AgentOrchestrator {
  private heartbeat: HeartbeatSystem;
  private cron: CronScheduler;
  private failover: FailoverRouter;
  private approval: ApprovalHooks;
  private router: SmartModelRouter;
  private permissionEval: PermissionEvaluator;
  private agentLoop: AgentLoop | null = null;
  private loopMode: LoopMode | null = null;
  private llmCaller: LLMCaller | null = null;
  private eventCallbacks: OrchestratorCallback[] = [];
  private startedAt: string | null = null;
  private status: OrchestratorState['status'] = 'idle';

  constructor(config?: OrchestratorConfig) {
    this.heartbeat = createHeartbeatSystem(config?.heartbeat);
    this.cron = createCronScheduler(undefined, config?.cronCheckIntervalMs);
    this.failover = createFailoverRouter(config?.failoverChains);
    this.approval = createApprovalHooks(config?.approvalRules);
    this.router = new SmartModelRouter(config?.routingConfig);
    this.permissionEval = new PermissionEvaluator(config?.permissionRules || []);

    this.wireInternalEvents();
  }

  setLLMCaller(caller: LLMCaller): void {
    this.llmCaller = caller;
  }

  setAgentLoop(loop: AgentLoop): void {
    this.agentLoop = loop;
  }

  setLoopMode(loopMode: LoopMode): void {
    this.loopMode = loopMode;
  }

  setTaskQueuePoller(poller: TaskQueuePoller): void {
    this.heartbeat.setTaskQueuePoller(poller);
  }

  setTaskProcessor(processor: TaskProcessor): void {
    this.heartbeat.setTaskProcessor(processor);
  }

  setNotificationChannel(channel: (request: import('../approval/index.js').ApprovalRequest) => Promise<void>): void {
    this.approval.setNotificationChannel(channel);
  }

  addCronTask(config: Omit<CronTask, 'id' | 'executionCount' | 'lastExecutedAt' | 'nextExecutionAt' | 'createdAt'>): CronTask {
    return this.cron.createTask(config);
  }

  addApprovalRule(rule: ApprovalRule): void {
    this.approval.addRule(rule);
  }

  addPermissionRule(rule: PermissionRule): void {
    this.permissionEval.addRule(rule);
  }

  async evaluateAction(action: string, input: Record<string, unknown>): Promise<{
    approved: boolean;
    riskLevel: RiskLevel;
    requestId?: string;
    ruleId?: string;
    permissionResult?: PermissionResult;
  }> {
    const approvalResult = await this.approval.evaluateAction(action, input);

    const permCheck: PermissionCheck = {
      toolName: action,
      args: input,
    };
    const permissionResult = await this.permissionEval.checkPermission(permCheck);

    if (!approvalResult.approved) {
      this.emitOrchestratorEvent('approval_required', {
        action,
        requestId: approvalResult.requestId,
        riskLevel: approvalResult.riskLevel,
      });
    }

    const approved = approvalResult.approved && permissionResult.decision !== 'deny';

    return {
      approved,
      riskLevel: approvalResult.riskLevel,
      requestId: approvalResult.requestId,
      ruleId: approvalResult.ruleId,
      permissionResult,
    };
  }

  resolveApproval(decision: ApprovalDecision): import('../approval/index.js').ApprovalRequest | null {
    const result = this.approval.resolveRequest(decision);
    if (result) {
      this.emitOrchestratorEvent('approval_resolved', {
        requestId: decision.requestId,
        decision: decision.decision,
        resolvedBy: decision.resolvedBy,
      });
    }
    return result;
  }

  routeModel(prompt: string, options?: {
    requiresVision?: boolean;
    requiresReasoning?: boolean;
    requiresCode?: boolean;
    requiresLongContext?: boolean;
    preferSpeed?: boolean;
    estimatedInputTokens?: number;
    requiresToolUse?: boolean;
  }): FailoverResult & { routingDecision?: RoutingDecision } {
    const failoverResult = this.failover.route(prompt, options);

    const routingDecision = this.router.route(prompt, options?.requiresToolUse);

    return {
      ...failoverResult,
      routingDecision,
    };
  }

  reportModelFailure(modelId: string, error: string): void {
    this.failover.reportFailure(modelId, error);
    this.emitOrchestratorEvent('failover_fallback', { modelId, error });
  }

  reportModelSuccess(modelId: string): void {
    this.failover.reportSuccess(modelId);
  }

  start(): OrchestratorState {
    if (this.status === 'running') return this.getState();

    this.wireCronExecutor();

    this.heartbeat.start();
    this.cron.start();

    this.status = 'running';
    this.startedAt = new Date().toISOString();

    this.emitOrchestratorEvent('started', {});
    return this.getState();
  }

  pause(): OrchestratorState {
    this.heartbeat.pause();
    this.cron.stop();
    this.status = 'paused';
    this.emitOrchestratorEvent('paused', {});
    return this.getState();
  }

  resume(): OrchestratorState {
    this.heartbeat.resume();
    this.cron.start();
    this.status = 'running';
    this.emitOrchestratorEvent('resumed', {});
    return this.getState();
  }

  async stop(): Promise<OrchestratorState> {
    this.cron.stop();
    await this.heartbeat.gracefulShutdown();
    this.approval.destroy();
    this.status = 'idle';
    this.emitOrchestratorEvent('stopped', {});
    return this.getState();
  }

  getState(): OrchestratorState {
    const hbState = this.heartbeat.getState();
    return {
      status: this.status,
      heartbeatStatus: hbState.status,
      cronTaskCount: this.cron.listTasks(true).length,
      activeChainId: this.failover.getChain('default') ? 'default' : 'none',
      totalApprovals: this.approval.getAuditLog().length,
      pendingApprovals: this.approval.getPendingRequests().length,
      startedAt: this.startedAt,
      uptimeMs: this.startedAt ? Date.now() - new Date(this.startedAt).getTime() : 0,
    };
  }

  getHeartbeat(): HeartbeatSystem {
    return this.heartbeat;
  }

  getCron(): CronScheduler {
    return this.cron;
  }

  getFailover(): FailoverRouter {
    return this.failover;
  }

  getApproval(): ApprovalHooks {
    return this.approval;
  }

  getRouter(): SmartModelRouter {
    return this.router;
  }

  getPermissionEvaluator(): PermissionEvaluator {
    return this.permissionEval;
  }

  onEvent(callback: OrchestratorCallback): () => void {
    this.eventCallbacks.push(callback);
    return () => {
      this.eventCallbacks = this.eventCallbacks.filter(cb => cb !== callback);
    };
  }

  private wireCronExecutor(): void {
    this.cron.setExecutor(async (prompt: string, task: CronTask) => {
      if (!this.llmCaller) {
        throw new Error('No LLM caller configured. Call setLLMCaller() first.');
      }

      const evaluation = await this.evaluateAction('cron_execute', {
        prompt,
        taskId: task.id,
        cronExpression: task.cronExpression,
      });

      if (!evaluation.approved) {
        throw new Error(`Cron task ${task.id} blocked by approval/permission system`);
      }

      const routeResult = this.routeModel(prompt, {
        preferSpeed: true,
        requiresToolUse: true,
      });

      const response = await this.llmCaller(
        [{ role: 'user', content: prompt }],
        [],
      );

      this.reportModelSuccess(routeResult.selectedModel.id);

      return response.content || '';
    });
  }

  private wireInternalEvents(): void {
    this.heartbeat.onEvent((event: HeartbeatEvent) => {
      if (event.type === 'beat') {
        this.emitOrchestratorEvent('heartbeat_beat', {
          beatCount: event.data.beatCount,
          tasksProcessed: event.data.tasksProcessed,
        });
      } else if (event.type === 'error') {
        this.emitOrchestratorEvent('error', {
          source: 'heartbeat',
          ...event.data,
        });
      }
    });

    this.cron.onEvent((event: CronEvent) => {
      if (event.type === 'task_started') {
        this.emitOrchestratorEvent('cron_execution', {
          taskId: event.taskId,
          phase: 'started',
          ...event.data,
        });
      } else if (event.type === 'task_completed') {
        this.emitOrchestratorEvent('cron_execution', {
          taskId: event.taskId,
          phase: 'completed',
          ...event.data,
        });
      } else if (event.type === 'task_failed') {
        this.emitOrchestratorEvent('error', {
          source: 'cron',
          taskId: event.taskId,
          ...event.data,
        });
      }
    });

    this.failover.onEvent((event: FailoverEvent) => {
      if (event.type === 'fallback') {
        this.emitOrchestratorEvent('failover_fallback', {
          modelId: event.modelId,
          chainId: event.chainId,
          ...event.data,
        });
      } else if (event.type === 'exhausted') {
        this.emitOrchestratorEvent('error', {
          source: 'failover',
          modelId: event.modelId,
          chainId: event.chainId,
          ...event.data,
        });
      }
    });

    this.approval.onEvent((event: ApprovalEvent) => {
      if (event.type === 'request_created') {
        this.emitOrchestratorEvent('approval_required', {
          requestId: event.requestId,
          ...event.data,
        });
      }
    });
  }

  private emitOrchestratorEvent(type: OrchestratorEvent['type'], data: Record<string, unknown>): void {
    const event: OrchestratorEvent = { type, timestamp: new Date().toISOString(), data };
    for (const cb of this.eventCallbacks) {
      try { cb(event); } catch {}
    }
  }
}

export function createOrchestrator(config?: OrchestratorConfig): AgentOrchestrator {
  return new AgentOrchestrator(config);
}
