import { describe, it, expect } from 'vitest';
import { writeFile, WriteTool } from '../tools/write.js';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

const testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cli-tools-write-'));
const testContext = { cwd: testDir, permissionMode: 'auto' as const, sandboxEnabled: false };

describe('WriteTool', () => {
  it('should create a new file', async () => {
    const filePath = path.join(testDir, 'new.txt');
    const result = await writeFile(filePath, 'hello world', testContext);
    expect(result.isError).toBeFalsy();
    expect(fs.readFileSync(filePath, 'utf8')).toBe('hello world');
  });

  it('should overwrite an existing file', async () => {
    const filePath = path.join(testDir, 'overwrite.txt');
    fs.writeFileSync(filePath, 'old content');
    const result = await writeFile(filePath, 'new content', testContext);
    expect(result.isError).toBeFalsy();
    expect(result.output).toContain('updated');
    expect(fs.readFileSync(filePath, 'utf8')).toBe('new content');
  });

  it('should create parent directories', async () => {
    const filePath = path.join(testDir, 'nested', 'dir', 'file.txt');
    const result = await writeFile(filePath, 'nested content', testContext);
    expect(result.isError).toBeFalsy();
    expect(fs.readFileSync(filePath, 'utf8')).toBe('nested content');
  });

  it('should reject null content', async () => {
    const result = await writeFile('test.txt', null as any, testContext);
    expect(result.isError).toBe(true);
    expect(result.errorCode).toBe(1);
  });

  it('should include metadata', async () => {
    const filePath = path.join(testDir, 'meta.txt');
    const result = await writeFile(filePath, 'line1\nline2', testContext);
    expect(result.isError).toBeFalsy();
    expect(result.metadata?.type).toBe('create');
    expect(result.metadata?.lineCount).toBe(2);
  });
});

describe('WriteTool execute', () => {
  it('should execute via tool definition', async () => {
    const result = await WriteTool.execute({ file_path: `${testDir}/exec.txt`, content: 'exec test' });
    expect(result.isError).toBeFalsy();
    expect(fs.readFileSync(path.join(testDir, 'exec.txt'), 'utf8')).toBe('exec test');
  });
});
