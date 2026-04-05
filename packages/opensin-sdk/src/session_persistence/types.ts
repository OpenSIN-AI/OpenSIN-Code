export interface SessionMessage {
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string | unknown;
  timestamp?: string;
  toolName?: string;
  toolCallId?: string;
}

export interface SessionMetadata {
  id: string;
  name?: string;
  created: string;
  modified: string;
  messageCount: number;
  tokenCost?: number;
  model?: string;
}

export interface SessionData {
  metadata: SessionMetadata;
  messages: SessionMessage[];
}
