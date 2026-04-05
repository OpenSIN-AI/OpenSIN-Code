import { describe, it, expect, beforeEach } from 'vitest';
import { createSnippetsManager, SnippetsManager } from '../snippets/index.js';

describe('SnippetsManager', () => {
  let sm: SnippetsManager;

  beforeEach(() => {
    sm = createSnippetsManager('/tmp/test-snippets');
  });

  it('should initialize without errors', async () => {
    await expect(sm.init()).resolves.not.toThrow();
  });

  it('should list built-in snippets', async () => {
    await sm.init();
    const snippets = sm.list();
    expect(snippets.length).toBeGreaterThan(0);
    const names = snippets.map(s => s.name);
    expect(names).toContain('review');
    expect(names).toContain('test');
    expect(names).toContain('docs');
    expect(names).toContain('fix');
  });

  it('should get a specific snippet', async () => {
    await sm.init();
    const snippet = sm.get('review');
    expect(snippet).toBeDefined();
    expect(snippet!.name).toBe('review');
  });

  it('should expand snippets in text', async () => {
    await sm.init();
    const result = await sm.expand('#review');
    expect(result.length).toBeGreaterThan(10);
    expect(result.toLowerCase()).toContain('review');
  });

  it('should return original text when no snippets found', async () => {
    await sm.init();
    const result = await sm.expand('Hello world, no snippets here');
    expect(result).toBe('Hello world, no snippets here');
  });

  it('should add custom snippets', async () => {
    await sm.init();
    await sm.add({
      name: 'custom-test',
      content: 'Custom test content',
      description: 'A custom test snippet',
    });
    const snippet = sm.get('custom-test');
    expect(snippet).toBeDefined();
    expect(snippet!.content).toBe('Custom test content');
  });

  it('should remove custom snippets', async () => {
    await sm.init();
    await sm.add({
      name: 'to-remove',
      content: 'Will be removed',
      description: 'Test',
    });
    const result = await sm.remove('to-remove');
    expect(result).toBe(true);
    expect(sm.get('to-remove')).toBeUndefined();
  });

  it('should not remove non-existent snippets', async () => {
    await sm.init();
    const result = await sm.remove('does-not-exist');
    expect(result).toBe(false);
  });

  it('should expand snippets with arguments', async () => {
    await sm.init();
    const result = await sm.expand('#review(lang=python)');
    expect(result).not.toContain('$lang');
  });
});
