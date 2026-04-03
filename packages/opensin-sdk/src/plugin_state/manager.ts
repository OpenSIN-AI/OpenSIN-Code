import { PluginState, PluginUninstallPrompt } from "./types.js";
import { PluginStateStorage, getPluginStateStorage } from "./storage.js";
import { KeychainManager, getKeychainManager } from "./keychain.js";

const SIN_PLUGIN_DATA_PREFIX = "SIN_PLUGIN_DATA:";

export class PluginStateManager {
  private storage: PluginStateStorage;
  private keychain: KeychainManager;
  private sensitiveKeys: Set<string> = new Set();

  constructor() {
    this.storage = getPluginStateStorage();
    this.keychain = getKeychainManager();
  }

  async getState(pluginId: string): Promise<Record<string, unknown> | null> {
    const state = await this.storage.load(pluginId);
    if (!state) {
      return null;
    }
    return state.data;
  }

  async setState(
    pluginId: string,
    version: string,
    data: Record<string, unknown>
  ): Promise<void> {
    const existing = await this.storage.load(pluginId);
    const now = new Date().toISOString();

    const state: PluginState = {
      pluginId,
      version,
      data,
      lastUpdated: now,
      createdAt: existing?.createdAt ?? now,
    };

    await this.storage.save(pluginId, state);
  }

  async getSensitiveValue(pluginId: string, key: string): Promise<string | null> {
    const storageKey = `${SIN_PLUGIN_DATA_PREFIX}${pluginId}:${key}`;
    return this.keychain.get(storageKey);
  }

  async setSensitiveValue(
    pluginId: string,
    key: string,
    value: string
  ): Promise<boolean> {
    const storageKey = `${SIN_PLUGIN_DATA_PREFIX}${pluginId}:${key}`;
    this.sensitiveKeys.add(storageKey);
    return this.keychain.set(storageKey, value);
  }

  async deleteSensitiveValue(pluginId: string, key: string): Promise<boolean> {
    const storageKey = `${SIN_PLUGIN_DATA_PREFIX}${pluginId}:${key}`;
    this.sensitiveKeys.delete(storageKey);
    return this.keychain.delete(storageKey);
  }

  async deleteState(pluginId: string): Promise<boolean> {
    const sensitiveKeys = Array.from(this.sensitiveKeys).filter((k) =>
      k.startsWith(`${SIN_PLUGIN_DATA_PREFIX}${pluginId}:`)
    );
    for (const key of sensitiveKeys) {
      await this.keychain.delete(key);
      this.sensitiveKeys.delete(key);
    }
    return this.storage.delete(pluginId);
  }

  async getUninstallPrompt(
    pluginId: string,
    pluginName: string
  ): Promise<PluginUninstallPrompt> {
    const hasState = await this.storage.exists(pluginId);
    const stateSize = hasState ? await this.storage.getStateSize(pluginId) : 0;

    return {
      pluginId,
      pluginName,
      hasState,
      stateSize,
      deleteState: false,
    };
  }

  async handleUninstall(
    pluginId: string,
    deleteState: boolean
  ): Promise<void> {
    if (deleteState) {
      await this.deleteState(pluginId);
    }
  }

  async listAllStates(): Promise<PluginState[]> {
    const pluginIds = await this.storage.listAllPlugins();
    const states: PluginState[] = [];
    for (const id of pluginIds) {
      const state = await this.storage.load(id);
      if (state) {
        states.push(state);
      }
    }
    return states;
  }

  async hasState(pluginId: string): Promise<boolean> {
    return this.storage.exists(pluginId);
  }
}

let _pluginStateManager: PluginStateManager | null = null;

export function getPluginStateManager(): PluginStateManager {
  if (!_pluginStateManager) {
    _pluginStateManager = new PluginStateManager();
  }
  return _pluginStateManager;
}

export function resetPluginStateManager(): void {
  _pluginStateManager = null;
}
