import { describe, it, expect, beforeAll } from 'vitest';
import { globFiles, GlobTool } from '../tools/glob.js';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

const testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cli-tools-glob-'));
const testContext = { cwd: testDir, permissionMode: 'auto' as const, sandboxEnabled: false };

beforeAll(() => {
  fs.writeFileSync(path.join(testDir, 'file.ts'), 'export const a = 1;');
  fs.writeFileSync(path.join(testDir, 'file.js'), 'const b = 2;');
  fs.mkdirSync(path.join(testDir, 'src'), { recursive: true });
  fs.writeFileSync(path.join(testDir, 'src', 'app.ts'), 'import {a} from "../file";');
  fs.writeFileSync(path.join(testDir, 'src', 'app.tsx'), 'export const App = () => null;');
});

describe('GlobTool', () => {
  it('should find files matching a simple pattern', async () => {
    const result = await globFiles('*.ts', testContext, { path: testDir });
    expect(result.isError).toBeFalsy();
    expect(result.output).toContain('file.ts');
  });

  it('should find files with recursive pattern', async () => {
    const result = await globFiles('**/*.ts', testContext, { path: testDir });
    expect(result.isError).toBeFalsy();
    expect(result.output).toContain('src/app.ts');
  });

  it('should handle no matches', async () => {
    const result = await globFiles('*.xyz', testContext, { path: testDir });
    expect(result.isError).toBeFalsy();
    expect(result.output).toContain('No files matched');
  });

  it('should handle non-existent path', async () => {
    const result = await globFiles('*.ts', testContext, { path: '/nonexistent' });
    expect(result.isError).toBe(true);
  });
});

describe('GlobTool execute', () => {
  it('should execute via tool definition', async () => {
    const result = await GlobTool.execute({ pattern: '*.ts', path: testDir });
    expect(result.isError).toBeFalsy();
    expect(result.output).toContain('file.ts');
  });
});
