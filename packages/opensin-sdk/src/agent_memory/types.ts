/**
 * OpenSIN Agent Memory — Type Definitions
 *
 * Persistent, self-editable memory blocks inspired by Letta agents.
 * Memory survives across sessions and context compaction.
 *
 * Branded as OpenSIN/sincode.
 */

/** Scope of a memory block */
export type MemoryScope = 'global' | 'project';

/** A single memory block with metadata and content */
export interface MemoryBlock {
  /** Scope: global (shared across projects) or project (codebase-specific) */
  scope: MemoryScope;
  /** Unique identifier for the block */
  label: string;
  /** Tells the agent how to use this block */
  description: string;
  /** Maximum characters allowed */
  limit: number;
  /** Prevent agent from modifying */
  readOnly: boolean;
  /** The actual content of the block */
  value: string;
  /** File path on disk */
  filePath: string;
  /** Last modification time */
  lastModified: Date;
}

/** Options for creating or updating a memory block */
export interface MemoryBlockOptions {
  description?: string;
  limit?: number;
  readOnly?: boolean;
}

/** Result of a memory operation */
export interface MemoryOperationResult {
  success: boolean;
  output: string;
  error?: string;
}

/** CLI command result for memory commands */
export interface MemoryCliResult {
  success: boolean;
  output: string;
  error?: string;
}

/** Memory store interface for CRUD operations */
export interface MemoryStore {
  /** Ensure seed blocks exist on first run */
  ensureSeed(): Promise<void>;
  /** List all memory blocks, optionally filtered by scope */
  listBlocks(scope: MemoryScope | 'all'): Promise<MemoryBlock[]>;
  /** Get a single memory block by scope and label */
  getBlock(scope: MemoryScope, label: string): Promise<MemoryBlock>;
  /** Create or update a memory block (full overwrite) */
  setBlock(
    scope: MemoryScope,
    label: string,
    value: string,
    opts?: MemoryBlockOptions,
  ): Promise<void>;
  /** Replace a substring within a memory block */
  replaceInBlock(
    scope: MemoryScope,
    label: string,
    oldText: string,
    newText: string,
  ): Promise<void>;
  /** Delete a memory block */
  deleteBlock(scope: MemoryScope, label: string): Promise<void>;
}

/** Configuration for the agent memory system */
export interface AgentMemoryConfig {
  /** Project root directory */
  projectDirectory: string;
  /** Custom memory directory (defaults to .opensin/memory/) */
  memoryDir?: string;
  /** Custom global memory directory */
  globalMemoryDir?: string;
}
