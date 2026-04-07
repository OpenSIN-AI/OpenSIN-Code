import * as fs from 'fs';
import * as path from 'path';

export interface SecureCredential {
  pluginId: string;
  key: string;
  value: string;
}

export class PluginKeychain {
  private keychainPath: string;
  private credentials: Map<string, string>;

  constructor(baseDir: string) {
    this.keychainPath = path.join(baseDir, 'plugin-keychain.json');
    this.credentials = new Map();
    this.load();
  }

  private load(): void {
    try {
      const raw = fs.readFileSync(this.keychainPath, 'utf-8');
      const data = JSON.parse(raw);
      this.credentials = new Map(Object.entries(data));
    } catch {
      this.credentials = new Map();
    }
  }

  private save(): void {
    const data = Object.fromEntries(this.credentials);
    fs.writeFileSync(this.keychainPath, JSON.stringify(data, null, 2));
  }

  set(pluginId: string, key: string, value: string): void {
    const entryKey = `${pluginId}:${key}`;
    this.credentials.set(entryKey, value);
    this.save();
  }

  get(pluginId: string, key: string): string | undefined {
    return this.credentials.get(`${pluginId}:${key}`);
  }

  delete(pluginId: string, key: string): void {
    this.credentials.delete(`${pluginId}:${key}`);
    this.save();
  }

  getAllForPlugin(pluginId: string): Record<string, string> {
    const result: Record<string, string> = {};
    for (const [key, value] of this.credentials) {
      if (key.startsWith(`${pluginId}:`)) {
        result[key.slice(pluginId.length + 1)] = value;
      }
    }
    return result;
  }
}
