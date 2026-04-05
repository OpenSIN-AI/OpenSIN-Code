/**
 * sin-hookify — TypeScript Type Definitions
 * Portiert aus sin-claude/claude-code-main/plugins/hookify/core/
 */

export type HookEvent = 'bash' | 'file' | 'stop' | 'prompt' | 'all';
export type HookAction = 'warn' | 'block';
export type HookOperator = 'regex_match' | 'contains' | 'equals' | 'not_contains' | 'starts_with' | 'ends_with';
export type HookEventName = 'PreToolUse' | 'PostToolUse' | 'Stop' | 'UserPromptSubmit' | 'SessionStart' | 'SessionEnd' | 'PreCompact' | 'Notification';

export interface HookCondition {
  field: string;
  operator: HookOperator;
  pattern: string;
}

export interface HookRule {
  name: string;
  enabled: boolean;
  event: HookEvent;
  pattern?: string; // Legacy simple pattern
  conditions: HookCondition[];
  action: HookAction;
  tool_matcher?: string; // e.g., "Bash", "Edit|Write", "*"
  message: string;
}

export interface HookInput {
  tool_name?: string;
  tool_input?: Record<string, unknown>;
  hook_event_name?: HookEventName;
  reason?: string;
  transcript_path?: string;
  user_prompt?: string;
}

export interface HookOutput {
  systemMessage?: string;
  hookSpecificOutput?: {
    hookEventName: HookEventName;
    permissionDecision: 'allow' | 'deny';
  };
  decision?: 'allow' | 'block';
  reason?: string;
}

export interface HookifyConfig {
  rulesDirectory: string;
  ruleFilePattern: string;
  maxRules: number;
  regexCacheSize: number;
}
