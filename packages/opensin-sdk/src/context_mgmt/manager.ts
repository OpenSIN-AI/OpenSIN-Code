/**
 * OpenSIN Context Manager
 *
 * Manages the context window with automatic compression, entry
 * prioritization, and threshold monitoring.
 */

import { randomUUID } from 'crypto'
import type {
  ContextEntry,
  ContextWindow,
  ContextRole,
  CompressionStrategy,
  ContextEvent,
  ContextStoreConfig,
} from './types'

type EventHandler = (event: ContextEvent) => void

const DEFAULT_CONFIG: ContextStoreConfig = {
  maxEntries: 1000,
  maxTokens: 128000,
  compressionThreshold: 0.8,
  compressionStrategy: 'priority_based',
  autoCompress: true,
}

export class OpenSINContextManager {
  private window: ContextWindow
  private config: ContextStoreConfig
  private handlers: Map<string, Set<EventHandler>> = new Map()

  constructor(sessionId: string, config?: Partial<ContextStoreConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config }
    this.window = {
      entries: [],
      totalTokens: 0,
      maxTokens: this.config.maxTokens,
      utilization: 0,
      sessionId,
      createdAt: Date.now(),
      lastUpdated: Date.now(),
    }
  }

  get state(): ContextWindow {
    return { ...this.window, entries: [...this.window.entries] }
  }

  addEntry(role: ContextRole, content: string, metadata?: Record<string, unknown>, priority?: number): ContextEntry {
    const tokenCount = this.estimateTokens(content)
    const entry: ContextEntry = {
      id: randomUUID(),
      role,
      content,
      timestamp: Date.now(),
      tokenCount,
      metadata,
      priority: priority ?? this.defaultPriority(role),
    }

    this.window.entries.push(entry)
    this.window.totalTokens += tokenCount
    this.window.lastUpdated = Date.now()
    this.window.utilization = this.window.totalTokens / this.window.maxTokens

    this.emit({
      type: 'entry_added',
      entry,
      totalTokens: this.window.totalTokens,
      timestamp: Date.now(),
    })

    if (this.window.utilization >= this.config.compressionThreshold && this.config.autoCompress) {
      this.emit({
        type: 'threshold_exceeded',
        utilization: this.window.utilization,
        timestamp: Date.now(),
      })
    }

    return entry
  }

  removeEntry(entryId: string): boolean {
    const idx = this.window.entries.findIndex((e) => e.id === entryId)
    if (idx === -1) return false

    const entry = this.window.entries[idx]!
    this.window.entries.splice(idx, 1)
    this.window.totalTokens -= entry.tokenCount
    this.window.lastUpdated = Date.now()
    this.window.utilization = this.window.totalTokens / this.window.maxTokens

    this.emit({
      type: 'entry_removed',
      entryId,
      totalTokens: this.window.totalTokens,
      timestamp: Date.now(),
    })

    return true
  }

  getEntries(): ContextEntry[] {
    return [...this.window.entries]
  }

  getEntry(id: string): ContextEntry | undefined {
    return this.window.entries.find((e) => e.id === id)
  }

  getTotalTokens(): number {
    return this.window.totalTokens
  }

  getUtilization(): number {
    return this.window.utilization
  }

  needsCompression(): boolean {
    return this.window.utilization >= this.config.compressionThreshold
  }

  clear(): void {
    this.window.entries = []
    this.window.totalTokens = 0
    this.window.utilization = 0
    this.window.lastUpdated = Date.now()
  }

  private defaultPriority(role: ContextRole): number {
    switch (role) {
      case 'system': return 100
      case 'user': return 80
      case 'assistant': return 60
      case 'tool': return 40
      default: return 50
    }
  }

  private estimateTokens(text: string): number {
    return Math.ceil(text.length / 4)
  }

  on(eventType: string, handler: EventHandler): void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, new Set())
    }
    this.handlers.get(eventType)!.add(handler)
  }

  off(eventType: string, handler: EventHandler): void {
    this.handlers.get(eventType)?.delete(handler)
  }

  private emit(event: ContextEvent): void {
    const typeHandlers = this.handlers.get(event.type) ?? new Set()
    for (const handler of typeHandlers) {
      try { handler(event) } catch { /* ignore */ }
    }
  }
}
