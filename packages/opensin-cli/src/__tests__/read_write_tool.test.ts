import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { WriteTool } from '../tools/write.js';
import { ReadTool } from '../tools/read.js';
import { rm, writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';

describe('WriteTool & ReadTool', () => {
  const writeTool = new WriteTool();
  const readTool = new ReadTool();
  const testDir = '/tmp/opensin-cli-test';
  const testFile = join(testDir, 'test.txt');
  const testContent = 'Hello, OpenSIN!\nLine 2\nLine 3';

  beforeEach(async () => {
    await mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  describe('WriteTool', () => {
    it('should write content to a file', async () => {
      const result = await writeTool.execute({ path: testFile, content: testContent });
      expect(result.isError).toBeFalsy();
      expect(result.output).toContain('test.txt');
    });

    it('should create parent directories', async () => {
      const nestedFile = join(testDir, 'nested', 'deep', 'file.txt');
      const result = await writeTool.execute({ path: nestedFile, content: 'nested content' });
      expect(result.isError).toBeFalsy();
    });

    it('should have valid JSON schema', () => {
      expect(writeTool.parameters.properties.path.type).toBe('string');
      expect(writeTool.parameters.properties.content.type).toBe('string');
      expect(writeTool.parameters.required).toContain('path');
      expect(writeTool.parameters.required).toContain('content');
    });
  });

  describe('ReadTool', () => {
    it('should read file content', async () => {
      await writeFile(testFile, testContent);
      const result = await readTool.execute({ path: testFile });
      expect(result.isError).toBeFalsy();
      expect(result.output).toContain('Hello, OpenSIN');
    });

    it('should return error for missing file', async () => {
      const result = await readTool.execute({ path: '/tmp/nonexistent-file-12345.txt' });
      expect(result.isError).toBe(true);
    });

    it('should support line range selection', async () => {
      await writeFile(testFile, 'line1\nline2\nline3\nline4\nline5');
      const result = await readTool.execute({ path: testFile, startLine: 1, endLine: 2 });
      expect(result.output).toContain('line2');
      expect(result.output).not.toContain('line5');
    });

    it('should have valid JSON schema', () => {
      expect(readTool.parameters.properties.path.type).toBe('string');
      expect(readTool.parameters.properties.startLine.type).toBe('number');
      expect(readTool.parameters.properties.endLine.type).toBe('number');
    });
  });
});
