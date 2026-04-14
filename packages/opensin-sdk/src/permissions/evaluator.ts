import { PermissionRule, PermissionCheck, PermissionResult, AuditEntry } from './types';
import { evaluatePermission } from './rules';

export class PermissionEvaluator {
  private rules: PermissionRule[];
  private auditLog: AuditEntry[];
  private sessionPermissions = new Map<string, PermissionResult>();

  constructor(rules: PermissionRule[] = []) {
    this.rules = rules;
    this.auditLog = [];
  }

  addRule(rule: PermissionRule): void {
    this.rules.push(rule);
  }

  removeRule(ruleId: string): boolean {
    const index = this.rules.findIndex(r => r.id === ruleId);
    if (index !== -1) {
      this.rules.splice(index, 1);
      return true;
    }
    return false;
  }

  getRules(): PermissionRule[] {
    return [...this.rules];
  }

  async checkPermission(check: PermissionCheck): Promise<PermissionResult> {
    const cacheKey = `${check.toolName}:${JSON.stringify(check.args)}`;
    const cached = this.sessionPermissions.get(cacheKey);
    if (cached) {
      return cached;
    }

    const result = evaluatePermission(this.rules, check);

    const entry: AuditEntry = {
      timestamp: new Date(),
      toolName: check.toolName,
      args: check.args,
      decision: result.decision,
      ruleId: result.rule?.id,
    };
    this.auditLog.push(entry);

    if (result.decision !== 'ask') {
      this.sessionPermissions.set(cacheKey, result);
    }

    return result;
  }

  clearSessionPermissions(): void {
    this.sessionPermissions.clear();
  }

  getAuditLog(): AuditEntry[] {
    return [...this.auditLog];
  }

  getAuditLogByTool(toolName: string): AuditEntry[] {
    return this.auditLog.filter(entry => entry.toolName === toolName);
  }
}
