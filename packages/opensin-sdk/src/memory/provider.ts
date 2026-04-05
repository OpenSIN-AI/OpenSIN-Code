import type { MemoryEntry, MemoryProvider } from './types.js'
import { randomUUID } from 'crypto'
import { readFile, writeFile, mkdir, readdir, unlink } from 'fs/promises'
import { join } from 'path'

export class FileMemoryProvider implements MemoryProvider {
  private dir: string
  private cache: Map<string, MemoryEntry> = new Map()

  constructor(dir: string) { this.dir = dir }

  private async ensureDir(): Promise<void> { await mkdir(this.dir, { recursive: true }) }
  private filePath(id: string): string { return join(this.dir, `${id}.json`) }

  async save(entry: MemoryEntry): Promise<void> {
    await this.ensureDir()
    const saved = { ...entry, updatedAt: Date.now() }
    this.cache.set(entry.id, saved)
    await writeFile(this.filePath(entry.id), JSON.stringify(saved, null, 2))
  }

  async load(id: string): Promise<MemoryEntry | null> {
    if (this.cache.has(id)) return this.cache.get(id) ?? null
    try {
      const data = await readFile(this.filePath(id), 'utf-8')
      const entry = JSON.parse(data) as MemoryEntry
      this.cache.set(id, entry)
      return entry
    } catch { return null }
  }

  async search(query: string, limit = 10): Promise<MemoryEntry[]> {
    const entries = await this.list(undefined, 1000)
    const lower = query.toLowerCase()
    return entries.filter((e) => e.content.toLowerCase().includes(lower) || e.tags.some((t) => t.toLowerCase().includes(lower))).sort((a, b) => b.importance - a.importance).slice(0, limit)
  }

  async delete(id: string): Promise<boolean> {
    this.cache.delete(id)
    try { await unlink(this.filePath(id)); return true } catch { return false }
  }

  async list(tags?: string[], limit = 50): Promise<MemoryEntry[]> {
    await this.ensureDir()
    const files = await readdir(this.dir)
    const entries: MemoryEntry[] = []
    for (const file of files) {
      if (!file.endsWith('.json')) continue
      const entry = await this.load(file.replace('.json', ''))
      if (entry) entries.push(entry)
    }
    let result = entries
    if (tags && tags.length > 0) result = result.filter((e) => tags.some((t) => e.tags.includes(t)))
    return result.sort((a, b) => b.importance - a.importance).slice(0, limit)
  }
}

export function createFileProvider(dir: string): MemoryProvider { return new FileMemoryProvider(dir) }
