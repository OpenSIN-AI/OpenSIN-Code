/**
 * Session Manager — Session lifecycle management for the CLI.
 * 
 * Handles create, load, list, resume, and delete sessions.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { OpenSINClient } from '../client.js';
import { SessionInfo, NewSessionRequest } from '../types.js';
import { AgentState } from './types.js';

const SESSIONS_DIR = path.join(os.homedir(), '.opensin', 'cli_sessions');

export class SessionManager {
  private client: OpenSINClient;
  private currentSession: string | null = null;
  private state: AgentState;

  constructor(client: OpenSINClient, workspace: string, model: string) {
    this.client = client;
    this.state = {
      sessionId: null,
      model,
      workspace,
      permissionMode: 'auto',
      tokenUsage: { input: 0, output: 0, total: 0 },
      turnCount: 0,
    };
    this.ensureSessionsDir();
  }

  private ensureSessionsDir(): void {
    if (!fs.existsSync(SESSIONS_DIR)) {
      fs.mkdirSync(SESSIONS_DIR, { recursive: true });
    }
  }

  async create(title?: string): Promise<string> {
    const request: NewSessionRequest = {
      workspace: this.state.workspace,
      model: this.state.model,
      title: title || `Session ${new Date().toLocaleString()}`,
    };
    const response = await this.client.createSession(request);
    this.currentSession = response.session_id;
    this.state.sessionId = response.session_id;
    this.state.turnCount = 0;
    this.state.tokenUsage = { input: 0, output: 0, total: 0 };
    this.saveSessionMeta(response);
    return response.session_id;
  }

  async resume(sessionId: string): Promise<void> {
    const response = await this.client.resumeSession(sessionId);
    if ('error' in response) {
      throw new Error(response.error as string);
    }
    this.currentSession = sessionId;
    this.state.sessionId = sessionId;
    this.state.turnCount = (response.message_count as number) || 0;
  }

  async list(limit = 20): Promise<SessionInfo[]> {
    const response = await this.client.listSessions(limit);
    return response.sessions;
  }

  async delete(sessionId: string): Promise<void> {
    await this.client.deleteSession(sessionId);
    if (this.currentSession === sessionId) {
      this.currentSession = null;
      this.state.sessionId = null;
    }
  }

  getCurrentSession(): string | null {
    return this.currentSession;
  }

  getState(): AgentState {
    return { ...this.state };
  }

  addTokenUsage(input: number, output: number): void {
    this.state.tokenUsage.input += input;
    this.state.tokenUsage.output += output;
    this.state.tokenUsage.total += input + output;
    this.state.turnCount++;
  }

  setModel(model: string): void {
    this.state.model = model;
  }

  setWorkspace(workspace: string): void {
    this.state.workspace = workspace;
  }

  setPermissionMode(mode: string): void {
    this.state.permissionMode = mode;
  }

  private saveSessionMeta(response: { session_id: string; title: string; workspace: string }): void {
    const metaPath = path.join(SESSIONS_DIR, `${response.session_id}.json`);
    fs.writeFileSync(metaPath, JSON.stringify({
      session_id: response.session_id,
      title: response.title,
      workspace: response.workspace,
      createdAt: Date.now(),
    }, null, 2));
  }
}
