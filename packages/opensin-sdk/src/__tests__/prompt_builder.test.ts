import { describe, it, expect } from 'vitest';
import { PromptBuilder } from '../prompt_builder/builder';
import { injectContext } from '../prompt_builder/context_injector';
import { optimizeSections } from '../prompt_builder/optimizer';

describe('PromptBuilder', () => {
  it('builds prompt from sections', () => {
    const builder = new PromptBuilder();
    builder.addSection({ name: 'greeting', content: 'Hello, {{name}}!', priority: 10, variable: { name: 'World' } });
    const result = builder.build({});
    expect(result).toContain('Hello, World!');
  });

  it('sorts by priority', () => {
    const builder = new PromptBuilder();
    builder.addSection({ name: 'low', content: 'LOW', priority: 1 });
    builder.addSection({ name: 'high', content: 'HIGH', priority: 100 });
    const result = builder.build({});
    expect(result.indexOf('HIGH')).toBeLessThan(result.indexOf('LOW'));
  });

  it('respects maxTokens', () => {
    const builder = new PromptBuilder();
    builder.addSection({ name: 'big', content: 'A'.repeat(4000), priority: 10 });
    builder.addSection({ name: 'small', content: 'B', priority: 5 });
    const result = builder.build({}, 500);
    expect(result).not.toContain('B');
  });
});

describe('injectContext', () => {
  it('replaces variables', () => {
    const result = injectContext('Dir: {{cwd}}, Branch: {{gitBranch}}', {
      cwd: '/app',
      gitBranch: 'main',
    });
    expect(result).toBe('Dir: /app, Branch: main');
  });

  it('uses defaults for missing values', () => {
    const result = injectContext('Dir: {{cwd}}', {});
    expect(result).toContain('Dir: ');
  });
});

describe('optimizeSections', () => {
  it('keeps high priority sections within token limit', () => {
    const sections = [
      { name: 'high', content: 'HIGH', priority: 100 },
      { name: 'low', content: 'LOW', priority: 1 },
    ];
    const result = optimizeSections(sections, 1);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('high');
  });

  it('includes multiple sections if within limit', () => {
    const sections = [
      { name: 'a', content: 'A', priority: 10 },
      { name: 'b', content: 'B', priority: 5 },
    ];
    const result = optimizeSections(sections, 10);
    expect(result).toHaveLength(2);
  });
});

describe('prompt_builder exports', () => {
  it('exports all public API from index', async () => {
    const pb = await import('../prompt_builder/index');
    expect(pb.PromptBuilder).toBeDefined();
    expect(pb.optimizeSections).toBeDefined();
    expect(pb.injectContext).toBeDefined();
    expect(pb.SYSTEM_TEMPLATE).toBeDefined();
  });
});
