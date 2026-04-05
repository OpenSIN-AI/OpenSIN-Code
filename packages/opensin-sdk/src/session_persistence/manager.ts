import fs from 'fs';
import path from 'path';
import { SessionMessage, SessionData, SessionMetadata } from './types.js';
import { SessionStore } from './store.js';

export class SessionManager {
  private store: SessionStore;
  private currentSession: string | null = null;

  constructor(store?: SessionStore) {
    this.store = store || new SessionStore();
  }

  createSession(id: string, name?: string): SessionMetadata {
    this.currentSession = id;
    const metadata: SessionMetadata = {
      id,
      name,
      created: new Date().toISOString(),
      modified: new Date().toISOString(),
      messageCount: 0,
    };
    this.saveMetadata(metadata);
    fs.writeFileSync(this.store.getFilePath(id), '');
    return metadata;
  }

  addMessage(message: SessionMessage): void {
    if (!this.currentSession) {
      throw new Error('No active session');
    }
    this.store.saveMessage(this.currentSession, message);
    this.updateMetadata();
  }

  resumeSession(sessionId: string): SessionData {
    const messages = this.store.loadMessages(sessionId);
    const metadata = this.loadMetadata(sessionId);
    this.currentSession = sessionId;
    return { metadata, messages };
  }

  listSessions(): SessionMetadata[] {
    const ids = this.store.listSessions();
    return ids.map(id => this.loadMetadata(id)).filter(Boolean);
  }

  deleteSession(sessionId: string): boolean {
    this.store.deleteSession(sessionId);
    const metaPath = this.getMetaPath(sessionId);
    if (fs.existsSync(metaPath)) {
      fs.unlinkSync(metaPath);
    }
    if (this.currentSession === sessionId) {
      this.currentSession = null;
    }
    return true;
  }

  getCurrentSession(): string | null {
    return this.currentSession;
  }

  private saveMetadata(metadata: SessionMetadata): void {
    const metaPath = this.getMetaPath(metadata.id);
    fs.writeFileSync(metaPath, JSON.stringify(metadata, null, 2));
  }

  private loadMetadata(sessionId: string): SessionMetadata {
    const metaPath = this.getMetaPath(sessionId);
    if (!fs.existsSync(metaPath)) {
      const messages = this.store.loadMessages(sessionId);
      return {
        id: sessionId,
        created: new Date().toISOString(),
        modified: new Date().toISOString(),
        messageCount: messages.length,
      };
    }
    return JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
  }

  private updateMetadata(): void {
    if (!this.currentSession) return;
    const messages = this.store.loadMessages(this.currentSession);
    const metadata = this.loadMetadata(this.currentSession);
    metadata.messageCount = messages.length;
    metadata.modified = new Date().toISOString();
    this.saveMetadata(metadata);
  }

  private getMetaPath(sessionId: string): string {
    return path.join(this.store['baseDir'], `${sessionId}.meta.json`);
  }
}
