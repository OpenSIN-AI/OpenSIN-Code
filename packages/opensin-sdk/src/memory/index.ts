// Agent Memory Plugin — Letta-style persistent memory
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

// New Memory Manager with FileMemoryProvider
export { MemoryManager, createMemoryManager } from './manager.js'
export { FileMemoryProvider, createFileProvider } from './provider.js'
export type { MemoryEntry, MemoryProvider } from './types.js'
