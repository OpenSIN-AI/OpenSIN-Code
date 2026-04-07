export type NotificationType = 'info' | 'success' | 'warning' | 'error';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: Date;
  dismissed: boolean;
}

export interface NotificationConfig {
  enabled: boolean;
  sound: boolean;
  showOnFocus: boolean;
  minDuration: number;
}
