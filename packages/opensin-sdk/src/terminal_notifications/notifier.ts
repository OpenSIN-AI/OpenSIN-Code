/**
 * OpenSIN Terminal Notifications — Notifier Orchestrator
 *
 * Manages multiple notification providers, applies filters,
 * quiet hours, cooldown, and dispatches notifications.
 *
 * Branded: OpenSIN/sincode
 */

import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as os from 'node:os';
import type {
  NotificationPayload,
  NotificationProvider,
  NotificationProviderConfig,
  NotificationSettings,
  NotificationResult,
  NotificationEvent,
  NotificationLevel,
} from './types.js';
import { createProvider } from './providers.js';

const DEFAULT_SETTINGS: NotificationSettings = {
  enabled: true,
  providers: [
    { type: 'terminal-bell', enabled: true },
  ],
  cooldownMs: 5000,
};

export class NotificationManager {
  private settings: NotificationSettings;
  private providers: Map<string, NotificationProvider> = new Map();
  private lastNotificationTime: Map<string, number> = new Map();
  private configPath: string;

  constructor(configDir?: string) {
    this.configPath = configDir
      ? path.join(configDir, 'notifications.json')
      : path.join(os.homedir(), '.opensin', 'notifications.json');
    this.settings = { ...DEFAULT_SETTINGS, providers: [] };
  }

  async init(): Promise<void> {
    await this.loadConfig();
    await this.initProviders();
  }

  private async loadConfig(): Promise<void> {
    try {
      const raw = await fs.readFile(this.configPath, 'utf-8');
      this.settings = { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    } catch {
      this.settings = { ...DEFAULT_SETTINGS };
    }
  }

  private async saveConfig(): Promise<void> {
    const dir = path.dirname(this.configPath);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(this.configPath, JSON.stringify(this.settings, null, 2));
  }

  private async initComponents(): Promise<void> {
    this.providers.clear();

    for (const config of this.settings.providers) {
      if (!config.enabled) continue;
      const provider = createProvider(config);
      if (provider && await provider.isAvailable()) {
        this.providers.set(config.type, provider);
      }
    }
  }

  async notify(payload: NotificationPayload): Promise<NotificationResult[]> {
    if (!this.settings.enabled) return [];

    if (this.isQuietHours()) return [];

    const eventKey = payload.event || 'custom';
    const lastTime = this.lastNotificationTime.get(eventKey) || 0;
    const cooldown = this.settings.cooldownMs || 0;

    if (Date.now() - lastTime < cooldown) return [];

    const results: NotificationResult[] = [];

    for (const [type, provider] of this.providers) {
      const config = this.settings.providers.find(p => p.type === type);
      if (!config) continue;

      if (config.levelFilter?.length && payload.level && !config.levelFilter.includes(payload.level)) {
        continue;
      }

      if (config.eventFilter?.length && payload.event && !config.eventFilter.includes(payload.event)) {
        continue;
      }

      const start = Date.now();
      try {
        const success = await provider.send(payload);
        results.push({ provider: type, success, durationMs: Date.now() - start });
      } catch (error) {
        results.push({
          provider: type,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          durationMs: Date.now() - start,
        });
      }
    }

    this.lastNotificationTime.set(eventKey, Date.now());
    return results;
  }

  private isQuietHours(): boolean {
    const qh = this.settings.quietHours;
    if (!qh) return false;

    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const [startH, startM] = qh.start.split(':').map(Number);
    const [endH, endM] = qh.end.split(':').map(Number);
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;

    if (startMinutes > endMinutes) {
      return currentMinutes >= startMinutes || currentMinutes <= endMinutes;
    }

    return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
  }

  async addProvider(config: NotificationProviderConfig): Promise<boolean> {
    const existing = this.settings.providers.findIndex(p => p.type === config.type);
    if (existing >= 0) {
      this.settings.providers[existing] = config;
    } else {
      this.settings.providers.push(config);
    }

    await this.saveConfig();
    await this.initComponents();
    return true;
  }

  async removeProvider(type: NotificationProviderConfig['type']): Promise<boolean> {
    this.settings.providers = this.settings.providers.filter(p => p.type !== type);
    await this.saveConfig();
    await this.initComponents();
    return true;
  }

  async toggle(enabled: boolean): Promise<void> {
    this.settings.enabled = enabled;
    await this.saveConfig();
  }

  getSettings(): NotificationSettings {
    return { ...this.settings };
  }

  getActiveProviders(): string[] {
    return Array.from(this.providers.keys());
  }

  dispose(): void {
    for (const provider of this.providers.values()) {
      provider.dispose?.();
    }
    this.providers.clear();
  }
}

export function createNotificationManager(configDir?: string): NotificationManager {
  return new NotificationManager(configDir);
}
