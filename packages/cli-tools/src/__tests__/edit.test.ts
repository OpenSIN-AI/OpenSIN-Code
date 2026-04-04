import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { editFile, EditTool } from '../tools/edit.js';
import type { SecurityContext } from '../types.js';

const testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'opensin-edit-test-'));
const testContext: SecurityContext = {
  cwd: testDir,
  permissionMode: 'auto',
  sandboxEnabled: false,
};

beforeAll(() => {
  fs.writeFileSync(path.join(testDir, 'edit-me.txt'), 'Hello World\nThis is a test file\nHello World again\n');
});

afterAll(() => {
  fs.rmSync(testDir, { recursive: true, force: true });
});

describe('EditTool', () => {
  describe('editFile', () => {
    it('should replace a string in a file', async () => {
      const filePath = path.join(testDir, 'edit-me.txt');
      const result = await editFile(filePath, 'Hello World', 'Goodbye World', testContext);
      expect(result.isError).toBeFalsy();
      expect(result.content[0].text).toContain('edited successfully');
      expect(fs.readFileSync(filePath, 'utf8')).toContain('Goodbye World');
    });

    it('should reject when old_string equals new_string', async () => {
      const filePath = path.join(testDir, 'edit-me.txt');
      const result = await editFile(filePath, 'same', 'same', testContext);
      expect(result.isError).toBe(true);
      expect(result.errorCode).toBe(1);
    });

    it('should reject when string not found', async () => {
      const filePath = path.join(testDir, 'edit-me.txt');
      const result = await editFile(filePath, 'nonexistent string xyz', 'replacement', testContext);
      expect(result.isError).toBe(true);
      expect(result.errorCode).toBe(8);
    });

    it('should reject multiple matches without replace_all', async () => {
      const filePath = path.join(testDir, 'multi.txt');
      fs.writeFileSync(filePath, 'foo\nfoo\nfoo\n');
      const result = await editFile(filePath, 'foo', 'bar', testContext);
      expect(result.isError).toBe(true);
      expect(result.errorCode).toBe(9);
    });

    it('should replace all occurrences with replace_all', async () => {
      const filePath = path.join(testDir, 'multi.txt');
      fs.writeFileSync(filePath, 'foo\nfoo\nfoo\n');
      const result = await editFile(filePath, 'foo', 'bar', testContext, { replaceAll: true });
      expect(result.isError).toBeFalsy();
      expect(fs.readFileSync(filePath, 'utf8')).toBe('bar\nbar\nbar\n');
    });

    it('should handle non-existent file', async () => {
      const result = await editFile(path.join(testDir, 'does-not-exist.txt'), 'old', 'new', testContext);
      expect(result.isError).toBe(true);
      expect(result.errorCode).toBe(6);
    });

    it('should include diff in output', async () => {
      const filePath = path.join(testDir, 'edit-me.txt');
      fs.writeFileSync(filePath, 'original content\n');
      const result = await editFile(filePath, 'original', 'modified', testContext);
      expect(result.isError).toBeFalsy();
      expect(result.content[0].text).toContain('---');
      expect(result.content[0].text).toContain('+++');
    });

    it('should include metadata', async () => {
      const filePath = path.join(testDir, 'edit-me.txt');
      fs.writeFileSync(filePath, 'test content\n');
      const result = await editFile(filePath, 'test', 'edited', testContext);
      expect(result.metadata).toBeDefined();
      expect(result.metadata?.type).toBe('update');
    });
  });

  describe('tool definition', () => {
    it('should have correct name', () => {
      expect(EditTool.name).toBe('edit');
    });

    it('should have input schema', () => {
      expect(EditTool.inputSchema).toBeDefined();
      expect(EditTool.inputSchema.required).toContain('file_path');
      expect(EditTool.inputSchema.required).toContain('old_string');
      expect(EditTool.inputSchema.required).toContain('new_string');
    });

    it('should have a working handler', async () => {
      const filePath = path.join(testDir, 'handler-edit.txt');
      fs.writeFileSync(filePath, 'before');
      const result = await EditTool.handler({ file_path: filePath, old_string: 'before', new_string: 'after' });
      expect(result.isError).toBeFalsy();
      expect(fs.readFileSync(filePath, 'utf8')).toBe('after');
    });
  });
});
