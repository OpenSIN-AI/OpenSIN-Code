export { TerminalNotifier, getTerminalNotifier, resetTerminalNotifier } from "./notifier.js";
export {
  detectTerminalType,
  createProvider,
  ITerm2Provider,
  KittyProvider,
  GhosttyProvider,
  TmuxProvider,
  UnknownProvider,
} from "./providers.js";
export type {
  NotificationType,
  TerminalType,
  TerminalNotification,
  NotificationPreferences,
  ProgressState,
  TerminalCapabilities,
} from "./types.js";
