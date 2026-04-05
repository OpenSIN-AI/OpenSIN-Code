/**
 * Feature Flags — All experimental features from sin-claude
 */

export const FEATURE_FLAGS = {
  // Core Features
  COORDINATOR_MODE: { enabled: false, description: 'Multi-Agent Coordinator Mode' },
  KAIROS: { enabled: false, description: 'Assistant Mode (proactive help)' },
  VOICE_MODE: { enabled: false, description: 'Voice Input/Output' },
  BRIDGE_MODE: { enabled: false, description: 'Remote Bridge (ReplBridge)' },
  DAEMON: { enabled: false, description: 'Daemon/Background Mode' },
  PROACTIVE: { enabled: false, description: 'Proactive agent actions' },

  // Tool Features
  WORKFLOW_SCRIPTS: { enabled: false, description: 'Workflow Scripts Engine' },
  HISTORY_SNIP: { enabled: false, description: 'History Snipping/Truncation' },
  WEB_BROWSER_TOOL: { enabled: false, description: 'Native Browser Tool' },
  CONTEXT_COLLAPSE: { enabled: false, description: 'Context Collapse/Compaction' },
  UDS_INBOX: { enabled: false, description: 'Unix Domain Socket Inbox' },
  AGENT_TRIGGERS: { enabled: false, description: 'Cron/Scheduled Agent Triggers' },
  MONITOR_TOOL: { enabled: false, description: 'System Monitoring Tool' },
  OVERFLOW_TEST_TOOL: { enabled: false, description: 'Overflow Test Tool' },

  // Notification Features
  KAIROS_PUSH_NOTIFICATION: { enabled: false, description: 'Push Notifications' },
  KAIROS_GITHUB_WEBHOOKS: { enabled: false, description: 'GitHub Webhook Integration' },

  // Remote Features
  CCR_REMOTE_SETUP: { enabled: false, description: 'CCR Remote Setup' },
} as const;

export type FeatureFlagName = keyof typeof FEATURE_FLAGS;

export function isFeatureEnabled(flag: FeatureFlagName): boolean {
  return FEATURE_FLAGS[flag]?.enabled ?? false;
}

export function enableFeature(flag: FeatureFlagName): void {
  if (FEATURE_FLAGS[flag]) {
    FEATURE_FLAGS[flag] = { ...FEATURE_FLAGS[flag], enabled: true };
  }
}

export function disableFeature(flag: FeatureFlagName): void {
  if (FEATURE_FLAGS[flag]) {
    FEATURE_FLAGS[flag] = { ...FEATURE_FLAGS[flag], enabled: false };
  }
}

export function getAllFlags(): Record<string, { enabled: boolean; description: string }> {
  return { ...FEATURE_FLAGS };
}
