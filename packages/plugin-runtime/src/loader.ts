import { PluginManifest, SINPlugin } from '@opensin/plugin-sdk';
import { PluginRegistry } from './registry.js';
import { createPluginContext, ContextOptions } from './context-factory.js';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export interface PluginLoaderOptions {
  projectPluginsDir?: string;
  userPluginsDir?: string;
  builtinPlugins?: SINPlugin[];
  enabledPlugins?: string[];
  disabledPlugins?: string[];
  pluginConfigs?: Record<string, Record<string, unknown>>;
}

export class PluginLoader {
  private registry: PluginRegistry;
  private options: Required<PluginLoaderOptions>;

  constructor(registry: PluginRegistry, options: PluginLoaderOptions = {}) {
    this.registry = registry;
    this.options = {
      projectPluginsDir: '.sin/plugins',
      userPluginsDir: path.join(process.env.HOME || '~', '.sin/plugins'),
      builtinPlugins: [],
      enabledPlugins: [],
      disabledPlugins: [],
      pluginConfigs: {},
      ...options,
    };
  }

  async loadAll(contextOptions: ContextOptions): Promise<PluginRegistry> {
    // 1. Load built-in plugins
    for (const plugin of this.options.builtinPlugins) {
      await this.loadPlugin(plugin, contextOptions);
    }

    // 2. Discover and load project plugins
    await this.discoverAndLoad(this.options.projectPluginsDir, contextOptions);

    // 3. Discover and load user plugins
    await this.discoverAndLoad(this.options.userPluginsDir, contextOptions);

    // 4. Load enabled plugins from config
    for (const pluginName of this.options.enabledPlugins) {
      if (!this.registry.has(pluginName)) {
        await this.loadExternalPlugin(pluginName, contextOptions);
      }
    }

    // 5. Activate all loaded plugins
    await this.registry.activateAll();

    return this.registry;
  }

  private async loadPlugin(
    plugin: SINPlugin,
    contextOptions: ContextOptions,
  ): Promise<void> {
    if (this.options.disabledPlugins.includes(plugin.name)) {
      return;
    }

    const config = this.options.pluginConfigs[plugin.name] || {};
    const context = createPluginContext({
      ...contextOptions,
      config,
    });

    const manifest: PluginManifest = {
      name: plugin.name,
      version: plugin.version || '1.0.0',
      type: plugin.type,
      description: plugin.description,
      main: '',
      sinPlugin: {
        minVersion: '0.1.0',
        capabilities: [plugin.type],
      },
    };

    await this.registry.register(manifest, plugin, context);
  }

  private async discoverAndLoad(
    pluginsDir: string,
    contextOptions: ContextOptions,
  ): Promise<void> {
    try {
      const entries = await fs.readdir(pluginsDir, { withFileTypes: true });

      for (const entry of entries) {
        if (!entry.isDirectory()) continue;

        const pluginDir = path.join(pluginsDir, entry.name);
        const manifestPath = path.join(pluginDir, 'sin-plugin.json');

        try {
          const manifestContent = await fs.readFile(manifestPath, 'utf-8');
          const manifest = JSON.parse(manifestContent) as PluginManifest;

          if (this.options.disabledPlugins.includes(manifest.name)) {
            continue;
          }

          // Load plugin module
          const mainPath = path.join(pluginDir, manifest.main || 'dist/index.js');
          const pluginModule = await import(fileURLToPath(new URL(`file://${mainPath}`)));
          const plugin = pluginModule.default as SINPlugin;

          const config = this.options.pluginConfigs[manifest.name] || {};
          const context = createPluginContext({
            ...contextOptions,
            config,
          });

          await this.registry.register(manifest, plugin, context);
        } catch (error) {
          console.warn(`Failed to load plugin from ${pluginDir}:`, error);
        }
      }
    } catch {
      // Directory doesn't exist, skip
    }
  }

  private async loadExternalPlugin(
    pluginName: string,
    contextOptions: ContextOptions,
  ): Promise<void> {
    try {
      // Try to load from npm
      const pluginModule = await import(pluginName);
      const plugin = pluginModule.default as SINPlugin;

      if (this.options.disabledPlugins.includes(pluginName)) {
        return;
      }

      const config = this.options.pluginConfigs[pluginName] || {};
      const context = createPluginContext({
        ...contextOptions,
        config,
      });

      const manifest: PluginManifest = {
        name: plugin.name,
        version: plugin.version || '1.0.0',
        type: plugin.type,
        description: plugin.description,
        main: '',
        sinPlugin: {
          minVersion: '0.1.0',
          capabilities: [plugin.type],
        },
      };

      await this.registry.register(manifest, plugin, context);
    } catch (error) {
      console.warn(`Failed to load external plugin ${pluginName}:`, error);
    }
  }
}
