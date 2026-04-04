import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { executeCommand, BashTool } from '../tools/bash.js';
import type { SecurityContext } from '../types.js';

const testContext: SecurityContext = {
  cwd: process.cwd(),
  permissionMode: 'auto',
  sandboxEnabled: false,
};

describe('BashTool', () => {
  describe('executeCommand', () => {
    it('should execute a simple command successfully', async () => {
      const result = await executeCommand('echo "hello world"', testContext);
      expect(result.isError).toBeFalsy();
      expect(result.content[0].text).toContain('hello world');
    });

    it('should capture stderr', async () => {
      const result = await executeCommand('echo "error" >&2', testContext);
      expect(result.isError).toBeFalsy();
      expect(result.content[0].text).toContain('[stderr]');
      expect(result.content[0].text).toContain('error');
    });

    it('should handle command failure', async () => {
      const result = await executeCommand('exit 1', testContext);
      expect(result.isError).toBe(true);
    });

    it('should reject empty commands', async () => {
      const result = await executeCommand('', testContext);
      expect(result.isError).toBe(true);
      expect(result.errorCode).toBe(1);
    });

    it('should reject dangerous commands', async () => {
      const result = await executeCommand('rm -rf /', testContext);
      expect(result.isError).toBe(true);
      expect(result.errorCode).toBe(2);
    });

    it('should handle timeout', async () => {
      const result = await executeCommand('sleep 10', testContext, { timeout: 100 });
      expect(result.isError).toBe(true);
      expect(result.errorCode).toBe(5);
    });

    it('should work with custom cwd', async () => {
      const result = await executeCommand('pwd', testContext, { cwd: '/tmp' });
      expect(result.isError).toBeFalsy();
      expect(result.content[0].text).toContain('/tmp');
    });

    it('should handle piped commands', async () => {
      const result = await executeCommand('echo "hello" | tr "a-z" "A-Z"', testContext);
      expect(result.isError).toBeFalsy();
      expect(result.content[0].text).toContain('HELLO');
    });
  });

  describe('tool definition', () => {
    it('should have correct name', () => {
      expect(BashTool.name).toBe('bash');
    });

    it('should have input schema', () => {
      expect(BashTool.inputSchema).toBeDefined();
      expect(BashTool.inputSchema.type).toBe('object');
      expect(BashTool.inputSchema.required).toContain('command');
    });

    it('should have description', () => {
      expect(BashTool.description).toBeTruthy();
      expect(BashTool.description.length).toBeGreaterThan(10);
    });

    it('should have a working handler', async () => {
      const result = await BashTool.handler({ command: 'echo test' });
      expect(result.isError).toBeFalsy();
      expect(result.content[0].text).toContain('test');
    });
  });
});
