import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { sessionSearch, formatTimestamp, truncateAroundMatches } from '../hermes_memory/session_search.js';

describe('sessionSearch', () => {
  let testDir: string;
  let counter = 0;

  beforeEach(() => {
    counter++;
    testDir = `/tmp/test-sessions-${counter}`;
  });

  afterEach(async () => {
    try {
      const fs = await import('node:fs/promises');
      await fs.rm(testDir, { recursive: true, force: true });
    } catch { /* ignore */ }
  });

  it('should return empty results when no sessions exist', async () => {
    const result = await sessionSearch('', undefined, 3, undefined, testDir);
    const parsed = JSON.parse(result);
    expect(parsed.success).toBe(true);
    expect(parsed.count).toBe(0);
  });

  it('should list recent sessions when query is empty', async () => {
    const fs = await import('node:fs/promises');
    await fs.mkdir(testDir, { recursive: true });
    await fs.writeFile(`${testDir}/session-1.json`, JSON.stringify({
      id: 'session-1',
      title: 'Test Session 1',
      source: 'cli',
      started_at: Date.now() / 1000,
      message_count: 10,
      preview: 'User asked about Python',
    }));
    const result = await sessionSearch('', undefined, 3, undefined, testDir);
    const parsed = JSON.parse(result);
    expect(parsed.success).toBe(true);
    expect(parsed.mode).toBe('recent');
    expect(parsed.count).toBe(1);
    expect(parsed.results[0].title).toBe('Test Session 1');
  });

  it('should exclude hidden session sources', async () => {
    const fs = await import('node:fs/promises');
    await fs.mkdir(testDir, { recursive: true });
    await fs.writeFile(`${testDir}/tool-session.json`, JSON.stringify({
      id: 'tool-session',
      title: 'Tool Session',
      source: 'tool',
      started_at: Date.now() / 1000,
    }));
    const result = await sessionSearch('', undefined, 3, undefined, testDir);
    const parsed = JSON.parse(result);
    expect(parsed.count).toBe(0);
  });

  it('should exclude current session', async () => {
    const fs = await import('node:fs/promises');
    await fs.mkdir(testDir, { recursive: true });
    await fs.writeFile(`${testDir}/current.json`, JSON.stringify({
      id: 'current-session',
      title: 'Current Session',
      source: 'cli',
      started_at: Date.now() / 1000,
    }));
    const result = await sessionSearch('', undefined, 3, 'current-session', testDir);
    const parsed = JSON.parse(result);
    expect(parsed.count).toBe(0);
  });

  it('should search sessions by keyword', async () => {
    const fs = await import('node:fs/promises');
    await fs.mkdir(testDir, { recursive: true });
    await fs.writeFile(`${testDir}/session-1.json`, JSON.stringify({
      id: 'session-1',
      title: 'Python Debug Session',
      source: 'cli',
      started_at: Date.now() / 1000,
      messages: [
        { role: 'user', content: 'How do I debug Python?' },
        { role: 'assistant', content: 'Use pdb or print statements.' },
      ],
    }));
    const result = await sessionSearch('python', undefined, 3, undefined, testDir);
    const parsed = JSON.parse(result);
    expect(parsed.success).toBe(true);
    expect(parsed.count).toBe(1);
    expect(parsed.results[0].summary).toContain('Python');
  });

  it('should not find non-matching sessions', async () => {
    const fs = await import('node:fs/promises');
    await fs.mkdir(testDir, { recursive: true });
    await fs.writeFile(`${testDir}/session-1.json`, JSON.stringify({
      id: 'session-1',
      title: 'JavaScript Session',
      source: 'cli',
      started_at: Date.now() / 1000,
      messages: [
        { role: 'user', content: 'How do I use React?' },
      ],
    }));
    const result = await sessionSearch('python', undefined, 3, undefined, testDir);
    const parsed = JSON.parse(result);
    expect(parsed.count).toBe(0);
  });

  it('should respect role_filter', async () => {
    const fs = await import('node:fs/promises');
    await fs.mkdir(testDir, { recursive: true });
    await fs.writeFile(`${testDir}/session-1.json`, JSON.stringify({
      id: 'session-1',
      title: 'Mixed Session',
      source: 'cli',
      started_at: Date.now() / 1000,
      messages: [
        { role: 'user', content: 'Tell me about Python' },
        { role: 'assistant', content: 'Python is a programming language.' },
        { role: 'tool', content: 'Very long tool output here' },
      ],
    }));
    const result = await sessionSearch('python', 'user', 3, undefined, testDir);
    const parsed = JSON.parse(result);
    expect(parsed.success).toBe(true);
  });
});

describe('formatTimestamp', () => {
  it('should format Unix timestamp', () => {
    const result = formatTimestamp(1700000000);
    expect(result).toContain('2023');
  });

  it('should handle null', () => {
    expect(formatTimestamp(null)).toBe('unknown');
  });

  it('should handle undefined', () => {
    expect(formatTimestamp(undefined)).toBe('unknown');
  });

  it('should handle ISO string', () => {
    const result = formatTimestamp('2024-01-15T10:30:00Z');
    expect(result).toContain('2024');
  });
});

describe('truncateAroundMatches', () => {
  it('should return full text if under limit', () => {
    const text = 'Short text';
    expect(truncateAroundMatches(text, 'text')).toBe(text);
  });

  it('should truncate around match', () => {
    const text = 'A'.repeat(50000) + 'MATCH' + 'B'.repeat(50000);
    const result = truncateAroundMatches(text, 'match', 1000);
    expect(result).toContain('MATCH');
    expect(result.length).toBeLessThan(text.length);
  });

  it('should add prefix/suffix when truncating', () => {
    const text = 'A'.repeat(50000) + 'MATCH' + 'B'.repeat(50000);
    const result = truncateAroundMatches(text, 'match', 1000);
    expect(result).toContain('truncated');
  });
});
