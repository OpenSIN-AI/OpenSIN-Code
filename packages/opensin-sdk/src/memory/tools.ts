/**
 * Memory tool definitions for the OpenSIN CLI agent.
 *
 * Provides the agent with tools to list, set, replace, delete, and search
 * memory blocks. These are exposed as /memory CLI commands.
 */

import type { MemoryScope, MemoryStore } from './memory.js';

// ---------------------------------------------------------------------------
// MemoryList — List available memory blocks
// ---------------------------------------------------------------------------

export function MemoryList(store: MemoryStore) {
  return {
    name: 'memory_list',
    description: 'List available memory blocks (labels, descriptions, sizes).',
    parameters: {
      type: 'object',
      properties: {
        scope: {
          type: 'string',
          enum: ['all', 'global', 'project'],
          description: 'Filter by scope. Defaults to "all".',
        },
      },
    },
    async execute(args: { scope?: string }): Promise<string> {
      const scope = (args.scope ?? 'all') as MemoryScope | 'all';
      const blocks = await store.listBlocks(scope);
      if (blocks.length === 0) {
        return 'No memory blocks found.';
      }

      return blocks
        .map(
          (b) =>
            `${b.scope}:${b.label}\n  read_only=${b.readOnly} chars=${b.value.length}/${b.limit}\n  ${b.description}`,
        )
        .join('\n\n');
    },
  };
}

// ---------------------------------------------------------------------------
// MemorySet — Create or update a memory block (full overwrite)
// ---------------------------------------------------------------------------

export function MemorySet(store: MemoryStore) {
  return {
    name: 'memory_set',
    description: 'Create or update a memory block (full overwrite).',
    parameters: {
      type: 'object',
      properties: {
        label: { type: 'string', description: 'Unique identifier for the block.' },
        scope: {
          type: 'string',
          enum: ['global', 'project'],
          description: 'Scope of the block. Defaults to "project".',
        },
        value: { type: 'string', description: 'Content of the memory block.' },
        description: { type: 'string', description: 'How the agent should use this block.' },
        limit: { type: 'number', description: 'Maximum characters allowed.' },
      },
      required: ['label', 'value'],
    },
    async execute(args: {
      label: string;
      value: string;
      scope?: string;
      description?: string;
      limit?: number;
    }): Promise<string> {
      const scope = (args.scope ?? 'project') as MemoryScope;
      await store.setBlock(scope, args.label, args.value, {
        description: args.description,
        limit: args.limit,
      });
      return `Updated memory block ${scope}:${args.label}.`;
    },
  };
}

// ---------------------------------------------------------------------------
// MemoryReplace — Replace a substring within a memory block
// ---------------------------------------------------------------------------

export function MemoryReplace(store: MemoryStore) {
  return {
    name: 'memory_replace',
    description: 'Replace a substring within a memory block.',
    parameters: {
      type: 'object',
      properties: {
        label: { type: 'string', description: 'Label of the block to edit.' },
        scope: {
          type: 'string',
          enum: ['global', 'project'],
          description: 'Scope of the block. Defaults to "project".',
        },
        oldText: { type: 'string', description: 'Text to find and replace.' },
        newText: { type: 'string', description: 'Replacement text.' },
      },
      required: ['label', 'oldText', 'newText'],
    },
    async execute(args: {
      label: string;
      oldText: string;
      newText: string;
      scope?: string;
    }): Promise<string> {
      const scope = (args.scope ?? 'project') as MemoryScope;
      await store.replaceInBlock(scope, args.label, args.oldText, args.newText);
      return `Updated memory block ${scope}:${args.label}.`;
    },
  };
}

// ---------------------------------------------------------------------------
// MemoryDelete — Delete a memory block
// ---------------------------------------------------------------------------

export function MemoryDelete(store: MemoryStore) {
  return {
    name: 'memory_delete',
    description: 'Delete a memory block permanently.',
    parameters: {
      type: 'object',
      properties: {
        label: { type: 'string', description: 'Label of the block to delete.' },
        scope: {
          type: 'string',
          enum: ['global', 'project'],
          description: 'Scope of the block. Defaults to "project".',
        },
      },
      required: ['label'],
    },
    async execute(args: { label: string; scope?: string }): Promise<string> {
      const scope = (args.scope ?? 'project') as MemoryScope;
      await store.deleteBlock(scope, args.label);
      return `Deleted memory block ${scope}:${args.label}.`;
    },
  };
}

// ---------------------------------------------------------------------------
// MemorySearch — Search memory blocks
// ---------------------------------------------------------------------------

export function MemorySearch(store: MemoryStore) {
  return {
    name: 'memory_search',
    description: 'Search memory blocks by label, description, or content.',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query string.' },
      },
      required: ['query'],
    },
    async execute(args: { query: string }): Promise<string> {
      const results = await store.searchBlocks(args.query);
      if (results.length === 0) {
        return `No memory blocks matching "${args.query}".`;
      }

      return results
        .map(
          (b) =>
            `${b.scope}:${b.label}\n  read_only=${b.readOnly} chars=${b.value.length}/${b.limit}\n  ${b.description}`,
        )
        .join('\n\n');
    },
  };
}
