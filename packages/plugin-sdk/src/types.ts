export type PluginType = 'tool' | 'hook' | 'agent' | 'command' | 'auth' | 'theme' | 'memory' | 'mcp';

export interface PluginManifest {
  name: string;
  version: string;
  description?: string;
  type: PluginType;
  main: string;
  author?: string;
  license?: string;
  keywords?: string[];
  sinPlugin: {
    minVersion: string;
    capabilities: string[];
    config?: Record<string, ConfigSchema>;
    dependencies?: Record<string, string>;
    opencodeCompatible?: boolean;
    permissions?: PluginPermissions;
  };
}

export interface ConfigSchema {
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  required?: boolean;
  default?: unknown;
  description?: string;
  enum?: unknown[];
  properties?: Record<string, ConfigSchema>;
  items?: ConfigSchema;
}

export interface PluginPermissions {
  filesystem?: 'none' | 'read' | 'write' | 'full';
  network?: 'none' | 'allowlist' | 'full';
  shell?: 'none' | 'allowlist' | 'full';
  memory?: 'none' | 'read' | 'write' | 'full';
  a2a?: 'none' | 'send' | 'receive' | 'full';
}

export interface ValidationResult {
  valid: boolean;
  errors?: string[];
  warnings?: string[];
}

export interface SessionInfo {
  id: string;
  agent: string;
  model: string;
  messages: Message[];
  title?: string;
  startTime: Date;
  endTime?: Date;
}

export interface Message {
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  timestamp: Date;
  toolCall?: ToolCall;
  toolResult?: ToolResult;
}

export interface ToolCall {
  id: string;
  name: string;
  parameters: Record<string, unknown>;
}

export interface ToolResult {
  id: string;
  content: string;
  error?: string;
  duration?: number;
}

export interface Logger {
  debug(message: string, ...args: unknown[]): void;
  info(message: string, ...args: unknown[]): void;
  warn(message: string, ...args: unknown[]): void;
  error(message: string, ...args: unknown[]): void;
}

export interface A2AMessage {
  type: string;
  payload: Record<string, unknown>;
  from: string;
  to: string;
  timestamp: Date;
  correlationId?: string;
}

export interface A2AResponse {
  success: boolean;
  data?: unknown;
  error?: string;
  correlationId: string;
}
