import { definePlugin, createTool, ParamTypes } from '@opensin/plugin-sdk';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as os from 'node:os';

interface MemoryBlock {
  scope: 'global' | 'project';
  label: string;
  value: string;
  description: string;
  created: Date;
  modified: Date;
}

class MemoryStore {
  private globalDir: string;
  private projectDir: string;

  constructor(projectDirectory: string) {
    this.globalDir = path.join(os.homedir(), '.opensin', 'memory');
    this.projectDir = path.join(projectDirectory, '.opensin', 'memory');
  }

  private async ensureDir(dir: string): Promise<void> {
    await fs.mkdir(dir, { recursive: true });
  }

  private blockPath(scope: 'global' | 'project', label: string): string {
    const dir = scope === 'global' ? this.globalDir : this.projectDir;
    return path.join(dir, `${label}.md`);
  }

  async listBlocks(scope: 'global' | 'project' | 'all' = 'all'): Promise<MemoryBlock[]> {
    const scopes = scope === 'all' ? ['global', 'project'] : [scope];
    const blocks: MemoryBlock[] = [];

    for (const s of scopes) {
      const dir = s === 'global' ? this.globalDir : this.projectDir;
      try {
        const files = await fs.readdir(dir);
        for (const file of files.filter(f => f.endsWith('.md'))) {
          const content = await fs.readFile(path.join(dir, file), 'utf-8');
          const label = file.replace('.md', '');
          blocks.push({
            scope: s as 'global' | 'project',
            label,
            value: content,
            description: `Memory block: ${label}`,
            created: new Date(),
            modified: new Date(),
          });
        }
      } catch { /* dir doesn't exist */ }
    }

    return blocks;
  }

  async setBlock(scope: 'global' | 'project', label: string, value: string): Promise<void> {
    const dir = scope === 'global' ? this.globalDir : this.projectDir;
    await this.ensureDir(dir);
    await fs.writeFile(this.blockPath(scope, label), value);
  }

  async getBlock(scope: 'global' | 'project', label: string): Promise<string | null> {
    try {
      return await fs.readFile(this.blockPath(scope, label), 'utf-8');
    } catch {
      return null;
    }
  }

  async deleteBlock(scope: 'global' | 'project', label: string): Promise<boolean> {
    try {
      await fs.unlink(this.blockPath(scope, label));
      return true;
    } catch {
      return false;
    }
  }

  async searchBlocks(query: string): Promise<{ scope: string; label: string; snippet: string }[]> {
    const blocks = await this.listBlocks('all');
    const lowerQuery = query.toLowerCase();
    return blocks
      .filter(b => b.label.toLowerCase().includes(lowerQuery) || b.value.toLowerCase().includes(lowerQuery))
      .map(b => ({ scope: b.scope, label: b.label, snippet: b.value.slice(0, 200) }));
  }

  async ensureSeed(): Promise<void> {
    const seeds = [
      { scope: 'project' as const, label: 'project-context', value: '# Project Context\n\nAdd your project context here.' },
      { scope: 'project' as const, label: 'task-notes', value: '# Task Notes\n\nAdd task-specific notes here.' },
    ];

    for (const seed of seeds) {
      const existing = await this.getBlock(seed.scope, seed.label);
      if (!existing) {
        await this.setBlock(seed.scope, seed.label, seed.value);
      }
    }
  }
}

export default definePlugin({
  name: '@opensin/plugin-agent-memory',
  version: '0.1.0',
  type: 'memory',
  description: 'Letta-style persistent memory blocks with markdown storage',

  async activate(ctx) {
    const projectDir = ctx.getConfig<string>('projectDir', process.cwd());
    const store = new MemoryStore(projectDir);
    await store.ensureSeed();

    ctx.tools.register(createTool({
      name: 'memory_list',
      description: 'List all memory blocks',
      parameters: {
        scope: ParamTypes.string({ description: 'Filter by scope (global|project|all)', default: 'all' }),
      },
      execute: async (params: Record<string, unknown>) => {
        const scope = (params.scope as string) || 'all';
        const blocks = await store.listBlocks(scope as 'global' | 'project' | 'all');
        if (blocks.length === 0) return { content: 'No memory blocks found.' };
        return { content: blocks.map(b => `${b.scope}:${b.label} (${b.value.length} chars)`).join('\n') };
      }
    }));

    ctx.tools.register(createTool({
      name: 'memory_set',
      description: 'Create or update a memory block',
      parameters: {
        scope: ParamTypes.string({ required: true, description: 'Scope (global|project)' }),
        label: ParamTypes.string({ required: true, description: 'Block label' }),
        value: ParamTypes.string({ required: true, description: 'Block content' }),
      },
      execute: async (params: Record<string, unknown>) => {
        const scope = params.scope as 'global' | 'project';
        const label = params.label as string;
        const value = params.value as string;
        await store.setBlock(scope, label, value);
        return { content: `Memory block "${scope}:${label}" saved.` };
      }
    }));

    ctx.tools.register(createTool({
      name: 'memory_get',
      description: 'Read a memory block',
      parameters: {
        scope: ParamTypes.string({ required: true, description: 'Scope (global|project)' }),
        label: ParamTypes.string({ required: true, description: 'Block label' }),
      },
      execute: async (params: Record<string, unknown>) => {
        const scope = params.scope as 'global' | 'project';
        const label = params.label as string;
        const value = await store.getBlock(scope, label);
        return { content: value || `Memory block "${scope}:${label}" not found.` };
      }
    }));

    ctx.tools.register(createTool({
      name: 'memory_delete',
      description: 'Delete a memory block',
      parameters: {
        scope: ParamTypes.string({ required: true, description: 'Scope (global|project)' }),
        label: ParamTypes.string({ required: true, description: 'Block label' }),
      },
      execute: async (params: Record<string, unknown>) => {
        const scope = params.scope as 'global' | 'project';
        const label = params.label as string;
        const deleted = await store.deleteBlock(scope, label);
        return { content: deleted ? `Memory block "${scope}:${label}" deleted.` : `Not found.` };
      }
    }));

    ctx.tools.register(createTool({
      name: 'memory_search',
      description: 'Search memory blocks',
      parameters: {
        query: ParamTypes.string({ required: true, description: 'Search query' }),
      },
      execute: async (params: Record<string, unknown>) => {
        const query = params.query as string;
        const results = await store.searchBlocks(query);
        if (results.length === 0) return { content: 'No matching memory blocks found.' };
        return { content: results.map(r => `${r.scope}:${r.label}\n${r.snippet}`).join('\n---\n') };
      }
    }));

    ctx.logger.info('Agent memory plugin activated');
  },
});
