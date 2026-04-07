export interface PluginState {
  id: string;
  name: string;
  version: string;
  enabled: boolean;
  installedAt: Date;
  lastUpdated: Date | null;
  config: Record<string, unknown>;
}

export interface PluginStateStore {
  states: Map<string, PluginState>;
  lastSync: Date | null;
}

export type PluginStateEvent =
  | { type: 'installed'; pluginId: string }
  | { type: 'uninstalled'; pluginId: string }
  | { type: 'enabled'; pluginId: string }
  | { type: 'disabled'; pluginId: string }
  | { type: 'config_updated'; pluginId: string; key: string };
