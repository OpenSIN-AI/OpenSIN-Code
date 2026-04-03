import {
  SavedPrompt,
  RestoreEvent,
  PromptInterruptEvent,
  PromptInterruptListener,
  PromptInterruptConfig,
} from "./types.js";
import { InterruptHandler } from "./interrupt_handler.js";

export class PromptRestore {
  private handler: InterruptHandler;
  private restoreHistory: SavedPrompt[] = [];
  private listeners: Set<PromptInterruptListener> = new Set();

  constructor(handler: InterruptHandler) {
    this.handler = handler;
    this.handler.on((event) => {
      if (event.type === "interrupt") {
        this.handleInterrupt(event);
      }
    });
  }

  private handleInterrupt(event: PromptInterruptEvent): void {
    if (event.type !== "interrupt") return;

    const saved = this.handler.getSavedPrompt();
    if (!saved) return;

    this.restoreHistory.unshift(saved);
    const config = this.handler.getConfig();
    if (this.restoreHistory.length > config.maxRestoreHistory) {
      this.restoreHistory = this.restoreHistory.slice(0, config.maxRestoreHistory);
    }

    const restoreEvent: RestoreEvent = {
      type: "restore",
      promptId: saved.id,
      input: saved.input,
      timestamp: Date.now(),
    };

    this.emit(restoreEvent);
  }

  getRestoredPrompt(): SavedPrompt | null {
    return this.restoreHistory[0] ?? null;
  }

  getRestoreHistory(): ReadonlyArray<SavedPrompt> {
    return [...this.restoreHistory];
  }

  clearHistory(): void {
    this.restoreHistory = [];
  }

  canRestore(): boolean {
    return this.restoreHistory.length > 0;
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
        // Listener errors should not break the restore flow
      }
    }
  }
}

export class PromptInterruptManager {
  private handler: InterruptHandler;
  private restore: PromptRestore;

  constructor(config: Partial<PromptInterruptConfig> = {}) {
    this.handler = new InterruptHandler(config);
    this.restore = new PromptRestore(this.handler);
  }

  get interruptHandler(): InterruptHandler {
    return this.handler;
  }

  get promptRestore(): PromptRestore {
    return this.restore;
  }

  capture(input: string, sessionId: string, metadata?: Record<string, unknown>): SavedPrompt {
    return this.handler.capturePrompt(input, sessionId, metadata);
  }

  interrupt(reason?: "user" | "timeout" | "error") {
    return this.handler.interrupt(reason);
  }

  getRestoredInput(): string | null {
    const restored = this.restore.getRestoredPrompt();
    return restored?.input ?? null;
  }

  canRestore(): boolean {
    return this.restore.canRestore();
  }

  clear(): void {
    this.handler.clear();
  }

  clearHistory(): void {
    this.restore.clearHistory();
  }
}
