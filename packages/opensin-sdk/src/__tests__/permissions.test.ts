import { describe, it, expect, beforeEach } from 'vitest';
import { matchRule, evaluatePermission, findMatchingRule } from '../permissions/rules';
import { PermissionEvaluator } from '../permissions/evaluator';
import { AuditLogger } from '../permissions/audit_log';

describe('permissions/rules', () => {
  it('matches exact tool name', () => {
    const rule = { id: '1', toolName: 'Bash', decision: 'allow' };
    expect(matchRule(rule, { toolName: 'Bash' })).toBe(true);
    expect(matchRule(rule, { toolName: 'Read' })).toBe(false);
  });

  it('matches tool name pattern', () => {
    const rule = { id: '1', toolNamePattern: '^Bash', decision: 'allow' };
    expect(matchRule(rule, { toolName: 'Bash' })).toBe(true);
    expect(matchRule(rule, { toolName: 'BashRun' })).toBe(true);
    expect(matchRule(rule, { toolName: 'Read' })).toBe(false);
  });

  it('matches file path pattern', () => {
    const rule = { id: '1', toolName: 'Read', filePathPattern: '\\.env$', decision: 'deny' };
    expect(matchRule(rule, { toolName: 'Read', args: { path: '/app/.env' } })).toBe(true);
    expect(matchRule(rule, { toolName: 'Read', args: { path: '/app/config.json' } })).toBe(false);
  });

  it('matches command pattern', () => {
    const rule = { id: '1', toolName: 'Bash', commandPattern: 'rm -rf', decision: 'deny' };
    expect(matchRule(rule, { toolName: 'Bash', args: { command: 'rm -rf /tmp' } })).toBe(true);
    expect(matchRule(rule, { toolName: 'Bash', args: { command: 'ls -la' } })).toBe(false);
  });

  it('evaluates permission with matching rule', () => {
    const rules = [{ id: '1', toolName: 'Read', decision: 'allow' as const }];
    const result = evaluatePermission(rules, { toolName: 'Read' });
    expect(result.decision).toBe('allow');
    expect(result.rule?.id).toBe('1');
  });

  it('returns ask when no rule matches', () => {
    const rules = [{ id: '1', toolName: 'Read', decision: 'allow' as const }];
    const result = evaluatePermission(rules, { toolName: 'Bash' });
    expect(result.decision).toBe('ask');
  });

  it('finds first matching rule', () => {
    const rules = [
      { id: '1', toolName: 'Read', decision: 'allow' as const },
      { id: '2', toolName: 'Bash', decision: 'deny' as const },
    ];
    const found = findMatchingRule(rules, { toolName: 'Bash' });
    expect(found?.id).toBe('2');
  });
});

describe('PermissionEvaluator', () => {
  let evaluator: PermissionEvaluator;

  beforeEach(() => {
    evaluator = new PermissionEvaluator([
      { id: '1', toolName: 'Read', decision: 'allow' },
      { id: '2', toolName: 'Write', decision: 'allow' },
    ]);
  });

  it('allows matching tool', async () => {
    const result = await evaluator.checkPermission({ toolName: 'Read' });
    expect(result.decision).toBe('allow');
  });

  it('asks for unknown tool', async () => {
    const result = await evaluator.checkPermission({ toolName: 'Bash' });
    expect(result.decision).toBe('ask');
  });

  it('adds and removes rules', () => {
    evaluator.addRule({ id: '3', toolName: 'Bash', decision: 'deny' });
    expect(evaluator.getRules()).toHaveLength(3);
    evaluator.removeRule('3');
    expect(evaluator.getRules()).toHaveLength(2);
  });

  it('caches session permissions', async () => {
    await evaluator.checkPermission({ toolName: 'Read' });
    await evaluator.checkPermission({ toolName: 'Read' });
    const log = evaluator.getAuditLog();
    expect(log.length).toBe(1);
  });

  it('clears session permissions', async () => {
    await evaluator.checkPermission({ toolName: 'Read' });
    evaluator.clearSessionPermissions();
    expect(evaluator.getAuditLog()).toHaveLength(1);
  });

  it('filters audit log by tool', async () => {
    await evaluator.checkPermission({ toolName: 'Read' });
    await evaluator.checkPermission({ toolName: 'Write' });
    const readLogs = evaluator.getAuditLogByTool('Read');
    expect(readLogs).toHaveLength(1);
  });
});

describe('AuditLogger', () => {
  it('logs and retrieves entries', () => {
    const logger = new AuditLogger();
    logger.log({
      timestamp: new Date(),
      toolName: 'Bash',
      decision: 'allow',
    });
    expect(logger.getAll()).toHaveLength(1);
    expect(logger.getByTool('Bash')).toHaveLength(1);
  });

  it('provides summary', () => {
    const logger = new AuditLogger();
    logger.log({ timestamp: new Date(), toolName: 'Read', decision: 'allow' });
    logger.log({ timestamp: new Date(), toolName: 'Bash', decision: 'deny' });
    logger.log({ timestamp: new Date(), toolName: 'Edit', decision: 'ask' });

    const summary = logger.getSummary();
    expect(summary.total).toBe(3);
    expect(summary.allowed).toBe(1);
    expect(summary.denied).toBe(1);
    expect(summary.asked).toBe(1);
  });

  it('filters by decision', () => {
    const logger = new AuditLogger();
    logger.log({ timestamp: new Date(), toolName: 'Read', decision: 'allow' });
    logger.log({ timestamp: new Date(), toolName: 'Bash', decision: 'allow' });
    logger.log({ timestamp: new Date(), toolName: 'Edit', decision: 'deny' });

    expect(logger.getByDecision('allow')).toHaveLength(2);
    expect(logger.getByDecision('deny')).toHaveLength(1);
  });

  it('clears entries', () => {
    const logger = new AuditLogger();
    logger.log({ timestamp: new Date(), toolName: 'Read', decision: 'allow' });
    logger.clear();
    expect(logger.getAll()).toHaveLength(0);
  });
});

describe('permissions exports', () => {
  it('exports all public API from index', async () => {
    const permissions = await import('../permissions/index');
    expect(permissions.PermissionEvaluator).toBeDefined();
    expect(permissions.ApprovalGate).toBeDefined();
    expect(permissions.AuditLogger).toBeDefined();
    expect(permissions.matchRule).toBeDefined();
    expect(permissions.findMatchingRule).toBeDefined();
    expect(permissions.evaluatePermission).toBeDefined();
  });
});
