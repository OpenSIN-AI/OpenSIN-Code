import { describe, it, expect } from 'vitest';
import { renderStatusBar, renderStatusLine } from '../terminal_ui/status_bar';
import { renderMarkdown } from '../terminal_ui/markdown_renderer';

describe('status_bar', () => {
  it('renders full status bar', () => {
    const result = renderStatusBar({
      model: 'gpt-5.4',
      tokenCount: 12500,
      cost: 0.0375,
      sessionName: 'test-session',
    });
    expect(result).toContain('Model: gpt-5.4');
    expect(result).toContain('Tokens: 12.500');
    expect(result).toContain('Cost: $0.0375');
    expect(result).toContain('Session: test-session');
  });

  it('renders minimal status bar', () => {
    const result = renderStatusBar({
      model: 'gpt-5.4',
      tokenCount: 0,
      cost: 0,
    });
    expect(result).toBe('Model: gpt-5.4');
  });

  it('renders status line with padding', () => {
    const result = renderStatusLine({
      model: 'gpt-5.4',
      tokenCount: 100,
      cost: 0.001,
    });
    expect(result).toContain('Model: gpt-5.4');
    expect(result).toContain('Tokens: 100');
  });
});

describe('markdown_renderer', () => {
  it('renders headings', () => {
    const result = renderMarkdown('# Title\n## Subtitle\n### Section');
    expect(result).toContain('TITLE');
    expect(result).toContain('Subtitle');
    expect(result).toContain('Section');
  });

  it('renders lists', () => {
    const result = renderMarkdown('- Item 1\n- Item 2\n* Item 3');
    expect(result).toContain('• Item 1');
    expect(result).toContain('• Item 2');
    expect(result).toContain('• Item 3');
  });

  it('renders code blocks', () => {
    const result = renderMarkdown('```typescript\ncode here\n```');
    expect(result).toContain('[typescript code block]');
  });

  it('renders blockquotes', () => {
    const result = renderMarkdown('> This is a quote');
    expect(result).toContain('> This is a quote');
  });

  it('renders numbered lists', () => {
    const result = renderMarkdown('1. First\n2. Second');
    expect(result).toContain('1. First');
    expect(result).toContain('2. Second');
  });

  it('preserves empty lines', () => {
    const result = renderMarkdown('Line 1\n\nLine 2');
    expect(result).toContain('Line 1');
    expect(result).toContain('Line 2');
  });
});

describe('terminal_ui exports', () => {
  it('exports all public API from index', async () => {
    const tui = await import('../terminal_ui/index');
    expect(tui.renderStatusBar).toBeDefined();
    expect(tui.renderStatusLine).toBeDefined();
    expect(tui.renderMarkdown).toBeDefined();
  });
});
