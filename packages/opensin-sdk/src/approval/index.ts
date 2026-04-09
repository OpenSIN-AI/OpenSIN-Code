/**
 * OpenSIN Approval Hooks — Safety gates for autonomous operations
 *
 * Like OpenClaw's requireApproval, this system provides risk-based approval
 * gates that require human confirmation before high-risk autonomous actions.
 */

export type RiskLevel = 'auto' | 'notify' | 'approve';

export interface ApprovalRule {
  id: string;
  name: string;
  actionPatterns: string[];
  riskLevel: RiskLevel;
  conditions: ApprovalCondition[];
  timeoutMs: number;
  timeoutAction: 'reject' | 'approve' | 'escalate';
  enabled: boolean;
  metadata: Record<string, unknown>;
}

export interface ApprovalCondition {
  field: string;
  operator: 'eq' | 'neq' | 'gt' | 'lt' | 'contains' | 'matches' | 'in';
  value: string | number | boolean | string[];
}

export interface ApprovalRequest {
  id: string;
  ruleId: string;
  action: string;
  input: Record<string, unknown>;
  riskLevel: RiskLevel;
  status: 'pending' | 'approved' | 'rejected' | 'expired' | 'escalated';
  requestedAt: string;
  resolvedAt: string | null;
  resolvedBy: string | null;
  reason?: string;
  timeoutMs: number;
  expiresAt: string;
}

export interface ApprovalDecision {
  requestId: string;
  decision: 'approve' | 'reject';
  resolvedBy: string;
  reason?: string;
}

export interface ApprovalEvent {
  type: 'request_created' | 'approved' | 'rejected' | 'expired' | 'escalated';
  timestamp: string;
  requestId: string;
  data: Record<string, unknown>;
}

const DEFAULT_RULES: ApprovalRule[] = [
  {
    id: 'auto-safe-ops',
    name: 'Auto-approve safe operations',
    actionPatterns: ['read_file', 'glob', 'grep', 'search', 'list', 'status', 'health', 'info'],
    riskLevel: 'auto',
    conditions: [],
    timeoutMs: 0,
    timeoutAction: 'approve',
    enabled: true,
    metadata: {},
  },
  {
    id: 'notify-write-ops',
    name: 'Notify on write operations',
    actionPatterns: ['write_file', 'edit_file', 'create_*', 'update_*'],
    riskLevel: 'notify',
    conditions: [],
    timeoutMs: 300000,
    timeoutAction: 'approve',
    enabled: true,
    metadata: {},
  },
  {
    id: 'approve-destructive-ops',
    name: 'Require approval for destructive operations',
    actionPatterns: ['delete_*', 'remove_*', 'rm_*', 'drop_*', 'truncate_*', 'destroy_*'],
    riskLevel: 'approve',
    conditions: [],
    timeoutMs: 600000,
    timeoutAction: 'reject',
    enabled: true,
    metadata: {},
  },
  {
    id: 'approve-network-ops',
    name: 'Require approval for external network calls',
    actionPatterns: ['deploy_*', 'publish_*', 'send_*', 'webhook_*', 'api_*'],
    riskLevel: 'approve',
    conditions: [],
    timeoutMs: 300000,
    timeoutAction: 'reject',
    enabled: true,
    metadata: {},
  },
  {
    id: 'approve-financial-ops',
    name: 'Require approval for financial operations',
    actionPatterns: ['payment_*', 'charge_*', 'refund_*', 'transfer_*', 'stripe_*'],
    riskLevel: 'approve',
    conditions: [],
    timeoutMs: 900000,
    timeoutAction: 'reject',
    enabled: true,
    metadata: {},
  },
  {
    id: 'approve-auth-ops',
    name: 'Require approval for auth/security operations',
    actionPatterns: ['auth_*', 'token_*', 'credential_*', 'secret_*', 'key_*', 'password_*'],
    riskLevel: 'approve',
    conditions: [],
    timeoutMs: 300000,
    timeoutAction: 'reject',
    enabled: true,
    metadata: {},
  },
];

export class ApprovalHooks {
  private rules: Map<string, ApprovalRule> = new Map();
  private pendingRequests: Map<string, ApprovalRequest> = new Map();
  private auditLog: ApprovalRequest[] = [];
  private eventListeners: ((event: ApprovalEvent) => void)[] = [];
  private notificationChannel: ((request: ApprovalRequest) => Promise<void>) | null = null;
  private expiryChecker: ReturnType<typeof setInterval> | null = null;

  constructor(rules?: ApprovalRule[]) {
    const initialRules = rules || DEFAULT_RULES;
    for (const rule of initialRules) {
      this.rules.set(rule.id, rule);
    }
    this.startExpiryChecker();
  }

  setNotificationChannel(channel: (request: ApprovalRequest) => Promise<void>): void {
    this.notificationChannel = channel;
  }

  async evaluateAction(
    action: string,
    input: Record<string, unknown>,
  ): Promise<{ approved: boolean; riskLevel: RiskLevel; requestId?: string; ruleId?: string }> {
    const matchingRule = this.findMatchingRule(action, input);

    if (!matchingRule) {
      return { approved: true, riskLevel: 'auto' };
    }

    switch (matchingRule.riskLevel) {
      case 'auto':
        return { approved: true, riskLevel: 'auto', ruleId: matchingRule.id };

      case 'notify': {
        const request = this.createRequest(matchingRule, action, input);
        if (this.notificationChannel) {
          await this.notificationChannel(request);
        }
        return { approved: true, riskLevel: 'notify', requestId: request.id, ruleId: matchingRule.id };
      }

      case 'approve': {
        const request = this.createRequest(matchingRule, action, input);
        if (this.notificationChannel) {
          await this.notificationChannel(request);
        }
        return { approved: false, riskLevel: 'approve', requestId: request.id, ruleId: matchingRule.id };
      }
    }
  }

  resolveRequest(decision: ApprovalDecision): ApprovalRequest | null {
    const request = this.pendingRequests.get(decision.requestId);
    if (!request || request.status !== 'pending') return null;

    request.status = decision.decision === 'approve' ? 'approved' : 'rejected';
    request.resolvedAt = new Date().toISOString();
    request.resolvedBy = decision.resolvedBy;
    request.reason = decision.reason;

    this.pendingRequests.delete(decision.requestId);
    this.auditLog.push(request);

    this.emitEvent(decision.decision === 'approve' ? 'approved' : 'rejected', request.id, {
      resolvedBy: decision.resolvedBy,
      reason: decision.reason,
    });

    return request;
  }

  getPendingRequests(): ApprovalRequest[] {
    return Array.from(this.pendingRequests.values());
  }

  getAuditLog(limit = 100): ApprovalRequest[] {
    return this.auditLog.slice(-limit);
  }

  addRule(rule: ApprovalRule): void {
    this.rules.set(rule.id, rule);
  }

  removeRule(ruleId: string): boolean {
    return this.rules.delete(ruleId);
  }

  updateRule(ruleId: string, updates: Partial<ApprovalRule>): ApprovalRule | undefined {
    const rule = this.rules.get(ruleId);
    if (!rule) return undefined;
    const updated = { ...rule, ...updates };
    this.rules.set(ruleId, updated);
    return updated;
  }

  listRules(enabledOnly = false): ApprovalRule[] {
    const all = Array.from(this.rules.values());
    return enabledOnly ? all.filter(r => r.enabled) : all;
  }

  onEvent(listener: (event: ApprovalEvent) => void): () => void {
    this.eventListeners.push(listener);
    return () => {
      this.eventListeners = this.eventListeners.filter(l => l !== listener);
    };
  }

  destroy(): void {
    if (this.expiryChecker) {
      clearInterval(this.expiryChecker);
      this.expiryChecker = null;
    }
  }

  private findMatchingRule(action: string, input: Record<string, unknown>): ApprovalRule | null {
    const enabledRules = Array.from(this.rules.values()).filter(r => r.enabled);

    const sortedByPriority = enabledRules.sort((a, b) => {
      const priorityMap: Record<RiskLevel, number> = { approve: 3, notify: 2, auto: 1 };
      return priorityMap[b.riskLevel] - priorityMap[a.riskLevel];
    });

    for (const rule of sortedByPriority) {
      const matchesAction = rule.actionPatterns.some(pattern => {
        if (pattern.includes('*')) {
          const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
          return regex.test(action);
        }
        return action === pattern;
      });

      if (!matchesAction) continue;

      if (rule.conditions.length === 0) return rule;

      const allConditionsMet = rule.conditions.every(condition =>
        this.evaluateCondition(condition, input),
      );

      if (allConditionsMet) return rule;
    }

    return null;
  }

  private evaluateCondition(condition: ApprovalCondition, input: Record<string, unknown>): boolean {
    const fieldValue = input[condition.field];

    switch (condition.operator) {
      case 'eq': return fieldValue === condition.value;
      case 'neq': return fieldValue !== condition.value;
      case 'gt': return typeof fieldValue === 'number' && fieldValue > (condition.value as number);
      case 'lt': return typeof fieldValue === 'number' && fieldValue < (condition.value as number);
      case 'contains': return typeof fieldValue === 'string' && fieldValue.includes(condition.value as string);
      case 'matches': {
        if (typeof fieldValue !== 'string') return false;
        try { return new RegExp(condition.value as string).test(fieldValue); } catch { return false; }
      }
      case 'in': return Array.isArray(condition.value) && condition.value.includes(String(fieldValue));
      default: return false;
    }
  }

  private createRequest(rule: ApprovalRule, action: string, input: Record<string, unknown>): ApprovalRequest {
    const request: ApprovalRequest = {
      id: `approval-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      ruleId: rule.id,
      action,
      input,
      riskLevel: rule.riskLevel,
      status: 'pending',
      requestedAt: new Date().toISOString(),
      resolvedAt: null,
      resolvedBy: null,
      timeoutMs: rule.timeoutMs,
      expiresAt: new Date(Date.now() + rule.timeoutMs).toISOString(),
    };

    this.pendingRequests.set(request.id, request);
    this.emitEvent('request_created', request.id, { action, riskLevel: rule.riskLevel, ruleName: rule.name });

    return request;
  }

  private startExpiryChecker(): void {
    this.expiryChecker = setInterval(() => {
      this.checkExpiredRequests();
    }, 30000);
  }

  private checkExpiredRequests(): void {
    const now = new Date();

    for (const [id, request] of this.pendingRequests) {
      if (request.status !== 'pending') continue;

      if (now >= new Date(request.expiresAt)) {
        const rule = this.rules.get(request.ruleId);
        const timeoutAction = rule?.timeoutAction || 'reject';

        request.status = timeoutAction === 'approve' ? 'approved' : timeoutAction === 'escalate' ? 'escalated' : 'expired';
        request.resolvedAt = new Date().toISOString();
        request.resolvedBy = 'system:timeout';
        request.reason = `Request expired after ${request.timeoutMs}ms`;

        this.pendingRequests.delete(id);
        this.auditLog.push(request);

        this.emitEvent('expired', id, { timeoutAction, ruleId: request.ruleId });
      }
    }
  }

  private emitEvent(type: ApprovalEvent['type'], requestId: string, data: Record<string, unknown>): void {
    const event: ApprovalEvent = { type, timestamp: new Date().toISOString(), requestId, data };
    for (const listener of this.eventListeners) {
      try { listener(event); } catch { }
    }
  }
}

export function createApprovalHooks(rules?: ApprovalRule[]): ApprovalHooks {
  return new ApprovalHooks(rules);
}

export { DEFAULT_RULES };
