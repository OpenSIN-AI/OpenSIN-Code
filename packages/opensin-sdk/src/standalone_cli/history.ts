import { HistoryEntry, CliConfig } from "./types.js";

export class HistoryManager {
  private config: CliConfig;
  private inMemoryCache: Map<string, HistoryEntry[]> = new Map();

  constructor(config: CliConfig) {
    this.config = config;
  }

  async add(entry: Omit<HistoryEntry, "timestamp" | "id">): Promise<HistoryEntry> {
    const fullEntry: HistoryEntry = {
      ...entry,
      id: this.generateEntryId(),
      timestamp: new Date().toISOString(),
    };

    const cache = this.inMemoryCache.get(entry.sessionId) || [];
    cache.push(fullEntry);

    if (cache.length > this.config.maxHistoryEntries) {
      cache.splice(0, cache.length - this.config.maxHistoryEntries);
    }

    this.inMemoryCache.set(entry.sessionId, cache);

    await this.persistEntry(entry.sessionId, fullEntry);
    return fullEntry;
  }

  async get(sessionId: string, limit?: number): Promise<HistoryEntry[]> {
    const cached = this.inMemoryCache.get(sessionId);
    if (cached) {
      const result = limit ? cached.slice(-limit) : cached;
      return result;
    }

    return this.loadFromFile(sessionId, limit);
  }

  async search(sessionId: string, query: string): Promise<HistoryEntry[]> {
    const entries = await this.get(sessionId);
    const lowerQuery = query.toLowerCase();

    return entries.filter(
      (entry) =>
        entry.content.toLowerCase().includes(lowerQuery) ||
        entry.role.includes(lowerQuery)
    );
  }

  async clear(sessionId?: string): Promise<void> {
    if (sessionId) {
      this.inMemoryCache.delete(sessionId);
      await this.clearFile(sessionId);
    } else {
      this.inMemoryCache.clear();
    }
  }

  async export(sessionId: string): Promise<string> {
    const entries = await this.get(sessionId);
    return entries
      .map((e) => `[${e.timestamp}] ${e.role}: ${e.content}`)
      .join("\n\n");
  }

  private async persistEntry(sessionId: string, entry: HistoryEntry): Promise<void> {
    try {
      const fs = await import("fs");
      const path = await import("path");
      const historyPath = path.join(
        this.config.historyFile,
        `${sessionId}.jsonl`
      );

      const dir = path.dirname(historyPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      fs.appendFileSync(historyPath, JSON.stringify(entry) + "\n");
    } catch {
      // Silently fail
    }
  }

  private async loadFromFile(sessionId: string, limit?: number): Promise<HistoryEntry[]> {
    try {
      const fs = await import("fs");
      const path = await import("path");
      const historyPath = path.join(
        this.config.historyFile,
        `${sessionId}.jsonl`
      );

      if (!fs.existsSync(historyPath)) return [];

      const content = fs.readFileSync(historyPath, "utf-8");
      const entries = content
        .split("\n")
        .filter((line) => line.trim())
        .map((line) => JSON.parse(line) as HistoryEntry);

      const result = limit ? entries.slice(-limit) : entries;
      this.inMemoryCache.set(sessionId, result);
      return result;
    } catch {
      return [];
    }
  }

  private async clearFile(sessionId: string): Promise<void> {
    try {
      const fs = await import("fs");
      const path = await import("path");
      const historyPath = path.join(
        this.config.historyFile,
        `${sessionId}.jsonl`
      );

      if (fs.existsSync(historyPath)) {
        fs.unlinkSync(historyPath);
      }
    } catch {
      // Silently fail
    }
  }

  private generateEntryId(): string {
    return `hist-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  }
}
