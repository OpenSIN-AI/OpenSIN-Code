// src/plugin.ts
import { PluginType, PluginManifest, ValidationResult, PluginPermissions } from './types.js';
import { PluginContext } from './context.js';

export interface SINPlugin {
  name: string;
  version: string;
  type: PluginType;
  description?: string;

  /** Plugin initialisieren — vor dem Laden */
  init?(ctx: PluginContext): Promise<void>;

  /** Plugin aktivieren — registriert Tools, Hooks, Commands */
  activate?(ctx: PluginContext): Promise<void>;

  /** Plugin deaktivieren — deregistriert alles */
  deactivate?(ctx: PluginContext): Promise<void>;

  /** Plugin zerstören — Cleanup von Ressourcen */
  destroy?(ctx: PluginContext): Promise<void>;

  /** Konfiguration validieren */
  validateConfig?(config: Record<string, unknown>): ValidationResult;
}

/** Factory function to define a plugin */
export function definePlugin(plugin: SINPlugin): SINPlugin {
  // Validate plugin structure
  if (!plugin.name || !plugin.version || !plugin.type) {
    throw new Error('Plugin must have name, version, and type');
  }

  if (!plugin.name.startsWith('@sin/') && !plugin.name.includes('/')) {
    throw new Error('Plugin name must be scoped (@sin/name or scope/name)');
  }

  return plugin;
}

/** Factory function to define an auth provider plugin */
export function defineAuthProvider(authProvider: {
  name: string;
  displayName: string;
  authenticate: (config: Record<string, unknown>) => Promise<{
    provider: string;
    token: string;
    models: string[];
  }>;
}): SINPlugin {
  return definePlugin({
    name: authProvider.name,
    version: '1.0.0',
    type: 'auth',
    description: `Authentication provider for ${authProvider.displayName}`,

    async activate(ctx) {
      // Register auth provider
      ctx.events.emit('auth:provider:register', {
        name: authProvider.name,
        displayName: authProvider.displayName,
        authenticate: authProvider.authenticate,
      });
    },
  });
}