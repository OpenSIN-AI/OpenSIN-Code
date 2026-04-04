import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { globSearch, GlobTool } from '../tools/glob.js';
import type { SecurityContext } from '../types.js';

const testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'opensin-glob-test-'));
const testContext: SecurityContext = {
  cwd: testDir,
  permissionMode: 'auto',
  sandboxEnabled: false,
};

beforeAll(() => {
  // Create test file structure
  fs.mkdirSync(path.join(testDir, 'src'), { recursive: true });
  fs.mkdirSync(path.join(testDir, 'src', 'components'), { recursive: true });
  fs.mkdirSync(path.join(testDir, 'tests'), { recursive: true });
  
  fs.writeFileSync(path.join(testDir, 'src', 'index.ts'), 'export {}');
  fs.writeFileSync(path.join(testDir, 'src', 'utils.ts'), 'export {}');
  fs.writeFileSync(path.join(testDir, 'src', 'components', 'App.tsx'), 'export {}');
  fs.writeFileSync(path.join(testDir, 'src', 'components', 'Button.tsx'), 'export {}');
  fs.writeFileSync(path.join(testDir, 'tests', 'index.test.ts'), 'test()');
  fs.writeFileSync(path.join(testDir, 'package.json'), '{}');
  fs.writeFileSync(path.join(testDir, 'README.md'), '# Test');
});

afterAll(() => {
  fs.rmSync(testDir, { recursive: true, force: true });
});

describe('GlobTool', () => {
  describe('globSearch', () => {
    it('should find files matching a simple pattern', async () => {
      const result = await globSearch('*.json', testContext);
      expect(result.isError).toBeFalsy();
      expect(result.content[0].text).toContain('package.json');
    });

    it('should find files with recursive pattern', async () => {
      const result = await globSearch('**/*.ts', testContext);
      expect(result.isError).toBeFalsy();
      expect(result.content[0].text).toContain('index.ts');
      expect(result.content[0].text).toContain('utils.ts');
      expect(result.content[0].text).toContain('index.test.ts');
    });

    it('should find tsx files', async () => {
      const result = await globSearch('**/*.tsx', testContext);
      expect(result.isError).toBeFalsy();
      expect(result.content[0].text).toContain('App.tsx');
      expect(result.content[0].text).toContain('Button.tsx');
    });

    it('should handle no matches', async () => {
      const result = await globSearch('**/*.xyz', testContext);
      expect(result.isError).toBeFalsy();
      expect(result.content[0].text).toContain('No files found');
    });

    it('should handle empty pattern', async () => {
      const result = await globSearch('', testContext);
      expect(result.isError).toBe(true);
      expect(result.errorCode).toBe(1);
    });

    it('should handle non-existent path', async () => {
      const result = await globSearch('*.ts', testContext, { path: '/nonexistent/path' });
      expect(result.isError).toBe(true);
      expect(result.errorCode).toBe(3);
    });

    it('should handle path that is not a directory', async () => {
      const result = await globSearch('*.ts', testContext, { path: path.join(testDir, 'package.json') });
      expect(result.isError).toBe(true);
      expect(result.errorCode).toBe(4);
    });

    it('should include metadata', async () => {
      const result = await globSearch('**/*.ts', testContext);
      expect(result.metadata).toBeDefined();
      expect(result.metadata?.totalFiles).toBeGreaterThan(0);
    });

    it('should handle alternation pattern', async () => {
      const result = await globSearch('**/*.{ts,tsx}', testContext);
      expect(result.isError).toBeFalsy();
      expect(result.content[0].text).toContain('.ts');
      expect(result.content[0].text).toContain('.tsx');
    });
  });

  describe('tool definition', () => {
    it('should have correct name', () => {
      expect(GlobTool.name).toBe('glob');
    });

    it('should have input schema', () => {
      expect(GlobTool.inputSchema).toBeDefined();
      expect(GlobTool.inputSchema.required).toContain('pattern');
    });

    it('should have a working handler', async () => {
      const result = await GlobTool.handler({ pattern: '*.json', path: testDir });
      expect(result.isError).toBeFalsy();
      expect(result.content[0].text).toContain('package.json');
    });
  });
});
