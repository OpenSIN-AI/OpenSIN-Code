import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { grepSearch, GrepTool } from '../tools/grep.js';
import type { SecurityContext } from '../types.js';

const testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'opensin-grep-test-'));
const testContext: SecurityContext = {
  cwd: testDir,
  permissionMode: 'auto',
  sandboxEnabled: false,
};

beforeAll(() => {
  fs.writeFileSync(path.join(testDir, 'file1.ts'), 'const hello = "world";\nfunction test() {}\n');
  fs.writeFileSync(path.join(testDir, 'file2.ts'), 'const goodbye = "world";\nfunction other() {}\n');
  fs.writeFileSync(path.join(testDir, 'file3.js'), 'const hello = "js";\n');
  fs.writeFileSync(path.join(testDir, 'readme.md'), '# Hello\nThis is a readme\n');
});

afterAll(() => {
  fs.rmSync(testDir, { recursive: true, force: true });
});

describe('GrepTool', () => {
  describe('grepSearch', () => {
    it('should find files with matches', async () => {
      const result = await grepSearch('hello', testContext, { caseInsensitive: true });
      expect(result.isError).toBeFalsy();
      expect(result.content[0].text).toContain('Found');
      expect(result.content[0].text).toContain('file1.ts');
      expect(result.content[0].text).toContain('file3.js');
    });

    it('should show content matches', async () => {
      const result = await grepSearch('const', testContext, { outputMode: 'content' });
      expect(result.isError).toBeFalsy();
      expect(result.content[0].text).toContain('const');
    });

    it('should show count matches', async () => {
      const result = await grepSearch('const', testContext, { outputMode: 'count' });
      expect(result.isError).toBeFalsy();
      expect(result.content[0].text).toContain(':');
    });

    it('should filter by glob pattern', async () => {
      const result = await grepSearch('hello', testContext, { glob: '*.ts', caseInsensitive: true });
      expect(result.isError).toBeFalsy();
      expect(result.content[0].text).toContain('file1.ts');
      expect(result.content[0].text).not.toContain('file3.js');
    });

    it('should handle case sensitive search', async () => {
      const result = await grepSearch('Hello', testContext, { caseInsensitive: false });
      expect(result.isError).toBeFalsy();
      expect(result.content[0].text).toContain('readme.md');
      expect(result.content[0].text).not.toContain('file1.ts');
    });

    it('should handle no matches', async () => {
      const result = await grepSearch('zzzznotfound', testContext);
      expect(result.isError).toBeFalsy();
      expect(result.content[0].text).toContain('No files found');
    });

    it('should handle invalid regex', async () => {
      const result = await grepSearch('[invalid', testContext);
      expect(result.isError).toBe(true);
      expect(result.errorCode).toBe(2);
    });

    it('should handle empty pattern', async () => {
      const result = await grepSearch('', testContext);
      expect(result.isError).toBe(true);
      expect(result.errorCode).toBe(1);
    });

    it('should handle non-existent path', async () => {
      const result = await grepSearch('test', testContext, { path: '/nonexistent/path' });
      expect(result.isError).toBe(true);
      expect(result.errorCode).toBe(4);
    });

    it('should include metadata', async () => {
      const result = await grepSearch('const', testContext);
      expect(result.metadata).toBeDefined();
      expect(result.metadata?.filesSearched).toBeGreaterThan(0);
    });
  });

  describe('tool definition', () => {
    it('should have correct name', () => {
      expect(GrepTool.name).toBe('grep');
    });

    it('should have input schema', () => {
      expect(GrepTool.inputSchema).toBeDefined();
      expect(GrepTool.inputSchema.required).toContain('pattern');
    });

    it('should have a working handler', async () => {
      const result = await GrepTool.handler({ pattern: 'const', path: testDir });
      expect(result.isError).toBeFalsy();
      expect(result.content[0].text).toContain('Found');
    });
  });
});
