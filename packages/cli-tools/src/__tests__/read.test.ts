import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { readFile, ReadTool } from '../tools/read.js';
import type { SecurityContext } from '../types.js';

const testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'opensin-read-test-'));
const testContext: SecurityContext = {
  cwd: testDir,
  permissionMode: 'auto',
  sandboxEnabled: false,
};

beforeAll(() => {
  // Create test files
  fs.writeFileSync(path.join(testDir, 'hello.txt'), 'line 1\nline 2\nline 3\nline 4\nline 5\n');
  fs.writeFileSync(path.join(testDir, 'empty.txt'), '');
  fs.writeFileSync(path.join(testDir, 'subdir', 'nested.txt'), 'nested content\n'), { recursive: true };
});

afterAll(() => {
  fs.rmSync(testDir, { recursive: true, force: true });
});

describe('ReadTool', () => {
  describe('readFile', () => {
    it('should read a file successfully', async () => {
      const result = await readFile('hello.txt', testContext);
      expect(result.isError).toBeFalsy();
      expect(result.content[0].text).toContain('line 1');
      expect(result.content[0].text).toContain('line 5');
    });

    it('should show line numbers', async () => {
      const result = await readFile('hello.txt', testContext);
      expect(result.content[0].text).toContain('1: line 1');
      expect(result.content[0].text).toContain('5: line 5');
    });

    it('should handle offset', async () => {
      const result = await readFile('hello.txt', testContext, { offset: 3 });
      expect(result.content[0].text).toContain('3: line 3');
      expect(result.content[0].text).not.toContain('line 1');
    });

    it('should handle limit', async () => {
      const result = await readFile('hello.txt', testContext, { limit: 2 });
      expect(result.content[0].text).toContain('line 1');
      expect(result.content[0].text).toContain('line 2');
      expect(result.content[0].text).not.toContain('line 3');
    });

    it('should handle offset and limit together', async () => {
      const result = await readFile('hello.txt', testContext, { offset: 2, limit: 2 });
      expect(result.content[0].text).toContain('2: line 2');
      expect(result.content[0].text).toContain('3: line 3');
      expect(result.content[0].text).not.toContain('line 1');
      expect(result.content[0].text).not.toContain('line 4');
    });

    it('should handle empty files', async () => {
      const result = await readFile('empty.txt', testContext);
      expect(result.isError).toBeFalsy();
      expect(result.content[0].text).toContain('empty');
    });

    it('should handle non-existent files', async () => {
      const result = await readFile('nonexistent.txt', testContext);
      expect(result.isError).toBe(true);
      expect(result.errorCode).toBe(4);
    });

    it('should handle directories', async () => {
      const result = await readFile('subdir', testContext);
      expect(result.isError).toBe(true);
      expect(result.errorCode).toBe(5);
    });

    it('should include metadata', async () => {
      const result = await readFile('hello.txt', testContext);
      expect(result.metadata).toBeDefined();
      expect(result.metadata?.totalLines).toBe(5);
    });
  });

  describe('tool definition', () => {
    it('should have correct name', () => {
      expect(ReadTool.name).toBe('read');
    });

    it('should have input schema', () => {
      expect(ReadTool.inputSchema).toBeDefined();
      expect(ReadTool.inputSchema.required).toContain('file_path');
    });

    it('should have a working handler', async () => {
      const result = await ReadTool.handler({ file_path: path.join(testDir, 'hello.txt') });
      expect(result.isError).toBeFalsy();
      expect(result.content[0].text).toContain('line 1');
    });
  });
});
