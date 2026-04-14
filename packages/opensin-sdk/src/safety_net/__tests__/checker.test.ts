/**
 * OpenSIN Safety Net — Comprehensive Tests
 */

import { describe, it, expect } from 'vitest';
import { SafetyChecker } from '../checker';
import { DEFAULT_SAFETY_RULES } from '../types';
import type { SafetyRule } from '../types';

describe('SafetyChecker', () => {
  describe('constructor', () => {
    it('uses default rules when no rules provided', () => {
      const checker = new SafetyChecker();
      expect(checker).toBeDefined();
    });

    it('accepts custom rules', () => {
      const checker = new SafetyChecker([]);
      expect(checker).toBeDefined();
    });
  });

  describe('check', () => {
    it('blocks rm -rf /', () => {
      const checker = new SafetyChecker();
      const result = checker.check('rm -rf /');
      expect(result.allowed).toBe(false);
      expect(result.severity).toBe('block');
    });

    it('blocks rm -rf /*', () => {
      const checker = new SafetyChecker();
      const result = checker.check('rm -rf /*');
      expect(result.allowed).toBe(false);
      expect(result.severity).toBe('block');
    });

    it('blocks fork bomb pattern', () => {
      const checker = new SafetyChecker();
      const result = checker.check(':(){ :|:& };:');
      expect(result.allowed).toBe(false);
      expect(result.severity).toBe('block');
    });

    it('warns on git push --force', () => {
      const checker = new SafetyChecker();
      const result = checker.check('git push --force origin main');
      expect(result.allowed).toBe(true);
      expect(result.severity).toBe('warning');
    });

    it('warns on git reset --hard', () => {
      const checker = new SafetyChecker();
      const result = checker.check('git reset --hard HEAD');
      expect(result.allowed).toBe(true);
      expect(result.severity).toBe('warning');
    });

    it('warns on chmod -R 777', () => {
      const checker = new SafetyChecker();
      const result = checker.check('chmod -R 777 /some/path');
      expect(result.allowed).toBe(true);
      expect(result.severity).toBe('warning');
    });

    it('allows safe commands like ls', () => {
      const checker = new SafetyChecker();
      const result = checker.check('ls -la');
      expect(result.allowed).toBe(true);
      expect(result.severity).toBeUndefined();
    });

    it('allows safe commands like cat', () => {
      const checker = new SafetyChecker();
      const result = checker.check('cat file.txt');
      expect(result.allowed).toBe(true);
      expect(result.severity).toBeUndefined();
    });

    it('allows safe commands like git status', () => {
      const checker = new SafetyChecker();
      const result = checker.check('git status');
      expect(result.allowed).toBe(true);
      expect(result.severity).toBeUndefined();
    });

    it('allows safe commands like npm test', () => {
      const checker = new SafetyChecker();
      const result = checker.check('npm test');
      expect(result.allowed).toBe(true);
      expect(result.severity).toBeUndefined();
    });
  });

  describe('addRule', () => {
    it('adds new rule to the list', () => {
      const checker = new SafetyChecker();
      const initialCount = checker.getRules().length;
      checker.addRule({ pattern: /dangerous/, severity: 'block', message: 'Dangerous' });
      expect(checker.getRules().length).toBe(initialCount + 1);
    });
  });

  describe('removeRule', () => {
    it('removes rule by index', () => {
      const checker = new SafetyChecker();
      const initialCount = checker.getRules().length;
      checker.removeRule(0);
      expect(checker.getRules().length).toBe(initialCount - 1);
    });

    it('does nothing for invalid index', () => {
      const checker = new SafetyChecker();
      const initialCount = checker.getRules().length;
      checker.removeRule(999);
      expect(checker.getRules().length).toBe(initialCount);
    });

    it('does nothing for negative index', () => {
      const checker = new SafetyChecker();
      const initialCount = checker.getRules().length;
      checker.removeRule(-1);
      expect(checker.getRules().length).toBe(initialCount);
    });
  });

  describe('getRules', () => {
    it('returns copy of rules array', () => {
      const checker = new SafetyChecker();
      const rules1 = checker.getRules();
      const rules2 = checker.getRules();
      expect(rules1).toEqual(rules2);
      expect(rules1).not.toBe(rules2);
    });
  });

  describe('edge cases', () => {
    it('allows empty command', () => {
      const checker = new SafetyChecker();
      const result = checker.check('');
      expect(result.allowed).toBe(true);
    });

    it('does not match partial dangerous patterns', () => {
      const checker = new SafetyChecker();
      const result = checker.check('echo rm -rf /');
      expect(result.allowed).toBe(true);
    });
  });
});
