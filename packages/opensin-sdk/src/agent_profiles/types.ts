/**
 * OpenSIN Agent Profiles — Types
 *
 * Multi-agent profile system modeled after Kilo Code's custom modes.
 * Profiles are specialized personas with distinct tool access, behavior,
 * and model configuration. They solve the "never say things twice" problem
 * by persisting persona, preferences, rules, and memory per agent.
 *
 * Branded: OpenSIN/sincode
 */

export type ProfileMode = 'primary' | 'subagent' | 'all';

export type PermissionAction = 'allow' | 'deny' | 'ask';

export type ToolName =
  | 'read' | 'edit' | 'bash' | 'glob' | 'grep'
  | 'task' | 'webfetch' | 'websearch' | 'codesearch'
  | 'todowrite' | 'todoread' | 'mcp' | 'lsp'
  | 'snip' | 'morph_apply';

export interface PermissionRule {
  [pattern: string]: PermissionAction;
}

export interface ToolPermissions {
  read?: PermissionRule | PermissionAction;
  edit?: PermissionRule | PermissionAction;
  bash?: PermissionRule | PermissionAction;
  glob?: PermissionRule | PermissionAction;
  grep?: PermissionRule | PermissionAction;
  task?: PermissionRule | PermissionAction;
  webfetch?: PermissionRule | PermissionAction;
  websearch?: PermissionRule | PermissionAction;
  codesearch?: PermissionRule | PermissionAction;
  todowrite?: PermissionRule | PermissionAction;
  todoread?: PermissionRule | PermissionAction;
  mcp?: PermissionRule | PermissionAction;
  lsp?: PermissionRule | PermissionAction;
  snip?: PermissionRule | PermissionAction;
  morph_apply?: PermissionRule | PermissionAction;
  [tool: string]: PermissionRule | PermissionAction | undefined;
}

export interface AgentProfile {
  name: string;
  description: string;
  mode: ProfileMode;
  prompt: string;
  model?: string;
  temperature?: number;
  top_p?: number;
  steps?: number;
  color?: string;
  permission?: ToolPermissions;
  hidden?: boolean;
  disabled?: boolean;
  source?: 'builtin' | 'global' | 'project' | 'config';
  variant?: string;
}

export interface ProfileConfig {
  agent: Record<string, Partial<AgentProfile>>;
}

export interface ProfileResolution {
  profile: AgentProfile;
  effectivePermissions: ResolvedPermissions;
  effectiveModel?: string;
  effectiveTemperature?: number;
}

export interface ResolvedPermissions {
  [tool: string]: {
    action: PermissionAction;
    patterns?: Record<string, PermissionAction>;
  };
}

export type ProfileSource = 'builtin' | 'global' | 'project' | 'config' | 'env';
