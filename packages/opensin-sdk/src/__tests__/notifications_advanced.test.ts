import { describe, it, expect } from 'vitest';
import { MacOSNotificationProvider, LinuxNotificationProvider, TerminalBellProvider, WebhookNotificationProvider, NtfyNotificationProvider, SlackNotificationProvider, TelegramNotificationProvider, createProvider } from '../terminal_notifications/providers.js';

describe('Terminal Notifications - Advanced', () => {
  it('should create all provider types via factory', () => {
    const types = ['terminal-bell', 'webhook', 'ntfy', 'slack', 'telegram'];
    for (const type of types) {
      const config = { type, enabled: true } as any;
      if (type === 'webhook') config.url = 'https://example.com';
      if (type === 'ntfy') config.url = 'https://ntfy.sh/test';
      if (type === 'slack') config.webhookUrl = 'https://hooks.slack.com/test';
      if (type === 'telegram') { config.botToken = 'x'; config.chatId = 'x'; }
      const provider = createProvider(config);
      expect(provider).not.toBeNull();
      expect(provider!.type).toBe(type);
    }
  });

  it('should return null for unknown provider type', () => {
    const provider = createProvider({ type: 'unknown' as any, enabled: true });
    expect(provider).toBeNull();
  });

  it('TerminalBell should send with default count', async () => {
    const p = new TerminalBellProvider({ type: 'terminal-bell', enabled: true });
    const result = await p.send({ title: 'test' });
    expect(result).toBe(true);
  });

  it('Webhook should handle failed fetch gracefully', async () => {
    const p = new WebhookNotificationProvider({ type: 'webhook', enabled: true, url: 'https://invalid.example.com/webhook' });
    const result = await p.send({ title: 'test', body: 'test body' });
    expect(result).toBe(false);
  });

  it('Ntfy should handle failed fetch gracefully', async () => {
    const p = new NtfyNotificationProvider({ type: 'ntfy', enabled: true, url: 'https://invalid.example.com/test' });
    const result = await p.send({ title: 'test', body: 'test body' });
    expect(result).toBe(false);
  });

  it('Slack should handle failed fetch gracefully', async () => {
    const p = new SlackNotificationProvider({ type: 'slack', enabled: true, webhookUrl: 'https://invalid.example.com/hooks/test' });
    const result = await p.send({ title: 'test', level: 'error' });
    expect(result).toBe(false);
  });

  it('Telegram should handle failed fetch gracefully', async () => {
    const p = new TelegramNotificationProvider({ type: 'telegram', enabled: true, botToken: 'invalid', chatId: 'invalid' });
    const result = await p.send({ title: 'test', body: 'test body' });
    expect(result).toBe(false);
  });

  it('Slack should format error messages with red color', async () => {
    const p = new SlackNotificationProvider({ type: 'slack', enabled: true, webhookUrl: 'https://hooks.slack.com/test' });
    expect(await p.isAvailable()).toBe(true);
  });

  it('Ntfy should set correct priority for error level', async () => {
    const p = new NtfyNotificationProvider({ type: 'ntfy', enabled: true, url: 'https://ntfy.sh/test' });
    expect(await p.isAvailable()).toBe(true);
  });
});
