import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { readFile, ReadTool } from '../tools/read.js';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

const testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cli-tools-read-'));
const testContext = { cwd: testDir, permissionMode: 'auto' as const, sandboxEnabled: false };

describe('ReadTool', () => {
  it('should read a file', async () => {
    const filePath = path.join(testDir, 'hello.txt');
    fs.writeFileSync(filePath, 'Hello World');
    const result = await readFile('hello.txt', testContext);
    expect(result.isError).toBeFalsy();
    expect(result.output).toContain('Hello World');
  });

  it('should show line numbers', async () => {
    const filePath = path.join(testDir, 'lines.txt');
    fs.writeFileSync(filePath, 'line1\nline2\nline3');
    const result = await readFile('lines.txt', testContext);
    expect(result.output).toContain('1: line1');
    expect(result.output).toContain('2: line2');
  });

  it('should handle non-existent file', async () => {
    const result = await readFile('nonexistent.txt', testContext);
    expect(result.isError).toBe(true);
    expect(result.errorCode).toBe(404);
  });

  it('should handle directory path', async () => {
    const result = await readFile(testDir, testContext);
    expect(result.isError).toBe(true);
    expect(result.errorCode).toBe(400);
  });

  it('should include metadata', async () => {
    const filePath = path.join(testDir, 'meta.txt');
    fs.writeFileSync(filePath, 'test');
    const result = await readFile('meta.txt', testContext);
    expect(result.metadata?.filePath).toBe(filePath);
    expect(result.metadata?.totalLines).toBe(1);
  });

  it('should handle empty file', async () => {
    const filePath = path.join(testDir, 'empty.txt');
    fs.writeFileSync(filePath, '');
    const result = await readFile('empty.txt', testContext);
    expect(result.isError).toBeFalsy();
    expect(result.output).toBe('(File is empty)');
  });
});

describe('ReadTool execute', () => {
  it('should execute via tool definition', async () => {
    const filePath = path.join(testDir, 'exec.txt');
    fs.writeFileSync(filePath, 'exec test');
    const result = await ReadTool.execute({ file_path: 'exec.txt' });
    expect(result.isError).toBeFalsy();
    expect(result.output).toContain('exec test');
  });
});
