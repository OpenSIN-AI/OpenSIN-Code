export { PermissionEvaluator } from './evaluator';
export { ApprovalGate } from './approval_gate';
export { AuditLogger } from './audit_log';
export { matchRule, findMatchingRule, evaluatePermission } from './rules';
export type {
  PermissionDecision,
  PermissionRule,
  PermissionCheck,
  PermissionResult,
  AuditEntry,
} from './types';
