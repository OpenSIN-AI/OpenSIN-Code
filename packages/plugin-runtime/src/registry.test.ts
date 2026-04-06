import { describe, it, expect, beforeEach } from 'vitest';
import { PluginRegistry } from './registry.js';
import { mockContext } from '@opensin/plugin-sdk/test';
import { definePlugin } from '@opensin/plugin-sdk';

describe('PluginRegistry', () => {
  let registry: PluginRegistry;

  beforeEach(() => {
    registry = new PluginRegistry();
  });

  describe('register', () => {
    it('should register a plugin', async () => {
      const plugin = definePlugin({
        name: '@sin/test',
        version: '1.0.0',
        type: 'tool',
      });

      await registry.register({
        name: '@sin/test',
        version: '1.0.0',
        type: 'tool',
        main: 'dist/index.js',
        sinPlugin: { minVersion: '0.1.0', capabilities: ['tool'] },
      }, plugin, mockContext());

      expect(registry.has('@sin/test')).toBe(true);
      expect(registry.get('@sin/test')).toBeDefined();
    });

    it('should throw if plugin is already registered', async () => {
      const plugin = definePlugin({
        name: '@sin/dup',
        version: '1.0.0',
        type: 'tool',
      });

      const manifest = {
        name: '@sin/dup',
        version: '1.0.0',
        type: 'tool' as const,
        main: 'dist/index.js',
        sinPlugin: { minVersion: '0.1.0', capabilities: ['tool'] },
      };

      await registry.register(manifest, plugin, mockContext());

      await expect(registry.register(manifest, plugin, mockContext()))
        .rejects.toThrow('Plugin @sin/dup is already registered');
    });

    it('should throw if manifest has no name', async () => {
      const plugin = definePlugin({
        name: '@sin/test',
        version: '1.0.0',
        type: 'tool',
      });

      await expect(registry.register({
        name: '',
        version: '1.0.0',
        type: 'tool',
        main: 'dist/index.js',
        sinPlugin: { minVersion: '0.1.0', capabilities: ['tool'] },
      } as any, plugin, mockContext())).rejects.toThrow('Plugin manifest must have a name');
    });

    it('should throw if manifest has no version', async () => {
      const plugin = definePlugin({
        name: '@sin/test',
        version: '1.0.0',
        type: 'tool',
      });

      await expect(registry.register({
        name: '@sin/test',
        version: '',
        type: 'tool',
        main: 'dist/index.js',
        sinPlugin: { minVersion: '0.1.0', capabilities: ['tool'] },
      } as any, plugin, mockContext())).rejects.toThrow('must have a version');
    });

    it('should throw if manifest has no type', async () => {
      const plugin = definePlugin({
        name: '@sin/test',
        version: '1.0.0',
        type: 'tool',
      });

      await expect(registry.register({
        name: '@sin/test',
        version: '1.0.0',
        type: '' as any,
        main: 'dist/index.js',
        sinPlugin: { minVersion: '0.1.0', capabilities: ['tool'] },
      } as any, plugin, mockContext())).rejects.toThrow('must have a type');
    });

    it('should throw if sinPlugin.minVersion is missing', async () => {
      const plugin = definePlugin({
        name: '@sin/test',
        version: '1.0.0',
        type: 'tool',
      });

      await expect(registry.register({
        name: '@sin/test',
        version: '1.0.0',
        type: 'tool',
        main: 'dist/index.js',
        sinPlugin: { minVersion: '', capabilities: ['tool'] },
      } as any, plugin, mockContext())).rejects.toThrow('must specify sinPlugin.minVersion');
    });
  });

  describe('activate', () => {
    it('should activate a registered plugin', async () => {
      const calls: string[] = [];
      const plugin = definePlugin({
        name: '@sin/activate-test',
        version: '1.0.0',
        type: 'tool',
        async activate() { calls.push('activated'); },
      });

      await registry.register({
        name: '@sin/activate-test',
        version: '1.0.0',
        type: 'tool',
        main: 'dist/index.js',
        sinPlugin: { minVersion: '0.1.0', capabilities: ['tool'] },
      }, plugin, mockContext());

      await registry.activate('@sin/activate-test');
      expect(calls).toContain('activated');
      expect(registry.get('@sin/activate-test')?.state).toBe('active');
    });

    it('should throw if plugin is not found', async () => {
      await expect(registry.activate('@sin/nonexistent'))
        .rejects.toThrow('Plugin @sin/nonexistent not found');
    });

    it('should handle activation errors gracefully', async () => {
      const plugin = definePlugin({
        name: '@sin/fail-activate',
        version: '1.0.0',
        type: 'tool',
        async activate() { throw new Error('Activation failed'); },
      });

      await registry.register({
        name: '@sin/fail-activate',
        version: '1.0.0',
        type: 'tool',
        main: 'dist/index.js',
        sinPlugin: { minVersion: '0.1.0', capabilities: ['tool'] },
      }, plugin, mockContext());

      await expect(registry.activate('@sin/fail-activate'))
        .rejects.toThrow('Activation failed');
      expect(registry.get('@sin/fail-activate')?.state).toBe('error');
    });

    it('should be idempotent (no-op if already active)', async () => {
      let count = 0;
      const plugin = definePlugin({
        name: '@sin/idempotent',
        version: '1.0.0',
        type: 'tool',
        async activate() { count++; },
      });

      await registry.register({
        name: '@sin/idempotent',
        version: '1.0.0',
        type: 'tool',
        main: 'dist/index.js',
        sinPlugin: { minVersion: '0.1.0', capabilities: ['tool'] },
      }, plugin, mockContext());

      await registry.activate('@sin/idempotent');
      await registry.activate('@sin/idempotent');
      expect(count).toBe(1);
    });
  });

  describe('deactivate', () => {
    it('should deactivate an active plugin', async () => {
      const calls: string[] = [];
      const plugin = definePlugin({
        name: '@sin/deactivate-test',
        version: '1.0.0',
        type: 'tool',
        async activate() {},
        async deactivate() { calls.push('deactivated'); },
      });

      await registry.register({
        name: '@sin/deactivate-test',
        version: '1.0.0',
        type: 'tool',
        main: 'dist/index.js',
        sinPlugin: { minVersion: '0.1.0', capabilities: ['tool'] },
      }, plugin, mockContext());

      await registry.activate('@sin/deactivate-test');
      await registry.deactivate('@sin/deactivate-test');

      expect(calls).toContain('deactivated');
      expect(registry.get('@sin/deactivate-test')?.state).toBe('inactive');
    });

    it('should be no-op if plugin is not active', async () => {
      const plugin = definePlugin({
        name: '@sin/not-active',
        version: '1.0.0',
        type: 'tool',
        async deactivate() { throw new Error('Should not be called'); },
      });

      await registry.register({
        name: '@sin/not-active',
        version: '1.0.0',
        type: 'tool',
        main: 'dist/index.js',
        sinPlugin: { minVersion: '0.1.0', capabilities: ['tool'] },
      }, plugin, mockContext());

      // Should not throw
      await registry.deactivate('@sin/not-active');
    });
  });

  describe('destroy', () => {
    it('should deactivate then destroy a plugin', async () => {
      const calls: string[] = [];
      const plugin = definePlugin({
        name: '@sin/destroy-test',
        version: '1.0.0',
        type: 'tool',
        async activate() { calls.push('activated'); },
        async deactivate() { calls.push('deactivated'); },
        async destroy() { calls.push('destroyed'); },
      });

      await registry.register({
        name: '@sin/destroy-test',
        version: '1.0.0',
        type: 'tool',
        main: 'dist/index.js',
        sinPlugin: { minVersion: '0.1.0', capabilities: ['tool'] },
      }, plugin, mockContext());

      await registry.activate('@sin/destroy-test');
      await registry.destroy('@sin/destroy-test');

      expect(calls).toEqual(['activated', 'deactivated', 'destroyed']);
      expect(registry.has('@sin/destroy-test')).toBe(false);
    });

    it('should handle destroying an unregistered plugin gracefully', async () => {
      await expect(registry.destroy('@sin/nonexistent')).resolves.toBeUndefined();
    });
  });

  describe('activateAll', () => {
    it('should activate all registered plugins', async () => {
      const plugins = ['@sin/a', '@sin/b', '@sin/c'];
      const activated: string[] = [];

      for (const name of plugins) {
        const plugin = definePlugin({
          name,
          version: '1.0.0',
          type: 'tool',
          async activate() { activated.push(name); },
        });

        await registry.register({
          name,
          version: '1.0.0',
          type: 'tool',
          main: 'dist/index.js',
          sinPlugin: { minVersion: '0.1.0', capabilities: ['tool'] },
        }, plugin, mockContext());
      }

      await registry.activateAll();
      expect(activated).toEqual(['@sin/a', '@sin/b', '@sin/c']);
    });

    it('should continue activating other plugins if one fails', async () => {
      const activated: string[] = [];

      const failPlugin = definePlugin({
        name: '@sin/fail',
        version: '1.0.0',
        type: 'tool',
        async activate() { throw new Error('fail'); },
      });
      await registry.register({
        name: '@sin/fail',
        version: '1.0.0',
        type: 'tool',
        main: 'dist/index.js',
        sinPlugin: { minVersion: '0.1.0', capabilities: ['tool'] },
      }, failPlugin, mockContext());

      const successPlugin = definePlugin({
        name: '@sin/success',
        version: '1.0.0',
        type: 'tool',
        async activate() { activated.push('@sin/success'); },
      });
      await registry.register({
        name: '@sin/success',
        version: '1.0.0',
        type: 'tool',
        main: 'dist/index.js',
        sinPlugin: { minVersion: '0.1.0', capabilities: ['tool'] },
      }, successPlugin, mockContext());

      await registry.activateAll();
      expect(activated).toContain('@sin/success');
    });
  });

  describe('deactivateAll', () => {
    it('should deactivate all plugins in reverse order', async () => {
      const deactivated: string[] = [];
      const plugins = ['@sin/a', '@sin/b', '@sin/c'];

      for (const name of plugins) {
        const plugin = definePlugin({
          name,
          version: '1.0.0',
          type: 'tool',
          async activate() {},
          async deactivate() { deactivated.push(name); },
        });

        await registry.register({
          name,
          version: '1.0.0',
          type: 'tool',
          main: 'dist/index.js',
          sinPlugin: { minVersion: '0.1.0', capabilities: ['tool'] },
        }, plugin, mockContext());
      }

      await registry.activateAll();
      await registry.deactivateAll();

      expect(deactivated).toEqual(['@sin/c', '@sin/b', '@sin/a']);
    });
  });

  describe('getAll / getActive', () => {
    it('should return all registered plugins', async () => {
      const plugin = definePlugin({
        name: '@sin/list-test',
        version: '1.0.0',
        type: 'tool',
      });

      await registry.register({
        name: '@sin/list-test',
        version: '1.0.0',
        type: 'tool',
        main: 'dist/index.js',
        sinPlugin: { minVersion: '0.1.0', capabilities: ['tool'] },
      }, plugin, mockContext());

      const all = registry.getAll();
      expect(all).toHaveLength(1);
      expect(all[0].manifest.name).toBe('@sin/list-test');
    });

    it('should return only active plugins', async () => {
      const activePlugin = definePlugin({
        name: '@sin/active',
        version: '1.0.0',
        type: 'tool',
        async activate() {},
      });
      await registry.register({
        name: '@sin/active',
        version: '1.0.0',
        type: 'tool',
        main: 'dist/index.js',
        sinPlugin: { minVersion: '0.1.0', capabilities: ['tool'] },
      }, activePlugin, mockContext());

      const inactivePlugin = definePlugin({
        name: '@sin/inactive',
        version: '1.0.0',
        type: 'tool',
      });
      await registry.register({
        name: '@sin/inactive',
        version: '1.0.0',
        type: 'tool',
        main: 'dist/index.js',
        sinPlugin: { minVersion: '0.1.0', capabilities: ['tool'] },
      }, inactivePlugin, mockContext());

      await registry.activate('@sin/active');

      const active = registry.getActive();
      expect(active).toHaveLength(1);
      expect(active[0].manifest.name).toBe('@sin/active');
    });
  });
});
