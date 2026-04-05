import fs from 'fs';
import path from 'path';
import { SessionData, SessionMessage } from './types';

export class SessionStore {
  private baseDir: string;

  constructor(baseDir: string = '.opensin/sessions') {
    this.baseDir = baseDir;
    if (!fs.existsSync(this.baseDir)) {
      fs.mkdirSync(this.baseDir, { recursive: true });
    }
  }

  getFilePath(sessionId: string): string {
    return path.join(this.baseDir, `${sessionId}.jsonl`);
  }

  saveMessage(sessionId: string, message: SessionMessage): void {
    const filePath = this.getFilePath(sessionId);
    const line = JSON.stringify(message) + '\n';
    fs.appendFileSync(filePath, line);
  }

  loadMessages(sessionId: string): SessionMessage[] {
    const filePath = this.getFilePath(sessionId);
    if (!fs.existsSync(filePath)) return [];

    const content = fs.readFileSync(filePath, 'utf-8');
    return content
      .split('\n')
      .filter(line => line.trim())
      .map(line => JSON.parse(line));
  }

  deleteSession(sessionId: string): boolean {
    const filePath = this.getFilePath(sessionId);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
    return false;
  }

  listSessions(): string[] {
    if (!fs.existsSync(this.baseDir)) return [];
    return fs.readdirSync(this.baseDir)
      .filter(f => f.endsWith('.jsonl'))
      .map(f => f.replace('.jsonl', ''));
  }

  getSessionSize(sessionId: string): number {
    const filePath = this.getFilePath(sessionId);
    if (!fs.existsSync(filePath)) return 0;
    return fs.statSync(filePath).size;
  }
}
