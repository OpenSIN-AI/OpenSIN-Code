import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { mkdirSync, writeFileSync, rmSync, existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { BashTool, ReadTool, WriteTool, EditTool, GrepTool, GlobTool, ALL_CLI_TOOLS, getTool, listTools, isCommandSafe, isPathSafe, safeResolvePath } from '../index.js';

const TD = join(process.cwd(), 'test-cli-tmp');
beforeAll(() => {
  if (!existsSync(TD)) mkdirSync(TD, { recursive: true });
  writeFileSync(join(TD, 'hello.txt'), 'Hello World\nLine 2\nLine 3\nLine 4\nLine 5\n');
  writeFileSync(join(TD, 'test.js'), 'const x = 1;\nconst y = 2;\n');
  writeFileSync(join(TD, 'test.ts'), 'const a: number = 1;\n');
  mkdirSync(join(TD, 'subdir'), { recursive: true });
  writeFileSync(join(TD, 'subdir', 'nested.txt'), 'Nested content\n');
});
afterAll(() => { if (existsSync(TD)) rmSync(TD, { recursive: true, force: true }); });

describe('Tool Registry', () => {
  it('has 6 tools', () => expect(ALL_CLI_TOOLS).toHaveLength(6));
  it('has correct names', () => {
    const names = ALL_CLI_TOOLS.map(t => t.name);
    ['bash','read','write','edit','grep','glob'].forEach(n => expect(names).toContain(n));
  });
  it('gets tool by name', () => { expect(getTool('bash')).toBeDefined(); expect(getTool('nope')).toBeUndefined(); });
  it('lists tools with schema', () => {
    const tools = listTools();
    expect(tools).toHaveLength(6);
    tools.forEach(t => { expect(t.name).toBeDefined(); expect(t.inputSchema.type).toBe('object'); });
  });
});

describe('Security', () => {
  it('blocks dangerous', () => { expect(isCommandSafe('rm -rf /').allowed).toBe(false); expect(isCommandSafe('echo hi').allowed).toBe(true); });
  it('blocks sensitive paths', () => { expect(isPathSafe('/etc/shadow').allowed).toBe(false); expect(isPathSafe('/tmp/x.txt').allowed).toBe(true); });
  it('resolves paths', () => expect(safeResolvePath('t.txt', '/tmp')).toBe('/tmp/t.txt'));
});

describe('BashTool', () => {
  it('has correct schema', () => { expect(BashTool.name).toBe('bash'); expect(BashTool.inputSchema.required).toContain('command'); });
  it('executes commands', async () => { const r = await BashTool.execute({ command: 'echo hello' }); expect(r.isError).toBe(false); expect(r.output).toContain('hello'); });
  it('handles errors', async () => { const r = await BashTool.execute({ command: 'nonexistent_cmd_xyz' }); expect(r.isError).toBe(true); });
  it('blocks dangerous', async () => { const r = await BashTool.execute({ command: 'rm -rf /' }); expect(r.isError).toBe(true); expect(r.errorCode).toBe(403); });
  it('respects cwd', async () => { const r = await BashTool.execute({ command: 'pwd', cwd: TD }); expect(r.isError).toBe(false); expect(r.output).toContain(TD); });
  it('handles timeout', async () => { const r = await BashTool.execute({ command: 'sleep 10', timeout: 100 }); expect(r.isError).toBe(true); expect(r.errorCode).toBe(408); });
});

describe('ReadTool', () => {
  it('reads a file', async () => { const r = await ReadTool.execute({ file_path: join(TD, 'hello.txt') }); expect(r.isError).toBe(false); expect(r.output).toContain('1: Hello World'); });
  it('supports offset', async () => { const r = await ReadTool.execute({ file_path: join(TD, 'hello.txt'), offset: 3 }); expect(r.isError).toBe(false); expect(r.output).toContain('3: Line 3'); expect(r.output).not.toContain('1: Hello World'); });
  it('supports limit', async () => { const r = await ReadTool.execute({ file_path: join(TD, 'hello.txt'), limit: 2 }); expect(r.isError).toBe(false); expect(r.output.split('\n').filter(l => /^\d+:/.test(l)).length).toBe(2); });
  it('errors on nonexistent', async () => { const r = await ReadTool.execute({ file_path: '/nonexistent/file.txt' }); expect(r.isError).toBe(true); expect(r.errorCode).toBe(404); });
  it('blocks sensitive paths', async () => { const r = await ReadTool.execute({ file_path: '/etc/shadow' }); expect(r.isError).toBe(true); expect(r.errorCode).toBe(403); });
});

describe('WriteTool', () => {
  it('creates a file', async () => { const fp = join(TD, 'new.txt'); const r = await WriteTool.execute({ file_path: fp, content: 'Hello' }); expect(r.isError).toBe(false); expect(r.output).toContain('created'); expect(readFileSync(fp, 'utf-8')).toBe('Hello'); });
  it('overwrites a file', async () => { const fp = join(TD, 'ow.txt'); await WriteTool.execute({ file_path: fp, content: 'old' }); const r = await WriteTool.execute({ file_path: fp, content: 'new' }); expect(r.isError).toBe(false); expect(readFileSync(fp, 'utf-8')).toBe('new'); });
  it('creates parent dirs', async () => { const fp = join(TD, 'deep', 'dir', 'f.txt'); const r = await WriteTool.execute({ file_path: fp, content: 'nested' }); expect(r.isError).toBe(false); expect(existsSync(fp)).toBe(true); });
  it('blocks sensitive paths', async () => { const r = await WriteTool.execute({ file_path: '/etc/shadow', content: 'x' }); expect(r.isError).toBe(true); expect(r.errorCode).toBe(403); });
});

describe('EditTool', () => {
  it('edits a file', async () => { const fp = join(TD, 'ed.txt'); writeFileSync(fp, 'Hello World\n'); const r = await EditTool.execute({ file_path: fp, old_string: 'Hello', new_string: 'Hi' }); expect(r.isError).toBe(false); expect(readFileSync(fp, 'utf-8')).toContain('Hi World'); });
  it('errors when not found', async () => { const fp = join(TD, 'ed.txt'); const r = await EditTool.execute({ file_path: fp, old_string: 'NOTFOUND', new_string: 'x' }); expect(r.isError).toBe(true); expect(r.errorCode).toBe(404); });
  it('errors when identical', async () => { const r = await EditTool.execute({ file_path: join(TD, 'ed.txt'), old_string: 'x', new_string: 'x' }); expect(r.isError).toBe(true); expect(r.errorCode).toBe(400); });
  it('replaces all', async () => { const fp = join(TD, 'ea.txt'); writeFileSync(fp, 'foo bar foo'); const r = await EditTool.execute({ file_path: fp, old_string: 'foo', new_string: 'qux', replace_all: true }); expect(r.isError).toBe(false); expect(readFileSync(fp, 'utf-8')).toBe('qux bar qux'); });
  it('errors on multiple without replace_all', async () => { const fp = join(TD, 'em.txt'); writeFileSync(fp, 'foo bar foo'); const r = await EditTool.execute({ file_path: fp, old_string: 'foo', new_string: 'qux' }); expect(r.isError).toBe(true); expect(r.errorCode).toBe(409); });
});

describe('GrepTool', () => {
  it('finds matches', async () => { const r = await GrepTool.execute({ pattern: 'Hello', path: TD, output_mode: 'files_with_matches' }); expect(r.isError).toBe(false); expect(r.output).toContain('hello.txt'); });
  it('shows content', async () => { const r = await GrepTool.execute({ pattern: 'Hello', path: TD, output_mode: 'content' }); expect(r.isError).toBe(false); expect(r.output).toContain('Hello World'); });
  it('no matches', async () => { const r = await GrepTool.execute({ pattern: 'zzznotfound', path: TD }); expect(r.isError).toBe(false); expect(r.output).toContain('No matches found'); });
  it('empty pattern error', async () => { const r = await GrepTool.execute({ pattern: '' }); expect(r.isError).toBe(true); expect(r.errorCode).toBe(400); });
});

describe('GlobTool', () => {
  it('finds files', async () => { const r = await GlobTool.execute({ pattern: '**/*.txt', path: TD }); expect(r.isError).toBe(false); expect(r.output).toContain('hello.txt'); expect(r.output).toContain('nested.txt'); });
  it('finds js files', async () => { const r = await GlobTool.execute({ pattern: '**/*.js', path: TD }); expect(r.isError).toBe(false); expect(r.output).toContain('test.js'); });
  it('no matches', async () => { const r = await GlobTool.execute({ pattern: '**/*.xyz', path: TD }); expect(r.isError).toBe(false); expect(r.output).toContain('No files found'); });
  it('empty pattern error', async () => { const r = await GlobTool.execute({ pattern: '' }); expect(r.isError).toBe(true); expect(r.errorCode).toBe(400); });
});
