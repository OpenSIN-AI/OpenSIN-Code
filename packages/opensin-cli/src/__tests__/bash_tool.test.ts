import { describe, it, expect } from 'vitest';
import { BashTool } from '../tools/bash.js';

describe('BashTool', () => {
  const tool = new BashTool();

  it('should have correct name and description', () => {
    expect(tool.name).toBe('Bash');
    expect(tool.description).toBeTruthy();
  });

  it('should execute a simple echo command', async () => {
    const result = await tool.execute({ command: 'echo "hello world"' });
    expect(result.output).toContain('hello world');
    expect(result.isError).toBeFalsy();
  });

  it('should return error for non-zero exit', async () => {
    const result = await tool.execute({ command: 'exit 1' });
    expect(result.isError).toBe(true);
  });

  it('should handle commands with special characters', async () => {
    const result = await tool.execute({ command: 'echo $((2 + 2))' });
    expect(result.output.trim()).toBe('4');
  });

  it('should have valid JSON schema parameters', () => {
    expect(tool.parameters).toHaveProperty('type', 'object');
    expect(tool.parameters).toHaveProperty('properties');
    expect(tool.parameters.properties).toHaveProperty('command');
  });

  it('should support background mode', async () => {
    const result = await tool.execute({ command: 'echo background', background: true });
    expect(result.isError).toBeFalsy();
  });
});
