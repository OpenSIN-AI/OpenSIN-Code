import * as fs from 'fs';
import * as path from 'path';
import { PluginState, PluginStateStore } from './types';

export class PluginStateStorage {
  private storagePath: string;

  constructor(baseDir: string) {
    this.storagePath = path.join(baseDir, 'plugin-states.json');
  }

  async save(store: PluginStateStore): Promise<void> {
    const data = {
      states: Array.from(store.states.entries()).map(([id, state]) => [id, {
        ...state,
        installedAt: state.installedAt.toISOString(),
        lastUpdated: state.lastUpdated?.toISOString() ?? null,
      }]),
      lastSync: store.lastSync?.toISOString() ?? null,
    };
    await fs.promises.writeFile(this.storagePath, JSON.stringify(data, null, 2));
  }

  async load(): Promise<PluginStateStore> {
    try {
      const raw = await fs.promises.readFile(this.storagePath, 'utf-8');
      const data = JSON.parse(raw);
      const states = new Map<string, PluginState>(
        data.states.map(([id, s]: [string, any]) => [
          id,
          {
            ...s,
            installedAt: new Date(s.installedAt),
            lastUpdated: s.lastUpdated ? new Date(s.lastUpdated) : null,
          },
        ])
      );
      return {
        states,
        lastSync: data.lastSync ? new Date(data.lastSync) : null,
      };
    } catch {
      return { states: new Map(), lastSync: null };
    }
  }
}
