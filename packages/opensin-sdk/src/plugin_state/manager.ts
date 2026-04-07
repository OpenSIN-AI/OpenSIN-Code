import { PluginState, PluginStateStore, PluginStateEvent } from './types';

export class PluginStateManager {
  private store: PluginStateStore;
  private listeners: Array<(event: PluginStateEvent) => void>;

  constructor() {
    this.store = { states: new Map(), lastSync: null };
    this.listeners = [];
  }

  registerPlugin(state: PluginState): void {
    this.store.states.set(state.id, state);
    this.notify({ type: 'installed', pluginId: state.id });
  }

  unregisterPlugin(pluginId: string): void {
    this.store.states.delete(pluginId);
    this.notify({ type: 'uninstalled', pluginId });
  }

  enablePlugin(pluginId: string): void {
    const state = this.store.states.get(pluginId);
    if (state) {
      state.enabled = true;
      this.notify({ type: 'enabled', pluginId });
    }
  }

  disablePlugin(pluginId: string): void {
    const state = this.store.states.get(pluginId);
    if (state) {
      state.enabled = false;
      this.notify({ type: 'disabled', pluginId });
    }
  }

  updateConfig(pluginId: string, key: string, value: unknown): void {
    const state = this.store.states.get(pluginId);
    if (state) {
      state.config[key] = value;
      this.notify({ type: 'config_updated', pluginId, key });
    }
  }

  getPluginState(pluginId: string): PluginState | undefined {
    return this.store.states.get(pluginId);
  }

  getAllStates(): PluginState[] {
    return Array.from(this.store.states.values());
  }

  onStateChange(listener: (event: PluginStateEvent) => void): () => void {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index !== -1) this.listeners.splice(index, 1);
    };
  }

  private notify(event: PluginStateEvent): void {
    this.listeners.forEach((listener) => listener(event));
  }
}
