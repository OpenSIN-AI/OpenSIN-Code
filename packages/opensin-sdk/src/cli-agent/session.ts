/**
 * CLI Agent Session Manager
 */

import type {
  CLIAgentSession,
  CLIMessage,
  CLIContext,
  ToolCallRecord,
  TokenUsage,
  CLIAgentConfig,
} from "./types.js";

export class SessionManager {
  private sessions = new Map<string, CLIAgentSession>();
  private activeSessionId: string | null = null;

  createSession(config: CLIAgentConfig): CLIAgentSession {
    const session: CLIAgentSession = {
      id: config.sessionId,
      createdAt: Date.now(),
      lastActivity: Date.now(),
      messages: [],
      context: this.buildContext(config),
      status: "active",
      toolCalls: [],
      tokenUsage: { promptTokens: 0, completionTokens: 0, totalTokens: 0, estimatedCost: 0 },
    };
    this.sessions.set(session.id, session);
    this.activeSessionId = session.id;
    return session;
  }

  getSession(id: string): CLIAgentSession | null {
    return this.sessions.get(id) ?? null;
  }

  getActiveSession(): CLIAgentSession | null {
    if (!this.activeSessionId) return null;
    return this.sessions.get(this.activeSessionId) ?? null;
  }

  setActiveSession(id: string): boolean {
    if (!this.sessions.has(id)) return false;
    this.activeSessionId = id;
    return true;
  }

  addMessage(sessionId: string, message: CLIMessage): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;
    session.messages.push(message);
    session.lastActivity = Date.now();
  }

  addToolCall(sessionId: string, toolCall: ToolCallRecord): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;
    session.toolCalls.push(toolCall);
    session.lastActivity = Date.now();
  }

  updateTokenUsage(sessionId: string, usage: Partial<TokenUsage>): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;
    session.tokenUsage = {
      ...session.tokenUsage,
      ...usage,
    };
  }

  setStatus(sessionId: string, status: CLIAgentSession["status"]): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;
    session.status = status;
  }

  updateContext(sessionId: string, context: Partial<CLIContext>): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;
    session.context = { ...session.context, ...context };
  }

  getRecentMessages(sessionId: string, limit: number): CLIMessage[] {
    const session = this.sessions.get(sessionId);
    if (!session) return [];
    return session.messages.slice(-limit);
  }

  listSessions(): CLIAgentSession[] {
    return Array.from(this.sessions.values());
  }

  deleteSession(id: string): boolean {
    const deleted = this.sessions.delete(id);
    if (this.activeSessionId === id) {
      this.activeSessionId = null;
    }
    return deleted;
  }

  clearHistory(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;
    session.messages = [];
    session.toolCalls = [];
    session.tokenUsage = { promptTokens: 0, completionTokens: 0, totalTokens: 0, estimatedCost: 0 };
  }

  serializeSession(id: string): string | null {
    const session = this.sessions.get(id);
    if (!session) return null;
    return JSON.stringify(session, null, 2);
  }

  deserializeSession(data: string): CLIAgentSession | null {
    try {
      return JSON.parse(data) as CLIAgentSession;
    } catch {
      return null;
    }
  }

  private buildContext(config: CLIAgentConfig): CLIContext {
    return {
      workspacePath: config.workspacePath,
      activeFiles: [],
      environment: { ...process.env } as Record<string, string>,
      customVariables: {},
    };
  }
}
