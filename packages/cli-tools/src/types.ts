/**
 * OpenSIN CLI Tool Types
 */

export interface ToolResult {
  content: Array<{ type: string; text: string }>;
  isError?: boolean;
  errorCode?: number;
  metadata?: Record<string, unknown>;
}

export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: string;
    properties: Record<string, unknown>;
    required?: string[];
    additionalProperties?: boolean;
    [key: string]: unknown;
  };
  execute: (input: Record<string, unknown>) => Promise<ToolResult>;
}

export interface PermissionCheck {
  allowed: boolean;
  reason?: string;
  errorCode?: number;
}

export interface SecurityContext {
  cwd: string;
  permissionMode: 'auto' | 'ask' | 'readonly';
  allowedPaths?: string[];
  deniedPaths?: string[];
  sandboxEnabled: boolean;
  allowedCommands?: string[];
  deniedCommands?: string[];
}
