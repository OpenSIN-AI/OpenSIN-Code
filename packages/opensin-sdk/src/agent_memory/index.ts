/**
 * OpenSIN Agent Memory — Public API
 *
 * Persistent, self-editable memory blocks inspired by Letta agents.
 * Memory survives across sessions and context compaction.
 *
 * Branded as OpenSIN/sincode.
 */

export type {
  MemoryBlock,
  MemoryBlockOptions,
  MemoryCliResult,
  MemoryOperationResult,
  MemoryScope,
  MemoryStore,
  AgentMemoryConfig,
} from './types.js';

export { createMemoryStore } from './memory.js';
export { MEMORY_INSTRUCTIONS, getDefaultDescription } from './letta.js';
export { splitFrontmatter, buildFrontmatterDocument, atomicWriteFile } from './frontmatter.js';

import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as os from 'node:os';
import { createMemoryStore } from './memory.js';
import type { MemoryBlock, MemoryScope, MemoryStore, AgentMemoryConfig } from './types.js';

/**
 * MemoryManager — High-level facade over the MemoryStore.
 * Provides search, formatted output, and convenience methods
 * for CLI commands and system prompt injection.
 */
export class MemoryManager {
  private store: MemoryStore;
  private projectDirectory: string;

  constructor(config: AgentMemoryConfig) {
    this.projectDirectory = config.projectDirectory;
    this.store = createMemoryStore(
      config.projectDirectory,
      config.memoryDir,
      config.globalMemoryDir,
    );
  }

  /** Get the underlying MemoryStore for direct access */
  getStore(): MemoryStore {
    return this.store;
  }

  /** Initialize seed blocks and .gitignore */
  async initialize(): Promise<void> {
    await this.store.ensureSeed();
  }

  /** List all memory blocks, optionally filtered by scope */
  async list(scope: MemoryScope | 'all' = 'all'): Promise<MemoryBlock[]> {
    return this.store.listBlocks(scope);
  }

  /** Get a single memory block */
  async get(scope: MemoryScope, label: string): Promise<MemoryBlock> {
    return this.store.getBlock(scope, label);
  }

  /** Create or update a memory block */
  async set(
    scope: MemoryScope,
    label: string,
    value: string,
    opts?: { description?: string; limit?: number; readOnly?: boolean },
  ): Promise<void> {
    return this.store.setBlock(scope, label, value, opts);
  }

  /** Replace a substring within a memory block */
  async replace(
    scope: MemoryScope,
    label: string,
    oldText: string,
    newText: string,
  ): Promise<void> {
    return this.store.replaceInBlock(scope, label, oldText, newText);
  }

  /** Delete a memory block */
  async delete(scope: MemoryScope, label: string): Promise<void> {
    return this.store.deleteBlock(scope, label);
  }

  /**
   * Search across all memory blocks for a query string.
   * Returns matching blocks with the matched text context.
   */
  async search(query: string, scope: MemoryScope | 'all' = 'all'): Promise<
    Array<{
      block: MemoryBlock;
      matchIndex: number;
      context: string;
    }>
  > {
    const blocks = await this.list(scope);
    const results: Array<{ block: MemoryBlock; matchIndex: number; context: string }> = [];
    const lowerQuery = query.toLowerCase();

    for (const block of blocks) {
      const lowerValue = block.value.toLowerCase();
      const lowerLabel = block.label.toLowerCase();
      const lowerDesc = block.description.toLowerCase();

      // Search in value, label, and description
      const searchTargets = [
        { text: lowerValue, name: 'value' },
        { text: lowerLabel, name: 'label' },
        { text: lowerDesc, name: 'description' },
      ];

      for (const target of searchTargets) {
        const idx = target.text.indexOf(lowerQuery);
        if (idx !== -1) {
          // Extract context around the match (50 chars before/after)
          const contextStart = Math.max(0, idx - 50);
          const contextEnd = Math.min(target.text.length, idx + query.length + 50);
          const context = (contextStart > 0 ? '...' : '') +
            target.text.slice(contextStart, contextEnd) +
            (contextEnd < target.text.length ? '...' : '');

          results.push({
            block,
            matchIndex: idx,
            context,
          });
          break; // Only one match per block
        }
      }
    }

    // Sort by relevance (value matches first, then by match position)
    results.sort((a, b) => {
      const aInValue = a.block.value.toLowerCase().includes(lowerQuery);
      const bInValue = b.block.value.toLowerCase().includes(lowerQuery);
      if (aInValue && !bInValue) return -1;
      if (!aInValue && bInValue) return 1;
      return a.matchIndex - b.matchIndex;
    });

    return results;
  }

  /**
   * Build the memory section for system prompt injection.
   * Returns a formatted string with all memory blocks.
   */
  async buildPromptSection(): Promise<string> {
    const blocks = await this.list('all');
    if (blocks.length === 0) {
      return '';
    }

    const sections: string[] = [];
    sections.push('<agent_memory>');
    sections.push('The following memory blocks are available. Use memory tools to read and modify them.');

    for (const block of blocks) {
      const charsCurrent = block.value.length;
      sections.push('');
      sections.push(`--- Memory Block: ${block.scope}:${block.label} ---`);
      sections.push(`Description: ${block.description}`);
      sections.push(`Size: ${charsCurrent}/${block.limit} characters`);
      sections.push(`Read-only: ${block.readOnly}`);
      sections.push('');
      sections.push(block.value);
      sections.push(`--- End Block: ${block.scope}:${block.label} ---`);
    }

    sections.push('</agent_memory>');
    return sections.join('\n');
  }

  /**
   * Format a list of blocks for CLI display.
   */
  static formatBlockList(blocks: MemoryBlock[]): string {
    if (blocks.length === 0) {
      return 'No memory blocks found.';
    }

    const lines: string[] = [];
    lines.push('OpenSIN Agent Memory Blocks:');
    lines.push('');

    for (const block of blocks) {
      const charsCurrent = block.value.length;
      const status = block.readOnly ? ' [read-only]' : '';
      lines.push(`  [${block.scope}] ${block.label}${status}`);
      lines.push(`    Description: ${block.description}`);
      lines.push(`    Size: ${charsCurrent}/${block.limit} characters`);
      lines.push('');
    }

    return lines.join('\n');
  }

  /**
   * Format search results for CLI display.
   */
  static formatSearchResults(
    results: Array<{ block: MemoryBlock; matchIndex: number; context: string }>,
    query: string,
  ): string {
    if (results.length === 0) {
      return `No memory blocks match "${query}".`;
    }

    const lines: string[] = [];
    lines.push(`Search results for "${query}" (${results.length} match(es)):`);
    lines.push('');

    for (const result of results) {
      lines.push(`  [${result.block.scope}:${result.block.label}]`);
      lines.push(`    Context: ${result.context}`);
      lines.push('');
    }

    return lines.join('\n');
  }
}
