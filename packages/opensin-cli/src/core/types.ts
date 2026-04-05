export interface Message {
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string | null;
  tool_calls?: ToolCall[];
  tool_call_id?: string;
  name?: string;
}

export interface ToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

export interface ToolResult {
  tool_call_id: string;
  content: string;
  isError?: boolean;
  metadata?: Record<string, unknown>;
}

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
  execute(input: Record<string, unknown>): Promise<ToolExecutionResult>;
}

export interface ToolExecutionResult {
  output: string;
  isError?: boolean;
  metadata?: Record<string, unknown>;
}

export interface Session {
  sessionId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: Message[];
  cwd: string;
  model?: string;
  seq?: number;
  toolState?: {
    pending_tools: string[];
    completed_tools: string[];
  };
}

export interface PermissionRule {
  pattern: string;
  action: 'allow' | 'deny';
  tool?: string;
}

export interface HookDefinition {
  event: HookEvent;
  condition?: string;
  command: string;
}

export type HookEvent =
  | 'PreToolUse'
  | 'PostToolUse'
  | 'PostToolUseFailure'
  | 'PermissionDenied'
  | 'TaskCreated'
  | 'CwdChanged'
  | 'FileChanged'
  | 'SessionEnd'
  | 'StopFailure'
  | 'PostCompact';

export interface SkillDefinition {
  name: string;
  description: string;
  version: string;
  instructions: string;
  path: string;
}

export interface CompactionStats {
  totalCompactions: number;
  lastCompactionAt: string | null;
  circuitBreakerTripped: boolean;
  consecutiveFailures: number;
}

export interface Config {
  model?: string;
  effort?: 'low' | 'medium' | 'high';
  allowedTools?: string[];
  permissions?: {
    mode: 'ask' | 'auto' | 'dangerFullAccess';
    rules: PermissionRule[];
  };
  mcp?: {
    servers: Record<string, McpServerConfig>;
  };
  compaction?: {
    threshold: number;
    circuitBreakerThreshold: number;
    maxMessageSize: number;
  };
  hooks?: HookDefinition[];
}

export interface McpServerConfig {
  command: string;
  args: string[];
  env?: Record<string, string>;
}
