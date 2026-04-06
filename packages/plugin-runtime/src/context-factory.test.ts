import { describe, it, expect } from 'vitest';
import { createPluginContext } from './context-factory.js';

describe('createPluginContext', () => {
  it('should create a context with defaults', () => {
    const ctx = createPluginContext();

    expect(ctx.config).toEqual({});
    expect(ctx.session.id).toBe('unknown');
    expect(ctx.session.agent).toBe('default');
    expect(ctx.session.model).toBe('unknown');
    expect(ctx.session.messages).toEqual([]);
  });

  it('should accept custom config', () => {
    const ctx = createPluginContext({
      config: { apiKey: 'test', maxTokens: 1000 },
    });

    expect(ctx.getConfig('apiKey')).toBe('test');
    expect(ctx.getConfig('maxTokens')).toBe(1000);
    expect(ctx.getConfig('missing', 'default')).toBe('default');
  });

  it('should accept custom session', () => {
    const ctx = createPluginContext({
      session: {
        id: 'custom-session',
        agent: 'custom-agent',
        model: 'claude-3',
        messages: [],
        startTime: new Date(),
      },
    });

    expect(ctx.session.id).toBe('custom-session');
    expect(ctx.session.agent).toBe('custom-agent');
    expect(ctx.session.model).toBe('claude-3');
  });

  it('should support setConfig and getConfig', () => {
    const ctx = createPluginContext();

    ctx.setConfig('key', 'value');
    expect(ctx.getConfig('key')).toBe('value');

    ctx.setConfig('number', 42);
    expect(ctx.getConfig('number')).toBe(42);
  });

  it('should support tool registration', () => {
    const ctx = createPluginContext();

    const tool = {
      name: 'test_tool',
      description: 'Test',
      parameters: {},
      execute: async () => ({ content: '' }),
    };

    ctx.tools.register(tool);
    expect(ctx.tools.get('test_tool')).toBe(tool);
    expect(ctx.tools.list()).toHaveLength(1);

    ctx.tools.unregister('test_tool');
    expect(ctx.tools.get('test_tool')).toBeUndefined();
  });

  it('should support event bus', async () => {
    const ctx = createPluginContext();
    const events: any[] = [];

    ctx.events.on('test', async (data) => { events.push(data); });
    ctx.events.emit('test', { foo: 'bar' });

    expect(events).toEqual([{ foo: 'bar' }]);
  });

  it('should support event unregistration', async () => {
    const ctx = createPluginContext();
    let called = false;

    const handler = async () => { called = true; };
    ctx.events.on('remove', handler);
    ctx.events.off('remove', handler);
    ctx.events.emit('remove', {});

    expect(called).toBe(false);
  });

  it('should support memory operations', async () => {
    const ctx = createPluginContext();

    await ctx.sin.memory.set('key1', 'value1');
    expect(await ctx.sin.memory.get('key1')).toBe('value1');

    await ctx.sin.memory.delete('key1');
    expect(await ctx.sin.memory.get('key1')).toBeUndefined();

    await ctx.sin.memory.set('a', '1');
    await ctx.sin.memory.set('b', '2');
    const keys = await ctx.sin.memory.list();
    expect(keys).toContain('a');
    expect(keys).toContain('b');
    expect(keys).toHaveLength(2);
  });

  it('should support A2A operations', async () => {
    const ctx = createPluginContext();

    const response = await ctx.sin.a2a.send('agent', {
      type: 'task',
      payload: {},
      from: 'test',
      to: 'agent',
      timestamp: new Date(),
    });

    expect(response.success).toBe(true);
    expect(response.correlationId).toBe('mock');
  });

  it('should support permission checks', async () => {
    const ctx = createPluginContext();
    const result = await ctx.hasPermission('read', 'file.txt');
    expect(result).toBe(true);
  });

  it('should support logging', () => {
    const ctx = createPluginContext();

    expect(() => ctx.logger.debug('test')).not.toThrow();
    expect(() => ctx.logger.info('test')).not.toThrow();
    expect(() => ctx.logger.warn('test')).not.toThrow();
    expect(() => ctx.logger.error('test')).not.toThrow();
  });
});
