import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as os from 'node:os';
import plugin from './index.js';

describe('agent-memory plugin', () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = path.join(os.tmpdir(), `sin-test-${Date.now()}`);
    await fs.mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
  });

  it('should have correct plugin metadata', () => {
    expect(plugin.name).toBe('@opensin/plugin-agent-memory');
    expect(plugin.version).toBe('0.1.0');
    expect(plugin.type).toBe('memory');
  });

  it('should activate and register memory tools', async () => {
    const tools: any[] = [];
    const events: any[] = [];
    const logs: string[] = [];

    const ctx = {
      config: { projectDir: testDir },
      session: { id: 'test', agent: 'test', model: 'test', messages: [], startTime: new Date() },
      tools: {
        register: (tool: any) => tools.push(tool),
        unregister: () => {},
        get: () => undefined,
        list: () => tools,
      },
      events: {
        on: (event: string, handler: Function) => events.push({ event, handler }),
        off: () => {},
        emit: () => {},
        getListeners: () => [],
      },
      logger: {
        debug: () => {},
        info: (msg: string) => logs.push(msg),
        warn: () => {},
        error: () => {},
      },
      sin: {
        memory: { get: async () => null, set: async () => {}, delete: async () => {}, list: async () => [] },
        a2a: { send: async () => ({ success: true, correlationId: '' }), broadcast: async () => {} },
        permission: { check: async () => true },
      },
      getConfig: function(key: string, def: any) { return (this as any).config[key] ?? def; },
      setConfig: function(key: string, val: any) { (this as any).config[key] = val; },
      hasPermission: async () => true,
    };

    await plugin.activate?.(ctx as any);

    // Should register 5 tools
    expect(tools).toHaveLength(5);
    expect(tools.map(t => t.name)).toContain('memory_list');
    expect(tools.map(t => t.name)).toContain('memory_set');
    expect(tools.map(t => t.name)).toContain('memory_get');
    expect(tools.map(t => t.name)).toContain('memory_delete');
    expect(tools.map(t => t.name)).toContain('memory_search');

    // expect(events.some(e => e.event === 'context:prune')).toBe(true);

    // Should log activation
    expect(logs.some(l => l.includes('activated'))).toBe(true);
  });

  it('should execute memory_set and memory_get tools', async () => {
    const tools: any[] = [];
    const ctx = {
      config: { projectDir: testDir },
      session: { id: 'test', agent: 'test', model: 'test', messages: [], startTime: new Date() },
      tools: { register: (t: any) => tools.push(t), unregister: () => {}, get: () => undefined, list: () => tools },
      events: { on: () => {}, off: () => {}, emit: () => {}, getListeners: () => [] },
      logger: { debug: () => {}, info: () => {}, warn: () => {}, error: () => {} },
      sin: {
        memory: { get: async () => null, set: async () => {}, delete: async () => {}, list: async () => [] },
        a2a: { send: async () => ({ success: true, correlationId: '' }), broadcast: async () => {} },
        permission: { check: async () => true },
      },
      getConfig: function(key: string, def: any) { return (this as any).config[key] ?? def; },
      setConfig: function(key: string, val: any) { (this as any).config[key] = val; },
      hasPermission: async () => true,
    };

    await plugin.activate?.(ctx as any);

    const setTool = tools.find(t => t.name === 'memory_set');
    const getTool = tools.find(t => t.name === 'memory_get');

    // Set a memory block
    const setResult = await setTool.execute({ scope: 'project', label: 'test', value: 'hello world' });
    expect(setResult.content).toContain('saved');

    // Verify file was created
    const memoryFile = path.join(testDir, '.opensin', 'memory', 'test.md');
    const content = await fs.readFile(memoryFile, 'utf-8');
    expect(content).toBe('hello world');

    // Get the memory block
    const getResult = await getTool.execute({ scope: 'project', label: 'test' });
    expect(getResult.content).toBe('hello world');
  });

  it('should execute memory_delete tool', async () => {
    const tools: any[] = [];
    const ctx = {
      config: { projectDir: testDir },
      session: { id: 'test', agent: 'test', model: 'test', messages: [], startTime: new Date() },
      tools: { register: (t: any) => tools.push(t), unregister: () => {}, get: () => undefined, list: () => tools },
      events: { on: () => {}, off: () => {}, emit: () => {}, getListeners: () => [] },
      logger: { debug: () => {}, info: () => {}, warn: () => {}, error: () => {} },
      sin: {
        memory: { get: async () => null, set: async () => {}, delete: async () => {}, list: async () => [] },
        a2a: { send: async () => ({ success: true, correlationId: '' }), broadcast: async () => {} },
        permission: { check: async () => true },
      },
      getConfig: function(key: string, def: any) { return (this as any).config[key] ?? def; },
      setConfig: function(key: string, val: any) { (this as any).config[key] = val; },
      hasPermission: async () => true,
    };

    await plugin.activate?.(ctx as any);

    const setTool = tools.find(t => t.name === 'memory_set');
    const deleteTool = tools.find(t => t.name === 'memory_delete');

    await setTool.execute({ scope: 'project', label: 'to-delete', value: 'delete me' });
    const deleteResult = await deleteTool.execute({ scope: 'project', label: 'to-delete' });
    expect(deleteResult.content).toContain('deleted');

    // Verify file was removed
    const memoryFile = path.join(testDir, '.opensin', 'memory', 'to-delete.md');
    await expect(fs.readFile(memoryFile, 'utf-8')).rejects.toThrow();
  });

  it('should execute memory_list tool', async () => {
    const tools: any[] = [];
    const ctx = {
      config: { projectDir: testDir },
      session: { id: 'test', agent: 'test', model: 'test', messages: [], startTime: new Date() },
      tools: { register: (t: any) => tools.push(t), unregister: () => {}, get: () => undefined, list: () => tools },
      events: { on: () => {}, off: () => {}, emit: () => {}, getListeners: () => [] },
      logger: { debug: () => {}, info: () => {}, warn: () => {}, error: () => {} },
      sin: {
        memory: { get: async () => null, set: async () => {}, delete: async () => {}, list: async () => [] },
        a2a: { send: async () => ({ success: true, correlationId: '' }), broadcast: async () => {} },
        permission: { check: async () => true },
      },
      getConfig: function(key: string, def: any) { return (this as any).config[key] ?? def; },
      setConfig: function(key: string, val: any) { (this as any).config[key] = val; },
      hasPermission: async () => true,
    };

    await plugin.activate?.(ctx as any);

    const setTool = tools.find(t => t.name === 'memory_set');
    const listTool = tools.find(t => t.name === 'memory_list');

    await setTool.execute({ scope: 'project', label: 'a', value: '1' });
    await setTool.execute({ scope: 'project', label: 'b', value: '2' });

    const listResult = await listTool.execute({ scope: 'project' });
    expect(listResult.content).toContain('project:a');
    expect(listResult.content).toContain('project:b');
  });

  it('should execute memory_search tool', async () => {
    const tools: any[] = [];
    const ctx = {
      config: { projectDir: testDir },
      session: { id: 'test', agent: 'test', model: 'test', messages: [], startTime: new Date() },
      tools: { register: (t: any) => tools.push(t), unregister: () => {}, get: () => undefined, list: () => tools },
      events: { on: () => {}, off: () => {}, emit: () => {}, getListeners: () => [] },
      logger: { debug: () => {}, info: () => {}, warn: () => {}, error: () => {} },
      sin: {
        memory: { get: async () => null, set: async () => {}, delete: async () => {}, list: async () => [] },
        a2a: { send: async () => ({ success: true, correlationId: '' }), broadcast: async () => {} },
        permission: { check: async () => true },
      },
      getConfig: function(key: string, def: any) { return (this as any).config[key] ?? def; },
      setConfig: function(key: string, val: any) { (this as any).config[key] = val; },
      hasPermission: async () => true,
    };

    await plugin.activate?.(ctx as any);

    const setTool = tools.find(t => t.name === 'memory_set');
    const searchTool = tools.find(t => t.name === 'memory_search');

    await setTool.execute({ scope: 'project', label: 'api-keys', value: 'My API key is abc123' });
    await setTool.execute({ scope: 'project', label: 'notes', value: 'Random notes here' });

    const searchResult = await searchTool.execute({ query: 'api' });
    expect(searchResult.content).toContain('api-keys');
  });
});
