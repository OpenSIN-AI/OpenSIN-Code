/**
 * OpenSIN Envsitter Guard — Comprehensive Tests
 */

import { describe, it, expect } from 'vitest';
import { EnvGuard } from '../guard';
import { DEFAULT_ENVGUARD_CONFIG } from '../types';

describe('EnvGuard', () => {
  describe('constructor', () => {
    it('uses default config when no config provided', () => {
      const guard = new EnvGuard();
      expect(guard).toBeDefined();
    });

    it('accepts custom config overrides', () => {
      const guard = new EnvGuard({ maxKeysToList: 10 });
      expect(guard).toBeDefined();
    });
  });

  describe('isBlocked', () => {
    it('blocks .env file', () => {
      const guard = new EnvGuard();
      expect(guard.isBlocked('.env')).toBe(true);
    });

    it('blocks .env.local file', () => {
      const guard = new EnvGuard();
      expect(guard.isBlocked('.env.local')).toBe(true);
    });

    it('blocks .env.production file', () => {
      const guard = new EnvGuard();
      expect(guard.isBlocked('.env.production')).toBe(true);
    });

    it('blocks .env.development file', () => {
      const guard = new EnvGuard();
      expect(guard.isBlocked('.env.development')).toBe(true);
    });

    it('blocks .env.* pattern files', () => {
      const guard = new EnvGuard();
      expect(guard.isBlocked('.env.custom')).toBe(true);
      expect(guard.isBlocked('.env.test')).toBe(true);
    });

    it('allows non-env files like config.json', () => {
      const guard = new EnvGuard();
      expect(guard.isBlocked('config.json')).toBe(false);
    });

    it('allows README.md', () => {
      const guard = new EnvGuard();
      expect(guard.isBlocked('README.md')).toBe(false);
    });

    it('allows package.json', () => {
      const guard = new EnvGuard();
      expect(guard.isBlocked('package.json')).toBe(false);
    });
  });

  describe('validateRead', () => {
    it('blocks reading .env files', () => {
      const guard = new EnvGuard();
      const result = guard.validateRead('.env');
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('blocked');
    });

    it('allows reading non-env files', () => {
      const guard = new EnvGuard();
      const result = guard.validateRead('config.json');
      expect(result.allowed).toBe(true);
    });
  });

  describe('validateWrite', () => {
    it('blocks writing to .env files', () => {
      const guard = new EnvGuard();
      const result = guard.validateWrite('.env.local');
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('blocked');
    });

    it('allows writing to non-env files', () => {
      const guard = new EnvGuard();
      const result = guard.validateWrite('output.txt');
      expect(result.allowed).toBe(true);
    });
  });

  describe('listKeys', () => {
    it('returns empty array when allowKeyInspection is false', () => {
      const guard = new EnvGuard({ allowKeyInspection: false });
      const keys = guard.listKeys('/tmp');
      expect(keys).toEqual([]);
    });

    it('returns fingerprinted keys when enabled for existing env files', () => {
      const guard = new EnvGuard({ allowKeyInspection: true, maxKeysToList: 50 });
      const keys = guard.listKeys('/tmp');
      expect(Array.isArray(keys)).toBe(true);
    });

    it('respects maxKeysToList limit', () => {
      const guard = new EnvGuard({ allowKeyInspection: true, maxKeysToList: 5 });
      const keys = guard.listKeys('/tmp');
      expect(keys.length).toBeLessThanOrEqual(5);
    });
  });
});
