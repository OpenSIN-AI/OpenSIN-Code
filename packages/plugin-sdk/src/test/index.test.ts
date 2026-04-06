import { describe, it, expect } from 'vitest';
import { mockContext, testPlugin } from './index.js';
import { definePlugin } from '../plugin.js';

describe('mockContext', () => {
  it('should create a default context', () => {
    const ctx = mockContext();

    expect(ctx.config).toEqual({});
    expect(ctx.session.id).toBe('test-session');
    expect(ctx.session.agent).toBe('test-agent');
    expect(ctx.session.model).toBe('gpt-4');
    expect(ctx.session.messages).toEqual([]);
  });

  it('should accept config overrides', () => {
    const ctx = mockContext({
      config: { apiKey: 'test-key', maxRetries: 3 },
    });

    expect(ctx.config.apiKey).toBe('test-key');
    expect(ctx.config.maxRetries).toBe(3);
  });

  it('should accept session overrides', () => {
    const ctx = mockContext({
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

  it('should support getConfig with default value', () => {
    const ctx = mockContext({ config: { existing: 'value' } });

    expect(ctx.getConfig('existing')).toBe('value');
    expect(ctx.getConfig('missing', 'default')).toBe('default');
    expect(ctx.getConfig('missing')).toBeUndefined();
  });

  it('should support setConfig', () => {
    const ctx = mockContext();
    ctx.setConfig('newKey', 'newValue');
    expect(ctx.getConfig('newKey')).toBe('newValue');
  });

  it('should support hasPermission', async () => {
    const ctx = mockContext();
    const result = await ctx.hasPermission('read', 'file.txt');
    expect(result).toBe(true);
  });

  it('should support tool registration', () => {
    const ctx = mockContext();
    const tool = {
      name: 'test_tool',
      description: 'Test tool',
      parameters: {},
      execute: async () => ({ content: 'test' }),
    };

    ctx.tools.register(tool);
    expect(ctx.tools.get('test_tool')).toBe(tool);
    expect(ctx.tools.list()).toHaveLength(1);
  });

  it('should support tool unregistration', () => {
    const ctx = mockContext();
    const tool = {
      name: 'temp_tool',
      description: 'Temp tool',
      parameters: {},
      execute: async () => ({ content: '' }),
    };

    ctx.tools.register(tool);
    ctx.tools.unregister('temp_tool');
    expect(ctx.tools.get('temp_tool')).toBeUndefined();
  });

  it('should support event bus', async () => {
    const ctx = mockContext();
    let received = false;

    ctx.events.on('test', async () => { received = true; });
    ctx.events.emit('test', {});

    expect(received).toBe(true);
  });

  it('should support memory operations', async () => {
    const ctx = mockContext();

    await ctx.sin.memory.set('key1', 'value1');
    expect(await ctx.sin.memory.get('key1')).toBe('value1');

    await ctx.sin.memory.delete('key1');
    expect(await ctx.sin.memory.get('key1')).toBeUndefined();

    await ctx.sin.memory.set('a', '1');
    await ctx.sin.memory.set('b', '2');
    const keys = await ctx.sin.memory.list();
    expect(keys).toContain('a');
    expect(keys).toContain('b');
  });

  it('should support A2A operations', async () => {
    const ctx = mockContext();

    const response = await ctx.sin.a2a.send('test-agent', {
      type: 'test',
      payload: {},
      from: 'test',
      to: 'test-agent',
      timestamp: new Date(),
    });

    expect(response.success).toBe(true);
    expect(response.correlationId).toBe('mock-correlation-id');
  });

  it('should support logger', () => {
    const ctx = mockContext();

    // These should not throw
    expect(() => ctx.logger.debug('debug msg')).not.toThrow();
    expect(() => ctx.logger.info('info msg')).not.toThrow();
    expect(() => ctx.logger.warn('warn msg')).not.toThrow();
    expect(() => ctx.logger.error('error msg')).not.toThrow();
  });
});

describe('testPlugin', () => {
  it('should pass for a minimal plugin', async () => {
    const plugin = definePlugin({
      name: '@sin/minimal',
      version: '1.0.0',
      type: 'tool',
    });

    const result = await testPlugin(plugin);
    expect(result.success).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.warnings).toHaveLength(0);
  });

  it('should pass for a full lifecycle plugin', async () => {
    const plugin = definePlugin({
      name: '@sin/full',
      version: '1.0.0',
      type: 'tool',
      async init() {},
      async activate() {},
      async deactivate() {},
      async destroy() {},
    });

    const result = await testPlugin(plugin);
    expect(result.success).toBe(true);
  });

  it('should fail when activate throws', async () => {
    const plugin = definePlugin({
      name: '@sin/failing',
      version: '1.0.0',
      type: 'tool',
      async activate() {
        throw new Error('Activation failed');
      },
    });

    const result = await testPlugin(plugin);
    expect(result.success).toBe(false);
    expect(result.errors).toContain('Plugin test failed: Activation failed');
  });

  it('should test validateConfig with invalid config', async () => {
    const plugin = definePlugin({
      name: '@sin/config-test',
      version: '1.0.0',
      type: 'tool',
      validateConfig(config) {
        if (!config.apiKey) {
          return { valid: false, errors: ['apiKey required'] };
        }
        return { valid: true };
      },
    });

    const result = await testPlugin(plugin, {
      config: { apiKey: '' },
    });
    expect(result.success).toBe(false);
    expect(result.errors).toContain('apiKey required');
  });

  it('should pass validateConfig with valid config', async () => {
    const plugin = definePlugin({
      name: '@sin/config-valid',
      version: '1.0.0',
      type: 'tool',
      validateConfig(config) {
        if (config.apiKey) {
          return { valid: true };
        }
        return { valid: false, errors: ['apiKey required'] };
      },
    });

    const result = await testPlugin(plugin, {
      config: { apiKey: 'valid-key' },
    });
    expect(result.success).toBe(true);
  });
});
