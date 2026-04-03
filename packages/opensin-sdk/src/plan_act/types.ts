/** Plan/Act Mode Separation — types */

export type AgentMode = 'plan' | 'act';

export interface PlanStep {
  id: string;
  description: string;
  type: 'read' | 'write' | 'execute' | 'delete';
  filePath?: string;
  content?: string;
  command?: string;
  rationale: string;
}

export interface Plan {
  id: string;
  sessionId: string;
  mode: AgentMode;
  steps: PlanStep[];
  summary: string;
  createdAt: Date;
  status: PlanStatus;
}

export type PlanStatus = 'draft' | 'reviewing' | 'approved' | 'rejected' | 'executing' | 'completed';

export interface PlanApproval {
  planId: string;
  approved: boolean;
  comment?: string;
  approvedAt: Date;
  approvedBy: string;
}

export interface PlanActState {
  currentMode: AgentMode;
  activePlan: Plan | null;
  approval: PlanApproval | null;
  executionLog: ExecutionEntry[];
}

export interface ExecutionEntry {
  stepId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  result?: string;
  error?: string;
  timestamp: Date;
}
