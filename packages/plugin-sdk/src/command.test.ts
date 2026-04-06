import { describe, it, expect } from 'vitest';
import { createCommand, parseCommandArgs } from './command.js';

describe('createCommand', () => {
  it('should create a valid command definition', () => {
    const cmd = createCommand({
      name: '/test',
      description: 'A test command',
      execute: async () => ({ content: 'done' }),
    });

    expect(cmd.name).toBe('/test');
    expect(cmd.description).toBe('A test command');
    expect(cmd.execute).toBeDefined();
  });

  it('should auto-prepend slash to command name', () => {
    const cmd = createCommand({
      name: 'test',
      description: 'No slash',
      execute: async () => ({ content: '' }),
    });

    expect(cmd.name).toBe('/test');
  });

  it('should throw if name is missing', () => {
    expect(() => createCommand({
      name: '',
      description: 'test',
      execute: async () => ({ content: '' }),
    })).toThrow('Command must have name, description, and execute function');
  });

  it('should throw if description is missing', () => {
    expect(() => createCommand({
      name: '/test',
      description: '',
      execute: async () => ({ content: '' }),
    })).toThrow('Command must have name, description, and execute function');
  });

  it('should throw if execute is missing', () => {
    expect(() => createCommand({
      name: '/test',
      description: 'test',
      execute: undefined as any,
    })).toThrow('Command must have name, description, and execute function');
  });

  it('should accept aliases', () => {
    const cmd = createCommand({
      name: '/deploy',
      description: 'Deploy command',
      aliases: ['/d', '/push'],
      execute: async () => ({ content: '' }),
    });
    expect(cmd.aliases).toEqual(['/d', '/push']);
  });

  it('should accept options', () => {
    const cmd = createCommand({
      name: '/build',
      description: 'Build command',
      options: {
        target: { type: 'string', description: 'Build target', required: true },
        verbose: { type: 'boolean', description: 'Verbose output' },
      },
      execute: async () => ({ content: '' }),
    });
    expect(cmd.options?.target.type).toBe('string');
    expect(cmd.options?.target.required).toBe(true);
  });
});

describe('parseCommandArgs', () => {
  it('should parse simple command', () => {
    const result = parseCommandArgs('/deploy production');
    expect(result.command).toBe('/deploy');
    expect(result.args).toEqual(['production']);
    expect(result.options).toEqual({});
  });

  it('should parse long options', () => {
    const result = parseCommandArgs('/build --target=prod --verbose');
    expect(result.command).toBe('/build');
    expect(result.args).toEqual([]);
    expect(result.options).toEqual({ target: 'prod', verbose: true });
  });

  it('should parse short options', () => {
    const result = parseCommandArgs('/test -v -o output.txt');
    expect(result.command).toBe('/test');
    expect(result.args).toEqual([]);
    expect(result.options).toEqual({ v: true, o: 'output.txt' });
  });

  it('should parse mixed args and options', () => {
    const result = parseCommandArgs('/run script.js --env=test --force file2.js');
    expect(result.command).toBe('/run');
    expect(result.args).toEqual(['script.js']);
    expect(result.options).toEqual({ env: 'test', force: 'file2.js' });
  });

  it('should handle empty input', () => {
    const result = parseCommandArgs('');
    expect(result.command).toBe('');
    expect(result.args).toEqual([]);
    expect(result.options).toEqual({});
  });

  it('should handle command only', () => {
    const result = parseCommandArgs('/help');
    expect(result.command).toBe('/help');
    expect(result.args).toEqual([]);
  });
});
