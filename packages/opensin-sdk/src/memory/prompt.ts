/**
 * System prompt injection for OpenSIN memory blocks.
 *
 * Renders memory blocks as XML into the system prompt so the agent
 * always has its persistent memory in-context.
 */

import type { MemoryBlock } from './memory.js';
import { MEMORY_INSTRUCTIONS } from './letta.js';

const LINE_NUMBER_WARNING =
  '# NOTE: Line numbers shown below (with arrows like "1→") are to help during editing. Do NOT include line number prefixes in your memory edit tool calls.';

/**
 * Render metadata about the current memory state.
 */
function renderMemoryMetadata(blocks: MemoryBlock[]): string {
  const now = new Date();

  const lastModified = blocks.reduce(
    (latest, block) => (block.lastModified > latest ? block.lastModified : latest),
    new Date(0),
  );

  return `<memory_metadata>
- The current system date is: ${now.toISOString()}
- Memory blocks were last modified: ${lastModified.toISOString()}
- Use memory tools to manage your memory blocks
</memory_metadata>`;
}

/**
 * Render all memory blocks as XML for system prompt injection.
 * Returns empty string if no blocks exist.
 */
export function renderMemoryBlocks(blocks: MemoryBlock[]): string {
  if (blocks.length === 0) {
    return '';
  }

  const parts: string[] = [
    MEMORY_INSTRUCTIONS,
    '',
    '<memory_blocks>',
    'The following memory blocks are currently engaged in your core memory unit:',
    '',
  ];

  for (const block of blocks) {
    // Escape XML special characters in description
    const desc = block.description
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;');

    // Number lines for editing reference
    const numberedValue = block.value
      ? block.value.split('\n').map((line, i) => `${i + 1}→ ${line}`).join('\n')
      : '';

    const memoryBlock = `<${block.label}>
<description>
${desc}
</description>
<metadata>
- chars_current=${block.value.length}
- chars_limit=${block.limit}
- read_only=${block.readOnly}
- scope=${block.scope}
</metadata>
<warning>
${LINE_NUMBER_WARNING}
</warning>
<value>
${numberedValue}
</value>
</${block.label}>`;

    parts.push(memoryBlock);
  }

  parts.push('</memory_blocks>');
  parts.push('');
  parts.push(renderMemoryMetadata(blocks));

  return parts.join('\n');
}
