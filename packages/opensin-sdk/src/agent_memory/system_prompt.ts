/**
 * OpenSIN Agent Memory — System Prompt Integration
 *
 * Integrates memory blocks into the system prompt builder.
 * Memory is auto-injected at session start.
 *
 * Branded as OpenSIN/sincode.
 */

import { MemoryManager } from '../agent_memory/index.js';
import { MEMORY_INSTRUCTIONS } from '../agent_memory/letta.js';
import type { AgentMemoryConfig } from '../agent_memory/types.js';

/**
 * Build the full memory section for system prompt injection.
 * Combines Letta-style instructions with actual memory block content.
 */
export async function buildMemoryPromptSection(
  config: AgentMemoryConfig,
): Promise<string> {
  try {
    const manager = new MemoryManager(config);
    await manager.initialize();

    const memoryContent = await manager.buildPromptSection();
    if (!memoryContent) {
      return '';
    }

    return `\n${MEMORY_INSTRUCTIONS}\n\n${memoryContent}\n`;
  } catch {
    // If memory system fails, return empty string — don't break the prompt
    return '';
  }
}

/**
 * Append memory section to an existing system prompt array.
 * Used by the system prompt builder to inject memory at session start.
 */
export async function appendMemoryToSystemPrompt(
  promptParts: string[],
  config: AgentMemoryConfig,
): Promise<string[]> {
  const memorySection = await buildMemoryPromptSection(config);
  if (!memorySection) {
    return promptParts;
  }

  return [...promptParts, memorySection];
}
