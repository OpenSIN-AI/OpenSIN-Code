import type { MemoryEntry, MemoryProvider } from './types.js'
import { randomUUID } from 'crypto'

export class MemoryManager {
  private provider: MemoryProvider
  constructor(provider: MemoryProvider) { this.provider = provider }

  async add(content: string, tags: string[] = [], importance = 0.5): Promise<MemoryEntry> {
    const entry: MemoryEntry = { id: randomUUID(), content, tags, createdAt: Date.now(), updatedAt: Date.now(), accessCount: 0, importance }
    await this.provider.save(entry)
    return entry
  }

  async get(id: string): Promise<MemoryEntry | null> {
    const entry = await this.provider.load(id)
    if (entry) { entry.accessCount += 1; await this.provider.save(entry) }
    return entry
  }

  async search(query: string, limit = 10): Promise<MemoryEntry[]> { return this.provider.search(query, limit) }
  async list(tags?: string[], limit = 50): Promise<MemoryEntry[]> { return this.provider.list(tags, limit) }
  async delete(id: string): Promise<boolean> { return this.provider.delete(id) }

  async update(id: string, content?: string, tags?: string[], importance?: number): Promise<MemoryEntry | null> {
    const entry = await this.provider.load(id)
    if (!entry) return null
    if (content !== undefined) entry.content = content
    if (tags !== undefined) entry.tags = tags
    if (importance !== undefined) entry.importance = importance
    await this.provider.save(entry)
    return entry
  }
}

export function createMemoryManager(provider: MemoryProvider): MemoryManager { return new MemoryManager(provider) }
