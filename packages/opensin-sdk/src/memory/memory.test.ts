/**
 * Tests for OpenSIN Agent Memory — MemoryStore CRUD operations.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';
import { createMemoryStore, type MemoryStore } from './memory.js';

describe('MemoryStore', () => {
  let testDir: string;
  let store: MemoryStore;

  beforeEach(async () => {
    testDir = path.join(os.tmpdir(), `opensin-memory-test-${Date.now()}`);
    await fs.mkdir(testDir, { recursive: true });
    store = createMemoryStore(testDir);
  });

  afterEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
  });

  describe('ensureSeed', () => {
    it('creates seed memory blocks', async () => {
      await store.ensureSeed();
      const blocks = await store.listBlocks('project');
      expect(blocks.length).toBeGreaterThan(0);
      // Should have at least the canonical project blocks
      const labels = blocks.map((b) => b.label);
      expect(labels).toContain('project');
    });

    it('is idempotent — does not overwrite existing blocks', async () => {
      await store.ensureSeed();
      await store.setBlock('project', 'project', 'existing content');
      await store.ensureSeed();
      const block = await store.getBlock('project', 'project');
      expect(block.value).toBe('existing content');
    });
  });

  describe('listBlocks', () => {
    it('returns empty project blocks before seeding', async () => {
      const blocks = await store.listBlocks('project');
      expect(blocks).toEqual([]);
    });

    it('lists blocks sorted by priority', async () => {
      await store.ensureSeed();
      const blocks = await store.listBlocks('project');
      expect(blocks.length).toBeGreaterThan(1);
      // project should come first among project-scoped blocks
      expect(blocks[0].label).toBe('project');
    });

    it('filters by scope', async () => {
      await store.ensureSeed();
      const projectBlocks = await store.listBlocks('project');
      expect(projectBlocks.every((b) => b.scope === 'project')).toBe(true);
    });
  });

  describe('getBlock', () => {
    it('throws when block not found', async () => {
      await expect(store.getBlock('project', 'nonexistent')).rejects.toThrow(
        'Memory block not found',
      );
    });

    it('returns the correct block', async () => {
      await store.setBlock('project', 'test-block', 'hello world', {
        description: 'A test block',
      });
      const block = await store.getBlock('project', 'test-block');
      expect(block.label).toBe('test-block');
      expect(block.value).toBe('hello world');
      expect(block.description).toBe('A test block');
      expect(block.scope).toBe('project');
    });
  });

  describe('setBlock', () => {
    it('creates a new block', async () => {
      await store.setBlock('project', 'new-block', 'content here', {
        description: 'New block description',
        limit: 3000,
      });
      const block = await store.getBlock('project', 'new-block');
      expect(block.value).toBe('content here');
      expect(block.description).toBe('New block description');
      expect(block.limit).toBe(3000);
    });

    it('updates an existing block', async () => {
      await store.setBlock('project', 'upd-block', 'v1');
      await store.setBlock('project', 'upd-block', 'v2');
      const block = await store.getBlock('project', 'upd-block');
      expect(block.value).toBe('v2');
    });

    it('throws when value exceeds limit', async () => {
      await expect(
        store.setBlock('project', 'big-block', 'x'.repeat(6000), { limit: 5000 }),
      ).rejects.toThrow('Value too large');
    });
  });

  describe('replaceInBlock', () => {
    it('replaces text within a block', async () => {
      await store.setBlock('project', 'replace-test', 'hello world');
      await store.replaceInBlock('project', 'replace-test', 'world', 'opensin');
      const block = await store.getBlock('project', 'replace-test');
      expect(block.value).toBe('hello opensin');
    });

    it('throws when old text not found', async () => {
      await store.setBlock('project', 'no-match', 'hello world');
      await expect(
        store.replaceInBlock('project', 'no-match', 'missing', 'foo'),
      ).rejects.toThrow('Old text not found');
    });

    it('throws when replacement exceeds limit', async () => {
      await store.setBlock('project', 'limit-test', 'short', { limit: 10 });
      await expect(
        store.replaceInBlock('project', 'limit-test', 'short', 'x'.repeat(15)),
      ).rejects.toThrow('Value too large');
    });
  });

  describe('deleteBlock', () => {
    it('deletes an existing block', async () => {
      await store.setBlock('project', 'to-delete', 'content');
      await store.deleteBlock('project', 'to-delete');
      await expect(store.getBlock('project', 'to-delete')).rejects.toThrow(
        'Memory block not found',
      );
    });

    it('throws when block not found', async () => {
      await expect(store.deleteBlock('project', 'nonexistent')).rejects.toThrow(
        'Memory block not found',
      );
    });
  });

  describe('searchBlocks', () => {
    it('finds blocks matching query', async () => {
      await store.setBlock('project', 'search-test', 'this contains opensin magic');
      const results = await store.searchBlocks('opensin');
      expect(results.length).toBeGreaterThan(0);
      // Should contain our block (may also contain global blocks)
      const found = results.find((b) => b.label === 'search-test');
      expect(found).toBeDefined();
    });

    it('returns empty when no match', async () => {
      await store.setBlock('project', 'no-match-search', 'nothing here');
      const results = await store.searchBlocks('xyznonexistent123');
      expect(results).toEqual([]);
    });
  });

  describe('label validation', () => {
    it('rejects invalid labels', async () => {
      await expect(store.setBlock('project', '', 'content')).rejects.toThrow('Invalid label');
      await expect(store.setBlock('project', 'has spaces', 'content')).rejects.toThrow(
        'Invalid label',
      );
      await expect(store.setBlock('project', 'has/slash', 'content')).rejects.toThrow(
        'Invalid label',
      );
    });

    it('accepts valid labels', async () => {
      await store.setBlock('project', 'valid-label', 'content');
      await store.setBlock('project', 'valid_label_2', 'content');
      await store.setBlock('project', 'a', 'content');
      await store.setBlock('project', 'my-block-123', 'content');
    });
  });
});
