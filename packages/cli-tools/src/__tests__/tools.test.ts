import { describe, it, expect } from 'vitest';
import { BashTool, ReadTool, WriteTool, EditTool, GrepTool, GlobTool } from '../index.js';

describe('All Tools Registration', () => {
  it('BashTool should be registered', () => {
    expect(BashTool.name).toBe('bash');
    expect(BashTool.description).toBeTruthy();
    expect(BashTool.inputSchema).toBeTruthy();
    expect(typeof BashTool.execute).toBe('function');
  });

  it('ReadTool should be registered', () => {
    expect(ReadTool.name).toBe('read');
    expect(ReadTool.description).toBeTruthy();
    expect(ReadTool.inputSchema).toBeTruthy();
    expect(typeof ReadTool.execute).toBe('function');
  });

  it('WriteTool should be registered', () => {
    expect(WriteTool.name).toBe('write');
    expect(WriteTool.description).toBeTruthy();
    expect(WriteTool.inputSchema).toBeTruthy();
    expect(typeof WriteTool.execute).toBe('function');
  });

  it('EditTool should be registered', () => {
    expect(EditTool.name).toBe('edit');
    expect(EditTool.description).toBeTruthy();
    expect(EditTool.inputSchema).toBeTruthy();
    expect(typeof EditTool.execute).toBe('function');
  });

  it('GrepTool should be registered', () => {
    expect(GrepTool.name).toBe('grep');
    expect(GrepTool.description).toBeTruthy();
    expect(GrepTool.inputSchema).toBeTruthy();
    expect(typeof GrepTool.execute).toBe('function');
  });

  it('GlobTool should be registered', () => {
    expect(GlobTool.name).toBe('glob');
    expect(GlobTool.description).toBeTruthy();
    expect(GlobTool.inputSchema).toBeTruthy();
    expect(typeof GlobTool.execute).toBe('function');
  });
});

describe('Tool Input Schemas', () => {
  it('BashTool schema should require command', () => {
    expect(BashTool.inputSchema.required).toContain('command');
  });

  it('ReadTool schema should require file_path', () => {
    expect(ReadTool.inputSchema.required).toContain('file_path');
  });

  it('WriteTool schema should require file_path and content', () => {
    expect(WriteTool.inputSchema.required).toContain('file_path');
    expect(WriteTool.inputSchema.required).toContain('content');
  });

  it('EditTool schema should require file_path, old_string, new_string', () => {
    expect(EditTool.inputSchema.required).toContain('file_path');
    expect(EditTool.inputSchema.required).toContain('old_string');
    expect(EditTool.inputSchema.required).toContain('new_string');
  });

  it('GrepTool schema should require pattern', () => {
    expect(GrepTool.inputSchema.required).toContain('pattern');
  });

  it('GlobTool schema should require pattern', () => {
    expect(GlobTool.inputSchema.required).toContain('pattern');
  });
});
