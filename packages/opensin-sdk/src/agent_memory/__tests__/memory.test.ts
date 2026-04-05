/**
 * OpenSIN Agent Memory — Comprehensive Tests
 *
 * Tests for MemoryManager, MemoryStore, CLI commands, and system prompt integration.
 * Branded as OpenSIN/sincode.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as os from 'node:os';
import { MemoryManager } from '../index.js';
import { createMemoryStore } from '../memory.js';
import { splitFrontmatter, buildFrontmatterDocument, atomicWriteFile } from '../frontmatter.js';
import { MEMORY_INSTRUCTIONS, getDefaultDescription } from '../letta.js';
import {
  handleMemoryList,
  handleMemoryAdd,
  handleMemoryEdit,
  handleMemoryDelete,
  handleMemorySearch,
  handleMemoryGet,
  showMemoryHelp,
} from '../cli_commands.js';
import type { MemoryScope } from '../types.js';

// ==========================================
// Test Helpers
// ==========================================

async function createTempDir(): Promise<string> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'opensin-memory-test-'));
  return dir;
}

function createTestManager(projectDir: string, memoryDir?: string, globalMemoryDir?: string) {
  return new MemoryManager({
    projectDirectory: projectDir,
    memoryDir,
    globalMemoryDir,
  });
}

// ==========================================
// Frontmatter Tests
// ==========================================

describe('frontmatter utilities', () => {
  it('splits markdown with frontmatter', () => {
    const input = '---\nlabel: test\n---\nHello world';
    const { frontmatterText, body } = splitFrontmatter(input);
    expect(frontmatterText).toBe('label: test');
    expect(body).toBe('Hello world');
  });

  it('returns undefined frontmatter for plain text', () => {
    const input = 'Just plain text';
    const { frontmatterText, body } = splitFrontmatter(input);
    expect(frontmatterText).toBeUndefined();
    expect(body).toBe('Just plain text');
  });

  it('builds frontmatter document', () => {
    const doc = buildFrontmatterDocument(
      { label: 'test', description: 'A test block' },
      'Content here',
    );
    expect(doc).toContain('---');
    expect(doc).toContain('"label"');
    expect(doc).toContain('Content here');
  });

  it('writes and reads file atomically', async () => {
    const dir = await createTempDir();
    const filePath = path.join(dir, 'test.md');
    await atomicWriteFile(filePath, 'atomic content');
    const content = await fs.readFile(filePath, 'utf-8');
    expect(content).toBe('atomic content');
    await fs.rm(dir, { recursive: true });
  });
});

// ==========================================
// Letta Instructions Tests
// ==========================================

describe('letta instructions', () => {
  it('exports memory instructions', () => {
    expect(MEMORY_INSTRUCTIONS).toContain('<memory_instructions>');
    expect(MEMORY_INSTRUCTIONS).toContain('<memory_editing>');
    expect(MEMORY_INSTRUCTIONS).toContain('<memory_tools>');
    expect(MEMORY_INSTRUCTIONS).toContain('<core_memory>');
    expect(MEMORY_INSTRUCTIONS).toContain('<memory_scopes>');
  });

  it('provides default descriptions for known blocks', () => {
    expect(getDefaultDescription('persona')).toContain('persona');
    expect(getDefaultDescription('human')).toContain('human');
    expect(getDefaultDescription('project')).toContain('project');
  });

  it('provides generic fallback for unknown blocks', () => {
    const desc = getDefaultDescription('unknown-block');
    expect(desc).toContain('Durable memory block');
  });
});

// ==========================================
// MemoryStore Tests
// ==========================================

describe('MemoryStore', () => {
  let tempDir: string;
  let globalDir: string;

  beforeEach(async () => {
    tempDir = await createTempDir();
    globalDir = await createTempDir();
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
    await fs.rm(globalDir, { recursive: true, force: true });
  });

  it('creates seed blocks on initialize', async () => {
    const store = createMemoryStore(tempDir, undefined, globalDir);
    await store.ensureSeed();

    const blocks = await store.listBlocks('all');
    expect(blocks.length).toBeGreaterThan(0);

    const labels = blocks.map(b => b.label);
    expect(labels).toContain('persona');
    expect(labels).toContain('human');
    expect(labels).toContain('project');
  });

  it('creates and reads a memory block', async () => {
    const store = createMemoryStore(tempDir, undefined, globalDir);
    await store.setBlock('project', 'test-block', 'Test content value');
    const block = await store.getBlock('project', 'test-block');

    expect(block.label).toBe('test-block');
    expect(block.scope).toBe('project');
    expect(block.value).toBe('Test content value');
  });

  it('updates an existing memory block', async () => {
    const store = createMemoryStore(tempDir, undefined, globalDir);
    await store.setBlock('project', 'test-block', 'Original content');
    await store.setBlock('project', 'test-block', 'Updated content');
    const block = await store.getBlock('project', 'test-block');

    expect(block.value).toBe('Updated content');
  });

  it('deletes a memory block', async () => {
    const store = createMemoryStore(tempDir, undefined, globalDir);
    await store.setBlock('project', 'to-delete', 'Delete me');
    await store.deleteBlock('project', 'to-delete');

    await expect(store.getBlock('project', 'to-delete')).rejects.toThrow('Memory block not found');
  });

  it('replaces text within a block', async () => {
    const store = createMemoryStore(tempDir, undefined, globalDir);
    await store.setBlock('project', 'replace-test', 'Hello world, hello universe');
    await store.replaceInBlock('project', 'replace-test', 'hello universe', 'goodbye world');
    const block = await store.getBlock('project', 'replace-test');

    expect(block.value).toBe('Hello world, goodbye world');
  });

  it('throws on replace when old text not found', async () => {
    const store = createMemoryStore(tempDir, undefined, globalDir);
    await store.setBlock('project', 'replace-test', 'Hello world');

    await expect(
      store.replaceInBlock('project', 'replace-test', 'nonexistent', 'replacement'),
    ).rejects.toThrow('Old text not found');
  });

  it('respects read-only flag', async () => {
    const store = createMemoryStore(tempDir, undefined, globalDir);
    await store.setBlock('project', 'readonly-block', 'Protected content', { readOnly: true });

    // Verify the block was written with read-only flag
    const block = await store.getBlock('project', 'readonly-block');
    expect(block.readOnly).toBe(true);

    // Attempting to overwrite should fail
    await expect(
      store.setBlock('project', 'readonly-block', 'Attempted change'),
    ).rejects.toThrow('read-only');

    // Attempting to delete should fail
    await expect(
      store.deleteBlock('project', 'readonly-block'),
    ).rejects.toThrow('read-only');
  });

  it('enforces character limit', async () => {
    const store = createMemoryStore(tempDir, undefined, globalDir);

    await expect(
      store.setBlock('project', 'limited', 'x'.repeat(101), { limit: 100 }),
    ).rejects.toThrow('Value too large');
  });

  it('validates label format', async () => {
    const store = createMemoryStore(tempDir, undefined, globalDir);

    await expect(
      store.setBlock('project', 'INVALID LABEL WITH SPACES', 'content'),
    ).rejects.toThrow('Invalid label');
  });

  it('lists blocks sorted by priority', async () => {
    const store = createMemoryStore(tempDir, undefined, globalDir);
    await store.ensureSeed();
    await store.setBlock('global', 'persona', 'I am a helpful assistant');
    await store.setBlock('global', 'human', 'User likes TypeScript');
    await store.setBlock('project', 'project', 'This is a TypeScript project');

    const blocks = await store.listBlocks('all');
    expect(blocks.length).toBeGreaterThanOrEqual(3);

    // persona should come first (priority 0)
    expect(blocks[0].label).toBe('persona');
    // human should come second (priority 1)
    expect(blocks[1].label).toBe('human');
  });

  it('filters by scope', async () => {
    const store = createMemoryStore(tempDir, undefined, globalDir);
    await store.setBlock('global', 'g-block', 'Global content');
    await store.setBlock('project', 'p-block', 'Project content');

    const globalBlocks = await store.listBlocks('global');
    const projectBlocks = await store.listBlocks('project');

    expect(globalBlocks.every(b => b.scope === 'global')).toBe(true);
    expect(projectBlocks.every(b => b.scope === 'project')).toBe(true);
  });

  it('creates .gitignore in memory directory', async () => {
    const store = createMemoryStore(tempDir, undefined, globalDir);
    await store.ensureSeed();

    const gitignorePath = path.join(tempDir, '.opensin', 'memory', '.gitignore');
    const gitignoreContent = await fs.readFile(gitignorePath, 'utf-8');
    expect(gitignoreContent).toContain('*');
  });
});

// ==========================================
// MemoryManager Tests
// ==========================================

describe('MemoryManager', () => {
  let tempDir: string;
  let globalDir: string;
  let manager: MemoryManager;

  beforeEach(async () => {
    tempDir = await createTempDir();
    globalDir = await createTempDir();
    manager = createTestManager(tempDir, undefined, globalDir);
    await manager.initialize();
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
    await fs.rm(globalDir, { recursive: true, force: true });
  });

  it('lists all blocks', async () => {
    await manager.set('project', 'test-a', 'Content A');
    await manager.set('project', 'test-b', 'Content B');

    const blocks = await manager.list('project');
    expect(blocks.length).toBeGreaterThanOrEqual(2);
  });

  it('gets a specific block', async () => {
    await manager.set('project', 'specific', 'Specific content');
    const block = await manager.get('project', 'specific');

    expect(block.label).toBe('specific');
    expect(block.value).toBe('Specific content');
  });

  it('sets a block with options', async () => {
    await manager.set('project', 'with-opts', 'Content', {
      description: 'Custom description',
      limit: 1000,
    });

    const block = await manager.get('project', 'with-opts');
    expect(block.description).toBe('Custom description');
    expect(block.limit).toBe(1000);
  });

  it('replaces text in a block', async () => {
    await manager.set('project', 'replaceable', 'Old text here');
    await manager.replace('project', 'replaceable', 'Old text', 'New text');

    const block = await manager.get('project', 'replaceable');
    expect(block.value).toBe('New text here');
  });

  it('deletes a block', async () => {
    await manager.set('project', 'deletable', 'Delete me');
    await manager.delete('project', 'deletable');

    await expect(manager.get('project', 'deletable')).rejects.toThrow();
  });

  it('searches across blocks', async () => {
    await manager.set('project', 'typescript-notes', 'We use TypeScript for all new code');
    await manager.set('project', 'javascript-notes', 'Legacy JavaScript code exists too');
    await manager.set('global', 'preferences', 'User prefers TypeScript over JavaScript');

    const results = await manager.search('TypeScript');
    expect(results.length).toBeGreaterThanOrEqual(2);

    // Value matches should come first
    const firstBlockLabel = results[0].block.label;
    expect(['typescript-notes', 'preferences']).toContain(firstBlockLabel);
  });

  it('search returns context around match', async () => {
    await manager.set('project', 'context-test', 'The quick brown fox jumps over the lazy dog');

    const results = await manager.search('brown fox');
    expect(results.length).toBe(1);
    expect(results[0].context).toContain('brown fox');
  });

  it('search returns empty when no matches', async () => {
    await manager.set('project', 'no-match', 'Nothing relevant here');

    const results = await manager.search('xyznonexistent');
    expect(results.length).toBe(0);
  });

  it('builds prompt section with blocks', async () => {
    await manager.set('project', 'prompt-test', 'Important project info');

    const section = await manager.buildPromptSection();
    expect(section).toContain('<agent_memory>');
    expect(section).toContain('</agent_memory>');
    expect(section).toContain('Important project info');
    expect(section).toContain('project:prompt-test');
  });

  it('returns empty prompt section when no blocks have content', async () => {
    const section = await manager.buildPromptSection();
    expect(typeof section).toBe('string');
  });

  it('formats block list for CLI', async () => {
    await manager.set('project', 'cli-test', 'CLI test content');

    const blocks = await manager.list('project');
    const formatted = MemoryManager.formatBlockList(blocks);

    expect(formatted).toContain('OpenSIN Agent Memory Blocks');
    expect(formatted).toContain('cli-test');
    expect(formatted).toContain('characters');
  });

  it('formats empty block list', () => {
    const formatted = MemoryManager.formatBlockList([]);
    expect(formatted).toBe('No memory blocks found.');
  });

  it('formats search results for CLI', () => {
    const results = [
      {
        block: {
          scope: 'project' as MemoryScope,
          label: 'test',
          description: 'Test block',
          limit: 5000,
          readOnly: false,
          value: 'Test value',
          filePath: '/tmp/test.md',
          lastModified: new Date(),
        },
        matchIndex: 0,
        context: 'Test value',
      },
    ];

    const formatted = MemoryManager.formatSearchResults(results, 'Test');
    expect(formatted).toContain('Search results');
    expect(formatted).toContain('project:test');
  });

  it('formats empty search results', () => {
    const formatted = MemoryManager.formatSearchResults([], 'query');
    expect(formatted).toContain('No memory blocks match');
  });
});

// ==========================================
// CLI Command Handler Tests
// ==========================================

describe('CLI command handlers', () => {
  let tempDir: string;
  let globalDir: string;
  let manager: MemoryManager;

  beforeEach(async () => {
    tempDir = await createTempDir();
    globalDir = await createTempDir();
    manager = createTestManager(tempDir, undefined, globalDir);
    await manager.initialize();
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
    await fs.rm(globalDir, { recursive: true, force: true });
  });

  describe('handleMemoryList', () => {
    it('lists all blocks', async () => {
      await manager.set('project', 'list-test', 'Test content');
      const result = await handleMemoryList(manager, '');
      expect(result).toContain('list-test');
    });

    it('filters by project scope', async () => {
      await manager.set('project', 'proj-only', 'Project content');
      const result = await handleMemoryList(manager, '--project');
      expect(result).toContain('proj-only');
    });

    it('filters by global scope', async () => {
      await manager.set('global', 'glob-only', 'Global content');
      const result = await handleMemoryList(manager, '--global');
      expect(result).toContain('glob-only');
    });
  });

  describe('handleMemoryAdd', () => {
    it('adds a new block', async () => {
      const result = await handleMemoryAdd(manager, 'project:new-block Added via CLI');
      expect(result).toContain('created');
      expect(result).toContain('new-block');

      const block = await manager.get('project', 'new-block');
      expect(block.value).toBe('Added via CLI');
    });

    it('returns usage on empty args', async () => {
      const result = await handleMemoryAdd(manager, '');
      expect(result).toContain('Usage');
    });

    it('returns error on invalid scope', async () => {
      const result = await handleMemoryAdd(manager, 'invalid:label content');
      expect(result).toContain('Invalid scope');
    });

    it('returns error on missing content', async () => {
      const result = await handleMemoryAdd(manager, 'project:label');
      expect(result).toContain('must provide content');
    });
  });

  describe('handleMemoryEdit', () => {
    it('edits an existing block', async () => {
      await manager.set('project', 'edit-target', 'Original');
      const result = await handleMemoryEdit(manager, 'project:edit-target Updated content');
      expect(result).toContain('updated');

      const block = await manager.get('project', 'edit-target');
      expect(block.value).toBe('Updated content');
    });

    it('returns usage on empty args', async () => {
      const result = await handleMemoryEdit(manager, '');
      expect(result).toContain('Usage');
    });
  });

  describe('handleMemoryDelete', () => {
    it('deletes an existing block', async () => {
      await manager.set('project', 'delete-target', 'Delete me');
      const result = await handleMemoryDelete(manager, 'project:delete-target');
      expect(result).toContain('deleted');

      await expect(manager.get('project', 'delete-target')).rejects.toThrow();
    });

    it('returns error for non-existent block', async () => {
      const result = await handleMemoryDelete(manager, 'project:nonexistent');
      expect(result.toLowerCase()).toMatch(/error|not found/);
    });

    it('returns usage on empty args', async () => {
      const result = await handleMemoryDelete(manager, '');
      expect(result).toContain('Usage');
    });
  });

  describe('handleMemorySearch', () => {
    it('finds matching blocks', async () => {
      await manager.set('project', 'search-target', 'TypeScript is great');
      const result = await handleMemorySearch(manager, 'TypeScript');
      expect(result).toContain('search-target');
      expect(result).toContain('TypeScript');
    });

    it('returns no match message', async () => {
      await manager.set('project', 'no-match', 'Nothing here');
      const result = await handleMemorySearch(manager, 'xyznonexistent');
      expect(result).toContain('No memory blocks match');
    });

    it('returns usage on empty query', async () => {
      const result = await handleMemorySearch(manager, '');
      expect(result).toContain('Usage');
    });
  });

  describe('handleMemoryGet', () => {
    it('gets full block content', async () => {
      await manager.set('project', 'get-target', 'Full content to retrieve');
      const result = await handleMemoryGet(manager, 'project:get-target');
      expect(result).toContain('Full content to retrieve');
    });

    it('returns error for non-existent block', async () => {
      const result = await handleMemoryGet(manager, 'project:nonexistent');
      expect(result.toLowerCase()).toMatch(/error|not found/);
    });

    it('returns usage on empty args', async () => {
      const result = await handleMemoryGet(manager, '');
      expect(result).toContain('Usage');
    });
  });

  describe('showMemoryHelp', () => {
    it('returns help text with all commands', () => {
      const help = showMemoryHelp();
      expect(help).toContain('/memory list');
      expect(help).toContain('/memory add');
      expect(help).toContain('/memory edit');
      expect(help).toContain('/memory delete');
      expect(help).toContain('/memory search');
      expect(help).toContain('/memory get');
      expect(help).toContain('/memory help');
    });
  });
});

// ==========================================
// Integration Tests
// ==========================================

describe('Memory integration', () => {
  let tempDir: string;
  let globalDir: string;
  let manager: MemoryManager;

  beforeEach(async () => {
    tempDir = await createTempDir();
    globalDir = await createTempDir();
    manager = createTestManager(tempDir, undefined, globalDir);
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
    await fs.rm(globalDir, { recursive: true, force: true });
  });

  it('full CRUD lifecycle', async () => {
    // Create
    await manager.set('project', 'lifecycle', 'Initial content');
    let block = await manager.get('project', 'lifecycle');
    expect(block.value).toBe('Initial content');

    // Read
    const blocks = await manager.list('project');
    expect(blocks.some(b => b.label === 'lifecycle')).toBe(true);

    // Update
    await manager.set('project', 'lifecycle', 'Updated content');
    block = await manager.get('project', 'lifecycle');
    expect(block.value).toBe('Updated content');

    // Search
    const results = await manager.search('Updated');
    expect(results.some(r => r.block.label === 'lifecycle')).toBe(true);

    // Delete
    await manager.delete('project', 'lifecycle');
    await expect(manager.get('project', 'lifecycle')).rejects.toThrow();
  });

  it('global and project scopes are isolated', async () => {
    await manager.set('global', 'shared', 'Global value');
    await manager.set('project', 'shared', 'Project value');

    const globalBlock = await manager.get('global', 'shared');
    const projectBlock = await manager.get('project', 'shared');

    expect(globalBlock.value).toBe('Global value');
    expect(projectBlock.value).toBe('Project value');
    expect(globalBlock.filePath).not.toBe(projectBlock.filePath);
  });

  it('memory persists across manager instances', async () => {
    // First manager creates content
    await manager.initialize();
    await manager.set('project', 'persistent', 'This should persist');

    // Second manager reads the same content
    const manager2 = createTestManager(tempDir, undefined, globalDir);
    const blocks = await manager2.list('project');
    expect(blocks.some(b => b.label === 'persistent')).toBe(true);

    const block = await manager2.get('project', 'persistent');
    expect(block.value).toBe('This should persist');
  });

  it('prompt section includes all block data', async () => {
    await manager.initialize();
    await manager.set('project', 'prompt-data', 'Critical project knowledge');

    const section = await manager.buildPromptSection();
    expect(section).toContain('Critical project knowledge');
    expect(section).toContain('project:prompt-data');
    expect(section).toContain('<agent_memory>');
    expect(section).toContain('</agent_memory>');
  });
});
