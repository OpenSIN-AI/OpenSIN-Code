/**
 * OpenSIN Terminal Notifications — Types
 *
 * Type definitions for the terminal notification system supporting
 * multiple providers: macOS native, Linux (notify-send), Windows (toast),
 * terminal bell, and custom webhooks.
 *
 * Branded: OpenSIN/sincode
 */

// ---------------------------------------------------------------------------
// Provider Types
// ---------------------------------------------------------------------------

export type NotificationProviderType =
  | 'macos'
  | 'linux'
  | 'windows'
  | 'terminal-bell'
  | 'webhook'
  | 'ntfy'
  | 'slack'
  | 'telegram'
  | 'none';

export type NotificationLevel = 'info' | 'success' | 'warning' | 'error';

export type NotificationEvent =
  | 'task-complete'
  | 'task-error'
  | 'task-started'
  | 'tool-executed'
  | 'session-idle'
  | 'agent-complete'
  | 'custom';

// ---------------------------------------------------------------------------
// Notification Payload
// ---------------------------------------------------------------------------

export interface NotificationPayload {
  /** Notification title */
  title: string;
  /** Notification body text */
  body?: string;
  /** Notification level for icon/color */
  level?: NotificationLevel;
  /** Event type that triggered this notification */
  event?: NotificationEvent;
  /** Optional icon (emoji or path) */
  icon?: string;
  /** Optional sound name */
  sound?: string;
  /** Optional actions (provider-dependent) */
  actions?: NotificationAction[];
  /** Optional metadata for webhook payloads */
  metadata?: Record<string, unknown>;
}

export interface NotificationAction {
  id: string;
  label: string;
  /** Optional callback URL or action identifier */
  url?: string;
}

// ---------------------------------------------------------------------------
// Provider Configuration
// ---------------------------------------------------------------------------

export interface BaseProviderConfig {
  type: NotificationProviderType;
  /** Enable or disable this provider */
  enabled: boolean;
  /** Only notify for these levels (empty = all) */
  levelFilter?: NotificationLevel[];
  /** Only notify for these events (empty = all) */
  eventFilter?: NotificationEvent[];
  /** Minimum duration in ms before notifying (avoid spam for fast tasks) */
  minDurationMs?: number;
}

export interface MacOSProviderConfig extends BaseProviderConfig {
  type: 'macos';
  /** Use native macOS notifications (default: true) */
  useNative?: boolean;
  /** Custom sound name (system sounds) */
  sound?: string;
}

export interface LinuxProviderConfig extends BaseProviderConfig {
  type: 'linux';
  /** notify-send urgency level: low, normal, critical */
  urgency?: 'low' | 'normal' | 'critical';
}

export interface WindowsProviderConfig extends BaseProviderConfig {
  type: 'windows';
}

export interface TerminalBellConfig extends BaseProviderConfig {
  type: 'terminal-bell';
  /** Number of bell characters to send */
  count?: number;
}

export interface WebhookProviderConfig extends BaseProviderConfig {
  type: 'webhook';
  /** Webhook URL to POST to */
  url: string;
  /** Optional secret for signature verification */
  secret?: string;
  /** Custom headers */
  headers?: Record<string, string>;
}

export interface NtfyProviderConfig extends BaseProviderConfig {
  type: 'ntfy';
  /** ntfy.sh topic URL (e.g., https://ntfy.sh/my-topic) */
  url: string;
  /** Priority: 1=min, 2=low, 3=default, 4=high, 5=max */
  priority?: number;
  /** Optional tags (emoji names) */
  tags?: string[];
}

export interface SlackProviderConfig extends BaseProviderConfig {
  type: 'slack';
  /** Slack webhook URL */
  webhookUrl: string;
  /** Slack channel (optional, defaults to webhook channel) */
  channel?: string;
  /** Username to display (optional) */
  username?: string;
}

export interface TelegramProviderConfig extends BaseProviderConfig {
  type: 'telegram';
  /** Telegram bot token */
  botToken: string;
  /** Chat ID to send to */
  chatId: string;
}

export type NotificationProviderConfig =
  | MacOSProviderConfig
  | LinuxProviderConfig
  | WindowsProviderConfig
  | TerminalBellConfig
  | WebhookProviderConfig
  | NtfyProviderConfig
  | SlackProviderConfig
  | TelegramProviderConfig;

// ---------------------------------------------------------------------------
// Notification Settings
// ---------------------------------------------------------------------------

export interface NotificationSettings {
  /** Master toggle for all notifications */
  enabled: boolean;
  /** List of configured providers */
  providers: NotificationProviderConfig[];
  /** Quiet hours: do not notify during this time */
  quietHours?: {
    start: string; // HH:MM format, e.g., "22:00"
    end: string;   // HH:MM format, e.g., "07:00"
  };
  /** Cooldown between notifications for the same event (ms) */
  cooldownMs?: number;
}

// ---------------------------------------------------------------------------
// Provider Interface
// ---------------------------------------------------------------------------

export interface NotificationProvider {
  /** Provider type identifier */
  readonly type: NotificationProviderType;
  /** Whether this provider is available on the current system */
  isAvailable(): Promise<boolean>;
  /** Send a notification */
  send(payload: NotificationPayload): Promise<boolean>;
  /** Clean up any resources */
  dispose?(): void;
}

// ---------------------------------------------------------------------------
// Notification Result
// ---------------------------------------------------------------------------

export interface NotificationResult {
  provider: NotificationProviderType;
  success: boolean;
  error?: string;
  durationMs?: number;
}
