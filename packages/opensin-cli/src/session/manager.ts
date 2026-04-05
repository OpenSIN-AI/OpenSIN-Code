import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { homedir } from 'node:os';
import type { Session } from '../core/types.js';
import { generateId } from '../utils/helpers.js';

const SESSIONS_DIR = join(homedir(), '.local', 'share', 'sincode', 'sessions');

export class SessionManager {
  constructor() {
    if (!existsSync(SESSIONS_DIR)) {
      mkdirSync(SESSIONS_DIR, { recursive: true });
    }
  }

  async create(initialMessage: string): Promise<Session> {
    const session: Session = {
      sessionId: generateId('sess'),
      title: this.generateTitle(initialMessage),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [{ role: 'user', content: initialMessage }],
      cwd: process.cwd(),
      seq: Date.now(),
    };
    await this.save(session);
    return session;
  }

  async load(sessionId: string): Promise<Session | null> {
    const filePath = this.getSessionPath(sessionId);
    if (!existsSync(filePath)) return null;
    try {
      const content = readFileSync(filePath, 'utf-8');
      return JSON.parse(content) as Session;
    } catch {
      return null;
    }
  }

  async loadLast(sessionId?: string): Promise<Session | null> {
    if (sessionId) return this.load(sessionId);

    // Load most recent session
    if (!existsSync(SESSIONS_DIR)) return null;
    const files = readdirSync(SESSIONS_DIR)
      .filter(f => f.endsWith('.json'))
      .map(f => ({
        name: f,
        mtime: (readFileSync(join(SESSIONS_DIR, f), 'utf-8') || ''),
      }))
      .sort((a, b) => {
        try {
          const sa = JSON.parse(a.mtime);
          const sb = JSON.parse(b.mtime);
          const timeCmp = (sb.updatedAt || '').localeCompare(sa.updatedAt || '');
          if (timeCmp !== 0) return timeCmp;
          return (sb.seq || 0) - (sa.seq || 0);
        } catch {
          return 0;
        }
      });

    if (files.length === 0) return null;
    const sessionPath = join(SESSIONS_DIR, files[0].name);
    try {
      const content = readFileSync(sessionPath, 'utf-8');
      return JSON.parse(content) as Session;
    } catch {
      return null;
    }
  }

  async save(session: Session): Promise<void> {
    session.updatedAt = new Date().toISOString();
    const filePath = this.getSessionPath(session.sessionId);
    const tmpPath = filePath + '.tmp';
    writeFileSync(tmpPath, JSON.stringify(session, null, 2), 'utf-8');
    writeFileSync(filePath, JSON.stringify(session, null, 2), 'utf-8');
    try { const { unlinkSync } = await import('node:fs'); unlinkSync(tmpPath); } catch {}
  }

  async list(): Promise<{ sessionId: string; title: string; updatedAt: string; messageCount: number }[]> {
    if (!existsSync(SESSIONS_DIR)) return [];
    const sessions: any[] = [];
    for (const file of readdirSync(SESSIONS_DIR).filter(f => f.endsWith('.json'))) {
      try {
        const content = readFileSync(join(SESSIONS_DIR, file), 'utf-8');
        const session = JSON.parse(content) as Session;
        sessions.push({
          sessionId: session.sessionId,
          title: session.title,
          updatedAt: session.updatedAt,
          messageCount: session.messages.length,
        });
      } catch {
        continue;
      }
    }
    return sessions.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  async delete(sessionId: string): Promise<boolean> {
    const filePath = this.getSessionPath(sessionId);
    if (!existsSync(filePath)) return false;
    const { unlinkSync } = await import('node:fs');
    unlinkSync(filePath);
    return true;
  }

  private getSessionPath(sessionId: string): string {
    return join(SESSIONS_DIR, `${sessionId}.json`);
  }

  private generateTitle(message: string): string {
    return message.slice(0, 50).replace(/\n/g, ' ').trim() || 'Untitled';
  }
}
