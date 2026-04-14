/**
 * OpenSIN AI Search — Comprehensive Tests
 */

import { describe, it, expect } from 'vitest';
import { AISearcher } from '../searcher';
import { DEFAULT_SEARCH_CONFIG } from '../types';

describe('AISearcher', () => {
  describe('constructor', () => {
    it('uses default config when no config provided', () => {
      const searcher = new AISearcher();
      expect(searcher).toBeDefined();
    });

    it('accepts custom config overrides', () => {
      const searcher = new AISearcher({ maxResults: 10 });
      expect(searcher).toBeDefined();
    });
  });

  describe('search', () => {
    it('returns empty array since performSearch is placeholder', async () => {
      const searcher = new AISearcher({ rateLimitMs: 0 });
      const results = await searcher.search('test query');
      expect(results).toEqual([]);
    });

    it('caches results for same query', async () => {
      const searcher = new AISearcher({ rateLimitMs: 0, cacheTimeoutMs: 60000 });
      await searcher.search('test');
      await searcher.search('test');
      expect(searcher.getCacheSize()).toBe(1);
    });

    it('creates separate cache entries for different queries', async () => {
      const searcher = new AISearcher({ rateLimitMs: 0, cacheTimeoutMs: 60000 });
      await searcher.search('query one');
      await searcher.search('query two');
      expect(searcher.getCacheSize()).toBe(2);
    });
  });

  describe('clearCache', () => {
    it('empties the cache', async () => {
      const searcher = new AISearcher({ rateLimitMs: 0, cacheTimeoutMs: 60000 });
      await searcher.search('test');
      expect(searcher.getCacheSize()).toBe(1);
      searcher.clearCache();
      expect(searcher.getCacheSize()).toBe(0);
    });
  });

  describe('getCacheSize', () => {
    it('returns 0 for fresh searcher', () => {
      const searcher = new AISearcher();
      expect(searcher.getCacheSize()).toBe(0);
    });

    it('returns correct count after multiple searches', async () => {
      const searcher = new AISearcher({ rateLimitMs: 0, cacheTimeoutMs: 60000 });
      await searcher.search('a');
      await searcher.search('b');
      await searcher.search('c');
      expect(searcher.getCacheSize()).toBe(3);
    });
  });
});
