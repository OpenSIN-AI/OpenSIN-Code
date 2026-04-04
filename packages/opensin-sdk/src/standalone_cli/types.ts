export type CliMode = "interactive" | "batch" | "stream";

export interface CliConfig {
  baseUrl: string;
  apiKey?: string;
  sessionId?: string;
  cwd: string;
  autoApprove: boolean;
  model?: string;
  maxTokens?: number;
  temperature?: number;
  timeoutMs: number;
  historyFile: string;
  maxHistoryEntries: number;
  imageSupport: boolean;
  platform: "linux-arm64" | "darwin" | "win32";
}

export interface NdjsonMessage {
  type: "prompt" | "response" | "error" | "system" | "image" | "session" | "history";
  id?: string;
  payload: Record<string, unknown>;
  timestamp: string;
}

export interface SessionRecord {
  sessionId: string;
  cwd: string;
  createdAt: string;
  lastActiveAt: string;
  messageCount: number;
  model?: string;
  status: "active" | "paused" | "closed";
}

export interface HistoryEntry {
  id: string;
  sessionId: string;
  role: "user" | "agent" | "system";
  content: string;
  timestamp: string;
  images?: string[];
  _meta?: Record<string, unknown>;
}

export interface StdinCommand {
  type: "text" | "image" | "file" | "command" | "session";
  payload: string | Record<string, unknown>;
  sessionId?: string;
}

export interface SessionResumeState {
  sessionId: string;
  lastMessages: HistoryEntry[];
  modelState?: Record<string, unknown>;
  context?: string;
  resumedAt: string;
}

export interface CliStatus {
  connected: boolean;
  sessionId: string | null;
  model: string | null;
  messagesInSession: number;
  autoApprove: boolean;
  uptime: number;
}
