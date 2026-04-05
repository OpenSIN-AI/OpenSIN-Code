import { describe, it, expect } from 'vitest';
import { loadConfig, generateId, truncate, escapeRegExp, maskSecrets } from '../utils/helpers.js';

describe('helpers', () => {
  describe('generateId', () => {
    it('should generate unique IDs', () => {
      const ids = new Set(Array.from({ length: 100 }, () => generateId()));
      expect(ids.size).toBe(100);
    });

    it('should generate prefixed IDs', () => {
      const id = generateId('test');
      expect(id.startsWith('test_')).toBe(true);
    });

    it('should generate unprefixed IDs', () => {
      const id = generateId();
      expect(id).toMatch(/^[a-z0-9]{8}$/);
    });
  });

  describe('loadConfig', () => {
    it('should load default config when no file exists', () => {
      const config = loadConfig('/tmp/nonexistent-config-path-12345');
      expect(config.model).toBe('openai/gpt-4o');
      expect(config.effort).toBe('medium');
      expect(config.permissions?.mode).toBe('ask');
    });

    it('should accept cwd parameter', () => {
      const config = loadConfig('/tmp');
      expect(config).toBeDefined();
    });
  });

  describe('truncate', () => {
    it('should not truncate short text', () => {
      expect(truncate('hello', 10)).toBe('hello');
    });

    it('should truncate long text', () => {
      const result = truncate('hello world', 5);
      expect(result).toContain('...');
      expect(result).not.toContain('hello world');
    });

    it('should handle exact length', () => {
      expect(truncate('hello', 5)).toBe('hello');
    });
  });

  describe('escapeRegExp', () => {
    it('should escape special regex characters', () => {
      const result = escapeRegExp('test.path+here?');
      expect(result).toContain('\\.');
      expect(result).toContain('\\+');
      expect(result).toContain('\\?');
    });

    it('should handle empty string', () => {
      expect(escapeRegExp('')).toBe('');
    });
  });

  describe('maskSecrets', () => {
    it('should mask OpenAI API keys', () => {
      const result = maskSecrets('key: sk-abcdefghijklmnopqrstuvwxyz');
      expect(result).toContain('[REDACTED]');
    });

    it('should mask GitHub tokens', () => {
      const result = maskSecrets('ghp_abcdefghijklmnopqrstuvwxyz1234567890');
      expect(result).toContain('[REDACTED]');
    });

    it('should mask AWS access keys', () => {
      const result = maskSecrets('AKIAIOSFODNN7EXAMPLE');
      expect(result).toContain('[REDACTED]');
    });

    it('should preserve text without secrets', () => {
      const result = maskSecrets('hello world');
      expect(result).toBe('hello world');
    });
  });
});
