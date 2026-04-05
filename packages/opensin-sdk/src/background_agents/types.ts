/**
 * OpenSIN Background Agents — Type Definitions
 *
 * Claude Code-style background agent delegation for OpenSIN-Code.
 * Fire off research/coding tasks, continue working, retrieve results when ready.
 *
 * Architecture:
 * - Background agents run in isolated sessions (separate AgentLoop instances)
 * - Results persist to disk as markdown files (survive context compaction)
 * - Parent session receives notifications when agents complete
 * - All branding uses OpenSIN/sincode identity
 */

// ==========================================
// Delegation Status
// ==========================================

export type BackgroundAgentStatus =
  | 'registered'
  | 'running'
  | 'complete'
  | 'error'
  | 'cancelled'
  | 'timeout';

export type TerminalStatus = Extract<BackgroundAgentStatus, 'complete' | 'error' | 'cancelled' | 'timeout'>;

export function isTerminalStatus(status: BackgroundAgentStatus): status is TerminalStatus {
  return status === 'complete' || status === 'error' || status === 'cancelled' || status === 'timeout';
}

export function isActiveStatus(status: BackgroundAgentStatus): boolean {
  return status === 'registered' || status === 'running';
}

// ==========================================
// Delegation Sub-Types
// ==========================================

export interface DelegationProgress {
  toolCalls: number;
  lastUpdateAt: Date;
  lastHeartbeatAt: Date;
  lastMessage?: string;
  lastMessageAt?: Date;
}

export interface DelegationArtifact {
  filePath: string;
  persistedAt?: Date;
  byteLength?: number;
  persistError?: string;
}

export interface DelegationRetrieval {
  retrievedAt?: Date;
  retrievalCount: number;
  lastReaderSessionId?: string;
}

export interface DelegationNotification {
  terminalNotifiedAt?: Date;
  terminalNotificationCount: number;
}

// ==========================================
// Background Agent Record (manager.ts type system)
// ==========================================

export interface BackgroundAgentRecord {
  /** Unique delegation ID (readable, e.g. "swift-coral-researcher") */
  id: string;

  /** Root session ID (top of parent chain) */
  rootSessionId: string;

  /** Isolated session ID for this background agent */
  sessionId: string;

  /** Parent session that spawned this delegation */
  parentSessionId: string;

  /** Parent message ID at time of spawn */
  parentMessageId: string;

  /** Parent agent name */
  parentAgent: string;

  /** Agent type/name (e.g. "sin-researcher") */
  agent: string;

  /** Task prompt given to the agent */
  prompt: string;

  /** Notification cycle tracking */
  notificationCycle: number;

  /** Notification cycle token */
  notificationCycleToken: string;

  /** Current lifecycle status */
  status: BackgroundAgentStatus;

  /** Progress tracking */
  progress: DelegationProgress;

  /** Artifact (persisted result file) */
  artifact: DelegationArtifact;

  /** Retrieval tracking */
  retrieval: DelegationRetrieval;

  /** Notification tracking */
  notification: DelegationNotification;

  /** Result content (when completed) */
  result?: string;

  /** Error message (if failed) */
  error?: string;

  /** Auto-generated title */
  title?: string;

  /** Auto-generated summary */
  description?: string;

  /** Timestamps */
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  updatedAt: Date;
  timeoutAt: Date;
}

// ==========================================
// Parent Notification State
// ==========================================

export interface ParentNotificationState {
  allCompleteNotificationCount: number;
  allCompleteCycle: number;
  allCompleteCycleToken: string;
  allCompleteNotifiedAt?: Date;
  allCompleteScheduledTimer?: ReturnType<typeof setTimeout>;
  allCompleteScheduledCycle?: number;
  allCompleteScheduledCycleToken?: string;
}

// ==========================================
// Spawn Input / Result
// ==========================================

export interface SpawnAgentInput {
  prompt: string;
  agent?: string;
  parentSessionId: string;
  parentMessageId: string;
  parentAgent: string;
}

export interface SpawnAgentResult {
  success: boolean;
  delegationId: string;
  sessionId: string;
  agentType: string;
  error?: string;
}

// ==========================================
// Agent List Item (CLI-friendly)
// ==========================================

export interface AgentListItem {
  id: string;
  status: BackgroundAgentStatus;
  title?: string;
  description?: string;
  agent: string;
  prompt: string;
  unread: boolean;
  createdAt: Date;
  completedAt?: Date;
}

// ==========================================
// Background Agent Event
// ==========================================

export type BackgroundAgentEventType =
  | 'agent:spawned'
  | 'agent:started'
  | 'agent:progress'
  | 'agent:complete'
  | 'agent:error'
  | 'agent:cancelled'
  | 'agent:timeout'
  | 'agent:retrieved'
  | 'agent:all-complete';

export interface BackgroundAgentSpawnedEvent {
  type: 'agent:spawned';
  agent: BackgroundAgentRecord;
}

export interface BackgroundAgentStartedEvent {
  type: 'agent:started';
  agentId: string;
}

export interface BackgroundAgentProgressEvent {
  type: 'agent:progress';
  agentId: string;
  message: string;
}

export interface BackgroundAgentCompleteEvent {
  type: 'agent:complete';
  agentId: string;
  result: string;
}

export interface BackgroundAgentErrorEvent {
  type: 'agent:error';
  agentId: string;
  error: string;
}

export interface BackgroundAgentCancelledEvent {
  type: 'agent:cancelled';
  agentId: string;
}

export interface BackgroundAgentTimeoutEvent {
  type: 'agent:timeout';
  agentId: string;
}

export interface BackgroundAgentRetrievedEvent {
  type: 'agent:retrieved';
  agentId: string;
}

export interface BackgroundAgentAllCompleteEvent {
  type: 'agent:all-complete';
  parentSessionId: string;
}

export type BackgroundAgentEvent =
  | BackgroundAgentSpawnedEvent
  | BackgroundAgentStartedEvent
  | BackgroundAgentProgressEvent
  | BackgroundAgentCompleteEvent
  | BackgroundAgentErrorEvent
  | BackgroundAgentCancelledEvent
  | BackgroundAgentTimeoutEvent
  | BackgroundAgentRetrievedEvent
  | BackgroundAgentAllCompleteEvent;

export type BackgroundAgentEventListener = (event: BackgroundAgentEvent) => void;

// ==========================================
// Background Agent Manager Config
// ==========================================

export interface BackgroundAgentConfig {
  /** Base directory for delegation artifacts */
  baseDir?: string;

  /** Default timeout in ms (15 minutes) */
  maxRunTimeMs?: number;

  /** Poll interval for artifact reads (ms) */
  readPollIntervalMs?: number;

  /** Grace period for terminal wait (ms) */
  terminalWaitGraceMs?: number;

  /** Quiet period before all-complete notification (ms) */
  allCompleteQuietPeriodMs?: number;

  /** Whether to auto-generate titles/summaries */
  autoMetadata?: boolean;
}

// ==========================================
// Default Constants
// ==========================================

export const DEFAULT_MAX_RUN_TIME_MS = 15 * 60 * 1000; // 15 minutes
export const DEFAULT_READ_POLL_INTERVAL_MS = 250;
export const DEFAULT_TERMINAL_WAIT_GRACE_MS = 10_000;
export const DEFAULT_ALL_COMPLETE_QUIET_PERIOD_MS = 50;

export const DEFAULT_BACKGROUND_AGENT_CONFIG: Required<BackgroundAgentConfig> = {
  baseDir: process.env.OPENCODE_DELEGATIONS_DIR ||
    `${process.env.HOME || process.env.USERPROFILE || '.'}/.local/share/opensin/delegations`,
  maxRunTimeMs: DEFAULT_MAX_RUN_TIME_MS,
  readPollIntervalMs: DEFAULT_READ_POLL_INTERVAL_MS,
  terminalWaitGraceMs: DEFAULT_TERMINAL_WAIT_GRACE_MS,
  allCompleteQuietPeriodMs: DEFAULT_ALL_COMPLETE_QUIET_PERIOD_MS,
  autoMetadata: true,
};

// ==========================================
// Legacy Aliases (for agent_manager.ts compatibility)
// ==========================================

export type DelegationStatus = BackgroundAgentStatus;

export interface DelegationRecord extends BackgroundAgentRecord {
  agentType: string;
  model?: string;
  maxTurns?: number;
}

export interface SpawnBackgroundAgentRequest {
  prompt: string;
  agentType?: string;
  parentSessionId: string;
  model?: string;
  maxTurns?: number;
  timeoutMs?: number;
  workspace?: string;
}

export interface SpawnBackgroundAgentResult {
  success: boolean;
  delegationId: string;
  sessionId: string;
  agentType: string;
  error?: string;
}

export interface DelegationListItem {
  id: string;
  status: BackgroundAgentStatus;
  title?: string;
  description?: string;
  agentType: string;
  prompt: string;
  createdAt: Date;
  completedAt?: Date;
  unread: boolean;
  artifactPath: string;
}

export interface BackgroundAgentManagerConfig {
  baseDir: string;
  defaultTimeoutMs: number;
  readPollIntervalMs: number;
  terminalWaitGraceMs: number;
  workspace: string;
  permissionMode: 'auto' | 'ask' | 'readonly';
  autoMetadata: boolean;
}

export interface BackgroundLLMCaller {
  (
    messages: unknown[],
    options?: { model?: string; max_tokens?: number; temperature?: number },
  ): Promise<{
    content: string;
    usage: unknown;
    stopReason: string;
  }>;
}

export interface BackgroundToolExecutor {
  (
    toolName: string,
    toolInput: Record<string, unknown>,
    workspace: string,
    sessionId: string,
  ): Promise<{
    output: string;
    isError: boolean;
    errorCode?: number;
  }>;
}
