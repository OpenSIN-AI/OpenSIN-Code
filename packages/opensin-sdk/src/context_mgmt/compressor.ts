/**
 * OpenSIN Context Compressor
 *
 * Implements multiple compression strategies for reducing context
 * window usage while preserving important information.
 */

import type {
  ContextEntry,
  CompressionResult,
  CompressionStrategy,
} from './types.js'

export class OpenSINContextCompressor {
  compress(
    entries: ContextEntry[],
    maxTokens: number,
    strategy: CompressionStrategy = 'priority_based'
  ): CompressionResult {
    const start = Date.now()
    const originalTokens = entries.reduce((sum, e) => sum + e.tokenCount, 0)

    switch (strategy) {
      case 'truncate':
        return this.truncate(entries, maxTokens, start)
      case 'summarize':
        return this.summarize(entries, maxTokens, start)
      case 'sliding_window':
        return this.slidingWindow(entries, maxTokens, start)
      case 'priority_based':
        return this.priorityBased(entries, maxTokens, start)
      case 'hybrid':
        return this.hybrid(entries, maxTokens, start)
      default:
        return this.priorityBased(entries, maxTokens, start)
    }
  }

  private truncate(entries: ContextEntry[], maxTokens: number, start: number): CompressionResult {
    let currentTokens = 0
    const kept: ContextEntry[] = []
    let removed = 0

    for (let i = entries.length - 1; i >= 0; i--) {
      const entry = entries[i]!
      if (currentTokens + entry.tokenCount <= maxTokens) {
        kept.unshift(entry)
        currentTokens += entry.tokenCount
      } else {
        removed++
      }
    }

    entries.length = 0
    entries.push(...kept)

    return {
      originalTokens,
      compressedTokens: currentTokens,
      entriesRemoved: removed,
      entriesCompressed: 0,
      strategy: 'truncate',
      duration: Date.now() - start,
    }
  }

  private summarize(entries: ContextEntry[], maxTokens: number, start: number): CompressionResult {
    const systemEntries = entries.filter((e) => e.role === 'system')
    const recentEntries = entries.slice(-Math.min(10, entries.length))
    const otherEntries = entries.filter(
      (e) => e.role !== 'system' && !recentEntries.includes(e)
    )

    let currentTokens = systemEntries.reduce((s, e) => s + e.tokenCount, 0) +
      recentEntries.reduce((s, e) => s + e.tokenCount, 0)

    let compressed = 0
    let removed = 0

    for (const entry of otherEntries) {
      if (currentTokens + entry.tokenCount <= maxTokens) {
        currentTokens += entry.tokenCount
      } else {
        const summary = `[${entry.role} message compressed - ${entry.tokenCount} tokens]`
        const summaryTokens = this.estimateTokens(summary)
        if (currentTokens + summaryTokens <= maxTokens) {
          entry.content = summary
          entry.tokenCount = summaryTokens
          entry.compressed = true
          currentTokens += summaryTokens
          compressed++
        } else {
          removed++
        }
      }
    }

    return {
      originalTokens,
      compressedTokens: currentTokens,
      entriesRemoved: removed,
      entriesCompressed: compressed,
      strategy: 'summarize',
      duration: Date.now() - start,
    }
  }

  private slidingWindow(entries: ContextEntry[], maxTokens: number, start: number): CompressionResult {
    const systemEntries = entries.filter((e) => e.role === 'system')
    const systemTokens = systemEntries.reduce((s, e) => s + e.tokenCount, 0)
    const availableTokens = maxTokens - systemTokens

    const conversationEntries = entries.filter((e) => e.role !== 'system')
    let windowTokens = 0
    const windowEntries: ContextEntry[] = []
    let removed = 0

    for (let i = conversationEntries.length - 1; i >= 0; i--) {
      const entry = conversationEntries[i]!
      if (windowTokens + entry.tokenCount <= availableTokens) {
        windowEntries.unshift(entry)
        windowTokens += entry.tokenCount
      } else {
        removed++
      }
    }

    entries.length = 0
    entries.push(...systemEntries, ...windowEntries)

    return {
      originalTokens,
      compressedTokens: systemTokens + windowTokens,
      entriesRemoved: removed,
      entriesCompressed: 0,
      strategy: 'sliding_window',
      duration: Date.now() - start,
    }
  }

  private priorityBased(entries: ContextEntry[], maxTokens: number, start: number): CompressionResult {
    const sorted = [...entries].sort((a, b) => b.priority - a.priority)
    const kept: ContextEntry[] = []
    let currentTokens = 0
    let removed = 0

    for (const entry of sorted) {
      if (currentTokens + entry.tokenCount <= maxTokens) {
        kept.push(entry)
        currentTokens += entry.tokenCount
      } else {
        removed++
      }
    }

    kept.sort((a, b) => a.timestamp - b.timestamp)
    entries.length = 0
    entries.push(...kept)

    return {
      originalTokens,
      compressedTokens: currentTokens,
      entriesRemoved: removed,
      entriesCompressed: 0,
      strategy: 'priority_based',
      duration: Date.now() - start,
    }
  }

  private hybrid(entries: ContextEntry[], maxTokens: number, start: number): CompressionResult {
    const systemEntries = entries.filter((e) => e.role === 'system')
    const systemTokens = systemEntries.reduce((s, e) => s + e.tokenCount, 0)
    const availableTokens = maxTokens - systemTokens

    const highPriority = entries.filter((e) => e.priority >= 80)
    const highTokens = highPriority.reduce((s, e) => s + e.tokenCount, 0)

    if (highTokens > availableTokens) {
      return this.priorityBased(entries, maxTokens, start)
    }

    const remainingTokens = availableTokens - highTokens
    const lowPriority = entries.filter((e) => e.priority < 80 && e.role !== 'system')

    let currentTokens = systemTokens + highTokens
    let compressed = 0
    let removed = 0

    for (const entry of lowPriority) {
      if (currentTokens + entry.tokenCount <= maxTokens) {
        currentTokens += entry.tokenCount
      } else {
        const summary = `[${entry.role} message compressed]`
        const summaryTokens = this.estimateTokens(summary)
        if (currentTokens + summaryTokens <= maxTokens) {
          entry.content = summary
          entry.tokenCount = summaryTokens
          entry.compressed = true
          currentTokens += summaryTokens
          compressed++
        } else {
          removed++
        }
      }
    }

    return {
      originalTokens,
      compressedTokens: currentTokens,
      entriesRemoved: removed,
      entriesCompressed: compressed,
      strategy: 'hybrid',
      duration: Date.now() - start,
    }
  }

  private estimateTokens(text: string): number {
    return Math.ceil(text.length / 4)
  }
}

export function createCompressor(): OpenSINContextCompressor {
  return new OpenSINContextCompressor()
}
