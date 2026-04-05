/**
 * OpenSIN Handoff Manager — Comprehensive Tests
 */

import { describe, it, expect } from 'vitest';
import { HandoffManager } from '../manager.ts';
import { DEFAULT_HANDOFF_CONFIG } from '../types.ts';

describe('HandoffManager', () => {
  describe('constructor', () => {
    it('uses default config when no config provided', () => {
      const manager = new HandoffManager();
      expect(manager).toBeDefined();
    });

    it('accepts custom config overrides', () => {
      const manager = new HandoffManager({ maxSummaryLength: 500 });
      expect(manager).toBeDefined();
    });
  });

  describe('generateHandoff', () => {
    it('creates formatted markdown with session ID and summary', () => {
      const manager = new HandoffManager();
      const result = manager.generateHandoff({
        sessionId: 'test-123',
        summary: 'Testing handoff',
      });
      expect(result).toContain('Session Handoff');
      expect(result).toContain('test-123');
      expect(result).toContain('Testing handoff');
    });

    it('includes completed tasks when provided', () => {
      const manager = new HandoffManager();
      const result = manager.generateHandoff({
        sessionId: 's1',
        summary: 'test',
        completedTasks: ['task1', 'task2'],
      });
      expect(result).toContain('## Completed');
      expect(result).toContain('task1');
      expect(result).toContain('task2');
    });

    it('includes pending tasks when provided', () => {
      const manager = new HandoffManager();
      const result = manager.generateHandoff({
        sessionId: 's1',
        summary: 'test',
        pendingTasks: ['pending1'],
      });
      expect(result).toContain('## Pending');
      expect(result).toContain('pending1');
    });

    it('includes key decisions when includeDecisions is true', () => {
      const manager = new HandoffManager({ includeDecisions: true });
      const result = manager.generateHandoff({
        sessionId: 's1',
        summary: 'test',
        keyDecisions: ['decision1'],
      });
      expect(result).toContain('## Key Decisions');
      expect(result).toContain('decision1');
    });

    it('excludes decisions when includeDecisions is false', () => {
      const manager = new HandoffManager({ includeDecisions: false });
      const result = manager.generateHandoff({
        sessionId: 's1',
        summary: 'test',
        keyDecisions: ['decision1'],
      });
      expect(result).not.toContain('## Key Decisions');
    });

    it('includes file changes when includeFileChanges is true', () => {
      const manager = new HandoffManager({ includeFileChanges: true });
      const result = manager.generateHandoff({
        sessionId: 's1',
        summary: 'test',
        fileChanges: ['file1.ts', 'file2.ts'],
      });
      expect(result).toContain('## File Changes');
      expect(result).toContain('file1.ts');
    });

    it('excludes file changes when includeFileChanges is false', () => {
      const manager = new HandoffManager({ includeFileChanges: false });
      const result = manager.generateHandoff({
        sessionId: 's1',
        summary: 'test',
        fileChanges: ['file1.ts'],
      });
      expect(result).not.toContain('## File Changes');
    });

    it('truncates to maxSummaryLength', () => {
      const manager = new HandoffManager({ maxSummaryLength: 50 });
      const result = manager.generateHandoff({
        sessionId: 's1',
        summary: 'This is a very long summary that should be truncated because it exceeds the max length limit',
      });
      expect(result.length).toBeLessThanOrEqual(50);
    });

    it('handles empty context gracefully', () => {
      const manager = new HandoffManager();
      const result = manager.generateHandoff({});
      expect(result).toContain('Session Handoff');
      expect(result).toContain('unknown');
    });

    it('handles all empty arrays', () => {
      const manager = new HandoffManager();
      const result = manager.generateHandoff({
        sessionId: 's1',
        summary: 'test',
        completedTasks: [],
        pendingTasks: [],
        keyDecisions: [],
        fileChanges: [],
      });
      expect(result).not.toContain('## Completed');
      expect(result).not.toContain('## Pending');
    });
  });

  describe('generateContinuationPrompt', () => {
    it('wraps handoff with continuation prefix', () => {
      const manager = new HandoffManager();
      const result = manager.generateContinuationPrompt({
        sessionId: 's1',
        summary: 'test',
      });
      expect(result).toContain('You are continuing a previous session');
      expect(result).toContain('Session Handoff');
    });
  });
});
