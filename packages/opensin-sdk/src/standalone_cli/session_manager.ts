import {
  CliConfig,
  SessionRecord,
  SessionResumeState,
  HistoryEntry,
} from "./types.js";

export class SessionManager {
  private sessions: Map<string, SessionRecord> = new Map();
  private activeSessionId: string | null = null;
  private config: CliConfig;

  constructor(config: CliConfig) {
    this.config = config;
  }

  async createSession(cwd?: string): Promise<SessionRecord> {
    const sessionId = this.generateSessionId();
    const now = new Date().toISOString();

    const record: SessionRecord = {
      sessionId,
      cwd: cwd || this.config.cwd,
      createdAt: now,
      lastActiveAt: now,
      messageCount: 0,
      model: this.config.model,
      status: "active",
    };

    this.sessions.set(sessionId, record);
    this.activeSessionId = sessionId;

    await this.persistSession(record);
    return record;
  }

  async loadSession(sessionId: string): Promise<SessionRecord | null> {
    const record = this.sessions.get(sessionId);
    if (record) {
      this.activeSessionId = sessionId;
      return record;
    }

    const loaded = await this.loadPersistedSession(sessionId);
    if (loaded) {
      this.sessions.set(sessionId, loaded);
      this.activeSessionId = sessionId;
      return loaded;
    }

    return null;
  }

  async resumeSession(sessionId: string): Promise<SessionResumeState | null> {
    const record = await this.loadSession(sessionId);
    if (!record) return null;

    const history = await this.loadSessionHistory(sessionId);
    const recentMessages = history.slice(-20);

    const resumeState: SessionResumeState = {
      sessionId,
      lastMessages: recentMessages,
      resumedAt: new Date().toISOString(),
    };

    record.status = "active";
    record.lastActiveAt = new Date().toISOString();
    await this.persistSession(record);

    return resumeState;
  }

  async closeSession(sessionId?: string): Promise<boolean> {
    const targetId = sessionId || this.activeSessionId;
    if (!targetId) return false;

    const record = this.sessions.get(targetId);
    if (record) {
      record.status = "closed";
      record.lastActiveAt = new Date().toISOString();
      await this.persistSession(record);
    }

    if (this.activeSessionId === targetId) {
      this.activeSessionId = null;
    }

    return true;
  }

  getActiveSession(): SessionRecord | null {
    if (!this.activeSessionId) return null;
    return this.sessions.get(this.activeSessionId) || null;
  }

  listSessions(): SessionRecord[] {
    return Array.from(this.sessions.values()).sort(
      (a, b) => new Date(b.lastActiveAt).getTime() - new Date(a.lastActiveAt).getTime()
    );
  }

  async recordMessage(sessionId: string, entry: HistoryEntry): Promise<void> {
    const record = this.sessions.get(sessionId);
    if (record) {
      record.messageCount++;
      record.lastActiveAt = new Date().toISOString();
      await this.persistSession(record);
    }

    await this.appendHistoryEntry(sessionId, entry);
  }

  async loadSessionHistory(sessionId: string): Promise<HistoryEntry[]> {
    try {
      const fs = await import("fs");
      const path = await import("path");
      const historyPath = path.join(
        this.config.historyFile,
        `${sessionId}.jsonl`
      );

      if (!fs.existsSync(historyPath)) return [];

      const content = fs.readFileSync(historyPath, "utf-8");
      return content
        .split("\n")
        .filter((line) => line.trim())
        .map((line) => JSON.parse(line) as HistoryEntry);
    } catch {
      return [];
    }
  }

  private async persistSession(record: SessionRecord): Promise<void> {
    try {
      const fs = await import("fs");
      const path = await import("path");
      const sessionsDir = path.dirname(this.config.historyFile);

      if (!fs.existsSync(sessionsDir)) {
        fs.mkdirSync(sessionsDir, { recursive: true });
      }

      const sessionsPath = path.join(sessionsDir, "sessions.json");
      let sessions: Record<string, SessionRecord> = {};

      if (fs.existsSync(sessionsPath)) {
        sessions = JSON.parse(fs.readFileSync(sessionsPath, "utf-8"));
      }

      sessions[record.sessionId] = record;

      const trimmed = Object.entries(sessions)
        .sort(([, a], [, b]) =>
          new Date(b.lastActiveAt).getTime() - new Date(a.lastActiveAt).getTime()
        )
        .slice(0, this.config.maxHistoryEntries);

      fs.writeFileSync(sessionsPath, JSON.stringify(Object.fromEntries(trimmed), null, 2));
    } catch {
      // Silently fail persistence
    }
  }

  private async loadPersistedSession(sessionId: string): Promise<SessionRecord | null> {
    try {
      const fs = await import("fs");
      const path = await import("path");
      const sessionsPath = path.join(
        path.dirname(this.config.historyFile),
        "sessions.json"
      );

      if (!fs.existsSync(sessionsPath)) return null;

      const sessions: Record<string, SessionRecord> = JSON.parse(
        fs.readFileSync(sessionsPath, "utf-8")
      );

      return sessions[sessionId] || null;
    } catch {
      return null;
    }
  }

  private async appendHistoryEntry(sessionId: string, entry: HistoryEntry): Promise<void> {
    try {
      const fs = await import("fs");
      const path = await import("path");
      const historyPath = path.join(
        this.config.historyFile,
        `${sessionId}.jsonl`
      );

      fs.appendFileSync(historyPath, JSON.stringify(entry) + "\n");
    } catch {
      // Silently fail
    }
  }

  private generateSessionId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `sin-${timestamp}-${random}`;
  }
}
