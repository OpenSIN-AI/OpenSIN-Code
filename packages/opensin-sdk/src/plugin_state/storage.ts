import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { PluginState, PluginStateConfig } from "./types.js";

const DEFAULT_CONFIG: PluginStateConfig = {
  stateDir: path.join(os.homedir(), ".opensin", "plugin-state"),
  maxStateSize: 10 * 1024 * 1024,
  encryptionEnabled: false,
};

export class PluginStateStorage {
  private config: PluginStateConfig;

  constructor(config?: Partial<PluginStateConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.ensureStateDir();
  }

  private ensureStateDir(): void {
    if (!fs.existsSync(this.config.stateDir)) {
      fs.mkdirSync(this.config.stateDir, { recursive: true });
    }
  }

  private getStatePath(pluginId: string): string {
    const safe = pluginId.replace(/[^a-zA-Z0-9._-]/g, "_");
    return path.join(this.config.stateDir, `${safe}.json`);
  }

  async save(pluginId: string, state: PluginState): Promise<void> {
    const statePath = this.getStatePath(pluginId);
    const json = JSON.stringify(state, null, 2);

    if (Buffer.byteLength(json, "utf-8") > this.config.maxStateSize) {
      throw new Error(
        `Plugin state for ${pluginId} exceeds maximum size of ${this.config.maxStateSize} bytes`
      );
    }

    fs.writeFileSync(statePath, json, "utf-8");
  }

  async load(pluginId: string): Promise<PluginState | null> {
    const statePath = this.getStatePath(pluginId);
    if (!fs.existsSync(statePath)) {
      return null;
    }
    try {
      const json = fs.readFileSync(statePath, "utf-8");
      return JSON.parse(json) as PluginState;
    } catch {
      return null;
    }
  }

  async delete(pluginId: string): Promise<boolean> {
    const statePath = this.getStatePath(pluginId);
    if (!fs.existsSync(statePath)) {
      return false;
    }
    fs.unlinkSync(statePath);
    return true;
  }

  async exists(pluginId: string): Promise<boolean> {
    const statePath = this.getStatePath(pluginId);
    return fs.existsSync(statePath);
  }

  async getStateSize(pluginId: string): Promise<number> {
    const statePath = this.getStatePath(pluginId);
    if (!fs.existsSync(statePath)) {
      return 0;
    }
    return fs.statSync(statePath).size;
  }

  async listAllPlugins(): Promise<string[]> {
    if (!fs.existsSync(this.config.stateDir)) {
      return [];
    }
    return fs
      .readdirSync(this.config.stateDir)
      .filter((f) => f.endsWith(".json"))
      .map((f) => f.replace(".json", ""));
  }
}

let _storage: PluginStateStorage | null = null;

export function getPluginStateStorage(
  config?: Partial<PluginStateConfig>
): PluginStateStorage {
  if (!_storage) {
    _storage = new PluginStateStorage(config);
  }
  return _storage;
}

export function resetPluginStateStorage(): void {
  _storage = null;
}
