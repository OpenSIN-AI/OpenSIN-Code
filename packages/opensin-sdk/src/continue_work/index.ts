import type { ActionRecord, WorkState, ContinueWorkResult } from "./models.js";

export type { ActionRecord, WorkState, ContinueWorkResult } from "./models.js";

export class ActionHistory {
  private actions: ActionRecord[] = [];
  private maxHistory: number;

  constructor(maxHistory = 500) {
    this.maxHistory = maxHistory;
  }

  record(type: string, description: string, metadata: Record<string, unknown> = {}): ActionRecord {
    const action: ActionRecord = {
      id: crypto.randomUUID(),
      type,
      description,
      timestamp: Date.now(),
      metadata,
    };
    this.actions.push(action);
    if (this.actions.length > this.maxHistory) {
      this.actions = this.actions.slice(-this.maxHistory);
    }
    return action;
  }

  getHistory(limit = 50): ActionRecord[] {
    return this.actions.slice(-limit);
  }

  clear(): void {
    this.actions = [];
  }

  serialize(): string {
    return JSON.stringify(this.actions);
  }

  deserialize(data: string): ActionRecord[] {
    this.actions = JSON.parse(data) as ActionRecord[];
    return this.actions;
  }
}

export class ContextRestorer {
  private context: Record<string, unknown> = {};

  set(key: string, value: unknown): void {
    this.context[key] = value;
  }

  get<T>(key: string): T | undefined {
    return this.context[key] as T | undefined;
  }

  getAll(): Record<string, unknown> {
    return { ...this.context };
  }

  clear(): void {
    this.context = {};
  }

  serialize(): string {
    return JSON.stringify(this.context);
  }

  deserialize(data: string): Record<string, unknown> {
    this.context = JSON.parse(data) as Record<string, unknown>;
    return this.context;
  }
}

export class WorkStateSerializer {
  static serialize(state: WorkState): string {
    return JSON.stringify(state, null, 2);
  }

  static deserialize(data: string): WorkState {
    return JSON.parse(data) as WorkState;
  }

  static toFile(state: WorkState): string {
    return `# OpenSIN Work State
# Session: ${state.sessionId}
# Last Active: ${new Date(state.lastActive).toISOString()}
# Task: ${state.currentTask}

## Context
${JSON.stringify(state.context, null, 2)}

## Recent Actions
${state.actions.slice(-20).map(a => `- [${new Date(a.timestamp).toISOString()}] ${a.type}: ${a.description}`).join("\n")}

## Files
${state.files.map(f => `- ${f}`).join("\n")}
`;
  }
}

export class ContinueMyWork {
  private history: ActionHistory;
  private restorer: ContextRestorer;
  private stateStorage: Map<string, string> = new Map();

  constructor() {
    this.history = new ActionHistory();
    this.restorer = new ContextRestorer();
  }

  trackAction(type: string, description: string, metadata: Record<string, unknown> = {}): ActionRecord {
    return this.history.record(type, description, metadata);
  }

  setContext(key: string, value: unknown): void {
    this.restorer.set(key, value);
  }

  saveState(sessionId: string, currentTask: string, files: string[] = []): WorkState {
    const state: WorkState = {
      sessionId,
      currentTask,
      actions: this.history.getHistory(),
      context: this.restorer.getAll(),
      files,
      lastActive: Date.now(),
      metadata: { version: "1.0.0" },
    };
    this.stateStorage.set(sessionId, WorkStateSerializer.serialize(state));
    return state;
  }

  async resume(sessionId: string): Promise<ContinueWorkResult> {
    const serialized = this.stateStorage.get(sessionId);
    if (!serialized) {
      return { restored: false, workState: null, lastActions: [], message: "No saved state found" };
    }

    const state = WorkStateSerializer.deserialize(serialized);
    this.history.deserialize(JSON.stringify(state.actions));
    this.restorer.deserialize(JSON.stringify(state.context));

    return {
      restored: true,
      workState: state,
      lastActions: state.actions.slice(-10),
      message: `Resumed session from ${new Date(state.lastActive).toISOString()}. Last task: ${state.currentTask}`,
    };
  }

  getState(sessionId: string): WorkState | null {
    const serialized = this.stateStorage.get(sessionId);
    if (!serialized) return null;
    return WorkStateSerializer.deserialize(serialized);
  }

  clearState(sessionId: string): boolean {
    return this.stateStorage.delete(sessionId);
  }

  listStates(): string[] {
    return Array.from(this.stateStorage.keys());
  }
}

export const continueMyWork = new ContinueMyWork();
