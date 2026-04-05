export { PermissionEvaluator } from './evaluator.js';
export { ApprovalGate } from './approval_gate.js';
export { AuditLogger } from './audit_log.js';
export { matchRule, findMatchingRule, evaluatePermission } from './rules.js';
export type {
  PermissionDecision,
  PermissionRule,
  PermissionCheck,
  PermissionResult,
  AuditEntry,
} from './types.js';
