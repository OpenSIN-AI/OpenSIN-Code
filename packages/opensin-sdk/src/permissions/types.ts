export type PermissionDecision = 'allow' | 'deny' | 'ask';

export interface PermissionRule {
  id: string;
  toolName?: string;
  toolNamePattern?: string;
  filePathPattern?: string;
  commandPattern?: string;
  decision: PermissionDecision;
  timeout?: number;
  reason?: string;
}

export interface PermissionCheck {
  toolName: string;
  args?: Record<string, unknown>;
  cwd?: string;
}

export interface PermissionResult {
  decision: PermissionDecision;
  rule?: PermissionRule;
  reason?: string;
}

export interface AuditEntry {
  timestamp: Date;
  toolName: string;
  args?: Record<string, unknown>;
  decision: PermissionDecision;
  ruleId?: string;
  duration?: number;
}
