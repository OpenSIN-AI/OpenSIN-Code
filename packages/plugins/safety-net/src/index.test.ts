import { describe, it, expect } from 'vitest';
import plugin from './index.js';

describe('safety-net plugin', () => {
  it('should have correct plugin metadata', () => {
    expect(plugin.name).toBe('@opensin/plugin-safety-net');
    expect(plugin.version).toBe('0.1.0');
    expect(plugin.type).toBe('hook');
  });

  it('should activate successfully', async () => {
    const logs: string[] = [];
    const ctx = {
      config: { strictMode: true },
      session: { id: 'test', agent: 'test', model: 'test', messages: [], startTime: new Date() },
      tools: { register: () => {}, unregister: () => {}, get: () => undefined, list: () => [] },
      events: { on: () => {}, off: () => {}, emit: () => {}, getListeners: () => [] },
      logger: { debug: () => {}, info: () => {}, warn: (m: string) => logs.push(m), error: () => {} },
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
    expect(logs.some(l => l.includes('activated'))).toBe(true);
  });

  it('should block rm -rf / command', async () => {
    let prevented = false;
    const ctx = {
      config: { strictMode: true },
      session: { id: 'test', agent: 'test', model: 'test', messages: [], startTime: new Date() },
      tools: { register: () => {}, unregister: () => {}, get: () => undefined, list: () => [] },
      events: {
        on: (event: string, handler: Function) => {
          if (event === 'tool:execute:before') {
            handler({ tool: 'bash', args: { command: 'rm -rf /' }, preventDefault: () => { prevented = true; } });
          }
        },
        off: () => {}, emit: () => {}, getListeners: () => [],
      },
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
    expect(prevented).toBe(true);
  });

  it('should block git push --force', async () => {
    let prevented = false;
    const ctx = {
      config: { strictMode: true },
      session: { id: 'test', agent: 'test', model: 'test', messages: [], startTime: new Date() },
      tools: { register: () => {}, unregister: () => {}, get: () => undefined, list: () => [] },
      events: {
        on: (event: string, handler: Function) => {
          if (event === 'tool:execute:before') {
            handler({ tool: 'bash', args: { command: 'git push --force origin main' }, preventDefault: () => { prevented = true; } });
          }
        },
        off: () => {}, emit: () => {}, getListeners: () => [],
      },
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
    expect(prevented).toBe(true);
  });

  it('should not block safe commands', async () => {
    let prevented = false;
    const ctx = {
      config: { strictMode: true },
      session: { id: 'test', agent: 'test', model: 'test', messages: [], startTime: new Date() },
      tools: { register: () => {}, unregister: () => {}, get: () => undefined, list: () => [] },
      events: {
        on: (event: string, handler: Function) => {
          if (event === 'tool:execute:before') {
            handler({ tool: 'bash', args: { command: 'ls -la' }, preventDefault: () => { prevented = true; } });
          }
        },
        off: () => {}, emit: () => {}, getListeners: () => [],
      },
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
    expect(prevented).toBe(false);
  });
});
