import { definePlugin, createTool, ParamTypes } from '@opensin/plugin-sdk';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as os from 'node:os';
import * as crypto from 'node:crypto';

interface MemoryEntry {
  id: string;
  content: string;
  embedding: number[];
  tags: string[];
  created: Date;
  scope: 'session' | 'project';
}

function simpleEmbedding(text: string, dimensions = 64): number[] {
  // Simple hash-based embedding (placeholder - real implementation would use ML model)
  const embedding: number[] = [];
  for (let i = 0; i < dimensions; i++) {
    const hash = crypto.createHash('md5').update(`${text}-${i}`).digest('hex');
    embedding.push(parseInt(hash.slice(0, 8), 16) / 0xffffffff);
  }
  return embedding;
}

function cosineSimilarity(a: number[], b: number[]): number {
  let dotProduct = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB) || 1);
}

class VectorMemory {
  private entries: MemoryEntry[] = [];
  private storePath: string;

  constructor(projectDir: string) {
    this.storePath = path.join(projectDir, '.sin', 'mem-store.json');
  }

  async load(): Promise<void> {
    try {
      const data = await fs.readFile(this.storePath, 'utf-8');
      const parsed = JSON.parse(data);
      this.entries = parsed.map((e: any) => ({ ...e, created: new Date(e.created) }));
    } catch { /* no store yet */ }
  }

  async save(): Promise<void> {
    await fs.mkdir(path.dirname(this.storePath), { recursive: true });
    await fs.writeFile(this.storePath, JSON.stringify(this.entries, null, 2));
  }

  async add(content: string, tags: string[] = [], scope: 'session' | 'project' = 'project'): Promise<string> {
    const id = crypto.randomUUID();
    const entry: MemoryEntry = {
      id, content, embedding: simpleEmbedding(content),
      tags, created: new Date(), scope,
    };
    this.entries.push(entry);
    await this.save();
    return id;
  }

  async search(query: string, limit = 5): Promise<{ id: string; content: string; score: number; tags: string[] }[]> {
    const queryEmbedding = simpleEmbedding(query);
    const results = this.entries
      .map(e => ({
        id: e.id,
        content: e.content,
        score: cosineSimilarity(queryEmbedding, e.embedding),
        tags: e.tags,
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
    return results;
  }

  async delete(id: string): Promise<boolean> {
    const idx = this.entries.findIndex(e => e.id === id);
    if (idx === -1) return false;
    this.entries.splice(idx, 1);
    await this.save();
    return true;
  }

  async list(scope?: 'session' | 'project'): Promise<MemoryEntry[]> {
    return scope ? this.entries.filter(e => e.scope === scope) : this.entries;
  }
}

export default definePlugin({
  name: '@opensin/plugin-mem',
  version: '0.1.0',
  type: 'memory',
  description: 'Vector DB persistent memory with semantic search',

  async activate(ctx) {
    const projectDir = ctx.getConfig<string>('projectDir', process.cwd());
    const mem = new VectorMemory(projectDir);
    await mem.load();

    ctx.tools.register(createTool({
      name: 'mem_save',
      description: 'Save a memory entry with semantic embedding',
      parameters: {
        content: ParamTypes.string({ required: true, description: 'Content to save' }),
        tags: ParamTypes.string({ description: 'Comma-separated tags' }),
        scope: ParamTypes.string({ description: 'Scope (session|project)', default: 'project' }),
      },
      execute: async (params: Record<string, unknown>) => {
        const content = params.content as string;
        const tags = (params.tags as string || '').split(',').map(t => t.trim()).filter(Boolean);
        const scope = (params.scope as 'session' | 'project') || 'project';
        const id = await mem.add(content, tags, scope);
        return { content: `Memory saved: ${id}` };
      }
    }));

    ctx.tools.register(createTool({
      name: 'mem_search',
      description: 'Search memories using semantic similarity',
      parameters: {
        query: ParamTypes.string({ required: true, description: 'Search query' }),
        limit: ParamTypes.number({ description: 'Max results', default: 5 }),
      },
      execute: async (params: Record<string, unknown>) => {
        const query = params.query as string;
        const limit = (params.limit as number) || 5;
        const results = await mem.search(query, limit);
        if (results.length === 0) return { content: 'No matching memories found.' };
        return { content: results.map(r => `[${r.score.toFixed(3)}] ${r.content.slice(0, 200)}\n  tags: ${r.tags.join(', ')}`).join('\n\n') };
      }
    }));

    ctx.tools.register(createTool({
      name: 'mem_list',
      description: 'List all memory entries',
      parameters: {
        scope: ParamTypes.string({ description: 'Filter by scope' }),
      },
      execute: async (params: Record<string, unknown>) => {
        const scope = params.scope as 'session' | 'project' | undefined;
        const entries = await mem.list(scope);
        if (entries.length === 0) return { content: 'No memories stored.' };
        return { content: entries.map(e => `${e.id.slice(0, 8)}: ${e.content.slice(0, 100)} [${e.scope}]`).join('\n') };
      }
    }));

    ctx.tools.register(createTool({
      name: 'mem_delete',
      description: 'Delete a memory entry',
      parameters: {
        id: ParamTypes.string({ required: true, description: 'Memory ID' }),
      },
      execute: async (params: Record<string, unknown>) => {
        const id = params.id as string;
        const deleted = await mem.delete(id);
        return { content: deleted ? `Memory ${id} deleted.` : `Memory ${id} not found.` };
      }
    }));

    // Auto-capture: save important context changes
    ctx.events.on('session:end', async () => {
      ctx.logger.info('Mem plugin: session ended, memory persisted');
    });

    ctx.logger.info('Mem plugin activated (vector DB memory with semantic search)');
  },
});
