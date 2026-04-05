import { describe, it, expect } from 'vitest';
import { shouldSnip, snipOutput, DEFAULT_MAX_LINES, DEFAULT_MAX_CHARS, SNIPPABLE_COMMANDS } from '../tools_v2/SnipTool/index.js';

describe('shouldSnip', () => {
  it('should detect snippable commands', () => {
    expect(shouldSnip('git status')).toBe(true);
    expect(shouldSnip('npm install')).toBe(true);
    expect(shouldSnip('docker ps')).toBe(true);
    expect(shouldSnip('cargo build')).toBe(true);
    expect(shouldSnip('go test ./...')).toBe(true);
    expect(shouldSnip('find . -name "*.ts"')).toBe(true);
  });

  it('should handle sudo prefixed commands', () => {
    // sudo prefix is not handled by shouldSnip - it looks at first word
    expect(shouldSnip('sudo git status')).toBe(false);
    // But direct commands work
    expect(shouldSnip('git status')).toBe(true);
  });

  it('should handle complex commands', () => {
    expect(shouldSnip('npm run build -- --production')).toBe(true);
  });
});

describe('snipOutput', () => {
  it('should not snip short output', () => {
    const input = 'line1\nline2\nline3';
    const result = snipOutput(input, 50, 10000);
    expect(result).toBe(input);
  });

  it('should snip long output', () => {
    const lines = Array.from({ length: 100 }, (_, i) => `line-${i}`);
    const input = lines.join('\n');
    const result = snipOutput(input, 10, 10000);
    expect(result).toContain('[... 90 lines snipped');
    expect(result).toContain('line-0');
    expect(result).toContain('line-99');
  });

  it('should truncate by chars when needed', () => {
    const input = 'x'.repeat(20000);
    const result = snipOutput(input, 1000, 5000);
    expect(result.length).toBeLessThan(20000);
    expect(result).toContain('[... output truncated at 5000 chars ...]');
  });

  it('should use defaults', () => {
    const lines = Array.from({ length: 100 }, (_, i) => `line-${i}`);
    const input = lines.join('\n');
    const result = snipOutput(input, DEFAULT_MAX_LINES, DEFAULT_MAX_CHARS);
    expect(result).toContain('[...');
  });
});

describe('SNIPPABLE_COMMANDS', () => {
  it('should include common commands', () => {
    expect(SNIPPABLE_COMMANDS).toContain('git');
    expect(SNIPPABLE_COMMANDS).toContain('npm');
    expect(SNIPPABLE_COMMANDS).toContain('docker');
    expect(SNIPPABLE_COMMANDS).toContain('grep');
    expect(SNIPPABLE_COMMANDS).toContain('find');
  });
});
