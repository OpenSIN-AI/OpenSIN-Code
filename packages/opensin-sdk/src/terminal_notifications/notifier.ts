import { Notification, NotificationConfig, NotificationType } from './types';

const DEFAULT_CONFIG: NotificationConfig = {
  enabled: true,
  sound: false,
  showOnFocus: false,
  minDuration: 5000,
};

export class TerminalNotifier {
  private config: NotificationConfig;
  private notifications: Notification[];

  constructor(config?: Partial<NotificationConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.notifications = [];
  }

  notify(type: NotificationType, title: string, message: string): Notification {
    const notification: Notification = {
      id: `notif-${Date.now()}`,
      type,
      title,
      message,
      timestamp: new Date(),
      dismissed: false,
    };

    this.notifications.push(notification);

    if (this.config.enabled) {
      this.sendSystemNotification(notification);
    }

    return notification;
  }

  info(title: string, message: string): Notification {
    return this.notify('info', title, message);
  }

  success(title: string, message: string): Notification {
    return this.notify('success', title, message);
  }

  warning(title: string, message: string): Notification {
    return this.notify('warning', title, message);
  }

  error(title: string, message: string): Notification {
    return this.notify('error', title, message);
  }

  dismiss(id: string): void {
    const notif = this.notifications.find((n) => n.id === id);
    if (notif) {
      notif.dismissed = true;
    }
  }

  getActive(): Notification[] {
    return this.notifications.filter((n) => !n.dismissed);
  }

  private sendSystemNotification(notification: Notification): void {
    const icons: Record<NotificationType, string> = {
      info: '📢',
      success: '✅',
      warning: '⚠️',
      error: '❌',
    };
    console.error(`${icons[notification.type]} ${notification.title}: ${notification.message}`);
  }
}
