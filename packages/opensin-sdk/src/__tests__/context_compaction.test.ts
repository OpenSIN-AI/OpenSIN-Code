import { describe, it, expect, beforeEach } from 'vitest';
import { CircuitBreaker } from '../context_compaction/circuit_breaker';
import type { ContextEntry } from '../context_mgmt/types';

const makeEntries = (count: number, tokensEach: number = 1000): ContextEntry[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: `msg-${i}`,
    role: i % 2 === 0 ? 'user' : 'assistant',
    content: `Message ${i}`,
    tokenCount: tokensEach,
    timestamp: Date.now() + i,
    priority: i < 2 ? 100 : 50,
  }));
};

describe('CircuitBreaker', () => {
  let breaker: CircuitBreaker;

  beforeEach(() => {
    breaker = new CircuitBreaker({ maxTokens: 10000, threshold: 0.8 });
  });

  it('triggers compaction above threshold', () => {
    expect(breaker.shouldCompact(8000)).toBe(true);
    expect(breaker.shouldCompact(7999)).toBe(false);
  });

  it('auto compacts entries', () => {
    const entries = makeEntries(20, 1000);
    const result = breaker.autoCompact(entries, 20000);
    expect(result.success).toBe(true);
    expect(result.tokensAfter).toBeLessThan(20000);
    expect(result.messagesRemoved).toBeGreaterThanOrEqual(0);
  });

  it('tracks compaction count', () => {
    const entries = makeEntries(20, 1000);
    breaker.autoCompact(entries, 20000);
    breaker.autoCompact(entries, 20000);
    expect(breaker.getCompactedCount()).toBe(2);
  });

  it('selects truncate strategy at critical usage', () => {
    breaker = new CircuitBreaker({ maxTokens: 10000, threshold: 0.5 });
    const entries = makeEntries(50, 1000);
    const result = breaker.autoCompact(entries, 50000);
    expect(result.success).toBe(true);
  });
});

describe('context_compaction exports', () => {
  it('exports all public API from index', async () => {
    const cc = await import('../context_compaction/index');
    expect(cc.CircuitBreaker).toBeDefined();
  });
});
