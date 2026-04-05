/**
 * OpenSIN Code - Background Agents Plugin
 * Type definitions for async agent delegation
 *
 * Claude Code-style background agents with context persistence.
 * Branded: OpenSIN/sincode
 */

// ==========================================
// STATUS TYPES
// ==========================================

export type BackgroundAgentStatus =
  | 'registered'
  | 'running'
  | 'complete'
  | 'error'
  | 'cancelled'
  | 'timeout'

export type TerminalStatus = Extract<
  BackgroundAgentStatus,
  'complete' | 'error' | 'cancelled' | 'timeout'
>

export function isTerminalStatus(status: BackgroundAgentStatus): status is TerminalStatus {
  return (
    status === 'complete' ||
    status === 'error' ||
    status === 'cancelled' ||
    status === 'timeout'
  )
}

export function isActiveStatus(status: BackgroundAgentStatus): boolean {
  return status === 'registered' || status === 'running'
}

// ==========================================
// AGENT RECORD
// ==========================================

export interface AgentProgress {
  toolCalls: number
  lastUpdateAt: Date
  lastHeartbeatAt: Date
  lastMessage?: string
  lastMessageAt?: Date
}

export interface AgentNotificationState {
  terminalNotifiedAt?: Date
  terminalNotificationCount: number
}

export interface AgentRetrievalState {
  retrievedAt?: Date
  retrievalCount: number
  lastReaderSessionID?: string
}

export interface AgentArtifactState {
  filePath: string
  persistedAt?: Date
  byteLength?: number
  persistError?: string
}

export interface BackgroundAgentRecord {
  id: string
  rootSessionID: string
  sessionID: string
  parentSessionID: string
  parentMessageID: string
  parentAgent: string
  prompt: string
  agent: string
  status: BackgroundAgentStatus
  createdAt: Date
  startedAt?: Date
  completedAt?: Date
  updatedAt: Date
  timeoutAt: Date
  progress: AgentProgress
  notification: AgentNotificationState
  retrieval: AgentRetrievalState
  artifact: AgentArtifactState
  error?: string
  title?: string
  description?: string
  result?: string
}

// ==========================================
// INPUT/OUTPUT TYPES
// ==========================================

export interface SpawnAgentInput {
  parentSessionID: string
  parentMessageID: string
  parentAgent: string
  prompt: string
  agent: string
}

export interface AgentListItem {
  id: string
  status: BackgroundAgentStatus
  title?: string
  description?: string
  agent?: string
  prompt?: string
  unread?: boolean
  createdAt: Date
  completedAt?: Date
}

export interface AgentManagerOptions {
  maxRunTimeMs?: number
  readPollIntervalMs?: number
  terminalWaitGraceMs?: number
  allCompleteQuietPeriodMs?: number
  idGenerator?: () => string
}

// ==========================================
// CONSTANTS
// ==========================================

export const DEFAULT_MAX_RUN_TIME_MS = 15 * 60 * 1000 // 15 minutes
export const TERMINAL_WAIT_GRACE_MS = 10_000
export const READ_POLL_INTERVAL_MS = 250
export const ALL_COMPLETE_QUIET_PERIOD_MS = 50
