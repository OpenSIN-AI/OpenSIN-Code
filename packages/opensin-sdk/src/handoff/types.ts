/**
 * OpenSIN Handoff Types
 */

export interface HandoffContext {
  sessionId: string;
  summary: string;
  completedTasks: string[];
  pendingTasks: string[];
  keyDecisions: string[];
  fileChanges: string[];
  timestamp: Date;
}

export interface HandoffConfig {
  maxSummaryLength: number;
  includeFileChanges: boolean;
  includeDecisions: boolean;
}

export const DEFAULT_HANDOFF_CONFIG: HandoffConfig = {
  maxSummaryLength: 2000,
  includeFileChanges: true,
  includeDecisions: true,
};
