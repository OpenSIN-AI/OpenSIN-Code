import { describe, it, expect } from 'vitest';
import plugin from './index.js';

describe('smart-title plugin', () => {
  it('should have correct plugin metadata', () => {
    expect(plugin.name).toBe('@opensin/plugin-smart-title');
    expect(plugin.version).toBe('0.1.0');
    expect(plugin.type).toBe('hook');
  });

  it('should activate successfully', async () => {
    const logs: string[] = [];
    const ctx = {
      config: {},
      session: { id: 'test', agent: 'test', model: 'test', messages: [], startTime: new Date(), title: '' },
      tools: { register: () => {}, unregister: () => {}, get: () => undefined, list: () => [] },
      events: { on: () => {}, off: () => {}, emit: () => {}, getListeners: () => [] },
      logger: { debug: () => {}, info: (m: string) => logs.push(m), warn: () => {}, error: () => {} },
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
});
