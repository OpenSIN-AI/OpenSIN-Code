import { SINPlugin, PluginManifest, PluginType, ValidationResult } from '@opensin/plugin-sdk';
import { PluginContext, ToolRegistry, EventBus, SINCoreAPI } from '@opensin/plugin-sdk';

interface PluginEntry {
  manifest: PluginManifest;
  instance: SINPlugin;
  context: PluginContext;
  state: 'loaded' | 'active' | 'inactive' | 'error';
  error?: string;
}

export class PluginRegistry {
  private plugins = new Map<string, PluginEntry>();
  private loadOrder: string[] = [];

  get(name: string): PluginEntry | undefined {
    return this.plugins.get(name);
  }

  has(name: string): boolean {
    return this.plugins.has(name);
  }

  getAll(): PluginEntry[] {
    return Array.from(this.plugins.values());
  }

  getActive(): PluginEntry[] {
    return this.getAll().filter(p => p.state === 'active');
  }

  async register(
    manifest: PluginManifest,
    instance: SINPlugin,
    context: PluginContext,
  ): Promise<void> {
    if (this.plugins.has(manifest.name)) {
      throw new Error(`Plugin ${manifest.name} is already registered`);
    }

    // Validate manifest
    this.validateManifest(manifest);

    this.plugins.set(manifest.name, {
      manifest,
      instance,
      context,
      state: 'loaded',
    });

    this.loadOrder.push(manifest.name);
  }

  async activate(name: string): Promise<void> {
    const entry = this.plugins.get(name);
    if (!entry) {
      throw new Error(`Plugin ${name} not found`);
    }

    if (entry.state === 'active') {
      return;
    }

    try {
      // Check dependencies
      await this.checkDependencies(entry.manifest);

      // Run init if present
      if (entry.instance.init) {
        await entry.instance.init(entry.context);
      }

      // Run activate
      if (entry.instance.activate) {
        await entry.instance.activate(entry.context);
      }

      entry.state = 'active';
      entry.context.events.emit('plugin:activate', { name });
    } catch (error) {
      entry.state = 'error';
      entry.error = error instanceof Error ? error.message : String(error);
      throw error;
    }
  }

  async deactivate(name: string): Promise<void> {
    const entry = this.plugins.get(name);
    if (!entry) {
      throw new Error(`Plugin ${name} not found`);
    }

    if (entry.state !== 'active') {
      return;
    }

    try {
      if (entry.instance.deactivate) {
        await entry.instance.deactivate(entry.context);
      }

      entry.state = 'inactive';
      entry.context.events.emit('plugin:deactivate', { name });
    } catch (error) {
      entry.error = error instanceof Error ? error.message : String(error);
      throw error;
    }
  }

  async destroy(name: string): Promise<void> {
    const entry = this.plugins.get(name);
    if (!entry) {
      return;
    }

    if (entry.state === 'active') {
      await this.deactivate(name);
    }

    if (entry.instance.destroy) {
      await entry.instance.destroy(entry.context);
    }

    this.plugins.delete(name);
  }

  async activateAll(): Promise<void> {
    for (const name of this.loadOrder) {
      try {
        await this.activate(name);
      } catch (error) {
        console.error(`Failed to activate plugin ${name}:`, error);
      }
    }
  }

  async deactivateAll(): Promise<void> {
    for (const name of [...this.loadOrder].reverse()) {
      try {
        await this.deactivate(name);
      } catch (error) {
        console.error(`Failed to deactivate plugin ${name}:`, error);
      }
    }
  }

  private validateManifest(manifest: PluginManifest): void {
    if (!manifest.name) {
      throw new Error('Plugin manifest must have a name');
    }
    if (!manifest.version) {
      throw new Error(`Plugin ${manifest.name} must have a version`);
    }
    if (!manifest.type) {
      throw new Error(`Plugin ${manifest.name} must have a type`);
    }
    if (!manifest.sinPlugin?.minVersion) {
      throw new Error(`Plugin ${manifest.name} must specify sinPlugin.minVersion`);
    }
    if (!manifest.sinPlugin?.capabilities) {
      throw new Error(`Plugin ${manifest.name} must specify sinPlugin.capabilities`);
    }
  }

  private async checkDependencies(manifest: PluginManifest): Promise<void> {
    const deps = manifest.sinPlugin.dependencies;
    if (!deps) return;

    for (const [depName, versionRange] of Object.entries(deps)) {
      if (!this.plugins.has(depName)) {
        throw new Error(`Plugin ${manifest.name} requires dependency ${depName} (${versionRange})`);
      }
    }
  }
}
