export interface PluginState {
  pluginId: string;
  version: string;
  data: Record<string, unknown>;
  lastUpdated: string;
  createdAt: string;
}

export interface PluginStateConfig {
  stateDir: string;
  maxStateSize: number;
  encryptionEnabled: boolean;
}

export interface SensitiveValue {
  key: string;
  service: string;
  account: string;
}

export interface KeychainBackend {
  name: string;
  set(key: string, value: string): Promise<boolean>;
  get(key: string): Promise<string | null>;
  delete(key: string): Promise<boolean>;
  isAvailable(): Promise<boolean>;
}

export interface PluginUninstallPrompt {
  pluginId: string;
  pluginName: string;
  hasState: boolean;
  stateSize: number;
  deleteState: boolean;
}

export type PlatformType = "darwin" | "linux" | "windows";
