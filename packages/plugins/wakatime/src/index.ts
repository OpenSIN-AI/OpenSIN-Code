import { definePlugin } from '@opensin/plugin-sdk';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as os from 'node:os';

interface Heartbeat {
  type: string;
  entity: string;
  time: number;
  project: string;
  language: string;
}

async function sendHeartbeat(apiKey: string, heartbeat: Heartbeat): Promise<void> {
  try {
    const url = 'https://wakatime.com/api/v1/users/current/heartbeats';
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(apiKey).toString('base64')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(heartbeat),
    });
    if (!response.ok) {
      throw new Error(`WakaTime API error: ${response.status}`);
    }
  } catch (error: any) {
    // Silently fail
  }
}

function detectLanguage(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  const langMap: Record<string, string> = {
    '.ts': 'TypeScript', '.tsx': 'TypeScript', '.js': 'JavaScript', '.jsx': 'JavaScript',
    '.py': 'Python', '.go': 'Go', '.rs': 'Rust', '.java': 'Java',
    '.rb': 'Ruby', '.php': 'PHP', '.swift': 'Swift', '.kt': 'Kotlin',
    '.css': 'CSS', '.scss': 'SCSS', '.html': 'HTML', '.md': 'Markdown',
    '.json': 'JSON', '.yaml': 'YAML', '.yml': 'YAML', '.toml': 'TOML',
    '.sh': 'Shell', '.bash': 'Shell', '.zsh': 'Shell',
  };
  return langMap[ext] || 'Other';
}

export default definePlugin({
  name: '@opensin/plugin-wakatime',
  version: '0.1.0',
  type: 'hook',
  description: 'WakaTime integration for tracking coding activity',

  async activate(ctx) {
    const apiKey = ctx.getConfig<string>('apiKey', '');
    const projectName = ctx.getConfig<string>('projectName', 'sin-code-cli');
    const enabled = ctx.getConfig('enabled', false);

    if (!enabled || !apiKey) {
      ctx.logger.info('WakaTime plugin disabled (set apiKey and enabled: true)');
      return;
    }

    let heartbeatsSent = 0;

    ctx.events.on('tool:execute:after', async (data: any) => {
      const { tool, args } = data || {};
      if (tool === 'write' && args?.path) {
        const heartbeat: Heartbeat = {
          type: 'file',
          entity: args.path,
          time: Date.now() / 1000,
          project: projectName,
          language: detectLanguage(args.path),
        };
        await sendHeartbeat(apiKey, heartbeat);
        heartbeatsSent++;
      }
    });

    ctx.events.on('session:end', async () => {
      ctx.logger.info(`[wakatime] Session ended — ${heartbeatsSent} heartbeats sent`);
    });

    ctx.logger.info(`WakaTime plugin activated (project: ${projectName})`);
  },
});
