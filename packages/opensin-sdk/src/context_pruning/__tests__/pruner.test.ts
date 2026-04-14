/**
 * OpenSIN Context Pruner — Comprehensive Tests
 */

import { describe, it, expect } from 'vitest';
import { ContextPruner } from '../pruner';
import { DEFAULT_PRUNING_POLICY } from '../types';
import type { ContextMessage } from '../pruner';

describe('ContextPruner', () => {
  describe('constructor', () => {
    it('uses default policy when no config provided', () => {
      const pruner = new ContextPruner();
      const result = pruner.prune([]);
      expect(result).toEqual([]);
    });

    it('accepts custom policy overrides', () => {
      const pruner = new ContextPruner({ maxToolOutputLines: 10 });
      expect(pruner).toBeDefined();
    });
  });

  describe('prune', () => {
    it('keeps system messages always', () => {
      const pruner = new ContextPruner();
      const messages: ContextMessage[] = [{ role: 'system', content: 'You are helpful' }];
      const result = pruner.prune(messages);
      expect(result).toHaveLength(1);
      expect(result[0].role).toBe('system');
    });

    it('keeps user messages always', () => {
      const pruner = new ContextPruner();
      const messages: ContextMessage[] = [{ role: 'user', content: 'Hello' }];
      const result = pruner.prune(messages);
      expect(result).toHaveLength(1);
      expect(result[0].role).toBe('user');
    });

    it('keeps recent assistant messages within maxMessageAge', () => {
      const pruner = new ContextPruner({ maxMessageAge: 5 });
      const messages: ContextMessage[] = [
        { role: 'system', content: 'sys' },
        { role: 'assistant', content: 'recent' },
        { role: 'assistant', content: 'also recent' },
      ];
      const result = pruner.prune(messages);
      expect(result).toHaveLength(3);
    });

    it('truncates tool results exceeding maxToolOutputLines', () => {
      const pruner = new ContextPruner({ maxToolOutputLines: 5, maxMessageAge: 2 });
      const longContent = Array.from({ length: 50 }, (_, i) => `line ${i}`).join('\n');
      // age = messages.length - i. For tool to be old: need age > 2.
      // Put tool early, then many messages after it.
      const messages: ContextMessage[] = [
        { role: 'system', content: 'sys' },
        { role: 'assistant', content: longContent, toolCallId: 'tool_1' },
        { role: 'assistant', content: 'a1' },
        { role: 'assistant', content: 'a2' },
        { role: 'assistant', content: 'a3' },
        { role: 'assistant', content: 'a4' },
        { role: 'assistant', content: 'a5' },
        { role: 'assistant', content: 'a6' },
        { role: 'assistant', content: 'recent1' },
        { role: 'assistant', content: 'recent2' },
      ];
      // 10 messages. Tool at i=1: age=9 > 2, has toolCallId, 20 lines > 5 → truncated
      const result = pruner.prune(messages);
      // Find the truncated message
      const truncated = result.find(m => m.content.includes('[Pruned:'));
      expect(truncated).toBeDefined();
      expect(truncated!.content).toContain('line 0');
      expect(truncated!.content).toContain('line 49');
    });

    it('returns unchanged messages when pruneStaleOutputs is false', () => {
      const pruner = new ContextPruner({ pruneStaleOutputs: false });
      const messages: ContextMessage[] = [
        { role: 'system', content: 'sys' },
        { role: 'assistant', content: 'keep me' },
      ];
      const result = pruner.prune(messages);
      expect(result).toHaveLength(2);
      expect(result).toEqual(messages);
    });

    it('handles empty messages array', () => {
      const pruner = new ContextPruner();
      const result = pruner.prune([]);
      expect(result).toHaveLength(0);
    });

    it('handles single message', () => {
      const pruner = new ContextPruner();
      const messages: ContextMessage[] = [{ role: 'user', content: 'single' }];
      const result = pruner.prune(messages);
      expect(result).toHaveLength(1);
    });

    it('handles all same role messages', () => {
      const pruner = new ContextPruner();
      const messages: ContextMessage[] = [
        { role: 'user', content: 'msg1' },
        { role: 'user', content: 'msg2' },
        { role: 'user', content: 'msg3' },
      ];
      const result = pruner.prune(messages);
      expect(result).toHaveLength(3);
    });
  });

  describe('getStats', () => {
    it('returns copy of stats object', () => {
      const pruner = new ContextPruner();
      const stats1 = pruner.getStats();
      const stats2 = pruner.getStats();
      expect(stats1).toEqual(stats2);
      expect(stats1).not.toBe(stats2);
    });

    it('tracks messagesPruned and tokensSaved after pruning', () => {
      const pruner = new ContextPruner({ maxToolOutputLines: 5, maxMessageAge: 2 });
      const longContent = Array.from({ length: 50 }, (_, i) => `line ${i}`).join('\n');
      // Tool at i=0 in 10 messages: age=10 > 2 → truncated
      const messages: ContextMessage[] = [
        { role: 'assistant', content: longContent, toolCallId: 'tool_1' },
        { role: 'assistant', content: 'a1' },
        { role: 'assistant', content: 'a2' },
        { role: 'assistant', content: 'a3' },
        { role: 'assistant', content: 'a4' },
        { role: 'assistant', content: 'a5' },
        { role: 'assistant', content: 'a6' },
        { role: 'assistant', content: 'a7' },
        { role: 'assistant', content: 'recent1' },
        { role: 'assistant', content: 'recent2' },
      ];
      pruner.prune(messages);
      const stats = pruner.getStats();
      expect(stats.messagesPruned).toBe(1);
      expect(stats.tokensSaved).toBeGreaterThan(0);
    });
  });

  describe('resetStats', () => {
    it('zeros out counters', () => {
      const pruner = new ContextPruner({ maxToolOutputLines: 5, maxMessageAge: 2 });
      const longContent = Array.from({ length: 50 }, (_, i) => `line ${i}`).join('\n');
      const messages: ContextMessage[] = [
        { role: 'assistant', content: 'msg1' },
        { role: 'assistant', content: 'msg2' },
        { role: 'assistant', content: 'msg3' },
        { role: 'assistant', content: 'msg4' },
        { role: 'assistant', content: 'msg5' },
        { role: 'assistant', content: longContent, toolCallId: 'tool_1' },
        { role: 'assistant', content: 'msg6' },
        { role: 'assistant', content: 'msg7' },
      ];
      pruner.prune(messages);
      pruner.resetStats();
      const stats = pruner.getStats();
      expect(stats.messagesPruned).toBe(0);
      expect(stats.tokensSaved).toBe(0);
    });
  });
});
