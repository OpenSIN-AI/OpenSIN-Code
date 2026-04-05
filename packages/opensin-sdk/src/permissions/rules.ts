import { PermissionRule, PermissionCheck, PermissionResult } from './types.js';

export function matchRule(rule: PermissionRule, check: PermissionCheck): boolean {
  if (rule.toolName && rule.toolName !== check.toolName) return false;

  if (rule.toolNamePattern) {
    const regex = new RegExp(rule.toolNamePattern);
    if (!regex.test(check.toolName)) return false;
  }

  if (rule.filePathPattern && check.args) {
    const filePath = check.args.path || check.args.file || check.args.filePath;
    if (typeof filePath === 'string') {
      const regex = new RegExp(rule.filePathPattern);
      if (!regex.test(filePath)) return false;
    }
  }

  if (rule.commandPattern && check.args) {
    const command = check.args.command || check.args.cmd;
    if (typeof command === 'string') {
      const regex = new RegExp(rule.commandPattern);
      if (!regex.test(command)) return false;
    }
  }

  return true;
}

export function findMatchingRule(
  rules: PermissionRule[],
  check: PermissionCheck
): PermissionRule | undefined {
  for (const rule of rules) {
    if (matchRule(rule, check)) {
      return rule;
    }
  }
  return undefined;
}

export function evaluatePermission(
  rules: PermissionRule[],
  check: PermissionCheck
): PermissionResult {
  const rule = findMatchingRule(rules, check);

  if (rule) {
    return {
      decision: rule.decision,
      rule,
      reason: rule.reason,
    };
  }

  return {
    decision: 'ask',
    reason: `No matching rule for tool '${check.toolName}'`,
  };
}
