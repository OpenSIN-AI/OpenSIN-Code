/**
 * Tests for OpenSIN memory prompt rendering.
 */

import { describe, it, expect } from 'vitest';
import { renderMemoryBlocks } from './prompt';
import type { MemoryBlock } from './memory';

describe('renderMemoryBlocks', () => {
  it('returns empty string for no blocks', () => {
    expect(renderMemoryBlocks([])).toBe('');
  });

  it('renders blocks with XML structure', () => {
    const blocks: MemoryBlock[] = [
      {
        scope: 'global',
        label: 'persona',
        description: 'Agent persona',
        limit: 5000,
        readOnly: false,
        value: 'I am a helpful assistant.',
        filePath: '/tmp/persona.md',
        lastModified: new Date('2026-01-01'),
      },
    ];

    const result = renderMemoryBlocks(blocks);
    expect(result).toContain('<memory_blocks>');
    expect(result).toContain('<persona>');
    expect(result).toContain('<description>');
    expect(result).toContain('Agent persona');
    expect(result).toContain('<value>');
    expect(result).toContain('I am a helpful assistant.');
    expect(result).toContain('</memory_blocks>');
    expect(result).toContain('<memory_metadata>');
  });

  it('escapes XML special characters in description', () => {
    const blocks: MemoryBlock[] = [
      {
        scope: 'project',
        label: 'test',
        description: 'Use <foo> & "bar"',
        limit: 1000,
        readOnly: false,
        value: '',
        filePath: '/tmp/test.md',
        lastModified: new Date(),
      },
    ];

    const result = renderMemoryBlocks(blocks);
    expect(result).toContain('&lt;foo&gt;');
    expect(result).toContain('&amp;');
  });

  it('includes line numbers in value', () => {
    const blocks: MemoryBlock[] = [
      {
        scope: 'project',
        label: 'numbered',
        description: 'Test',
        limit: 1000,
        readOnly: false,
        value: 'line one\nline two',
        filePath: '/tmp/numbered.md',
        lastModified: new Date(),
      },
    ];

    const result = renderMemoryBlocks(blocks);
    expect(result).toContain('1→ line one');
    expect(result).toContain('2→ line two');
  });

  it('includes metadata for each block', () => {
    const blocks: MemoryBlock[] = [
      {
        scope: 'global',
        label: 'meta-test',
        description: 'Test',
        limit: 3000,
        readOnly: true,
        value: 'content',
        filePath: '/tmp/meta.md',
        lastModified: new Date(),
      },
    ];

    const result = renderMemoryBlocks(blocks);
    expect(result).toContain('chars_current=7');
    expect(result).toContain('chars_limit=3000');
    expect(result).toContain('read_only=true');
    expect(result).toContain('scope=global');
  });
});
