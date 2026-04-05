export interface SessionState {
  currentTask: string;
  openFiles: string[];
  recentActions: string[];
  pendingItems: string[];
  contextSummary: string;
  timestamp: string;
}

export interface HandoffConfig {
  maxRecentActions: number;
  includeOpenFiles: boolean;
  includePendingItems: boolean;
  includeContextSummary: boolean;
}

export interface HandoffPrompt {
  prompt: string;
  state: SessionState;
  metadata: { generatedAt: string; version: string };
}
