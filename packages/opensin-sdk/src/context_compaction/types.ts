export interface CompactionConfig {
  threshold: number;
  maxTokens: number;
  keepRecent: number;
}

export interface CompactionTrigger {
  type: 'token_limit' | 'message_count' | 'manual';
  currentTokens: number;
  currentMessages: number;
}

export interface CompactionResult {
  success: boolean;
  tokensBefore: number;
  tokensAfter: number;
  messagesRemoved: number;
}
