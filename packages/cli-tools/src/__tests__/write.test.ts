import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { writeFile, WriteTool } from '../tools/write.js';
import type { SecurityContext } from '../types.js';

const testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'opensin-write-test-'));
const testContext: SecurityContext = {
  cwd: testDir,
  permissionMode: 'auto',
  sandboxEnabled: false,
};

afterAll(() => {
  fs.rmSync(testDir, { recursive: true, force: true });
});

describe('WriteTool', () => {
  describe('writeFile', () => {
    it('should create a new file', async () => {
      const filePath = path.join(testDir, 'new-file.txt');
      const result = await writeFile(filePath, 'hello world', testContext);
      expect(result.isError).toBeFalsy();
      expect(result.content[0].text).toContain('created');
      expect(fs.existsSync(filePath)).toBe(true);
      expect(fs.readFileSync(filePath, 'utf8')).toBe('hello world');
    });

    it('should overwrite an existing file', async () => {
      const filePath = path.join(testDir, 'existing.txt');
      fs.writeFileSync(filePath, 'old content');
      
      const result = await writeFile(filePath, 'new content', testContext);
      expect(result.isError).toBeFalsy();
      expect(result.content[0].text).toContain('updated');
      expect(fs.readFileSync(filePath, 'utf8')).toBe('new content');
    });

    it('should create parent directories', async () => {
      const filePath = path.join(testDir, 'deep', 'nested', 'dir', 'file.txt');
      const result = await writeFile(filePath, 'nested content', testContext);
      expect(result.isError).toBeFalsy();
      expect(fs.existsSync(filePath)).toBe(true);
    });

    it('should handle empty content', async () => {
      const filePath = path.join(testDir, 'empty.txt');
      const result = await writeFile(filePath, '', testContext);
      expect(result.isError).toBeFalsy();
      expect(fs.readFileSync(filePath, 'utf8')).toBe('');
    });

    it('should handle multiline content', async () => {
      const filePath = path.join(testDir, 'multiline.txt');
      const content = 'line 1\nline 2\nline 3\n';
      const result = await writeFile(filePath, content, testContext);
      expect(result.isError).toBeFalsy();
      expect(fs.readFileSync(filePath, 'utf8')).toBe(content);
    });

    it('should include metadata', async () => {
      const filePath = path.join(testDir, 'meta.txt');
      const result = await writeFile(filePath, 'test', testContext);
      expect(result.metadata).toBeDefined();
      expect(result.metadata?.type).toBe('create');
      expect(result.metadata?.filePath).toBe(filePath);
    });

    it('should reject null content', async () => {
      const filePath = path.join(testDir, 'null.txt');
      const result = await writeFile(filePath, null as unknown as string, testContext);
      expect(result.isError).toBe(true);
      expect(result.errorCode).toBe(1);
    });
  });

  describe('tool definition', () => {
    it('should have correct name', () => {
      expect(WriteTool.name).toBe('write');
    });

    it('should have input schema', () => {
      expect(WriteTool.inputSchema).toBeDefined();
      expect(WriteTool.inputSchema.required).toContain('file_path');
      expect(WriteTool.inputSchema.required).toContain('content');
    });

    it('should have a working handler', async () => {
      const filePath = path.join(testDir, 'handler-test.txt');
      const result = await WriteTool.handler({ file_path: filePath, content: 'handler test' });
      expect(result.isError).toBeFalsy();
      expect(fs.existsSync(filePath)).toBe(true);
    });
  });
});
