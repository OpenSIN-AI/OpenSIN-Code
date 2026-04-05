/**
 * OpenSIN Terminal Notifications — Provider Implementations
 *
 * Multi-provider notification system: macOS, Linux, Windows, terminal bell,
 * webhook, ntfy.sh, Slack, and Telegram.
 *
 * Branded: OpenSIN/sincode
 */

import * as childProcess from 'node:child_process';
import * as os from 'node:os';
import * as util from 'node:util';
import type {
  NotificationPayload,
  NotificationProvider,
  NotificationProviderType,
  NotificationResult,
  MacOSProviderConfig,
  LinuxProviderConfig,
  TerminalBellConfig,
  WebhookProviderConfig,
  NtfyProviderConfig,
  SlackProviderConfig,
  TelegramProviderConfig,
  NotificationLevel,
} from './types.js';

const exec = util.promisify(childProcess.exec);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function levelToEmoji(level?: NotificationLevel): string {
  switch (level) {
    case 'error': return '🔴';
    case 'warning': return '🟡';
    case 'success': return '🟢';
    case 'info': default: return '🔵';
  }
}

function levelToNtfyPriority(level?: NotificationLevel): number {
  switch (level) {
    case 'error': return 5;
    case 'warning': return 4;
    case 'success': return 3;
    case 'info': default: return 3;
  }
}

function formatPayload(payload: NotificationPayload): string {
  const emoji = levelToEmoji(payload.level);
  const title = `${emoji} ${payload.title}`;
  return payload.body ? `${title}\n\n${payload.body}` : title;
}

// ---------------------------------------------------------------------------
// macOS Provider
// ---------------------------------------------------------------------------

export class MacOSNotificationProvider implements NotificationProvider {
  readonly type: NotificationProviderType = 'macos';
  private config: MacOSProviderConfig;

  constructor(config: MacOSProviderConfig) {
    this.config = { enabled: true, ...config };
  }

  async isAvailable(): Promise<boolean> {
    return os.platform() === 'darwin';
  }

  async send(payload: NotificationPayload): Promise<boolean> {
    if (os.platform() !== 'darwin') return false;

    const title = `${levelToEmoji(payload.level)} ${payload.title}`;
    const message = payload.body || '';
    const sound = this.config.sound || 'Glass';

    const escapedTitle = title.replace(/"/g, '\\"');
    const escapedMsg = message.replace(/"/g, '\\"');

    const script = `display notification "${escapedMsg}" with title "${escapedTitle}" sound name "${sound}"`;

    try {
      await exec(`osascript -e '${script}'`);
      return true;
    } catch {
      return false;
    }
  }
}

// ---------------------------------------------------------------------------
// Linux Provider
// ---------------------------------------------------------------------------

export class LinuxNotificationProvider implements NotificationProvider {
  readonly type: NotificationProviderType = 'linux';
  private config: LinuxProviderConfig;

  constructor(config: LinuxProviderConfig) {
    this.config = { enabled: true, ...config };
  }

  async isAvailable(): Promise<boolean> {
    if (os.platform() !== 'linux') return false;
    try {
      await exec('which notify-send');
      return true;
    } catch {
      return false;
    }
  }

  async send(payload: NotificationPayload): Promise<boolean> {
    const urgency = this.config.urgency || 'normal';
    const title = `${levelToEmoji(payload.level)} ${payload.title}`;
    const message = payload.body || '';

    try {
      await exec(
        `notify-send -u ${urgency} "${title}" "${message}"`,
      );
      return true;
    } catch {
      return false;
    }
  }
}

// ---------------------------------------------------------------------------
// Terminal Bell Provider
// ---------------------------------------------------------------------------

export class TerminalBellProvider implements NotificationProvider {
  readonly type: NotificationProviderType = 'terminal-bell';
  private config: TerminalBellConfig;

  constructor(config: TerminalBellConfig) {
    this.config = { enabled: true, count: 1, ...config };
  }

  async isAvailable(): Promise<boolean> {
    return true;
  }

  async send(payload: NotificationPayload): Promise<boolean> {
    const count = this.config.count || 1;
    const bells = '\x07'.repeat(count);
    process.stdout.write(bells);
    return true;
  }
}

// ---------------------------------------------------------------------------
// Webhook Provider
// ---------------------------------------------------------------------------

export class WebhookNotificationProvider implements NotificationProvider {
  readonly type: NotificationProviderType = 'webhook';
  private config: WebhookProviderConfig;

  constructor(config: WebhookProviderConfig) {
    this.config = { enabled: true, ...config };
  }

  async isAvailable(): Promise<boolean> {
    return !!this.config.url;
  }

  async send(payload: NotificationPayload): Promise<boolean> {
    try {
      const body = JSON.stringify({
        title: payload.title,
        body: payload.body,
        level: payload.level,
        event: payload.event,
        icon: payload.icon,
        metadata: payload.metadata,
        timestamp: new Date().toISOString(),
      });

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...this.config.headers,
      };

      const response = await fetch(this.config.url, {
        method: 'POST',
        headers,
        body,
      });

      return response.ok;
    } catch {
      return false;
    }
  }
}

// ---------------------------------------------------------------------------
// ntfy.sh Provider
// ---------------------------------------------------------------------------

export class NtfyNotificationProvider implements NotificationProvider {
  readonly type: NotificationProviderType = 'ntfy';
  private config: NtfyProviderConfig;

  constructor(config: NtfyProviderConfig) {
    this.config = { enabled: true, priority: 3, ...config };
  }

  async isAvailable(): Promise<boolean> {
    return !!this.config.url;
  }

  async send(payload: NotificationPayload): Promise<boolean> {
    try {
      const url = new URL(this.config.url);
      const headers: Record<string, string> = {
        'Title': payload.title,
        'Priority': String(this.config.priority ?? levelToNtfyPriority(payload.level)),
      };

      if (this.config.tags?.length) {
        headers['Tags'] = this.config.tags.join(',');
      }

      const response = await fetch(url.toString(), {
        method: 'POST',
        headers,
        body: payload.body || payload.title,
      });

      return response.ok;
    } catch {
      return false;
    }
  }
}

// ---------------------------------------------------------------------------
// Slack Provider
// ---------------------------------------------------------------------------

export class SlackNotificationProvider implements NotificationProvider {
  readonly type: NotificationProviderType = 'slack';
  private config: SlackProviderConfig;

  constructor(config: SlackProviderConfig) {
    this.config = { enabled: true, ...config };
  }

  async isAvailable(): Promise<boolean> {
    return !!this.config.webhookUrl;
  }

  async send(payload: NotificationPayload): Promise<boolean> {
    try {
      const color = payload.level === 'error' ? '#ff0000'
        : payload.level === 'warning' ? '#ffaa00'
        : payload.level === 'success' ? '#00cc00'
        : '#36a64f';

      const blocks = [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*${levelToEmoji(payload.level)} ${payload.title}*`,
          },
        },
      ];

      if (payload.body) {
        blocks.push({
          type: 'section',
          text: { type: 'plain_text', text: payload.body, emoji: true },
        });
      }

      const body: Record<string, unknown> = { blocks };
      if (this.config.channel) body.channel = this.config.channel;
      if (this.config.username) body.username = this.config.username;

      const response = await fetch(this.config.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      return response.ok;
    } catch {
      return false;
    }
  }
}

// ---------------------------------------------------------------------------
// Telegram Provider
// ---------------------------------------------------------------------------

export class TelegramNotificationProvider implements NotificationProvider {
  readonly type: NotificationProviderType = 'telegram';
  private config: TelegramProviderConfig;

  constructor(config: TelegramProviderConfig) {
    this.config = { enabled: true, ...config };
  }

  async isAvailable(): Promise<boolean> {
    return !!(this.config.botToken && this.config.chatId);
  }

  async send(payload: NotificationPayload): Promise<boolean> {
    try {
      const text = formatPayload(payload);
      const url = `https://api.telegram.org/bot${this.config.botToken}/sendMessage`;

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: this.config.chatId,
          text,
          parse_mode: 'HTML',
        }),
      });

      return response.ok;
    } catch {
      return false;
    }
  }
}

// ---------------------------------------------------------------------------
// Provider Factory
// ---------------------------------------------------------------------------

export function createProvider(
  config: NonNullable<import('./types.js').NotificationSettings>['providers'][number],
): NotificationProvider | null {
  switch (config.type) {
    case 'macos':
      return new MacOSNotificationProvider(config);
    case 'linux':
      return new LinuxNotificationProvider(config);
    case 'terminal-bell':
      return new TerminalBellProvider(config);
    case 'webhook':
      return new WebhookNotificationProvider(config);
    case 'ntfy':
      return new NtfyNotificationProvider(config);
    case 'slack':
      return new SlackNotificationProvider(config);
    case 'telegram':
      return new TelegramNotificationProvider(config);
    case 'windows':
    case 'none':
      return null;
    default:
      return null;
  }
}
