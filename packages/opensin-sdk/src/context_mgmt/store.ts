/**
 * OpenSIN Context Store
 *
 * Persistent storage for context snapshots with save, restore,
 * and lifecycle management.
 */

import { existsSync, mkdirSync, readdirSync, statSync, unlinkSync } from 'fs'
import { join } from 'path'
import { readFile, writeFile } from 'fs/promises'
import type { ContextEntry, ContextSnapshot, ContextStoreConfig } from './types.js'

export class OpenSINContextStore {
  private basePath: string
  private maxSnapshots: number
  private ttlMs: number | undefined

  constructor(config: ContextStoreConfig) {
    this.basePath = config.persistPath ?? join(process.cwd(), '.opensin', 'context')
    this.maxSnapshots = config.maxEntries
    this.ttlMs = config.ttlMs
  }

  async save(sessionId: string, entries: ContextEntry[], metadata?: Record<string, unknown>): Promise<string> {
    await this.ensureDir()

    const snapshot: ContextSnapshot = {
      sessionId,
      entries,
      totalTokens: entries.reduce((sum, e) => sum + e.tokenCount, 0),
      savedAt: Date.now(),
      metadata,
    }

    const filePath = this.snapshotPath(sessionId)
    await writeFile(filePath, JSON.stringify(snapshot, null, 2), 'utf-8')

    await this.cleanup()

    return filePath
  }

  async load(sessionId: string): Promise<ContextSnapshot | null> {
    const filePath = this.snapshotPath(sessionId)
    if (!existsSync(filePath)) return null

    try {
      const content = await readFile(filePath, 'utf-8')
      const snapshot = JSON.parse(content) as ContextSnapshot

      if (this.ttlMs && Date.now() - snapshot.savedAt > this.ttlMs) {
        await this.delete(sessionId)
        return null
      }

      return snapshot
    } catch {
      return null
    }
  }

  async delete(sessionId: string): Promise<void> {
    const filePath = this.snapshotPath(sessionId)
    if (existsSync(filePath)) {
      unlinkSync(filePath)
    }
  }

  async listSessions(): Promise<{ sessionId: string; savedAt: number; tokens: number }[]> {
    await this.ensureDir()
    const sessions: { sessionId: string; savedAt: number; tokens: number }[] = []

    try {
      const files = readdirSync(this.basePath)
      for (const file of files) {
        if (!file.endsWith('.json')) continue
        const filePath = join(this.basePath, file)
        const stat = statSync(filePath)
        if (!stat.isFile()) continue

        try {
          const content = await readFile(filePath, 'utf-8')
          const snapshot = JSON.parse(content) as ContextSnapshot
          sessions.push({
            sessionId: snapshot.sessionId,
            savedAt: snapshot.savedAt,
            tokens: snapshot.totalTokens,
          })
        } catch {
          // Skip corrupted files
        }
      }
    } catch {
      // Directory doesn't exist yet
    }

    return sessions.sort((a, b) => b.savedAt - a.savedAt)
  }

  async exists(sessionId: string): Promise<boolean> {
    return existsSync(this.snapshotPath(sessionId))
  }

  private snapshotPath(sessionId: string): string {
    const safeName = sessionId.replace(/[^a-zA-Z0-9_-]/g, '_')
    return join(this.basePath, `${safeName}.json`)
  }

  private async ensureDir(): Promise<void> {
    if (!existsSync(this.basePath)) {
      mkdirSync(this.basePath, { recursive: true })
    }
  }

  private async cleanup(): Promise<void> {
    const sessions = await this.listSessions()
    if (sessions.length <= this.maxSnapshots) return

    const toDelete = sessions.slice(this.maxSnapshots)
    for (const session of toDelete) {
      await this.delete(session.sessionId)
    }
  }
}

export function createContextStore(config: ContextStoreConfig): OpenSINContextStore {
  return new OpenSINContextStore(config)
}
