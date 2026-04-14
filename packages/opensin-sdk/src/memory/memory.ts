/**
 * OpenSIN Agent Memory — Persistent Letta-style memory blocks.
 *
 * Provides CRUD operations for memory blocks stored as markdown files
 * with YAML frontmatter in .opensin/memory/ directories.
 *
 * Memory block types:
 * - core identity (persona)
 * - task context
 * - user preferences
 * - project knowledge
 */

import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';
import { atomicWriteFile, buildFrontmatterDocument, splitFrontmatter } from './frontmatter';
import { getDefaultDescription } from './letta';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type MemoryScope = 'global' | 'project';

export interface MemoryBlock {
  scope: MemoryScope;
  label: string;
  description: string;
  limit: number;
  readOnly: boolean;
  value: string;
  filePath: string;
  lastModified: Date;
}

export interface MemoryStore {
  ensureSeed(): Promise<void>;
  listBlocks(scope: MemoryScope | 'all'): Promise<MemoryBlock[]>;
  getBlock(scope: MemoryScope, label: string): Promise<MemoryBlock>;
  setBlock(
    scope: MemoryScope,
    label: string,
    value: string,
    opts?: { description?: string; limit?: number },
  ): Promise<void>;
  replaceInBlock(scope: MemoryScope, label: string, oldText: string, newText: string): Promise<void>;
  deleteBlock(scope: MemoryScope, label: string): Promise<void>;
  searchBlocks(query: string): Promise<MemoryBlock[]>;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DEFAULT_LIMIT = 5000;

const SEED_BLOCKS: Array<{ scope: MemoryScope; label: string; description: string }> = [
  { scope: 'global', label: 'persona', description: getDefaultDescription('persona') },
  { scope: 'global', label: 'human', description: getDefaultDescription('human') },
  { scope: 'project', label: 'project', description: getDefaultDescription('project') },
  { scope: 'project', label: 'task-context', description: getDefaultDescription('task-context') },
  { scope: 'project', label: 'user-preferences', description: getDefaultDescription('user-preferences') },
  { scope: 'project', label: 'project-knowledge', description: getDefaultDescription('project-knowledge') },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function scopeDir(projectDirectory: string, scope: MemoryScope): string {
  return scope === 'global'
    ? path.join(os.homedir(), '.opensin', 'memory')
    : path.join(projectDirectory, '.opensin', 'memory');
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

function validateLabel(label: string): string {
  const trimmed = label.trim();
  if (!/^[a-z0-9][a-z0-9-_]{0,60}$/i.test(trimmed)) {
    throw new Error(
      `Invalid label "${label}". Use letters/numbers/dash/underscore (1-61 chars, must start with letter/number).`,
    );
  }
  return trimmed;
}

// ---------------------------------------------------------------------------
// File I/O
// ---------------------------------------------------------------------------

async function readBlockFile(
  scope: MemoryScope,
  filePath: string,
): Promise<MemoryBlock> {
  const [raw, stats] = await Promise.all([
    fs.readFile(filePath, 'utf-8'),
    fs.stat(filePath),
  ]);
  const { frontmatterText, body } = splitFrontmatter(raw);

  // Parse frontmatter
  const fm: Record<string, unknown> = {};
  if (frontmatterText) {
    const yaml = await import('yaml');
    const parsed = yaml.parse(frontmatterText);
    if (parsed && typeof parsed === 'object') {
      Object.assign(fm, parsed);
    }
  }

  const label = ((fm.label as string) ?? path.basename(filePath, path.extname(filePath))).trim();
  const desc = (fm.description as string);
  const description = (desc && desc.trim().length > 0
    ? desc
    : getDefaultDescription(label)).trim();
  const limit = (fm.limit as number) ?? DEFAULT_LIMIT;
  const readOnly = (fm.read_only as boolean ?? false) === true;

  return {
    scope,
    label,
    description,
    limit,
    readOnly,
    value: body.trim(),
    filePath,
    lastModified: stats.mtime,
  };
}

async function writeBlockFile(
  filePath: string,
  block: Pick<MemoryBlock, 'label' | 'description' | 'limit' | 'readOnly' | 'value'>,
): Promise<void> {
  const content = buildFrontmatterDocument(
    {
      label: block.label,
      description: block.description,
      limit: block.limit,
      read_only: block.readOnly,
    },
    block.value,
  );

  await atomicWriteFile(filePath, content);
}

// ---------------------------------------------------------------------------
// Stable sort for prompt caching
// ---------------------------------------------------------------------------

function stableSortBlocks(blocks: MemoryBlock[]): MemoryBlock[] {
  const priority = (block: MemoryBlock): [number, string] => {
    if (block.scope === 'global' && block.label === 'persona') return [0, block.label];
    if (block.scope === 'global' && block.label === 'human') return [1, block.label];
    if (block.scope === 'project' && block.label === 'project') return [2, block.label];
    if (block.scope === 'project' && block.label === 'task-context') return [3, block.label];
    if (block.scope === 'project' && block.label === 'user-preferences') return [4, block.label];
    if (block.scope === 'project' && block.label === 'project-knowledge') return [5, block.label];

    const scopeBase = block.scope === 'global' ? 10 : 20;
    return [scopeBase, block.label];
  };

  blocks.sort((a, b) => {
    const [pa, la] = priority(a);
    const [pb, lb] = priority(b);
    if (pa !== pb) return pa - pb;
    return la.localeCompare(lb);
  });

  return blocks;
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

export function createMemoryStore(projectDirectory: string): MemoryStore {
  return {
    async ensureSeed() {
      for (const seed of SEED_BLOCKS) {
        const dir = scopeDir(projectDirectory, seed.scope);
        await fs.mkdir(dir, { recursive: true });

        const filePath = path.join(dir, `${seed.label}.md`);
        if (await fileExists(filePath)) {
          continue;
        }

        await writeBlockFile(filePath, {
          label: seed.label,
          description: seed.description,
          limit: DEFAULT_LIMIT,
          readOnly: false,
          value: '',
        });
      }
    },

    async listBlocks(scope) {
      const scopes: MemoryScope[] = scope === 'all' ? ['global', 'project'] : [scope];
      const blocks: MemoryBlock[] = [];

      for (const s of scopes) {
        const dir = scopeDir(projectDirectory, s);
        if (!(await fileExists(dir))) {
          continue;
        }

        const entries = await fs.readdir(dir, { withFileTypes: true });
        for (const entry of entries) {
          if (!entry.isFile()) continue;
          if (!entry.name.endsWith('.md')) continue;
          if (entry.name.startsWith('.')) continue;

          const filePath = path.join(dir, entry.name);
          try {
            blocks.push(await readBlockFile(s, filePath));
          } catch {
            // Ignore invalid files silently
          }
        }
      }

      return stableSortBlocks(blocks);
    },

    async getBlock(scope, label) {
      const safeLabel = validateLabel(label);
      const dir = scopeDir(projectDirectory, scope);
      const filePath = path.join(dir, `${safeLabel}.md`);

      if (!(await fileExists(filePath))) {
        throw new Error(`Memory block not found: ${scope}:${safeLabel}`);
      }

      return readBlockFile(scope, filePath);
    },

    async setBlock(scope, label, value, opts) {
      const safeLabel = validateLabel(label);
      const dir = scopeDir(projectDirectory, scope);
      await fs.mkdir(dir, { recursive: true });

      const filePath = path.join(dir, `${safeLabel}.md`);
      const existing = (await fileExists(filePath))
        ? await readBlockFile(scope, filePath)
        : undefined;

      if (existing?.readOnly) {
        throw new Error(`Memory block is read-only: ${scope}:${safeLabel}`);
      }

      const description = (opts?.description ?? existing?.description ?? '').trim();
      const limit = opts?.limit ?? existing?.limit ?? DEFAULT_LIMIT;

      if (value.length > limit) {
        throw new Error(
          `Value too large for ${scope}:${safeLabel} (chars=${value.length}, limit=${limit}).`,
        );
      }

      await writeBlockFile(filePath, {
        label: safeLabel,
        description,
        limit,
        readOnly: existing?.readOnly ?? false,
        value,
      });
    },

    async replaceInBlock(scope, label, oldText, newText) {
      const block = await this.getBlock(scope, label);
      if (block.readOnly) {
        throw new Error(`Memory block is read-only: ${scope}:${block.label}`);
      }

      if (!block.value.includes(oldText)) {
        throw new Error(`Old text not found in ${scope}:${block.label}.`);
      }

      const next = block.value.replace(oldText, newText);
      if (next.length > block.limit) {
        throw new Error(
          `Value too large for ${scope}:${block.label} after replace (chars=${next.length}, limit=${block.limit}).`,
        );
      }

      await writeBlockFile(block.filePath, {
        label: block.label,
        description: block.description,
        limit: block.limit,
        readOnly: block.readOnly,
        value: next,
      });
    },

    async deleteBlock(scope, label) {
      const safeLabel = validateLabel(label);
      const dir = scopeDir(projectDirectory, scope);
      const filePath = path.join(dir, `${safeLabel}.md`);

      if (!(await fileExists(filePath))) {
        throw new Error(`Memory block not found: ${scope}:${safeLabel}`);
      }

      const existing = await readBlockFile(scope, filePath);
      if (existing.readOnly) {
        throw new Error(`Memory block is read-only: ${scope}:${safeLabel}`);
      }

      await fs.unlink(filePath);
    },

    async searchBlocks(query) {
      const allBlocks = await this.listBlocks('all');
      const lowerQuery = query.toLowerCase();

      return allBlocks.filter((block) =>
        block.label.toLowerCase().includes(lowerQuery) ||
        block.description.toLowerCase().includes(lowerQuery) ||
        block.value.toLowerCase().includes(lowerQuery),
      );
    },
  };
}
