/**
 * OpenSIN WakaTime Integration — Coding Activity Tracking
 *
 * Tracks coding activity in OpenSIN sessions via WakaTime API.
 * Sends heartbeats for tool executions, file edits, and session duration.
 *
 * Branded: OpenSIN/sincode
 */

import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as os from 'node:os';

interface WakaTimeHeartbeat {
  entity: string;
  type: 'file' | 'app' | 'domain';
  category: string;
  project?: string;
  language?: string;
  lineno?: number;
  cursorpos?: number;
  is_write?: boolean;
  timestamp: number;
}

interface WakaTimeConfig {
  apiKey: string;
  apiUrl?: string;
  project?: string;
}

const DEFAULT_API_URL = 'https://wakaTime.com/api/v1';

export class WakaTimeTracker {
  private config: WakaTimeConfig | null = null;
  private configPath: string;
  private queue: WakaTimeHeartbeat[] = [];
  private flushTimer: ReturnType<typeof setTimeout> | null = null;
  private sessionStart: number = Date.now();

  constructor(configDir?: string) {
    this.configPath = configDir
      ? path.join(configDir, 'wakatime.json')
      : path.join(os.homedir(), '.wakatime.cfg');
  }

  async init(): Promise<boolean> {
    await this.loadConfig();
    return this.config !== null;
  }

  private async loadConfig(): Promise<void> {
    try {
      if (process.env.WAKATIME_API_KEY) {
        this.config = {
          apiKey: process.env.WAKATIME_API_KEY,
          apiUrl: process.env.WAKATIME_API_URL || DEFAULT_API_URL,
          project: process.env.WAKATIME_PROJECT,
        };
        return;
      }

      const raw = await fs.readFile(this.configPath, 'utf-8');

      if (this.configPath.endsWith('.json')) {
        const parsed = JSON.parse(raw);
        this.config = {
          apiKey: parsed.apiKey,
          apiUrl: parsed.apiUrl || DEFAULT_API_URL,
          project: parsed.project,
        };
      } else {
        const keyMatch = raw.match(/api_key\s*=\s*(.+)/);
        if (keyMatch) {
          this.config = {
            apiKey: keyMatch[1].trim(),
            apiUrl: DEFAULT_API_URL,
          };
        }
      }
    } catch {
      this.config = null;
    }
  }

  async sendHeartbeat(heartbeat: Omit<WakaTimeHeartbeat, 'timestamp'>): Promise<boolean> {
    if (!this.config) return false;

    const entry: WakaTimeHeartbeat = {
      ...heartbeat,
      timestamp: Date.now() / 1000,
    };

    this.queue.push(entry);

    if (!this.flushTimer) {
      this.flushTimer = setTimeout(() => void this.flush(), 10000);
    }

    return true;
  }

  async trackToolExecution(toolName: string, filePath?: string, language?: string): Promise<boolean> {
    const category = this.mapToolToCategory(toolName);

    return this.sendHeartbeat({
      entity: filePath || `tool:${toolName}`,
      type: filePath ? 'file' : 'app',
      category,
      project: this.config?.project,
      language,
      is_write: ['write', 'edit', 'fileEdit', 'fileWrite'].includes(toolName),
    });
  }

  async trackSessionStart(project?: string): Promise<boolean> {
    this.sessionStart = Date.now();

    return this.sendHeartbeat({
      entity: 'opensin-code-session',
      type: 'app',
      category: 'coding',
      project: project || this.config?.project,
    });
  }

  async trackSessionEnd(): Promise<boolean> {
    const durationSec = (Date.now() - this.sessionStart) / 1000;

    return this.sendHeartbeat({
      entity: `opensin-code-session (${Math.round(durationSec)}s)`,
      type: 'app',
      category: 'coding',
      project: this.config?.project,
    });
  }

  private async flush(): Promise<void> {
    this.flushTimer = null;

    if (!this.config || this.queue.length === 0) return;

    const heartbeats = [...this.queue];
    this.queue = [];

    try {
      await fetch(`${this.config.apiUrl}/users/current/heartbeats`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${Buffer.from(this.config.apiKey).toString('base64')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(heartbeats),
      });
    } catch {
      this.queue.push(...heartbeats);
    }
  }

  private mapToolToCategory(toolName: string): string {
    const writeTools = ['write', 'edit', 'fileEdit', 'fileWrite', 'FileWriteTool', 'FileEditTool'];
    const readTools = ['read', 'fileRead', 'FileReadTool', 'grep', 'GrepTool', 'glob', 'GlobTool'];
    const debugTools = ['bash', 'BashTool', 'debug', 'test'];

    if (writeTools.includes(toolName)) return 'code reviewing';
    if (readTools.includes(toolName)) return 'code reviewing';
    if (debugTools.includes(toolName)) return 'debugging';

    return 'coding';
  }

  dispose(): void {
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }
    void this.flush();
  }
}

export function createWakaTimeTracker(configDir?: string): WakaTimeTracker {
  return new WakaTimeTracker(configDir);
}
