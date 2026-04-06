export interface PruningConfig {
  maxTokens: number;
  keepLastN: number;
  keepSystemPrompt: boolean;
  keepRecentToolOutputs: number;
}

export interface ContextMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  toolCallId?: string;
  toolName?: string;
}

export interface PruningResult {
  messages: ContextMessage[];
  tokensRemoved: number;
  tokensRemaining: number;
  prunedCount: number;
  reason: string;
}

export interface TokenCount {
  total: number;
  byRole: Record<string, number>;
}
