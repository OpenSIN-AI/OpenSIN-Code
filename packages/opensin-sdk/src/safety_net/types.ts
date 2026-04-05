/**
 * OpenSIN Safety Net Types
 */

export interface SafetyRule {
  pattern: RegExp;
  severity: 'warning' | 'block';
  message: string;
}

export interface SafetyCheck {
  allowed: boolean;
  severity?: 'warning' | 'block';
  message?: string;
}

export const DEFAULT_SAFETY_RULES: SafetyRule[] = [
  { pattern: /^rm\s+-rf\s+\/$/, severity: 'block', message: 'Cannot remove root directory' },
  { pattern: /^rm\s+-rf\s+\/\*$/, severity: 'block', message: 'Cannot remove all files from root' },
  { pattern: /:\(\)\{.*\|.*&.*\};/, severity: 'block', message: 'Fork bomb pattern detected' },
  { pattern: /^git\s+push\s+--force/, severity: 'warning', message: 'Force push detected — proceed with caution' },
  { pattern: /^git\s+reset\s+--hard/, severity: 'warning', message: 'Hard reset detected — this will discard all uncommitted changes' },
  { pattern: /^chmod\s+-R\s+777/, severity: 'warning', message: 'Setting 777 permissions recursively — security risk' },
];
