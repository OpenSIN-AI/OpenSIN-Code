import { describe, it, expect } from 'vitest';
import { ContextPruningPlugin, pruneContext, countTokens, countContextTokens } from '../index.js';
import type { ContextMessage } from '../types.js';

const makeMessages = (count: number): ContextMessage[] => {
  const msgs: ContextMessage[] = [];
  for (let i = 0; i < count; i++) {
    msgs.push({ role: 'assistant', content: 'Tool output ' + i + ': ' + 'word '.repeat(500) });
  }
  return msgs;
};

describe('countTokens', () => {
  it('counts empty string as 0', () => { expect(countTokens('')).toBe(0); });
  it('counts simple text', () => { expect(countTokens('hello world')).toBeGreaterThan(0); });
  it('scales with length', () => {
    expect(countTokens('a b c d e')).toBeLessThan(countTokens('a b c d e f g h i j'));
  });
});

describe('countContextTokens', () => {
  it('counts multi-message context', () => {
    const msgs: ContextMessage[] = [
      { role: 'system', content: 'You are a helper' },
      { role: 'user', content: 'Hello' },
    ];
    const result = countContextTokens(msgs);
    expect(result.total).toBeGreaterThan(0);
    expect(result.byRole['system']).toBeGreaterThan(0);
    expect(result.byRole['user']).toBeGreaterThan(0);
  });
});

describe('pruneContext', () => {
  it('returns all messages when under limit', () => {
    const msgs: ContextMessage[] = [
      { role: 'user', content: 'Hello' },
      { role: 'assistant', content: 'Hi there' },
    ];
    const result = pruneContext(msgs, { maxTokens: 10000 });
    expect(result.prunedCount).toBe(0);
    expect(result.messages).toHaveLength(2);
  });

  it('prunes when over limit', () => {
    const msgs = makeMessages(20);
    msgs.unshift({ role: 'system', content: 'You are a helper' });
    const result = pruneContext(msgs, { maxTokens: 2000, keepLastN: 1, keepSystemPrompt: true });
    expect(result.prunedCount).toBeGreaterThan(0);
    expect(result.tokensRemaining).toBeLessThan(result.tokensRemoved + result.tokensRemaining);
  });

  it('keeps system prompt when configured', () => {
    const msgs: ContextMessage[] = [
      { role: 'system', content: 'System prompt' },
      ...makeMessages(10),
    ];
    const result = pruneContext(msgs, { maxTokens: 500, keepSystemPrompt: true, keepLastN: 1 });
    const hasSystem = result.messages.some(m => m.role === 'system');
    expect(hasSystem).toBe(true);
  });

  it('returns reason string', () => {
    const result = pruneContext(makeMessages(10), { maxTokens: 100 });
    expect(result.reason).toContain('Pruned');
  });
});

describe('ContextPruningPlugin', () => {
  it('has correct manifest', () => {
    const plugin = new ContextPruningPlugin();
    const manifest = plugin.getManifest();
    expect(manifest.id).toBe('context-pruning');
    expect(manifest.name).toBe('Context Pruning Plugin');
    expect(manifest.version).toBe('0.1.0');
  });

  it('detects when pruning is needed', () => {
    const plugin = new ContextPruningPlugin({ maxTokens: 100 });
    expect(plugin.shouldPrune(makeMessages(10))).toBe(true);
    expect(plugin.shouldPrune([{ role: 'user', content: 'hi' }])).toBe(false);
  });

  it('prunes messages', () => {
    const plugin = new ContextPruningPlugin({ maxTokens: 200, keepLastN: 2 });
    const result = plugin.prune(makeMessages(10));
    expect(result.prunedCount).toBeGreaterThan(0);
  });

  it('allows config update', () => {
    const plugin = new ContextPruningPlugin();
    plugin.setConfig({ maxTokens: 500 });
    expect(plugin.getConfig().maxTokens).toBe(500);
  });
});
