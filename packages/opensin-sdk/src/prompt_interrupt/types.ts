export interface InterruptState {
  active: boolean;
  interruptedAt: Date | null;
  pendingPrompt: string | null;
  contextSnapshot: string | null;
}

export interface InterruptResult {
  interrupted: boolean;
  restored: boolean;
  newPrompt: string | null;
}
