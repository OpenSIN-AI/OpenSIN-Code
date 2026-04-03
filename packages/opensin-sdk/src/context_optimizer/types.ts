export interface ContextTool {
  name: string;
  tokenCost: number;
  callCount: number;
  lastUsed: string;
  impact: "high" | "medium" | "low";
}

export interface ContextMetrics {
  totalTokens: number;
  availableTokens: number;
  usedPercentage: number;
  messageCount: number;
  toolCallCount: number;
  fileReferences: number;
  memoryEntries: number;
}

export interface ContextWarning {
  type: "capacity" | "bloat" | "redundancy" | "stale";
  severity: "critical" | "warning" | "info";
  message: string;
  details: string;
  tokenImpact: number;
}

export interface OptimizationTip {
  id: string;
  title: string;
  description: string;
  action: string;
  estimatedSavings: number;
  category: "context" | "memory" | "tools" | "files";
  priority: "high" | "medium" | "low";
}

export interface ContextAnalysis {
  metrics: ContextMetrics;
  tools: ContextTool[];
  warnings: ContextWarning[];
  tips: OptimizationTip[];
  analyzedAt: string;
  sessionId: string;
}

export interface ContextOptimizerConfig {
  warningThreshold: number;
  criticalThreshold: number;
  maxToolsBeforeWarning: number;
  maxFileRefsBeforeWarning: number;
  staleEntryMinutes: number;
}
