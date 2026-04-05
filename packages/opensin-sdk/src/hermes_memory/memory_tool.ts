/**
 * OpenSIN Hermes Memory Tool — CLI Tool wrapper for MemoryStore
 *
 * Exposes the unified memory system as a CLI tool with actions:
 * add, replace, remove, read. Compatible with Hermes memory_tool.py schema.
 *
 * Branded: OpenSIN/sincode
 */

import type { ToolDefinition, ToolResult } from '../types.js';
import { MemoryStore, createMemoryStore } from './memory_store.js';

let globalMemoryStore: MemoryStore | null = null;

function getStore(): MemoryStore {
  if (!globalMemoryStore) {
    globalMemoryStore = createMemoryStore();
  }
  return globalMemoryStore;
}

export function resetMemoryStore(): void {
  globalMemoryStore = null;
}

export const MemoryTool: ToolDefinition = {
  name: 'memory',
  description: 'Save durable information to persistent memory that survives across sessions. Memory is shared between OpenSIN-Code CLI and sin-hermes-agent-main. Two targets: "memory" for personal notes, "user" for user profile. Actions: add, replace, remove, read.',
  inputSchema: {
    type: 'object',
    properties: {
      action: { type: 'string', enum: ['add', 'replace', 'remove', 'read'], description: 'The action to perform.' },
      target: { type: 'string', enum: ['memory', 'user'], description: "Which memory store: 'memory' for personal notes, 'user' for user profile." },
      content: { type: 'string', description: "The entry content. Required for 'add' and 'replace'." },
      old_text: { type: 'string', description: 'Short unique substring identifying the entry to replace or remove.' },
    },
    required: ['action', 'target'],
  },
  async execute(input: Record<string, unknown>): Promise<ToolResult> {
    const { action, target, content, old_text } = input as { action: string; target: string; content?: string; old_text?: string };
    const store = getStore();

    try {
      if (target !== 'memory' && target !== 'user') {
        return { content: [{ type: 'text', text: JSON.stringify({ success: false, error: `Invalid target '${target}'. Use 'memory' or 'user'.` }) }], isError: true };
      }

      let result;
      switch (action) {
        case 'add':
          if (!content) return { content: [{ type: 'text', text: JSON.stringify({ success: false, error: "Content is required for 'add' action." }) }], isError: true };
          result = await store.add(target, content);
          break;
        case 'replace':
          if (!old_text) return { content: [{ type: 'text', text: JSON.stringify({ success: false, error: "old_text is required for 'replace' action." }) }], isError: true };
          if (!content) return { content: [{ type: 'text', text: JSON.stringify({ success: false, error: "content is required for 'replace' action." }) }], isError: true };
          result = await store.replace(target, old_text, content);
          break;
        case 'remove':
          if (!old_text) return { content: [{ type: 'text', text: JSON.stringify({ success: false, error: "old_text is required for 'remove' action." }) }], isError: true };
          result = await store.remove(target, old_text);
          break;
        case 'read':
          await store.loadFromDisk();
          result = { success: true, target, entries: store.entriesFor(target === 'user' ? 'user' : 'memory'), usage: `${store.charCount(target).toLocaleString()}/${store.charLimit(target).toLocaleString()} chars`, entry_count: store.entriesFor(target === 'user' ? 'user' : 'memory').length };
          break;
        default:
          return { content: [{ type: 'text', text: JSON.stringify({ success: false, error: `Unknown action '${action}'. Use: add, replace, remove, read` }) }], isError: true };
      }

      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
    } catch (error) {
      return { content: [{ type: 'text', text: JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }) }], isError: true };
    }
  },
};

export function getMemorySystemPrompt(): string {
  const store = getStore();
  const memoryBlock = store.formatForSystemPrompt('memory');
  const userBlock = store.formatForSystemPrompt('user');
  const parts = [memoryBlock, userBlock].filter(Boolean);
  return parts.length > 0 ? parts.join('\n\n') : '';
}
