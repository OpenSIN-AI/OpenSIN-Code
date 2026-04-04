/**
 * Tests for all 6 CLI tools.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { mkdirSync, writeFileSync, rmSync, existsSync, readFileSync } from 'fs';
import { join } from 'path';
import {
  BashTool,
  ReadTool,
  WriteTool,
  EditTool,
  GrepTool,
  GlobTool,
  ALL_CLI_TOOLS,
  getTool,
  listTools,
  isCommandSafe,
  isPathSafe,
  safeResolvePath,
} from '../index.js';

const TEST_DIR = join(process.cwd(), 'test-cli-tools-tmp');

beforeAll(() => {
  if (!existsSync(TEST_DIR)) {
    mkdirSync(TEST_DIR, { recursive: true });
  }
  writeFileSync(join(TEST_DIR, 'hello.txt'), 'Hello World\nLine 2\nLine 3\nLine 4\nLine 5\n');
  writeFileSync(join(TEST_DIR, 'test.js'), 'const x = 1;\nconst y = 2;\nconsole.log(x + y);\n');
  writeFileSync(join(TEST_DIR, 'test.ts'), 'const a: number = 1;\nconst b: number = 2;\nconsole.log(a + b);\n');
  mkdirSync(join(TEST_DIR, 'subdir'), { recursive: true });
  writeFileSync(join(TEST_DIR, 'subdir', 'nested.txt'), 'Nested file content\n');
});

afterAll(() => {
  if (existsSync(TEST_DIR)) {
    rmSync(TEST_DIR, { recursive: true, force: true });
  }
});

describe('Tool Registry', () => {
  it('should have exactly 6 tools', () => {
    expect(ALL_CLI_TOOLS).toHaveLength(6);
  });

  it('should have all expected tool names', () => {
    const names = ALL_CLI_TOOLS.map(t => t.name);
    expect(names).toContain('bash');
    expect(names).toContain('read');
    expect(names).toContain('write');
    expect(names).toContain('edit');
    expect(names).toContain('grep');
    expect(names).toContain('glob');
  });

  it('should get tool by name', () => {
    expect(getTool('bash')).toBeDefined();
    expect(getTool('read')).toBeDefined();
    expect(getTool('write')).toBeDefined();
    expect(getTool('edit')).toBeDefined();
    expect(getTool('grep')).toBeDefined();
    expect(getTool('glob')).toBeDefined();
    expect(getTool('nonexistent')).toBeUndefined();
  });

  it('should list tools with schema', () => {
    const tools = listTools();
    expect(tools).toHaveLength(6);
    for (const tool of tools) {
      expect(tool.name).toBeDefined();
      expect(tool.description).toBeDefined();
      expect(tool.inputSchema).toBeDefined();
      expect(tool.inputSchema.type).toBe('object');
    }
  });
});

describe('Security', () => {
  it('should block dangerous commands', () => {
    expect(isCommandSafe('rm -rf /').allowed).toBe(false);
    expect(isCommandSafe('rm -rf /*').allowed).toBe(false);
    expect(isCommandSafe('ls -la').allowed).toBe(true);
    expect(isCommandSafe('echo hello').allowed).toBe(true);
  });

  it('should block sensitive paths', () => {
    expect(isPathSafe('/etc/shadow').allowed).toBe(false);
    expect(isPathSafe('/etc/passwd').allowed).toBe(false);
    expect(isPathSafe('/root/.ssh/id_rsa').allowed).toBe(false);
  });

  it('should allow normal paths', () => {
    expect(isPathSafe('/tmp/test.txt').allowed).toBe(true);
    expect(isPathSafe('/Users/test/project/file.ts').allowed).toBe(true);
  });

  it('should resolve paths safely', () => {
    const resolved = safeResolvePath('test.txt', '/tmp');
    expect(resolved).toBe('/tmp/test.txt');
  });
});

describe('BashTool', () => {
  it('should have correct schema', () => {
    expect(BashTool.name).toBe('bash');
    expect(BashTool.inputSchema.required).toContain('command');
    expect(BashTool.inputSchema.properties.command).toBeDefined();
  });

  it('should execute simple commands', async () => {
    const result = await BashTool.execute({ command: 'echo hello' });
    expect(result.isError).toBe(false);
    expect(result.output).toContain('hello');
  });

  it('should handle command errors', async () => {
    const result = await BashTool.execute({ command: 'nonexistent_command_xyz' });
    expect(result.isError).toBe(true);
  });

  it('should block dangerous commands', async () => {
    const result = await BashTool.execute({ command: 'rm -rf /' });
    expect(result.isError).toBe(true);
    expect(result.errorCode).toBe(403);
  });

  it('should respect cwd', async () => {
    const result = await BashTool.execute({ command: 'pwd', cwd: TEST_DIR });
    expect(result.isError).toBe(false);
    expect(result.output).toContain(TEST_DIR);
  });

  it('should handle timeout', async () => {
    const result = await BashTool.execute({ command: 'sleep 10', timeout: 100 });
    expect(result.isError).toBe(true);
    expect(result.errorCode).toBe(408);
  });
});

describe('ReadTool', () => {
  it('should have correct schema', () => {
    expect(ReadTool.name).toBe('read');
    expect(ReadTool.inputSchema.required).toContain('file_path');
  });

  it('should read a file', async () => {
    const result = await ReadTool.execute({ file_path: join(TEST_DIR, 'hello.txt') });
    expect(result.isError).toBe(false);
    expect(result.output).toContain('1: Hello World');
    expect(result.output).toContain('2: Line 2');
  });

  it('should support offset', async () => {
    const result = await ReadTool.execute({ file_path: join(TEST_DIR, 'hello.txt'), offset: 3 });
    expect(result.isError).toBe(false);
    expect(result.output).toContain('3: Line 3');
    expect(result.output).not.toContain('1: Hello World');
  });

  it('should support limit', async () => {
    const result = await ReadTool.execute({ file_path: join(TEST_DIR, 'hello.txt'), limit: 2 });
    expect(result.isError).toBe(false);
    const lines = result.output.split('\n').filter(l => /^\d+:/.test(l));
    expect(lines.length).toBe(2);
  });

  it('should error on nonexistent file', async () => {
    const result = await ReadTool.execute({ file_path: '/nonexistent/file.txt' });
    expect(result.isError).toBe(true);
    expect(result.errorCode).toBe(404);
  });

  it('should block sensitive paths', async () => {
    const result = await ReadTool.execute({ file_path: '/etc/shadow' });
    expect(result.isError).toBe(true);
    expect(result.errorCode).toBe(403);
  });
});

describe('WriteTool', () => {
  it('should have correct schema', () => {
    expect(WriteTool.name).toBe('write');
    expect(WriteTool.inputSchema.required).toContain('file_path');
    expect(WriteTool.inputSchema.required).toContain('content');
  });

  it('should create a new file', async () => {
    const filePath = join(TEST_DIR, 'new-file.txt');
    const result = await WriteTool.execute({ file_path: filePath, content: 'Hello from test' });
    expect(result.isError).toBe(false);
    expect(result.output).toContain('created');
    expect(existsSync(filePath)).toBe(true);
    expect(readFileSync(filePath, 'utf-8')).toBe('Hello from test');
  });

  it('should overwrite an existing file', async () => {
    const filePath = join(TEST_DIR, 'overwrite.txt');
    await WriteTool.execute({ file_path: filePath, content: 'original' });
    const result = await WriteTool.execute({ file_path: filePath, content: 'updated' });
    expect(result.isError).toBe(false);
    expect(result.output).toContain('updated');
    expect(readFileSync(filePath, 'utf-8')).toBe('updated');
  });

  it('should create parent directories', async () => {
    const filePath = join(TEST_DIR, 'deep', 'nested', 'dir', 'file.txt');
    const result = await WriteTool.execute({ file_path: filePath, content: 'nested content' });
    expect(result.isError).toBe(false);
    expect(existsSync(filePath)).toBe(true);
  });

  it('should block sensitive paths', async () => {
    const result = await WriteTool.execute({ file_path: '/etc/shadow', content: 'hacked' });
    expect(result.isError).toBe(true);
    expect(result.errorCode).toBe(403);
  });
});

describe('EditTool', () => {
  it('should have correct schema', () => {
    expect(EditTool.name).toBe('edit');
    expect(EditTool.inputSchema.required).toContain('file_path');
    expect(EditTool.inputSchema.required).toContain('old_string');
    expect(EditTool.inputSchema.required).toContain('new_string');
  });

  it('should edit a file', async () => {
    const filePath = join(TEST_DIR, 'edit-test.txt');
    writeFileSync(filePath, 'Hello World\nGoodbye World\n');
    const result = await EditTool.execute({ file_path: filePath, old_string: 'Hello World', new_string: 'Hi World' });
    expect(result.isError).toBe(false);
    expect(result.output).toContain('edited successfully');
    expect(readFileSync(filePath, 'utf-8')).toContain('Hi World');
  });

  it('should error when old_string not found', async () => {
    const filePath = join(TEST_DIR, 'edit-test.txt');
    const result = await EditTool.execute({ file_path: filePath, old_string: 'NOT IN FILE', new_string: 'replacement' });
    expect(result.isError).toBe(true);
    expect(result.errorCode).toBe(404);
  });

  it('should error when old_string equals new_string', async () => {
    const result = await EditTool.execute({ file_path: join(TEST_DIR, 'edit-test.txt'), old_string: 'same', new_string: 'same' });
    expect(result.isError).toBe(true);
    expect(result.errorCode).toBe(400);
  });

  it('should replace all occurrences', async () => {
    const filePath = join(TEST_DIR, 'edit-all.txt');
    writeFileSync(filePath, 'foo bar foo baz foo');
    const result = await EditTool.execute({ file_path: filePath, old_string: 'foo', new_string: 'qux', replace_all: true });
    expect(result.isError).toBe(false);
    expect(readFileSync(filePath, 'utf-8')).toBe('qux bar qux baz qux');
  });

  it('should error on multiple matches without replace_all', async () => {
    const filePath = join(TEST_DIR, 'edit-multi.txt');
    writeFileSync(filePath, 'foo bar foo');
    const result = await EditTool.execute({ file_path: filePath, old_string: 'foo', new_string: 'qux', replace_all: false });
    expect(result.isError).toBe(true);
    expect(result.errorCode).toBe(409);
    expect(result.output).toContain('2 occurrences');
  });
});

describe('GrepTool', () => {
  it('should have correct schema', () => {
    expect(GrepTool.name).toBe('grep');
    expect(GrepTool.inputSchema.required).toContain('pattern');
  });

  it('should find files with matches', async () => {
    const result = await GrepTool.execute({ pattern: 'Hello', path: TEST_DIR, output_mode: 'files_with_matches' });
    expect(result.isError).toBe(false);
    expect(result.output).toContain('hello.txt');
  });

  it('should show content matches', async () => {
    const result = await GrepTool.execute({ pattern: 'Hello', path: TEST_DIR, output_mode: 'content' });
    expect(result.isError).toBe(false);
    expect(result.output).toContain('Hello World');
  });

  it('should return no matches for nonexistent pattern', async () => {
    const result = await GrepTool.execute({ pattern: 'zzzzznotfound', path: TEST_DIR });
    expect(result.isError).toBe(false);
    expect(result.output).toContain('No matches found');
  });

  it('should error on empty pattern', async () => {
    const result = await GrepTool.execute({ pattern: '' });
    expect(result.isError).toBe(true);
    expect(result.errorCode).toBe(400);
  });
});

describe('GlobTool', () => {
  it('should have correct schema', () => {
    expect(GlobTool.name).toBe('glob');
    expect(GlobTool.inputSchema.required).toContain('pattern');
  });

  it('should find files by pattern', async () => {
    const result = await GlobTool.execute({ pattern: '**/*.txt', path: TEST_DIR });
    expect(result.isError).toBe(false);
    expect(result.output).toContain('hello.txt');
    expect(result.output).toContain('nested.txt');
  });

  it('should find JS files', async () => {
    const result = await GlobTool.execute({ pattern: '**/*.js', path: TEST_DIR });
    expect(result.isError).toBe(false);
    expect(result.output).toContain('test.js');
  });

  it('should return no matches for nonexistent pattern', async () => {
    const result = await GlobTool.execute({ pattern: '**/*.xyz', path: TEST_DIR });
    expect(result.isError).toBe(false);
    expect(result.output).toContain('No files found');
  });

  it('should error on empty pattern', async () => {
    const result = await GlobTool.execute({ pattern: '' });
    expect(result.isError).toBe(true);
    expect(result.errorCode).toBe(400);
  });
});
