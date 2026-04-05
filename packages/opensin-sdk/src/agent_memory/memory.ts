/**
 * OpenSIN Agent Memory — Memory Store
 *
 * File-based persistent memory store with CRUD operations.
 * Memory blocks are stored as markdown files with YAML frontmatter.
 *
 * Branded as OpenSIN/sincode.
 */

import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';
import * as YAML from 'yaml';
import type {
  MemoryBlock,
  MemoryBlockOptions,
  MemoryScope,
  MemoryStore,
} from './types.js';
import { atomicWriteFile, buildFrontmatterDocument, splitFrontmatter } from './frontmatter.js';
import { getDefaultDescription } from './letta.js';

// ==========================================
// Schema & Parsing
// ==========================================

const DEFAULT_LIMIT = 5000;

interface ParsedFrontmatter {
  label?: string;
  description?: string;
  limit?: number;
  read_only?: boolean;
}

function parseFrontmatter(frontmatterText: string | undefined): ParsedFrontmatter {
  if (!frontmatterText) {
    return {};
  }

  try {
    const loaded = YAML.parse(frontmatterText) as Record<string, unknown>;
    const result: ParsedFrontmatter = {};

    if (typeof loaded.label === 'string') result.label = loaded.label;
    if (typeof loaded.description === 'string') result.description = loaded.description;
    if (typeof loaded.limit === 'number' && Number.isInteger(loaded.limit) && loaded.limit > 0) {
      result.limit = loaded.limit;
    }
    if (typeof loaded.read_only === 'boolean') result.read_only = loaded.read_only;

    return result;
  } catch {
    return {};
  }
}

// ==========================================
// File I/O
// ==========================================

async function readBlockFile(
  scope: MemoryScope,
  filePath: string,
): Promise<MemoryBlock> {
  const [raw, stats] = await Promise.all([
    fs.readFile(filePath, 'utf-8'),
    fs.stat(filePath),
  ]);
  const { frontmatterText, body } = splitFrontmatter(raw);
  const fm = parseFrontmatter(frontmatterText);

  const label = (fm.label ?? path.basename(filePath, path.extname(filePath))).trim();
  const description =
    fm.description && fm.description.trim().length > 0
      ? fm.description
      : getDefaultDescription(label);
  const limit = fm.limit ?? DEFAULT_LIMIT;
  const readOnly = fm.read_only === true;

  return {
    scope,
    label,
    description: description.trim(),
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

// ==========================================
// Validation
// ==========================================

function validateLabel(label: string): string {
  const trimmed = label.trim();
  if (!/^[a-z0-9][a-z0-9-_]{1,60}$/i.test(trimmed)) {
    throw new Error(
      `Invalid label "${label}". Use letters/numbers/dash/underscore (2-61 chars).`,
    );
  }
  return trimmed;
}

// ==========================================
// Seed Blocks
// ==========================================

const SEED_BLOCKS: Array<{ scope: MemoryScope; label: string }> = [
  { scope: 'global', label: 'persona' },
  { scope: 'global', label: 'human' },
  { scope: 'project', label: 'project' },
];

// ==========================================
// Directory Resolution
// ==========================================

function scopeDir(
  projectDirectory: string,
  scope: MemoryScope,
  memoryDir?: string,
  globalMemoryDir?: string,
): string {
  if (scope === 'global') {
    return globalMemoryDir ?? path.join(os.homedir(), '.opensin', 'memory');
  }
  return memoryDir ?? path.join(projectDirectory, '.opensin', 'memory');
}

async function exists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function ensureGitignore(projectDirectory: string, memoryDir?: string): Promise<void> {
  const dir = memoryDir ?? path.join(projectDirectory, '.opensin', 'memory');
  const gitignorePath = path.join(dir, '.gitignore');

  await fs.mkdir(dir, { recursive: true });

  if (await exists(gitignorePath)) {
    return;
  }

  await fs.writeFile(gitignorePath, '*\n', 'utf-8');
}

// ==========================================
// Stable Sort for Prompt Caching
// ==========================================

function stableSortBlocks(blocks: MemoryBlock[]): MemoryBlock[] {
  const priority = (block: MemoryBlock): [number, string] => {
    if (block.scope === 'global' && block.label === 'persona') return [0, block.label];
    if (block.scope === 'global' && block.label === 'human') return [1, block.label];
    if (block.scope === 'project' && block.label === 'project') return [2, block.label];

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

// ==========================================
// Memory Store Factory
// ==========================================

export function createMemoryStore(
  projectDirectory: string,
  memoryDir?: string,
  globalMemoryDir?: string,
): MemoryStore {
  return {
    async ensureSeed() {
      await ensureGitignore(projectDirectory, memoryDir);

      for (const seed of SEED_BLOCKS) {
        const dir = scopeDir(projectDirectory, seed.scope, memoryDir, globalMemoryDir);
        await fs.mkdir(dir, { recursive: true });

        const filePath = path.join(dir, `${seed.label}.md`);
        if (await exists(filePath)) {
          continue;
        }

        await writeBlockFile(filePath, {
          label: seed.label,
          description: '',
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
        const dir = scopeDir(projectDirectory, s, memoryDir, globalMemoryDir);
        if (!(await exists(dir))) {
          continue;
        }

        const entries = await fs.readdir(dir, { withFileTypes: true });
        for (const entry of entries) {
          if (!entry.isFile()) continue;
          if (!entry.name.endsWith('.md')) continue;
          if (entry.name === '.gitignore') continue;

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
      const dir = scopeDir(projectDirectory, scope, memoryDir, globalMemoryDir);
      const filePath = path.join(dir, `${safeLabel}.md`);

      if (!(await exists(filePath))) {
        throw new Error(`Memory block not found: ${scope}:${safeLabel}`);
      }

      return readBlockFile(scope, filePath);
    },

    async setBlock(scope, label, value, opts) {
      const safeLabel = validateLabel(label);
      const dir = scopeDir(projectDirectory, scope, memoryDir, globalMemoryDir);
      await fs.mkdir(dir, { recursive: true });

      const filePath = path.join(dir, `${safeLabel}.md`);
      const existing = (await exists(filePath))
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
      const dir = scopeDir(projectDirectory, scope, memoryDir, globalMemoryDir);
      const filePath = path.join(dir, `${safeLabel}.md`);

      if (!(await exists(filePath))) {
        throw new Error(`Memory block not found: ${scope}:${safeLabel}`);
      }

      const existing = await readBlockFile(scope, filePath);
      if (existing.readOnly) {
        throw new Error(`Memory block is read-only: ${scope}:${safeLabel}`);
      }

      await fs.unlink(filePath);
    },
  };
}
