export type HookEvent = 'PreToolUse' | 'PostToolUse' | 'OnSessionStart' | 'OnSessionEnd';

export interface HookResult {
  success: boolean;
  error?: string;
  output?: unknown;
}

export interface HookDefinition {
  id: string;
  event: HookEvent;
  command: string;
  args?: string[];
  async?: boolean;
  skipOnError?: boolean;
  order?: number;
}
