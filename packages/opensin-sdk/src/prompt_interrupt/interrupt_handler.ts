import {
  PromptInterruptConfig,
  SavedPrompt,
  InterruptEvent,
  PromptInterruptEvent,
  PromptInterruptListener,
} from "./types.js";

const DEFAULT_CONFIG: PromptInterruptConfig = {
  enabled: true,
  restoreOnInterrupt: true,
  maxRestoreHistory: 10,
};

export class InterruptHandler {
  private config: PromptInterruptConfig;
  private listeners: Set<PromptInterruptListener> = new Set();
  private interrupted: boolean = false;
  private currentPrompt: SavedPrompt | null = null;

  constructor(config: Partial<PromptInterruptConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  setConfig(config: Partial<PromptInterruptConfig>): void {
    this.config = { ...this.config, ...config };
  }

  getConfig(): PromptInterruptConfig {
    return { ...this.config };
  }

  capturePrompt(input: string, sessionId: string, metadata?: Record<string, unknown>): SavedPrompt {
    const prompt: SavedPrompt = {
      id: `prompt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      input,
      timestamp: Date.now(),
      sessionId,
      metadata,
    };
    this.currentPrompt = prompt;
    this.interrupted = false;
    return prompt;
  }

  interrupt(reason: "user" | "timeout" | "error" = "user"): InterruptEvent | null {
    if (!this.config.enabled || !this.currentPrompt) {
      return null;
    }

    this.interrupted = true;
    const event: InterruptEvent = {
      type: "interrupt",
      promptId: this.currentPrompt.id,
      reason,
      timestamp: Date.now(),
    };

    this.emit(event);
    return event;
  }

  getSavedPrompt(): SavedPrompt | null {
    if (!this.config.restoreOnInterrupt || !this.interrupted || !this.currentPrompt) {
      return null;
    }
    return this.currentPrompt;
  }

  clear(): void {
    this.currentPrompt = null;
    this.interrupted = false;
  }

  isInterrupted(): boolean {
    return this.interrupted;
  }

  on(listener: PromptInterruptListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private emit(event: PromptInterruptEvent): void {
    for (const listener of this.listeners) {
      try {
        listener(event);
      } catch {
        // Listener errors should not break the interrupt flow
      }
    }
  }
}
