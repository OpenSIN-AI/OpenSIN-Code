export interface A2ATaskPayload {
  taskId: string;
  requesterId: string;
  targetId: string;
  instruction: string;
  context?: Record<string, any>;
  priority?: 'low' | 'normal' | 'high' | 'critical';
  timeoutMs?: number;
}

export interface A2ATaskResponse {
  taskId: string;
  status: 'accepted' | 'completed' | 'failed' | 'rejected';
  result?: any;
  error?: string;
  executionTimeMs?: number;
}

export interface A2AHealthCheck {
  status: 'alive' | 'degraded' | 'dead';
  agentId: string;
  version: string;
  activeTasks: number;
  uptimeSeconds: number;
}
