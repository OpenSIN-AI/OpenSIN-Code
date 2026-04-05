import { describe, it, expect, beforeEach } from 'vitest';
import { createSnippetsManager } from '../snippets/index.js';

describe('Snippets - Advanced', () => {
  let sm: ReturnType<typeof createSnippetsManager>;
  let counter = 0;

  beforeEach(() => {
    counter++;
    sm = createSnippetsManager(`/tmp/test-snippets-adv-${counter}`);
  });

  it('should expand multiple snippets in one text', async () => {
    await sm.init();
    const result = await sm.expand('#review and #test this code');
    expect(result).toContain('Review');
    expect(result).toContain('test');
  });

  it('should handle text with no snippets', async () => {
    await sm.init();
    const result = await sm.expand('Just plain text without any snippets');
    expect(result).toBe('Just plain text without any snippets');
  });

  it('should handle unknown snippet names', async () => {
    await sm.init();
    const result = await sm.expand('#nonexistent-snippet');
    expect(result).toBe('#nonexistent-snippet');
  });

  it('should list all built-in snippets', async () => {
    await sm.init();
    const snippets = sm.list();
    const names = snippets.map(s => s.name);
    const expectedBuiltins = ['review', 'test', 'docs', 'refactor', 'fix', 'explain', 'type', 'lint', 'git', 'context'];
    for (const name of expectedBuiltins) {
      expect(names).toContain(name);
    }
  });

  it('should handle adding duplicate snippet names', async () => {
    await sm.init();
    await sm.add({ name: 'custom', content: 'First', description: 'First', mode: 'primary' as any });
    await sm.add({ name: 'custom', content: 'Second', description: 'Second', mode: 'primary' as any });
    const snippet = sm.get('custom');
    expect(snippet!.content).toBe('Second');
  });

  it('should expand snippets with arguments', async () => {
    await sm.init();
    const result = await sm.expand('#review(lang=python, strict=true)');
    expect(result).not.toContain('$lang');
    expect(result).not.toContain('$strict');
  });
});
