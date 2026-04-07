import { Notification } from './types';

export interface NotificationProvider {
  send(notification: Notification): Promise<void>;
  isAvailable(): boolean;
}

export class ConsoleProvider implements NotificationProvider {
  async send(notification: Notification): Promise<void> {
    const icon = notification.type === 'error' ? '❌' : notification.type === 'warning' ? '⚠️' : notification.type === 'success' ? '✅' : '📢';
    console.error(`${icon} ${notification.title}: ${notification.message}`);
  }

  isAvailable(): boolean {
    return true;
  }
}

export class TerminalProvider implements NotificationProvider {
  async send(notification: Notification): Promise<void> {
    const bell = '\x07';
    const icon = notification.type === 'error' ? '❌' : notification.type === 'warning' ? '⚠️' : notification.type === 'success' ? '✅' : '📢';
    process.stderr.write(`${bell}${icon} ${notification.title}: ${notification.message}\n`);
  }

  isAvailable(): boolean {
    return process.stderr.isTTY ?? true;
  }
}

export class NotificationCenterProvider implements NotificationProvider {
  async send(notification: Notification): Promise<void> {
    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const execAsync = promisify(exec);

    const platform = process.platform;
    if (platform === 'darwin') {
      await execAsync(`osascript -e 'display notification "${notification.message}" with title "${notification.title}"'`);
    } else if (platform === 'linux') {
      await execAsync(`notify-send "${notification.title}" "${notification.message}"`);
    }
  }

  isAvailable(): boolean {
    return process.platform === 'darwin' || process.platform === 'linux';
  }
}
