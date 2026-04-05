import { describe, it, expect, beforeEach } from 'vitest';
import { MacOSNotificationProvider, LinuxNotificationProvider, TerminalBellProvider, WebhookNotificationProvider, NtfyNotificationProvider, SlackNotificationProvider, TelegramNotificationProvider, createProvider } from '../terminal_notifications/providers.js';
import { NotificationManager, createNotificationManager } from '../terminal_notifications/notifier.js';

describe('TerminalBellProvider', () => {
  it('should always be available', async () => {
    const p = new TerminalBellProvider({ type: 'terminal-bell', enabled: true });
    expect(await p.isAvailable()).toBe(true);
  });

  it('should send bells', async () => {
    const p = new TerminalBellProvider({ type: 'terminal-bell', enabled: true, count: 2 });
    const result = await p.send({ title: 'test' });
    expect(result).toBe(true);
  });
});

describe('WebhookNotificationProvider', () => {
  it('should be available when URL is set', async () => {
    const p = new WebhookNotificationProvider({ type: 'webhook', enabled: true, url: 'https://example.com/webhook' });
    expect(await p.isAvailable()).toBe(true);
  });

  it('should not be available when URL is missing', async () => {
    const p = new WebhookNotificationProvider({ type: 'webhook', enabled: true, url: '' });
    expect(await p.isAvailable()).toBe(false);
  });
});

describe('NtfyNotificationProvider', () => {
  it('should be available when URL is set', async () => {
    const p = new NtfyNotificationProvider({ type: 'ntfy', enabled: true, url: 'https://ntfy.sh/test' });
    expect(await p.isAvailable()).toBe(true);
  });
});

describe('SlackNotificationProvider', () => {
  it('should be available when webhookUrl is set', async () => {
    const p = new SlackNotificationProvider({ type: 'slack', enabled: true, webhookUrl: 'https://hooks.slack.com/test' });
    expect(await p.isAvailable()).toBe(true);
  });
});

describe('TelegramNotificationProvider', () => {
  it('should be available when botToken and chatId are set', async () => {
    const p = new TelegramNotificationProvider({ type: 'telegram', enabled: true, botToken: '123:abc', chatId: '-100' });
    expect(await p.isAvailable()).toBe(true);
  });

  it('should not be available when botToken is missing', async () => {
    const p = new TelegramNotificationProvider({ type: 'telegram', enabled: true, botToken: '', chatId: '-100' });
    expect(await p.isAvailable()).toBe(false);
  });
});

describe('createProvider factory', () => {
  it('should create correct provider types', () => {
    expect(createProvider({ type: 'terminal-bell', enabled: true })).toBeInstanceOf(TerminalBellProvider);
    expect(createProvider({ type: 'webhook', enabled: true, url: 'https://x.com' })).toBeInstanceOf(WebhookNotificationProvider);
    expect(createProvider({ type: 'ntfy', enabled: true, url: 'https://ntfy.sh/x' })).toBeInstanceOf(NtfyNotificationProvider);
    expect(createProvider({ type: 'slack', enabled: true, webhookUrl: 'https://hooks.slack.com/x' })).toBeInstanceOf(SlackNotificationProvider);
    expect(createProvider({ type: 'telegram', enabled: true, botToken: 'x', chatId: 'x' })).toBeInstanceOf(TelegramNotificationProvider);
  });

  it('should return null for windows/none', () => {
    expect(createProvider({ type: 'windows', enabled: true })).toBeNull();
    expect(createProvider({ type: 'none', enabled: true })).toBeNull();
  });
});

describe('NotificationManager', () => {
  let nm: NotificationManager;

  beforeEach(() => {
    nm = createNotificationManager('/tmp/test-notifications');
  });

  it('should initialize without errors', async () => {
    await expect(nm.init()).resolves.not.toThrow();
  });

  it('should return settings', async () => {
    await nm.init();
    const settings = nm.getSettings();
    expect(settings).toHaveProperty('enabled');
    expect(settings).toHaveProperty('providers');
  });

  it('should list active providers', async () => {
    await nm.init();
    const providers = nm.getActiveProviders();
    expect(Array.isArray(providers)).toBe(true);
  });

  it('should toggle notifications', async () => {
    await nm.init();
    await nm.toggle(false);
    const settings = nm.getSettings();
    expect(settings.enabled).toBe(false);
  });
});
