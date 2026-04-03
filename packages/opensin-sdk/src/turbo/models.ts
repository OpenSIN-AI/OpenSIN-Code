export interface TurboConfig {
  enabled: boolean;
  autoExecute: boolean;
  safetyFilter: CommandSafetyFilter;
  whitelist: string[];
  blacklist: string[];
  auditTrail: AuditEntry[];
}

export interface CommandSafetyFilter {
  blockDestructive: boolean;
  blockNetwork: boolean;
  blockSudo: boolean;
  maxExecutionTimeMs: number;
  requireConfirmation: boolean;
}

export interface AuditEntry {
  id: string;
  command: string;
  timestamp: number;
  allowed: boolean;
  reason: string;
  executed: boolean;
  output?: string;
  durationMs?: number;
}

export interface CommandResult {
  command: string;
  exitCode: number;
  stdout: string;
  stderr: string;
  durationMs: number;
  auditId: string;
}
