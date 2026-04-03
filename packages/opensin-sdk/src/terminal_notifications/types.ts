export type NotificationType = "task_complete" | "error" | "permission_required" | "progress";

export type TerminalType = "iterm2" | "kitty" | "ghostty" | "tmux" | "unknown";

export interface TerminalNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string;
  delivered: boolean;
  terminal: TerminalType;
}

export interface NotificationPreferences {
  enabled: boolean;
  taskComplete: boolean;
  error: boolean;
  permissionRequired: boolean;
  showProgressBar: boolean;
  soundEnabled: boolean;
  tmuxPassthrough: boolean;
  suppressWhileFocused: boolean;
}

export interface ProgressState {
  id: string;
  title: string;
  current: number;
  total: number;
  message?: string;
  startTime: number;
}

export interface TerminalCapabilities {
  terminal: TerminalType;
  supportsNotifications: boolean;
  supportsProgressBar: boolean;
  supportsTmuxPassthrough: boolean;
}
