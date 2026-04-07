import { InterruptState, InterruptResult } from './types';

export class InterruptHandler {
  private state: InterruptState;
  private signalHandlers: Map<string, () => void>;

  constructor() {
    this.state = { active: false, interruptedAt: null, pendingPrompt: null, contextSnapshot: null };
    this.signalHandlers = new Map();
  }

  setup(): void {
    const handler = () => this.handleInterrupt();
    process.on('SIGINT', handler);
    this.signalHandlers.set('SIGINT', handler);
  }

  teardown(): void {
    for (const [signal, handler] of this.signalHandlers) {
      process.removeListener(signal, handler);
    }
    this.signalHandlers.clear();
  }

  async handleInterrupt(): Promise<void> {
    this.state.active = true;
    this.state.interruptedAt = new Date();
  }

  setPendingPrompt(prompt: string): void {
    this.state.pendingPrompt = prompt;
  }

  setContextSnapshot(snapshot: string): void {
    this.state.contextSnapshot = snapshot;
  }

  getResult(): InterruptResult {
    return {
      interrupted: this.state.active,
      restored: !!this.state.contextSnapshot,
      newPrompt: this.state.pendingPrompt,
    };
  }

  reset(): void {
    this.state = { active: false, interruptedAt: null, pendingPrompt: null, contextSnapshot: null };
  }
}
