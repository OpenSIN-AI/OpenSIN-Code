import { describe, it, expect } from 'vitest';
import { executeCommand, BashTool } from '../tools/bash.js';

const testContext = { cwd: process.cwd(), permissionMode: 'auto' as const, sandboxEnabled: false };

describe('BashTool', () => {
  it('should execute a simple command', async () => {
    const result = await executeCommand('echo hello', testContext);
    expect(result.isError).toBeFalsy();
    expect(result.output).toBe('hello');
  });

  it('should reject empty command', async () => {
    const result = await executeCommand('', testContext);
    expect(result.isError).toBe(true);
    expect(result.errorCode).toBe(1);
  });

  it('should block dangerous commands', async () => {
    const result = await executeCommand('rm -rf /', testContext);
    expect(result.isError).toBe(true);
    expect(result.errorCode).toBe(2);
  });

  it('should handle command failure', async () => {
    const result = await executeCommand('false', testContext);
    expect(result.isError).toBe(true);
  });

  it('should capture stderr', async () => {
    const result = await executeCommand('echo error >&2', testContext);
    expect(result.isError).toBeFalsy();
    expect(result.output).toContain('error');
  });
});

describe('BashTool execute', () => {
  it('should execute via tool definition', async () => {
    const result = await BashTool.execute({ command: 'echo tool test' });
    expect(result.isError).toBeFalsy();
    expect(result.output).toBe('tool test');
  });
});
