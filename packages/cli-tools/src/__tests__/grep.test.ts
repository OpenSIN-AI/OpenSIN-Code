import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { grepContent, GrepTool } from '../tools/grep.js';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

const testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cli-tools-grep-'));
const testContext = { cwd: testDir, permissionMode: 'auto' as const, sandboxEnabled: false };

beforeAll(() => {
  fs.writeFileSync(path.join(testDir, 'hello.txt'), 'hello world\nfoo bar');
  fs.writeFileSync(path.join(testDir, 'data.txt'), 'hello data\nbaz qux');
});

describe('GrepTool', () => {
  it('should find matches', async () => {
    const result = await grepContent('hello', testContext, { path: testDir });
    expect(result.isError).toBeFalsy();
    expect(result.output).toContain('hello');
  });

  it('should handle no matches', async () => {
    const result = await grepContent('zzzzz', testContext, { path: testDir });
    expect(result.output).toContain('No matches found');
  });

  it('should handle non-existent path', async () => {
    const result = await grepContent('test', testContext, { path: '/nonexistent' });
    expect(result.isError).toBe(true);
  });
});

describe('GrepTool execute', () => {
  it('should execute via tool definition', async () => {
    const result = await GrepTool.execute({ pattern: 'hello', path: testDir });
    expect(result.isError).toBeFalsy();
    expect(result.output).toContain('hello');
  });
});
