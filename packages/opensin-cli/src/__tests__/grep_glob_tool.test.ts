import { describe, it, expect, beforeEach } from 'vitest';
import { GlobTool } from '../tools/glob.js';
import { GrepTool } from '../tools/grep.js';
import { writeFile, rm, mkdir } from 'node:fs/promises';
import { join } from 'node:path';

describe('GlobTool & GrepTool', () => {
  const globTool = new GlobTool();
  const grepTool = new GrepTool();
  const testDir = '/tmp/opensin-cli-glob-test';

  beforeEach(async () => {
    await mkdir(join(testDir, 'src'), { recursive: true });
    await writeFile(join(testDir, 'src', 'index.ts'), 'export const foo = 1;\nexport const bar = 2;');
    await writeFile(join(testDir, 'src', 'util.ts'), 'export function helper() { return 42; }');
    await writeFile(join(testDir, 'README.md'), '# Project\nThis is a test project.');
    await writeFile(join(testDir, 'package.json'), '{"name":"test","version":"1.0.0"}');
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  describe('GlobTool', () => {
    it('should find TypeScript files', async () => {
      const result = await globTool.execute({
        pattern: 'src/*.ts',
        path: testDir,
      });
      expect(result.isError).toBeFalsy();
      expect(result.output).toContain('index.ts');
      expect(result.output).toContain('util.ts');
    });

    it('should find files recursively', async () => {
      const result = await globTool.execute({
        pattern: '**/*.md',
        path: testDir,
      });
      expect(result.isError).toBeFalsy();
      expect(result.output).toContain('README.md');
    });

    it('should return empty for no matches', async () => {
      const result = await globTool.execute({
        pattern: '**/*.xyz',
        path: testDir,
      });
      expect(result.isError).toBeFalsy();
    });

    it('should have valid JSON schema', () => {
      expect(globTool.parameters.properties.pattern.type).toBe('string');
      expect(globTool.parameters.properties.path).toBeDefined();
      expect(globTool.parameters.properties.ignore).toBeDefined();
    });
  });

  describe('GrepTool', () => {
    it('should find matching lines', async () => {
      const result = await grepTool.execute({
        pattern: 'export',
        path: join(testDir, 'src'),
      });
      expect(result.isError).toBeFalsy();
      expect(result.output).toContain('export');
    });

    it('should return results for single file via glob pattern', async () => {
      const result = await grepTool.execute({
        pattern: 'export',
        path: join(testDir, 'src'),
        include: 'index.ts',
      });
      expect(result.isError).toBeFalsy();
      expect(result.output).toContain('export');
    });

    it('should return error for missing path', async () => {
      const result = await grepTool.execute({
        pattern: 'test',
        path: '/tmp/nonexistent-grep-path',
      });
      expect(result.isError).toBe(true);
    });

    it('should support files_with_matches output mode', async () => {
      const result = await grepTool.execute({
        pattern: 'export',
        path: join(testDir, 'src'),
        outputMode: 'files_with_matches',
      });
      expect(result.isError).toBeFalsy();
    });

    it('should have valid JSON schema', () => {
      expect(grepTool.parameters.properties.pattern.type).toBe('string');
      expect(grepTool.parameters.properties.path.type).toBe('string');
      expect(grepTool.parameters.properties.include).toBeDefined();
      expect(grepTool.parameters.properties.exclude).toBeDefined();
    });
  });
});
