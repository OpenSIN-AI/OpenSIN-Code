/**
 * OpenSIN Background Agents — Manager
 *
 * Core manager for background agent lifecycle: spawn, track, retrieve, kill.
 * Handles async delegation with context persistence and result delivery.
 *
 * Branded as OpenSIN/sincode for the OpenSIN ecosystem.
 *
 * Phase 3.2 — Background Agents Plugin (Async agent delegation)
 * Issue: #362
 */

import * as fs from "node:fs/promises";
import * as path from "node:path";
import * as os from "node:os";
import {
  BackgroundAgentRecord,
  TerminalStatus,
  SpawnAgentInput,
  AgentListItem,
  BackgroundAgentConfig,
  BackgroundAgentEvent,
  DEFAULT_MAX_RUN_TIME_MS,
  DEFAULT_READ_POLL_INTERVAL_MS,
  DEFAULT_TERMINAL_WAIT_GRACE_MS,
  DEFAULT_ALL_COMPLETE_QUIET_PERIOD_MS,
  isTerminalStatus,
  isActiveStatus,
  ParentNotificationState,
} from "./types.js";

// ============================================================
// Readable ID Generation (no external dependency)
// ============================================================

const ADJECTIVES = [
  "swift", "bold", "calm", "deep", "fast", "keen", "lucky", "prime",
  "rare", "safe", "true", "vast", "warm", "bright", "clear", "dark",
  "eager", "fair", "grand", "light", "noble", "quick", "sharp",
];

const COLORS = [
  "coral", "azure", "amber", "jade", "ruby", "onyx", "pearl", "gold",
  "silver", "bronze", "ivory", "ebony", "teal", "navy", "rose", "sage",
];

const ANIMALS = [
  "falcon", "wolf", "hawk", "bear", "lynx", "fox", "owl", "eagle",
  "tiger", "shark", "crane", "stag", "drake", "raven", "cobra", "puma",
];

function generateReadableId(): string {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const color = COLORS[Math.floor(Math.random() * COLORS.length)];
  const animal = ANIMALS[Math.floor(Math.random() * ANIMALS.length)];
  return `${adj}-${color}-${animal}`;
}

// ============================================================
// Metadata Generation (fallback without LLM)
// ============================================================

interface GeneratedMetadata {
  title: string;
  description: string;
}

function generateMetadataFallback(resultContent: string): GeneratedMetadata {
  const firstLine =
    resultContent.split("\n").find((l) => l.trim().length > 0) || "Agent result";
  const title = firstLine.slice(0, 40).trim() + (firstLine.length > 40 ? "..." : "");
  const description =
    resultContent.slice(0, 200).trim() + (resultContent.length > 200 ? "..." : "");
  return { title, description };
}

// ============================================================
// Terminal Waiter
// ============================================================

interface TerminalWaiter {
  promise: Promise<void>;
  resolve: () => void;
}

// ============================================================
// Background Agent Manager
// ============================================================

export class BackgroundAgentManager {
  // Core storage
  private delegations: Map<string, BackgroundAgentRecord> = new Map();
  private delegationsBySession: Map<string, string> = new Map();

  // Waiters & timers
  private terminalWaiters: Map<string, TerminalWaiter> = new Map();
  private timeoutTimers: Map<string, ReturnType<typeof setTimeout>> = new Map();

  // Parent tracking
  private pendingByParent: Map<string, Set<string>> = new Map();
  private parentNotificationState: Map<string, ParentNotificationState> = new Map();

  // Configuration
  private config: Required<BackgroundAgentConfig>;

  // Event listeners
  private eventListeners: Set<(event: BackgroundAgentEvent) => void> = new Set();

  // ID generator (overridable for testing)
  private idGenerator: () => string;

  constructor(config?: BackgroundAgentConfig) {
    this.config = {
      maxRunTimeMs: config?.maxRunTimeMs ?? DEFAULT_MAX_RUN_TIME_MS,
      readPollIntervalMs: config?.readPollIntervalMs ?? DEFAULT_READ_POLL_INTERVAL_MS,
      terminalWaitGraceMs: config?.terminalWaitGraceMs ?? DEFAULT_TERMINAL_WAIT_GRACE_MS,
      allCompleteQuietPeriodMs: config?.allCompleteQuietPeriodMs ?? DEFAULT_ALL_COMPLETE_QUIET_PERIOD_MS,
      baseDir: config?.baseDir || path.join(os.homedir(), ".local", "share", "opensin", "delegations"),
      autoMetadata: config?.autoMetadata ?? true,
    };
    this.idGenerator = generateReadableId;
  }

  // ============================================================
  // Event System
  // ============================================================

  onEvent(listener: (event: BackgroundAgentEvent) => void): void {
    this.eventListeners.add(listener);
  }

  offEvent(listener: (event: BackgroundAgentEvent) => void): void {
    this.eventListeners.delete(listener);
  }

  private emit(event: BackgroundAgentEvent): void {
    this.eventListeners.forEach((l) => {
      try {
        l(event);
      } catch {
        // Listener errors should not break the manager
      }
    });
  }

  // ============================================================
  // Directory Management
  // ============================================================

  private async getDelegationsDir(sessionId: string): Promise<string> {
    const rootId = await this.resolveRootSessionId(sessionId);
    return path.join(this.config.baseDir, rootId);
  }

  private async ensureDelegationsDir(sessionId: string): Promise<string> {
    const dir = await this.getDelegationsDir(sessionId);
    await fs.mkdir(dir, { recursive: true });
    return dir;
  }

  private async resolveRootSessionId(sessionId: string): Promise<string> {
    return sessionId;
  }

  // ============================================================
  // Terminal Waiter
  // ============================================================

  private createTerminalWaiter(id: string): void {
    if (this.terminalWaiters.has(id)) return;

    let resolve: (() => void) | undefined;
    const promise = new Promise<void>((innerResolve) => {
      resolve = innerResolve;
    });

    if (!resolve) {
      throw new Error(`Failed to initialize terminal waiter for agent ${id}`);
    }

    this.terminalWaiters.set(id, { promise, resolve });
  }

  private resolveTerminalWaiter(id: string): void {
    const waiter = this.terminalWaiters.get(id);
    if (!waiter) return;
    waiter.resolve();
  }

  // ============================================================
  // Timeout Management
  // ============================================================

  private clearTimeoutTimer(id: string): void {
    const timer = this.timeoutTimers.get(id);
    if (!timer) return;
    clearTimeout(timer);
    this.timeoutTimers.delete(id);
  }

  private scheduleTimeout(id: string): void {
    this.clearTimeoutTimer(id);
    const timer = setTimeout(() => {
      void this.handleTimeout(id);
    }, this.config.maxRunTimeMs);
    this.timeoutTimers.set(id, timer);
  }

  // ============================================================
  // Delegation State Mutations
  // ============================================================

  private updateDelegation(
    id: string,
    mutate: (delegation: BackgroundAgentRecord, now: Date) => void
  ): BackgroundAgentRecord | undefined {
    const delegation = this.delegations.get(id);
    if (!delegation) return undefined;

    const now = new Date();
    mutate(delegation, now);
    delegation.updatedAt = now;
    return delegation;
  }

  private registerDelegation(input: {
    id: string;
    rootSessionId: string;
    sessionId: string;
    parentSessionId: string;
    parentMessageId: string;
    parentAgent: string;
    prompt: string;
    agent: string;
    artifactPath: string;
  }): BackgroundAgentRecord {
    const isFirstForParent = !this.pendingByParent.has(input.parentSessionId);
    if (isFirstForParent) {
      this.pendingByParent.set(input.parentSessionId, new Set());
      this.resetParentAllCompleteCycle(input.parentSessionId);
    }

    const parentState = this.getParentNotificationState(input.parentSessionId);
    const notificationCycle = parentState.allCompleteCycle;
    const notificationCycleToken = parentState.allCompleteCycleToken;

    const now = new Date();
    const delegation: BackgroundAgentRecord = {
      id: input.id,
      rootSessionId: input.rootSessionId,
      sessionId: input.sessionId,
      parentSessionId: input.parentSessionId,
      parentMessageId: input.parentMessageId,
      parentAgent: input.parentAgent,
      prompt: input.prompt,
      agent: input.agent,
      notificationCycle,
      notificationCycleToken,
      status: "registered",
      createdAt: now,
      updatedAt: now,
      timeoutAt: new Date(now.getTime() + this.config.maxRunTimeMs),
      progress: {
        toolCalls: 0,
        lastUpdateAt: now,
        lastHeartbeatAt: now,
      },
      notification: {
        terminalNotificationCount: 0,
      },
      retrieval: {
        retrievalCount: 0,
      },
      artifact: {
        filePath: input.artifactPath,
      },
    };

    this.delegations.set(delegation.id, delegation);
    this.delegationsBySession.set(delegation.sessionId, delegation.id);
    this.createTerminalWaiter(delegation.id);
    this.pendingByParent.get(delegation.parentSessionId)?.add(delegation.id);

    return delegation;
  }

  private markStarted(id: string): BackgroundAgentRecord | undefined {
    return this.updateDelegation(id, (delegation, now) => {
      if (isTerminalStatus(delegation.status)) return;
      delegation.status = "running";
      delegation.startedAt = now;
      delegation.progress.lastUpdateAt = now;
      delegation.progress.lastHeartbeatAt = now;
    });
  }

  private markProgress(id: string, messageText?: string): BackgroundAgentRecord | undefined {
    return this.updateDelegation(id, (delegation, now) => {
      if (isTerminalStatus(delegation.status)) return;
      if (delegation.status === "registered") {
        delegation.status = "running";
        delegation.startedAt = delegation.startedAt ?? now;
      }
      delegation.progress.lastUpdateAt = now;
      delegation.progress.lastHeartbeatAt = now;
      if (messageText) {
        delegation.progress.lastMessage = messageText;
        delegation.progress.lastMessageAt = now;
      }
    });
  }

  private markTerminal(
    id: string,
    status: TerminalStatus,
    error?: string
  ): { transitioned: boolean; delegation?: BackgroundAgentRecord } {
    const delegation = this.delegations.get(id);
    if (!delegation) return { transitioned: false };

    if (isTerminalStatus(delegation.status)) {
      return { transitioned: false, delegation };
    }

    const now = new Date();
    delegation.status = status;
    delegation.completedAt = now;
    delegation.updatedAt = now;
    if (error) {
      delegation.error = error;
    }

    const pending = this.pendingByParent.get(delegation.parentSessionId);
    if (pending) {
      pending.delete(delegation.id);
      if (pending.size === 0) {
        this.pendingByParent.delete(delegation.parentSessionId);
      }
    }

    this.clearTimeoutTimer(id);
    this.resolveTerminalWaiter(id);

    return { transitioned: true, delegation };
  }

  private markNotified(id: string): BackgroundAgentRecord | undefined {
    return this.updateDelegation(id, (delegation) => {
      delegation.notification.terminalNotifiedAt = new Date();
      delegation.notification.terminalNotificationCount += 1;
    });
  }

  private markRetrieved(id: string, readerSessionId: string): BackgroundAgentRecord | undefined {
    return this.updateDelegation(id, (delegation) => {
      delegation.retrieval.retrievedAt = new Date();
      delegation.retrieval.retrievalCount += 1;
      delegation.retrieval.lastReaderSessionId = readerSessionId;
    });
  }

  // ============================================================
  // Parent Notification State
  // ============================================================

  private getParentNotificationState(parentSessionId: string): ParentNotificationState {
    const existing = this.parentNotificationState.get(parentSessionId);
    if (existing) return existing;

    const initialized: ParentNotificationState = {
      allCompleteNotificationCount: 0,
      allCompleteCycle: 0,
      allCompleteCycleToken: this.buildCycleToken(parentSessionId, 0),
    };
    this.parentNotificationState.set(parentSessionId, initialized);
    return initialized;
  }

  private buildCycleToken(parentSessionId: string, cycle: number): string {
    return `${parentSessionId}:${cycle}`;
  }

  private resetParentAllCompleteCycle(parentSessionId: string): void {
    const state = this.getParentNotificationState(parentSessionId);
    this.cancelScheduledAllComplete(state);
    state.allCompleteCycle += 1;
    state.allCompleteCycleToken = this.buildCycleToken(parentSessionId, state.allCompleteCycle);
    state.allCompleteNotifiedAt = undefined;
    state.allCompleteScheduledTimer = undefined;
    state.allCompleteScheduledCycle = undefined;
    state.allCompleteScheduledCycleToken = undefined;
  }

  private cancelScheduledAllComplete(state: ParentNotificationState): void {
    if (state.allCompleteScheduledTimer) {
      clearTimeout(state.allCompleteScheduledTimer);
    }
    state.allCompleteScheduledTimer = undefined;
    state.allCompleteScheduledCycle = undefined;
    state.allCompleteScheduledCycleToken = undefined;
  }

  private areCycleNotificationsComplete(parentSessionId: string, cycleToken: string): boolean {
    let cycleDelegationCount = 0;

    for (const delegation of this.delegations.values()) {
      if (delegation.parentSessionId !== parentSessionId) continue;
      if (delegation.notificationCycleToken !== cycleToken) continue;

      cycleDelegationCount += 1;
      if (!delegation.notification.terminalNotifiedAt) {
        return false;
      }
    }

    return cycleDelegationCount > 0;
  }

  private scheduleAllCompleteForParent(parentSessionId: string, _parentAgent: string): void {
    const state = this.getParentNotificationState(parentSessionId);
    const cycle = state.allCompleteCycle;
    const cycleToken = state.allCompleteCycleToken;

    if (!this.areCycleNotificationsComplete(parentSessionId, cycleToken)) return;
    if (state.allCompleteScheduledCycleToken === cycleToken) return;

    this.cancelScheduledAllComplete(state);

    state.allCompleteScheduledCycle = cycle;
    state.allCompleteScheduledCycleToken = cycleToken;
    state.allCompleteScheduledTimer = setTimeout(() => {
      void this.dispatchAllCompleteNotification(parentSessionId, cycle, cycleToken);
    }, this.config.allCompleteQuietPeriodMs);
  }

  private async dispatchAllCompleteNotification(
    parentSessionId: string,
    _cycle: number,
    _cycleToken: string
  ): Promise<void> {
    this.emit({ type: "agent:all-complete", parentSessionId });
    const state = this.getParentNotificationState(parentSessionId);
    state.allCompleteNotifiedAt = new Date();
    state.allCompleteNotificationCount += 1;
  }

  // ============================================================
  // Notification Building
  // ============================================================

  private buildTerminalNotification(delegation: BackgroundAgentRecord, remainingCount: number): string {
    const NL = "\n";
    const lines = [
      "<sin-agent-notification>",
      `<agent-id>${delegation.id}</agent-id>`,
      `<status>${delegation.status}</status>`,
      `<summary>Background agent ${delegation.status}: ${delegation.title || delegation.id}</summary>`,
      delegation.title ? `<title>${delegation.title}</title>` : "",
      delegation.description ? `<description>${delegation.description}</description>` : "",
      delegation.error ? `<error>${delegation.error}</error>` : "",
      `<artifact>${delegation.artifact.filePath}</artifact>`,
      `<retrieval>Use /agents result ${delegation.id} for full output.</retrieval>`,
      remainingCount > 0 ? `<remaining>${remainingCount}</remaining>` : "",
      "</sin-agent-notification>",
    ];

    return lines.filter((line) => line.length > 0).join(NL);
  }

  // ============================================================
  // Core: Spawn Agent
  // ============================================================

  async spawn(input: SpawnAgentInput): Promise<BackgroundAgentRecord> {
    const agentName = input.agent || "sin-researcher";
    const artifactDir = await this.ensureDelegationsDir(input.parentSessionId);
    const rootSessionId = await this.resolveRootSessionId(input.parentSessionId);
    const stableId = await this.generateUniqueId(artifactDir);
    const artifactPath = path.join(artifactDir, `${stableId}.md`);

    const sessionId = `session-${stableId}-${Date.now()}`;

    const delegation = this.registerDelegation({
      id: stableId,
      rootSessionId,
      sessionId,
      parentSessionId: input.parentSessionId,
      parentMessageId: input.parentMessageId,
      parentAgent: input.parentAgent,
      prompt: input.prompt,
      agent: agentName,
      artifactPath,
    });

    this.scheduleTimeout(delegation.id);
    this.markStarted(delegation.id);

    this.emit({ type: "agent:spawned", agent: delegation });
    this.emit({ type: "agent:started", agentId: delegation.id });

    return delegation;
  }

  // ============================================================
  // Core: Complete / Fail / Cancel
  // ============================================================

  async complete(agentId: string, result: string): Promise<void> {
    await this.finalizeAgent(agentId, "complete", undefined, result);
  }

  async fail(agentId: string, error: string): Promise<void> {
    await this.finalizeAgent(agentId, "error", error);
  }

  async cancel(agentId: string): Promise<void> {
    const delegation = this.delegations.get(agentId);
    if (!delegation || isTerminalStatus(delegation.status)) return;

    this.clearTimeoutTimer(agentId);
    await this.finalizeAgent(agentId, "cancelled", "Agent was cancelled by user");
  }

  // ============================================================
  // Core: Finalize Agent
  // ============================================================

  private async finalizeAgent(
    agentId: string,
    status: TerminalStatus,
    error?: string,
    resultOverride?: string
  ): Promise<void> {
    const { transitioned, delegation } = this.markTerminal(agentId, status, error);
    if (!transitioned || !delegation) return;

    const resolvedResult = resultOverride ?? this.resolveAgentResult(delegation);
    delegation.result = resolvedResult;

    if (resolvedResult.trim().length > 0 && this.config.autoMetadata) {
      const metadata = generateMetadataFallback(resolvedResult);
      delegation.title = metadata.title;
      delegation.description = metadata.description;
    }

    await this.persistOutput(delegation, resolvedResult);
    await this.notifyParent(agentId);

    if (status === "complete") {
      this.emit({ type: "agent:complete", agentId, result: resolvedResult });
    } else if (status === "error") {
      this.emit({ type: "agent:error", agentId, error: error ?? "Unknown error" });
    } else if (status === "cancelled") {
      this.emit({ type: "agent:cancelled", agentId });
    } else if (status === "timeout") {
      this.emit({ type: "agent:timeout", agentId });
    }
  }

  // ============================================================
  // Timeout Handler
  // ============================================================

  private async handleTimeout(agentId: string): Promise<void> {
    const delegation = this.delegations.get(agentId);
    if (!delegation || isTerminalStatus(delegation.status)) return;

    await this.finalizeAgent(
      agentId,
      "timeout",
      `Agent timed out after ${this.config.maxRunTimeMs / 1000}s`
    );
  }

  // ============================================================
  // Result Resolution
  // ============================================================

  private resolveAgentResult(delegation: BackgroundAgentRecord): string {
    if (delegation.status === "error") {
      return `Error: ${delegation.error || "Agent failed."}`;
    }
    if (delegation.status === "cancelled") {
      return "Agent was cancelled before completion.";
    }
    if (delegation.status === "timeout") {
      return `[TIMEOUT REACHED after ${this.config.maxRunTimeMs / 1000}s]\n\nPartial result may be available in artifact.`;
    }
    return delegation.result || "Agent completed with no output.";
  }

  // ============================================================
  // Persistence
  // ============================================================

  private async persistOutput(delegation: BackgroundAgentRecord, content: string): Promise<void> {
    try {
      const title = delegation.title || delegation.id;
      const description = delegation.description || "(No description generated)";
      const NL = "\n";

      const header = [
        `# ${title}`,
        "",
        description,
        "",
        "**OpenSIN Background Agent**",
        `**ID:** ${delegation.id}`,
        `**Agent:** ${delegation.agent}`,
        `**Status:** ${delegation.status}`,
        `**Session:** ${delegation.sessionId}`,
        `**Started:** ${(delegation.startedAt || delegation.createdAt).toISOString()}`,
        `**Completed:** ${delegation.completedAt?.toISOString() || "N/A"}`,
        "",
        "---",
        "",
      ].join(NL);

      await fs.writeFile(delegation.artifact.filePath, header + content, "utf8");

      const stats = await fs.stat(delegation.artifact.filePath);
      this.updateDelegation(delegation.id, (record) => {
        record.artifact.persistedAt = new Date();
        record.artifact.byteLength = stats.size;
        record.artifact.persistError = undefined;
      });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      this.updateDelegation(delegation.id, (record) => {
        record.artifact.persistError = errorMsg;
      });
    }
  }

  // ============================================================
  // Parent Notification
  // ============================================================

  private async notifyParent(agentId: string): Promise<void> {
    const delegation = this.delegations.get(agentId);
    if (!delegation) return;
    if (!isTerminalStatus(delegation.status)) return;
    if (delegation.notification.terminalNotifiedAt) return;

    const remainingCount = this.getPendingCount(delegation.parentSessionId);
    const notification = this.buildTerminalNotification(delegation, remainingCount);

    this.emit({
      type: "agent:complete",
      agentId,
      result: notification,
    });

    this.markNotified(agentId);
    this.scheduleAllCompleteForParent(delegation.parentSessionId, delegation.parentAgent);
  }

  // ============================================================
  // Query Methods
  // ============================================================

  findById(id: string): BackgroundAgentRecord | undefined {
    return this.delegations.get(id);
  }

  findBySession(sessionId: string): BackgroundAgentRecord | undefined {
    const delegationId = this.delegationsBySession.get(sessionId);
    if (!delegationId) return undefined;
    return this.delegations.get(delegationId);
  }

  listByParentSession(parentSessionId: string): BackgroundAgentRecord[] {
    return Array.from(this.delegations.values()).filter(
      (d) => d.parentSessionId === parentSessionId
    );
  }

  listAll(): BackgroundAgentRecord[] {
    return Array.from(this.delegations.values());
  }

  listActive(): BackgroundAgentRecord[] {
    return Array.from(this.delegations.values()).filter((d) => isActiveStatus(d.status));
  }

  listTerminal(): BackgroundAgentRecord[] {
    return Array.from(this.delegations.values()).filter((d) => isTerminalStatus(d.status));
  }

  getPendingCount(parentSessionId: string): number {
    return this.pendingByParent.get(parentSessionId)?.size ?? 0;
  }

  // ============================================================
  // Agent List (CLI-friendly format)
  // ============================================================

  getAgentList(parentSessionId?: string): AgentListItem[] {
    let agents = Array.from(this.delegations.values());

    if (parentSessionId) {
      agents = agents.filter((d) => d.parentSessionId === parentSessionId);
    }

    return agents.map((d) => ({
      id: d.id,
      status: d.status,
      title: d.title,
      description: d.description,
      agent: d.agent,
      prompt: d.prompt,
      unread: this.hasUnreadCompletion(d),
      createdAt: d.createdAt,
      completedAt: d.completedAt,
    }));
  }

  hasUnreadCompletion(delegation: BackgroundAgentRecord): boolean {
    if (!isTerminalStatus(delegation.status)) return false;
    if (!delegation.notification.terminalNotifiedAt) return false;
    if (!delegation.completedAt) return false;

    if (!delegation.retrieval.retrievedAt) return true;
    return delegation.retrieval.retrievedAt.getTime() < delegation.completedAt.getTime();
  }

  // ============================================================
  // Result Retrieval
  // ============================================================

  async getResult(agentId: string, readerSessionId?: string): Promise<string> {
    const delegation = this.delegations.get(agentId);
    if (!delegation) {
      throw new Error(`Agent "${agentId}" not found`);
    }

    if (readerSessionId) {
      this.markRetrieved(agentId, readerSessionId);
      this.emit({ type: "agent:retrieved", agentId });
    }

    // If still running, wait with timeout
    if (!isTerminalStatus(delegation.status)) {
      const result = await this.waitForTerminal(agentId, this.config.terminalWaitGraceMs);
      if (result === "timeout") {
        return `Agent "${agentId}" is still running (status: ${delegation.status}).\n\nUse /agents status ${agentId} to check progress.`;
      }
    }

    // Try to read persisted artifact first
    const persistedContent = await this.readPersistedArtifact(delegation.artifact.filePath);
    if (persistedContent) {
      return persistedContent;
    }

    // Fall back to in-memory result
    return this.resolveAgentResult(delegation);
  }

  async readPersistedArtifact(filePath: string): Promise<string | null> {
    try {
      return await fs.readFile(filePath, "utf8");
    } catch {
      return null;
    }
  }

  async waitForPersistedArtifact(filePath: string, maxWaitMs: number): Promise<string | null> {
    const start = Date.now();
    while (Date.now() - start < maxWaitMs) {
      const content = await this.readPersistedArtifact(filePath);
      if (content !== null) return content;
      await new Promise((resolve) => setTimeout(resolve, this.config.readPollIntervalMs));
    }
    return null;
  }

  // ============================================================
  // Terminal Wait
  // ============================================================

  async waitForTerminal(agentId: string, timeoutMs: number): Promise<"terminal" | "timeout"> {
    const delegation = this.delegations.get(agentId);
    if (!delegation) return "timeout";
    if (isTerminalStatus(delegation.status)) return "terminal";

    const waiter = this.terminalWaiters.get(agentId);
    if (!waiter) return "timeout";

    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      const result = await Promise.race<"terminal" | "timeout">([
        waiter.promise.then(() => "terminal" as const),
        new Promise<"timeout">((resolve) => {
          timer = setTimeout(() => resolve("timeout" as const), timeoutMs);
        }),
      ]);
      return result;
    } finally {
      if (timer) clearTimeout(timer);
    }
  }

  // ============================================================
  // Unique ID Generation
  // ============================================================

  private async generateUniqueId(artifactDir: string): Promise<string> {
    for (let attempt = 0; attempt < 20; attempt++) {
      const candidate = this.idGenerator();
      if (this.delegations.has(candidate)) continue;

      const candidatePath = path.join(artifactDir, `${candidate}.md`);
      try {
        await fs.access(candidatePath);
      } catch {
        return candidate;
      }
    }

    throw new Error("Failed to generate unique agent ID after 20 attempts");
  }

  // ============================================================
  // Cleanup
  // ============================================================

  dispose(): void {
    for (const timer of this.timeoutTimers.values()) {
      clearTimeout(timer);
    }
    this.timeoutTimers.clear();

    for (const state of this.parentNotificationState.values()) {
      this.cancelScheduledAllComplete(state);
    }

    for (const waiter of this.terminalWaiters.values()) {
      waiter.resolve();
    }
    this.terminalWaiters.clear();

    this.eventListeners.clear();
  }

  // ============================================================
  // Status Summary
  // ============================================================

  getStatusSummary(): {
    total: number;
    active: number;
    completed: number;
    errors: number;
    cancelled: number;
    timedOut: number;
  } {
    const all = this.listAll();
    return {
      total: all.length,
      active: all.filter((d) => d.status === "running" || d.status === "registered").length,
      completed: all.filter((d) => d.status === "complete").length,
      errors: all.filter((d) => d.status === "error").length,
      cancelled: all.filter((d) => d.status === "cancelled").length,
      timedOut: all.filter((d) => d.status === "timeout").length,
    };
  }
}
