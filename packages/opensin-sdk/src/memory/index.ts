// Agent Memory Plugin — Letta-style persistent memory
export { createMemoryStore } from './memory';
export type { MemoryStore, MemoryBlock, MemoryScope } from './memory';

export { renderMemoryBlocks } from './prompt';
export { MEMORY_INSTRUCTIONS, getDefaultDescription } from './letta';

export {
  MemoryList,
  MemorySet,
  MemoryReplace,
  MemoryDelete,
  MemorySearch,
} from './tools';

export { splitFrontmatter, buildFrontmatterDocument, atomicWriteFile } from './frontmatter';

// New Memory Manager with FileMemoryProvider
export { MemoryManager, createMemoryManager } from './manager'
export { FileMemoryProvider, createFileProvider } from './provider'
export type { MemoryEntry, MemoryProvider } from './types'
