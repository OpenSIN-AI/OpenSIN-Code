export interface PromptInterruptConfig {
  enabled: boolean;
  restoreOnInterrupt: boolean;
  maxRestoreHistory: number;
}

export interface SavedPrompt {
  id: string;
  input: string;
  timestamp: number;
  sessionId: string;
  metadata?: Record<string, unknown>;
}

export interface InterruptEvent {
  type: "interrupt";
  promptId: string;
  reason: "user" | "timeout" | "error";
  timestamp: number;
}

export interface RestoreEvent {
  type: "restore";
  promptId: string;
  input: string;
  timestamp: number;
}

export type PromptInterruptEvent = InterruptEvent | RestoreEvent;

export type PromptInterruptListener = (event: PromptInterruptEvent) => void;
