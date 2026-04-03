export interface ActionRecord {
  id: string;
  type: string;
  description: string;
  timestamp: number;
  metadata: Record<string, unknown>;
}

export interface WorkState {
  sessionId: string;
  currentTask: string;
  actions: ActionRecord[];
  context: Record<string, unknown>;
  files: string[];
  lastActive: number;
  metadata: Record<string, unknown>;
}

export interface ContinueWorkResult {
  restored: boolean;
  workState: WorkState | null;
  lastActions: ActionRecord[];
  message: string;
}
