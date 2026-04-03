import {
  NotificationType,
  TerminalNotification,
  TerminalType,
  NotificationPreferences,
  ProgressState,
  TerminalCapabilities,
} from "./types.js";
import {
  detectTerminalType,
  createProvider,
} from "./providers.js";

const DEFAULT_PREFERENCES: NotificationPreferences = {
  enabled: true,
  taskComplete: true,
  error: true,
  permissionRequired: true,
  showProgressBar: true,
  soundEnabled: true,
  tmuxPassthrough: true,
  suppressWhileFocused: false,
};

export class TerminalNotifier {
  private terminal: TerminalType;
  private provider: ReturnType<typeof createProvider>;
  private preferences: NotificationPreferences;
  private history: TerminalNotification[] = [];
  private activeProgress: Map<string, ProgressState> = new Map();

  constructor(preferences?: Partial<NotificationPreferences>) {
    this.terminal = detectTerminalType();
    this.provider = createProvider(this.terminal);
    this.preferences = { ...DEFAULT_PREFERENCES, ...preferences };
  }

  notify(type: NotificationType, title: string, message: string): TerminalNotification {
    const notification: TerminalNotification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      type,
      title,
      message,
      timestamp: new Date().toISOString(),
      delivered: false,
      terminal: this.terminal,
    };

    if (!this.preferences.enabled) {
      this.history.push(notification);
      return notification;
    }

    if (!this.isTypeEnabled(type)) {
      this.history.push(notification);
      return notification;
    }

    try {
      this.provider.sendNotification(title, message);
      notification.delivered = true;
    } catch {
      notification.delivered = false;
    }

    this.history.push(notification);
    return notification;
  }

  notifyTaskComplete(title: string, message: string): TerminalNotification {
    return this.notify("task_complete", title, message);
  }

  notifyError(title: string, message: string): TerminalNotification {
    return this.notify("error", title, message);
  }

  notifyPermissionRequired(title: string, message: string): TerminalNotification {
    return this.notify("permission_required", title, message);
  }

  startProgress(
    id: string,
    title: string,
    total: number,
    message?: string
  ): ProgressState {
    const state: ProgressState = {
      id,
      title,
      current: 0,
      total,
      message,
      startTime: Date.now(),
    };
    this.activeProgress.set(id, state);

    if (this.preferences.enabled && this.preferences.showProgressBar) {
      this.provider.setProgress(state);
    }

    return state;
  }

  updateProgress(id: string, current: number, message?: string): void {
    const state = this.activeProgress.get(id);
    if (!state) return;
    state.current = current;
    if (message) state.message = message;

    if (this.preferences.enabled && this.preferences.showProgressBar) {
      this.provider.setProgress(state);
    }
  }

  completeProgress(id: string): void {
    const state = this.activeProgress.get(id);
    if (!state) return;
    state.current = state.total;

    if (this.preferences.enabled && this.preferences.showProgressBar) {
      this.provider.setProgress(state);
    }

    this.activeProgress.delete(id);
  }

  clearProgress(id?: string): void {
    if (id) {
      this.activeProgress.delete(id);
    } else {
      this.activeProgress.clear();
    }
    this.provider.clearProgress();
  }

  getCapabilities(): TerminalCapabilities {
    return this.provider.getCapabilities();
  }

  getHistory(): TerminalNotification[] {
    return [...this.history];
  }

  getPreferences(): NotificationPreferences {
    return { ...this.preferences };
  }

  updatePreferences(prefs: Partial<NotificationPreferences>): void {
    this.preferences = { ...this.preferences, ...prefs };
  }

  getTerminalType(): TerminalType {
    return this.terminal;
  }

  private isTypeEnabled(type: NotificationType): boolean {
    switch (type) {
      case "task_complete":
        return this.preferences.taskComplete;
      case "error":
        return this.preferences.error;
      case "permission_required":
        return this.preferences.permissionRequired;
      case "progress":
        return this.preferences.showProgressBar;
      default:
        return true;
    }
  }
}

let _notifier: TerminalNotifier | null = null;

export function getTerminalNotifier(
  preferences?: Partial<NotificationPreferences>
): TerminalNotifier {
  if (!_notifier) {
    _notifier = new TerminalNotifier(preferences);
  }
  return _notifier;
}

export function resetTerminalNotifier(): void {
  _notifier = null;
}
