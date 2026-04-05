/**
 * OpenSIN Background Agents — BackgroundAgentManager
 *
 * Core manager for Claude Code-style background agent delegation.
 *
 * Lifecycle:
 * 1. spawn() — Create a background agent with isolated session
 * 2. Agent runs asynchronously (separate AgentLoop instance)
 * 3. Results persist to disk as markdown
 * 4. Parent receives notification on completion
 * 5. retrieve() — Get results when ready
 *
 * Features:
 * - Agent isolation (separate sessions, no context pollution)
 * - Context persistence (results survive compaction)
 * - Status tracking (registered → running → terminal)
 * - Timeout protection (default 15 min)
 * - Terminal-state protection (no regression from terminal states)
 * - Auto-generated titles/summaries for discoverability
 *
 * Branded as OpenSIN/sincode.
 */

import type { UserMessage, AssistantMessage } from '../types.js';
import type {
  DelegationRecord,
  TerminalStatus,
  SpawnBackgroundAgentRequest,
  SpawnBackgroundAgentResult,
  DelegationListItem,
  BackgroundAgentEvent,
  BackgroundAgentEventType,
  BackgroundAgentEventListener,
  BackgroundAgentManagerConfig,
  BackgroundLLMCaller,
  BackgroundToolExecutor,
} from './types.js';
import { generateDelegationId, generateSessionId } from './id_generator.js';
import {
  ensureDelegationsDir,
  getArtifactPath,
  persistDelegationResult,
  readArtifact,
} from './persistence.js';
import { isTerminalStatus, isActiveStatus, DEFAULT_BACKGROUND_AGENT_CONFIG } from './types.js';

// ==========================================
// Background Agent Session
// ==========================================

interface BackgroundAgentSession {
  id: string;
  delegationId: string;
  messages: (UserMessage | AssistantMessage)[];
  toolCalls: number;
  turnCount: number;
  status: 'registered' | 'running' | 'complete' | 'error' | 'cancelled' | 'timeout';
  startedAt: Date;
  completedAt?: Date;
  result?: string;
  error?: string;
}

// ==========================================
// BackgroundAgentManager
// ==========================================

export class BackgroundAgentManager {
  private delegations: Map<string, DelegationRecord> = new Map();
  private sessions: Map<string, BackgroundAgentSession> = new Map();
  private sessionToDelegation: Map<string, string> = new Map();
  private terminalWaiters: Map<string, { promise: Promise<void>; resolve: () => void }> = new Map();
  private timeoutTimers: Map<string, ReturnType<typeof setTimeout>> = new Map();
  private eventListeners: Set<BackgroundAgentEventListener> = new Set();
  private config: BackgroundAgentManagerConfig;
  private llmCaller: BackgroundLLMCaller;
  private toolExecutor: BackgroundToolExecutor;

  constructor(
    llmCaller: BackgroundLLMCaller,
    toolExecutor: BackgroundToolExecutor,
    config?: Partial<BackgroundAgentManagerConfig>,
  ) {
    this.llmCaller = llmCaller;
    this.toolExecutor = toolExecutor;
    this.config = { ...DEFAULT_BACKGROUND_AGENT_CONFIG, ...config };
  }

  // ==========================================
  // Event System
  // ==========================================

  onEvent(listener: BackgroundAgentEventListener): void {
    this.eventListeners.add(listener);
  }

  offEvent(listener: BackgroundAgentEventListener): void {
    this.eventListeners.delete(listener);
  }

  private emit(type: BackgroundAgentEventType, delegationId: string, data: Record<string, unknown> = {}): void {
    const event: BackgroundAgentEvent = {
      type,
      delegationId,
      timestamp: new Date(),
      data,
    };
    this.eventListeners.forEach(l => l(event));
  }

  // ==========================================
  // Spawn — Create Background Agent
  // ==========================================

  async spawn(request: SpawnBackgroundAgentRequest): Promise<SpawnBackgroundAgentResult> {
    const delegationId = generateDelegationId();
    const sessionId = generateSessionId();
    const agentType = request.agentType || 'sin-researcher';
    const timeoutMs = request.timeoutMs || this.config.defaultTimeoutMs;

    const artifactDir = await ensureDelegationsDir(this.config.baseDir, request.parentSessionId);
    const artifactPath = getArtifactPath(this.config.baseDir, request.parentSessionId, delegationId);

    const now = new Date();

    const delegation: DelegationRecord = {
      id: delegationId,
      parentSessionId: request.parentSessionId,
      sessionId,
      agentType,
      prompt: request.prompt,
      status: 'registered',
      progress: {
        toolCalls: 0,
        lastUpdateAt: now,
        lastHeartbeatAt: now,
      },
      artifact: {
        filePath: artifactPath,
      },
      retrieval: {
        retrievalCount: 0,
      },
      createdAt: now,
      updatedAt: now,
      timeoutAt: new Date(now.getTime() + timeoutMs),
      model: request.model,
      maxTurns: request.maxTurns,
    };

    this.delegations.set(delegationId, delegation);

    const systemPrompt = this.buildSystemPrompt(agentType, request.prompt);
    const session: BackgroundAgentSession = {
      id: sessionId,
      delegationId,
      messages: [
        {
          role: 'user',
          content: systemPrompt + '\n\n' + request.prompt,
        },
      ],
      toolCalls: 0,
      turnCount: 0,
      status: 'running',
      startedAt: now,
    };

    this.sessions.set(sessionId, session);
    this.sessionToDelegation.set(sessionId, delegationId);

    this.createTerminalWaiter(delegationId);
    this.scheduleTimeout(delegationId, timeoutMs);

    this.emit('delegation:registered', delegationId, {
      agentType,
      prompt: request.prompt,
      sessionId,
    });

    this.executeBackgroundAgent(session, delegation).catch(error => {
      this.finalizeDelegation(delegationId, 'error', error instanceof Error ? error.message : String(error));
    });

    this.markStarted(delegationId);

    return {
      success: true,
      delegationId,
      sessionId,
      agentType,
    };
  }

  // ==========================================
  // Async Execution Engine
  // ==========================================

  private async executeBackgroundAgent(
    session: BackgroundAgentSession,
    delegation: DelegationRecord,
  ): Promise<void> {
    const maxTurns = delegation.maxTurns || 50;
    let finalContent = '';

    try {
      while (session.turnCount < maxTurns && session.status === 'running') {
        session.turnCount++;

        delegation.progress.lastHeartbeatAt = new Date();
        delegation.progress.lastUpdateAt = new Date();

        const llmResponse = await this.llmCaller(
          session.messages,
          {
            model: delegation.model,
            max_tokens: 4096,
            temperature: 0.7,
          },
        );

        if (llmResponse.content) {
          finalContent += llmResponse.content;
          const assistantMsg: AssistantMessage = {
            role: 'assistant',
            content: llmResponse.content,
          };
          session.messages.push(assistantMsg);
        }

        if (llmResponse.stopReason === 'end_turn' || llmResponse.stopReason === 'stop') {
          break;
        }

        if (llmResponse.stopReason === 'tool_use') {
          delegation.progress.toolCalls++;
          session.toolCalls++;
        }
      }

      session.result = finalContent || '(No output produced)';
      session.status = 'complete';
      session.completedAt = new Date();

      delegation.result = session.result;
      delegation.title = this.generateTitle(delegation.prompt, session.result);
      delegation.description = this.generateDescription(session.result);

      const persistResult = await persistDelegationResult(delegation, session.result);
      if (persistResult.success) {
        delegation.artifact.persistedAt = new Date();
        delegation.artifact.byteLength = persistResult.byteLength;
      } else {
        delegation.artifact.persistError = persistResult.error;
      }

      this.finalizeDelegation(delegation.id, 'complete');

    } catch (error) {
      session.status = 'error';
      session.error = error instanceof Error ? error.message : String(error);
      session.completedAt = new Date();

      this.finalizeDelegation(delegation.id, 'error', session.error);
    }
  }

  // ==========================================
  // Status Tracking
  // ==========================================

  getDelegation(id: string): DelegationRecord | undefined {
    return this.delegations.get(id);
  }

  getDelegationBySession(sessionId: string): DelegationRecord | undefined {
    const delegationId = this.sessionToDelegation.get(sessionId);
    if (!delegationId) return undefined;
    return this.delegations.get(delegationId);
  }

  listDelegations(parentSessionId?: string): DelegationListItem[] {
    const delegations = Array.from(this.delegations.values());
    const filtered = parentSessionId
      ? delegations.filter(d => d.parentSessionId === parentSessionId)
      : delegations;

    return filtered.map(d => ({
      id: d.id,
      status: d.status,
      title: d.title,
      description: d.description,
      agentType: d.agentType,
      prompt: d.prompt,
      createdAt: d.createdAt,
      completedAt: d.completedAt,
      unread: this.hasUnreadCompletion(d),
      artifactPath: d.artifact.filePath,
    }));
  }

  getActiveDelegations(parentSessionId?: string): DelegationListItem[] {
    return this.listDelegations(parentSessionId).filter(d => isActiveStatus(d.status));
  }

  getCompletedDelegations(parentSessionId?: string): DelegationListItem[] {
    return this.listDelegations(parentSessionId).filter(d => isTerminalStatus(d.status));
  }

  // ==========================================
  // Result Retrieval
  // ==========================================

  async retrieve(delegationId: string, readerSessionId?: string): Promise<string> {
    const delegation = this.delegations.get(delegationId);
    if (!delegation) {
      throw new Error(`Delegation "${delegationId}" not found`);
    }

    if (isTerminalStatus(delegation.status)) {
      return this.getDelegationResult(delegation);
    }

    const result = await this.waitForTerminal(delegationId, this.config.terminalWaitGraceMs);
    if (result === 'timeout') {
      return `Delegation "${delegationId}" is still running (status: ${delegation.status}).\n` +
        `Use "agents status ${delegationId}" to check progress.`;
    }

    return this.getDelegationResult(delegation, readerSessionId);
  }

  private async getDelegationResult(
    delegation: DelegationRecord,
    readerSessionId?: string,
  ): Promise<string> {
    const artifactContent = await readArtifact(delegation.artifact.filePath);
    if (artifactContent) {
      delegation.retrieval.retrievedAt = new Date();
      delegation.retrieval.retrievalCount++;
      if (readerSessionId) {
        delegation.retrieval.lastReaderSessionId = readerSessionId;
      }
      this.emit('delegation:retrieved', delegation.id, {
        readerSessionId,
        retrievalCount: delegation.retrieval.retrievalCount,
      });
      return artifactContent;
    }

    if (delegation.result) {
      return delegation.result;
    }

    if (delegation.status === 'error') {
      return `Error: ${delegation.error || 'Delegation failed.'}`;
    }
    if (delegation.status === 'cancelled') {
      return 'Delegation was cancelled before completion.';
    }
    if (delegation.status === 'timeout') {
      return `Delegation timed out after ${this.config.defaultTimeoutMs / 1000}s.`;
    }

    return `Delegation "${delegation.id}" completed but produced no output.`;
  }

  // ==========================================
  // Kill / Cancel
  // ==========================================

  async kill(delegationId: string): Promise<boolean> {
    const delegation = this.delegations.get(delegationId);
    if (!delegation) {
      return false;
    }

    if (isTerminalStatus(delegation.status)) {
      return false;
    }

    const session = this.sessions.get(delegation.sessionId);
    if (session) {
      session.status = 'cancelled';
      session.completedAt = new Date();
    }

    this.finalizeDelegation(delegationId, 'cancelled');
    return true;
  }

  // ==========================================
  // Internal Helpers
  // ==========================================

  private markStarted(delegationId: string): void {
    const delegation = this.delegations.get(delegationId);
    if (!delegation || isTerminalStatus(delegation.status)) return;

    delegation.status = 'running';
    delegation.startedAt = new Date();
    delegation.updatedAt = new Date();

    this.emit('delegation:started', delegationId, {
      agentType: delegation.agentType,
    });
  }

  private finalizeDelegation(
    delegationId: string,
    status: TerminalStatus,
    error?: string,
  ): void {
    const delegation = this.delegations.get(delegationId);
    if (!delegation) return;

    if (isTerminalStatus(delegation.status)) return;

    const now = new Date();
    delegation.status = status;
    delegation.completedAt = now;
    delegation.updatedAt = now;
    if (error) {
      delegation.error = error;
    }

    this.clearTimeoutTimer(delegationId);
    this.resolveTerminalWaiter(delegationId);

    const session = this.sessions.get(delegation.sessionId);
    if (session) {
      session.status = status;
      session.completedAt = now;
      if (error) session.error = error;
    }

    this.emit(`delegation:${status}` as BackgroundAgentEventType, delegationId, {
      agentType: delegation.agentType,
      title: delegation.title,
      error,
    });
  }

  private createTerminalWaiter(delegationId: string): void {
    if (this.terminalWaiters.has(delegationId)) return;

    let resolve: (() => void) | undefined;
    const promise = new Promise<void>(innerResolve => {
      resolve = innerResolve;
    });

    if (!resolve) {
      throw new Error(`Failed to initialize terminal waiter for delegation ${delegationId}`);
    }

    this.terminalWaiters.set(delegationId, { promise, resolve });
  }

  private resolveTerminalWaiter(delegationId: string): void {
    const waiter = this.terminalWaiters.get(delegationId);
    if (!waiter) return;
    waiter.resolve();
    this.terminalWaiters.delete(delegationId);
  }

  private scheduleTimeout(delegationId: string, timeoutMs: number): void {
    this.clearTimeoutTimer(delegationId);
    const timer = setTimeout(() => {
      this.handleTimeout(delegationId);
    }, timeoutMs + 5_000);
    this.timeoutTimers.set(delegationId, timer);
  }

  private clearTimeoutTimer(delegationId: string): void {
    const timer = this.timeoutTimers.get(delegationId);
    if (!timer) return;
    clearTimeout(timer);
    this.timeoutTimers.delete(delegationId);
  }

  private async handleTimeout(delegationId: string): Promise<void> {
    const delegation = this.delegations.get(delegationId);
    if (!delegation || isTerminalStatus(delegation.status)) return;

    const session = this.sessions.get(delegation.sessionId);
    if (session) {
      session.status = 'timeout';
      session.completedAt = new Date();
    }

    this.finalizeDelegation(
      delegationId,
      'timeout',
      `Delegation timed out after ${this.config.defaultTimeoutMs / 1000}s`,
    );
  }

  private async waitForTerminal(
    delegationId: string,
    timeoutMs: number,
  ): Promise<'terminal' | 'timeout'> {
    const delegation = this.delegations.get(delegationId);
    if (!delegation) return 'timeout';
    if (isTerminalStatus(delegation.status)) return 'terminal';

    const waiter = this.terminalWaiters.get(delegationId);
    if (!waiter) return 'timeout';

    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      const result = await Promise.race<'terminal' | 'timeout'>([
        waiter.promise.then(() => 'terminal'),
        new Promise<'timeout'>(resolve => {
          timer = setTimeout(() => resolve('timeout'), timeoutMs);
        }),
      ]);
      return result;
    } finally {
      if (timer) clearTimeout(timer);
    }
  }

  private hasUnreadCompletion(delegation: DelegationRecord): boolean {
    if (!isTerminalStatus(delegation.status)) return false;
    if (!delegation.completedAt) return false;
    if (!delegation.retrieval.retrievedAt) return true;
    return delegation.retrieval.retrievedAt.getTime() < delegation.completedAt.getTime();
  }

  private buildSystemPrompt(agentType: string, taskPrompt: string): string {
    return `You are an OpenSIN background agent (${agentType}).

Your task:
${taskPrompt}

RULES:
- Work independently and thoroughly
- Provide a comprehensive, well-structured response
- Include code examples where relevant
- Cite sources if you reference external information
- Format your response in clear markdown

You are running in an isolated session. Your results will be persisted to disk
and delivered to the parent session when you complete.`;
  }

  private generateTitle(prompt: string, _result: string): string {
    const firstLine = prompt.split('\n').find(l => l.trim().length > 0) || 'Background task';
    const title = firstLine.slice(0, 50).trim();
    return title.length >= firstLine.length ? title : title + '...';
  }

  private generateDescription(result: string): string {
    const paragraphs = result.split('\n\n').filter(p => p.trim().length > 0);
    const firstPara = paragraphs[0] || '';
    const desc = firstPara.slice(0, 150).trim();
    return desc.length >= firstPara.length ? desc : desc + '...';
  }

  // ==========================================
  // Stats
  // ==========================================

  getStats(): {
    total: number;
    active: number;
    completed: number;
    failed: number;
    cancelled: number;
    timedOut: number;
  } {
    const all = Array.from(this.delegations.values());
    return {
      total: all.length,
      active: all.filter(d => isActiveStatus(d.status)).length,
      completed: all.filter(d => d.status === 'complete').length,
      failed: all.filter(d => d.status === 'error').length,
      cancelled: all.filter(d => d.status === 'cancelled').length,
      timedOut: all.filter(d => d.status === 'timeout').length,
    };
  }

  clearAll(): void {
    for (const timer of this.timeoutTimers.values()) {
      clearTimeout(timer);
    }
    this.timeoutTimers.clear();
    this.terminalWaiters.clear();
    this.delegations.clear();
    this.sessions.clear();
    this.sessionToDelegation.clear();
  }
}
