import { describe, it, expect } from 'vitest';
import { editFile, EditTool } from '../tools/edit.js';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

const testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cli-tools-edit-'));
const testContext = { cwd: testDir, permissionMode: 'auto' as const, sandboxEnabled: false };

describe('EditTool', () => {
  it('should replace a string in a file', async () => {
    const filePath = path.join(testDir, 'edit.txt');
    fs.writeFileSync(filePath, 'hello world');
    const result = await editFile(filePath, 'world', 'earth', testContext);
    expect(result.isError).toBeFalsy();
    expect(fs.readFileSync(filePath, 'utf8')).toBe('hello earth');
  });

  it('should reject when string not found', async () => {
    const filePath = path.join(testDir, 'nofind.txt');
    fs.writeFileSync(filePath, 'hello world');
    const result = await editFile(filePath, 'missing', 'earth', testContext);
    expect(result.isError).toBe(true);
    expect(result.errorCode).toBe(5);
  });

  it('should reject multiple matches', async () => {
    const filePath = path.join(testDir, 'multi.txt');
    fs.writeFileSync(filePath, 'foo bar foo');
    const result = await editFile(filePath, 'foo', 'baz', testContext);
    expect(result.isError).toBe(true);
    expect(result.errorCode).toBe(6);
  });

  it('should handle non-existent file', async () => {
    const result = await editFile('nonexistent.txt', 'old', 'new', testContext);
    expect(result.isError).toBe(true);
    expect(result.errorCode).toBe(404);
  });

  it('should include metadata', async () => {
    const filePath = path.join(testDir, 'meta.txt');
    fs.writeFileSync(filePath, 'old');
    const result = await editFile(filePath, 'old', 'new', testContext);
    expect(result.isError).toBeFalsy();
    expect(result.metadata?.filePath).toBe(filePath);
    expect(result.metadata?.occurrences).toBe(1);
  });
});

describe('EditTool execute', () => {
  it('should execute via tool definition', async () => {
    const filePath = path.join(testDir, 'exec.txt');
    fs.writeFileSync(filePath, 'hello');
    const result = await EditTool.execute({ file_path: `${testDir}/exec.txt`, old_string: 'hello', new_string: 'world' });
    expect(result.isError).toBeFalsy();
    expect(fs.readFileSync(filePath, 'utf8')).toBe('world');
  });
});
