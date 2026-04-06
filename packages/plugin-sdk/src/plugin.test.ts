import { describe, it, expect } from 'vitest';
import { definePlugin, defineAuthProvider } from './plugin.js';
import { mockContext, testPlugin } from './test/index.js';

describe('definePlugin', () => {
  it('should create a valid plugin', () => {
    const plugin = definePlugin({
      name: '@sin/test-plugin',
      version: '1.0.0',
      type: 'tool',
      description: 'Test plugin',
    });

    expect(plugin.name).toBe('@sin/test-plugin');
    expect(plugin.version).toBe('1.0.0');
    expect(plugin.type).toBe('tool');
  });

  it('should throw if name is missing', () => {
    expect(() => definePlugin({
      name: '',
      version: '1.0.0',
      type: 'tool',
    })).toThrow('Plugin must have name, version, and type');
  });

  it('should throw if version is missing', () => {
    expect(() => definePlugin({
      name: '@sin/test',
      version: '',
      type: 'tool',
    })).toThrow('Plugin must have name, version, and type');
  });

  it('should throw if type is missing', () => {
    expect(() => definePlugin({
      name: '@sin/test',
      version: '1.0.0',
      type: '' as any,
    })).toThrow('Plugin must have name, version, and type');
  });

  it('should throw if name is not scoped', () => {
    expect(() => definePlugin({
      name: 'unscoped-name',
      version: '1.0.0',
      type: 'tool',
    })).toThrow('Plugin name must be scoped');
  });

  it('should accept scoped names', () => {
    const plugin = definePlugin({
      name: '@scope/plugin-name',
      version: '1.0.0',
      type: 'hook',
    });
    expect(plugin.name).toBe('@scope/plugin-name');
  });

  it('should support lifecycle hooks', async () => {
    const calls: string[] = [];
    const plugin = definePlugin({
      name: '@sin/lifecycle-test',
      version: '1.0.0',
      type: 'tool',
      async init() { calls.push('init'); },
      async activate() { calls.push('activate'); },
      async deactivate() { calls.push('deactivate'); },
      async destroy() { calls.push('destroy'); },
    });

    const ctx = mockContext();
    await plugin.init?.(ctx);
    await plugin.activate?.(ctx);
    await plugin.deactivate?.(ctx);
    await plugin.destroy?.(ctx);

    expect(calls).toEqual(['init', 'activate', 'deactivate', 'destroy']);
  });
});

describe('defineAuthProvider', () => {
  it('should create an auth provider plugin', () => {
    const provider = defineAuthProvider({
      name: '@sin/test-auth',
      displayName: 'Test Auth',
      authenticate: async () => ({
        provider: 'test-auth',
        token: 'test-token',
        models: ['model-1', 'model-2'],
      }),
    });

    expect(provider.name).toBe('@sin/test-auth');
    expect(provider.type).toBe('auth');
  });

  it('should register auth provider on activate', async () => {
    const ctx = mockContext();
    const events: any[] = [];
    ctx.events.on('auth:provider:register', (data: any) => events.push(data));

    const provider = defineAuthProvider({
      name: '@sin/auth-test',
      displayName: 'Auth Test',
      authenticate: async () => ({
        provider: 'auth-test',
        token: 'token',
        models: ['gpt-4'],
      }),
    });

    await provider.activate?.(ctx);
    expect(events).toHaveLength(1);
    expect(events[0].name).toBe('@sin/auth-test');
    expect(events[0].displayName).toBe('Auth Test');
  });
});

describe('testPlugin', () => {
  it('should pass for a valid plugin', async () => {
    const plugin = definePlugin({
      name: '@sin/valid-plugin',
      version: '1.0.0',
      type: 'tool',
      async activate() {},
      async deactivate() {},
    });

    const result = await testPlugin(plugin);
    expect(result.success).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should fail for a plugin that throws on activate', async () => {
    const plugin = definePlugin({
      name: '@sin/broken-plugin',
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

  it('should test validateConfig if provided', async () => {
    const plugin = definePlugin({
      name: '@sin/config-plugin',
      version: '1.0.0',
      type: 'tool',
      validateConfig(config) {
        if (!config.apiKey) {
          return { valid: false, errors: ['apiKey is required'] };
        }
        return { valid: true };
      },
    });

    const result = await testPlugin(plugin, {
      config: { apiKey: '' },
    });
    expect(result.success).toBe(false);
    expect(result.errors).toContain('apiKey is required');
  });
});
