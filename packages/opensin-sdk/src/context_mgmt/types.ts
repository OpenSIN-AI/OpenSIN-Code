/**
 * OpenSIN Context Management — Type Definitions
 *
 * Core types for context window management, compression, and
 * persistent storage within the OpenSIN framework.
 */

/** Unique identifier for a context entry */
export type ContextId = string

/** Role of a message in context */
export type ContextRole = 'system' | 'user' | 'assistant' | 'tool'

/** Single context entry (message) */
export interface ContextEntry {
  id: ContextId
  role: ContextRole
  content: string
  timestamp: number
  tokenCount: number
  metadata?: Record<string, unknown>
  priority: number
  compressed?: boolean
}

/** Context window state */
export interface ContextWindow {
  entries: ContextEntry[]
  totalTokens: number
  maxTokens: number
  utilization: number
  sessionId: string
  createdAt: number
  lastUpdated: number
}

/** Compression strategy */
export type CompressionStrategy = 'truncate' | 'summarize' | 'sliding_window' | 'priority_based' | 'hybrid'

/** Compression result */
export interface CompressionResult {
  originalTokens: number
  compressedTokens: number
  entriesRemoved: number
  entriesCompressed: number
  strategy: CompressionStrategy
  duration: number
}

/** Context store configuration */
export interface ContextStoreConfig {
  maxEntries: number
  maxTokens: number
  compressionThreshold: number
  compressionStrategy: CompressionStrategy
  persistPath?: string
  autoCompress: boolean
  ttlMs?: number
}

/** Stored context snapshot */
export interface ContextSnapshot {
  sessionId: string
  entries: ContextEntry[]
  totalTokens: number
  savedAt: number
  metadata?: Record<string, unknown>
}

/** Context event */
export type ContextEvent =
  | { type: 'entry_added'; entry: ContextEntry; totalTokens: number; timestamp: number }
  | { type: 'entry_removed'; entryId: ContextId; totalTokens: number; timestamp: number }
  | { type: 'compressed'; result: CompressionResult; timestamp: number }
  | { type: 'threshold_exceeded'; utilization: number; timestamp: number }
  | { type: 'saved'; sessionId: string; entryCount: number; timestamp: number }
  | { type: 'restored'; sessionId: string; entryCount: number; timestamp: number }
