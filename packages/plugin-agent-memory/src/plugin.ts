import * as crypto from 'node:crypto';
import type { MemoryEntry, MemoryConfig, MemoryQuery } from './types.js';

const DEFAULT_CONFIG: MemoryConfig = {
  maxEntries: 1000,
  maxEntriesPerCategory: 200,
  minImportance: 0,
  autoConsolidate: true,
};

function generateId(): string {
  return 'mem-' + crypto.randomBytes(8).toString('hex');
}

function createEntry(category: string, content: string, importance = 0.5): MemoryEntry {
  const now = new Date().toISOString();
  return { id: generateId(), category, content, createdAt: now, updatedAt: now, accessCount: 0, importance };
}

export class AgentMemoryPlugin {
  private config: MemoryConfig;
  private memories: Map<string, MemoryEntry> = new Map();

  constructor(config?: Partial<MemoryConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  add(category: string, content: string, importance = 0.5): MemoryEntry {
    if (this.memories.size >= this.config.maxEntries) {
      this.evictLeastImportant();
    }
    const categoryCount = Array.from(this.memories.values()).filter(m => m.category === category).length;
    if (categoryCount >= this.config.maxEntriesPerCategory) {
      this.evictFromCategory(category);
    }
    const entry = createEntry(category, content, importance);
    this.memories.set(entry.id, entry);
    return entry;
  }

  get(id: string): MemoryEntry | undefined {
    const entry = this.memories.get(id);
    if (entry) {
      entry.accessCount++;
      entry.updatedAt = new Date().toISOString();
    }
    return entry;
  }

  query(query: MemoryQuery = {}): MemoryEntry[] {
    let results = Array.from(this.memories.values());
    if (query.category) results = results.filter(m => m.category === query.category);
    if (query.minImportance !== undefined) results = results.filter(m => m.importance >= (query.minImportance ?? 0));
    if (query.search) {
      const lower = query.search.toLowerCase();
      results = results.filter(m => m.content.toLowerCase().includes(lower) || m.category.toLowerCase().includes(lower));
    }
    results.sort((a, b) => b.importance - a.importance || b.accessCount - a.accessCount);
    if (query.limit) results = results.slice(0, query.limit);
    return results;
  }

  update(id: string, content: string): MemoryEntry | undefined {
    const entry = this.memories.get(id);
    if (!entry) return undefined;
    entry.content = content;
    entry.updatedAt = new Date().toISOString();
    return entry;
  }

  delete(id: string): boolean { return this.memories.delete(id); }

  getCategories(): string[] {
    const cats = new Set<string>();
    for (const m of this.memories.values()) cats.add(m.category);
    return Array.from(cats).sort();
  }

  getStats() {
    const entries = Array.from(this.memories.values());
    const byCategory: Record<string, number> = {};
    for (const m of entries) byCategory[m.category] = (byCategory[m.category] ?? 0) + 1;
    return {
      totalEntries: entries.length,
      categories: byCategory,
      avgImportance: entries.length > 0 ? entries.reduce((s, m) => s + m.importance, 0) / entries.length : 0,
    };
  }

  consolidate(): number {
    if (!this.config.autoConsolidate) return 0;
    const lowImportance = Array.from(this.memories.values()).filter(m => m.importance < this.config.minImportance && m.accessCount === 0);
    let removed = 0;
    for (const entry of lowImportance) {
      this.memories.delete(entry.id);
      removed++;
    }
    return removed;
  }

  getConfig(): MemoryConfig { return { ...this.config }; }
  setConfig(config: Partial<MemoryConfig>): void { this.config = { ...this.config, ...config }; }

  private evictLeastImportant(): void {
    let minEntry: MemoryEntry | null = null;
    for (const m of this.memories.values()) {
      if (!minEntry || m.importance < minEntry.importance) minEntry = m;
    }
    if (minEntry) this.memories.delete(minEntry.id);
  }

  private evictFromCategory(category: string): void {
    const catEntries = Array.from(this.memories.values()).filter(m => m.category === category);
    catEntries.sort((a, b) => a.importance - b.importance);
    if (catEntries.length > 0) this.memories.delete(catEntries[0].id);
  }

  getManifest() {
    return {
      id: 'agent-memory', name: 'Agent Memory Plugin', version: '0.1.0',
      description: 'Letta-style persistent memory for OpenSIN CLI', author: 'OpenSIN-AI', license: 'MIT',
    };
  }
}
