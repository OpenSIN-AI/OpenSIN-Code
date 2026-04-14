/**
 * OpenSIN Safety Net — Destructive command protection
 * 
 * Catches destructive git and filesystem commands before execution.
 */

import type { SafetyRule, SafetyCheck } from './types';
import { DEFAULT_SAFETY_RULES } from './types';

export class SafetyChecker {
  private rules: SafetyRule[];

  constructor(rules?: SafetyRule[]) {
    this.rules = rules || DEFAULT_SAFETY_RULES;
  }

  check(command: string): SafetyCheck {
    for (const rule of this.rules) {
      if (rule.pattern.test(command)) {
        if (rule.severity === 'block') {
          return { allowed: false, severity: 'block', message: rule.message };
        }
        return { allowed: true, severity: 'warning', message: rule.message };
      }
    }
    return { allowed: true };
  }

  addRule(rule: SafetyRule): void {
    this.rules.push(rule);
  }

  removeRule(index: number): void {
    if (index >= 0 && index < this.rules.length) {
      this.rules.splice(index, 1);
    }
  }

  getRules(): SafetyRule[] {
    return [...this.rules];
  }
}
