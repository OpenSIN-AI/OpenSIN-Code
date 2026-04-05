/**
 * OpenSIN Agent Memory Plugin — Public API.
 *
 * Exports the memory store factory, prompt renderer, and tool definitions
 * for integration with the OpenSIN CLI and system prompt builder.
 */

export { createMemoryStore } from './memory.js';
export type { MemoryStore, MemoryBlock, MemoryScope } from './memory.js';

export { renderMemoryBlocks } from './prompt.js';
export { MEMORY_INSTRUCTIONS, getDefaultDescription } from './letta.js';

export {
  MemoryList,
  MemorySet,
  MemoryReplace,
  MemoryDelete,
  MemorySearch,
} from './tools.js';

export { splitFrontmatter, buildFrontmatterDocument, atomicWriteFile } from './frontmatter.js';
