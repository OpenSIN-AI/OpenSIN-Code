import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import {
  BashTool, ReadTool, WriteTool, EditTool, GrepTool, GlobTool,
  ALL_CLI_TOOLS, getToolByName, getToolNames,
  isDangerousCommand, validateFilePath, isProtectedPath,
} from '../index.js';
import type { SecurityContext } from './types.js';

const testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'opensin-test-'));
const testContext: SecurityContext = { cwd: testDir, permissionMode: 'auto', sandboxEnabled: false };

beforeAll(() => {
  fs.mkdirSync(path.join(testDir, 'src'), { recursive: true });
  fs.writeFileSync(path.join(testDir, 'hello.txt'), 'line 1\nline 2\nline 3\n');
  fs.writeFileSync(path.join(testDir, 'src', 'app.ts'), 'const hello = "world";\n');
  fs.writeFileSync(path.join(testDir, 'src', 'utils.ts'), 'export function add(a: number, b: number) { return a + b; }\n');
  fs.writeFileSync(path.join(testDir, 'package.json'), '{"name": "test"}\n');
});

afterAll(() => { fs.rmSync(testDir, { recursive: true, force: true }); });

describe('Tool Registry', () => {
  it('has 6 tools', () => { expect(ALL_CLI_TOOLS).toHaveLength(6); });
  it('has correct names', () => {
    ['bash', 'read', 'write', 'edit', 'grep', 'glob'].forEach(n => expect(ALL_CLI_TOOLS.some(t => t.name === n)).toBe(true));
  });
  it('gets tool by name', () => { expect(getToolByName('bash')).toBeDefined(); expect(getToolByName('nonexistent')).toBeUndefined(); });
  it('lists tool names', () => { expect(getToolNames()).toEqual(['bash', 'read', 'write', 'edit', 'grep', 'glob']); });
});

describe('Security', () => {
  it('detects dangerous commands', () => {
    expect(isDangerousCommand('rm -rf /')).toBe(true);
    expect(isDangerousCommand('ls -la')).toBe(false);
  });
  it('detects protected paths', () => {
    expect(isProtectedPath('/etc/passwd')).toBe(true);
    expect(isProtectedPath('/home/user/file.txt')).toBe(false);
  });
  it('validates paths', () => {
    expect(validateFilePath('src/app.ts', testContext).allowed).toBe(true);
    expect(validateFilePath('/etc/passwd', testContext).allowed).toBe(false);
  });
});

describe('BashTool', () => {
  it('has correct schema', () => {
    expect(BashTool.name).toBe('bash');
    expect(BashTool.inputSchema.required).toContain('command');
  });
  it('executes commands', async () => {
    const r = await BashTool.handler({ command: 'echo hello' });
    expect(r.isError).toBeFalsy();
    expect(r.content[0].text).toContain('hello');
  });
  it('handles errors', async () => {
    const r = await BashTool.handler({ command: 'false' });
    expect(r.isError).toBe(true);
  });
  it('blocks dangerous', async () => {
    const r = await BashTool.handler({ command: 'rm -rf /' });
    expect(r.isError).toBe(true);
    expect(r.errorCode).toBe(2);
  });
  it('respects cwd', async () => {
    const r = await BashTool.handler({ command: 'pwd', cwd: '/tmp' });
    expect(r.isError).toBeFalsy();
    expect(r.content[0].text).toContain('/tmp');
  });
  it('handles timeout', async () => {
    const r = await BashTool.handler({ command: 'sleep 10', timeout: 100 });
    expect(r.isError).toBe(true);
    expect(r.errorCode).toBe(5);
  });
});

describe('ReadTool', () => {
  it('reads a file', async () => {
    const r = await ReadTool.handler({ file_path: path.join(testDir, 'hello.txt') });
    expect(r.isError).toBeFalsy();
    expect(r.content[0].text).toContain('line 1');
  });
  it('supports offset', async () => {
    const r = await ReadTool.handler({ file_path: path.join(testDir, 'hello.txt'), offset: 2 });
    expect(r.content[0].text).toContain('2: line 2');
    expect(r.content[0].text).not.toContain('1: line 1');
  });
  it('supports limit', async () => {
    const r = await ReadTool.handler({ file_path: path.join(testDir, 'hello.txt'), limit: 1 });
    expect(r.content[0].text).toContain('line 1');
    expect(r.content[0].text).not.toContain('line 2');
  });
  it('errors on nonexistent', async () => {
    const r = await ReadTool.handler({ file_path: '/nonexistent/file.txt' });
    expect(r.isError).toBe(true);
  });
  it('blocks sensitive paths', async () => {
    const r = await ReadTool.handler({ file_path: '/etc/passwd' });
    expect(r.isError).toBe(true);
  });
});

describe('WriteTool', () => {
  it('creates a file', async () => {
    const fp = path.join(testDir, 'new.txt');
    const r = await WriteTool.handler({ file_path: fp, content: 'hello' });
    expect(r.isError).toBeFalsy();
    expect(fs.readFileSync(fp, 'utf8')).toBe('hello');
  });
  it('overwrites a file', async () => {
    const fp = path.join(testDir, 'overwrite.txt');
    fs.writeFileSync(fp, 'old');
    const r = await WriteTool.handler({ file_path: fp, content: 'new' });
    expect(r.isError).toBeFalsy();
    expect(fs.readFileSync(fp, 'utf8')).toBe('new');
  });
  it('creates parent dirs', async () => {
    const fp = path.join(testDir, 'deep', 'nested', 'file.txt');
    const r = await WriteTool.handler({ file_path: fp, content: 'nested' });
    expect(r.isError).toBeFalsy();
    expect(fs.readFileSync(fp, 'utf8')).toBe('nested');
  });
  it('blocks sensitive paths', async () => {
    const r = await WriteTool.handler({ file_path: '/etc/shadow', content: 'x' });
    expect(r.isError).toBe(true);
  });
});

describe('EditTool', () => {
  it('edits a file', async () => {
    const fp = path.join(testDir, 'edit.txt');
    fs.writeFileSync(fp, 'hello world');
    const r = await EditTool.handler({ file_path: fp, old_string: 'hello', new_string: 'goodbye' });
    expect(r.isError).toBeFalsy();
    expect(fs.readFileSync(fp, 'utf8')).toBe('goodbye world');
  });
  it('errors when not found', async () => {
    const fp = path.join(testDir, 'edit.txt');
    const r = await EditTool.handler({ file_path: fp, old_string: 'nonexistent', new_string: 'x' });
    expect(r.isError).toBe(true);
  });
  it('errors when identical', async () => {
    const fp = path.join(testDir, 'edit.txt');
    const r = await EditTool.handler({ file_path: fp, old_string: 'hello', new_string: 'hello' });
    expect(r.isError).toBe(true);
  });
  it('replaces all', async () => {
    const fp = path.join(testDir, 'multi.txt');
    fs.writeFileSync(fp, 'foo foo foo');
    const r = await EditTool.handler({ file_path: fp, old_string: 'foo', new_string: 'bar', replace_all: true });
    expect(r.isError).toBeFalsy();
    expect(fs.readFileSync(fp, 'utf8')).toBe('bar bar bar');
  });
  it('errors on multiple without replace_all', async () => {
    const fp = path.join(testDir, 'multi.txt');
    fs.writeFileSync(fp, 'foo foo foo');
    const r = await EditTool.handler({ file_path: fp, old_string: 'foo', new_string: 'bar' });
    expect(r.isError).toBe(true);
  });
});

describe('GrepTool', () => {
  it('finds matches', async () => {
    const r = await GrepTool.handler({ pattern: 'hello', path: testDir });
    expect(r.isError).toBeFalsy();
    expect(r.content[0].text).toContain('Found');
    expect(r.content[0].text).toContain('app.ts');
  });
  it('shows content', async () => {
    const r = await GrepTool.handler({ pattern: 'hello', path: testDir, output_mode: 'content' });
    expect(r.isError).toBeFalsy();
    expect(r.content[0].text).toContain('hello');
  });
  it('no matches', async () => {
    const r = await GrepTool.handler({ pattern: 'zzzzz', path: testDir });
    expect(r.content[0].text).toContain('No files found');
  });
  it('empty pattern error', async () => {
    const r = await GrepTool.handler({ pattern: '' });
    expect(r.isError).toBe(true);
  });
});

describe('GlobTool', () => {
  it('finds files', async () => {
    const r = await GlobTool.handler({ pattern: '*.ts', path: path.join(testDir, 'src') });
    expect(r.isError).toBeFalsy();
    expect(r.content[0].text).toContain('app.ts');
    expect(r.content[0].text).toContain('utils.ts');
  });
  it('finds json files', async () => {
    const r = await GlobTool.handler({ pattern: '*.json', path: testDir });
    expect(r.isError).toBeFalsy();
    expect(r.content[0].text).toContain('package.json');
  });
  it('no matches', async () => {
    const r = await GlobTool.handler({ pattern: '**/*.xyz', path: testDir });
    expect(r.content[0].text).toContain('No files found');
  });
  it('empty pattern error', async () => {
    const r = await GlobTool.handler({ pattern: '' });
    expect(r.isError).toBe(true);
  });
});
