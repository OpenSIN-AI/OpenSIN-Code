/**
 * OpenSIN CLI Tool Types
 */

export interface ToolResult {
  output: string;
  isError: boolean;
  errorCode?: number;
  metadata?: Record<string, unknown>;
}

export interface InputSchema {
  type: 'object';
  properties: Record<string, unknown>;
  required?: string[];
  additionalProperties?: boolean;
}

export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: InputSchema;
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
  sandboxEnabled: boolean;
}

export interface PathSecurityPolicy {
  deniedDirs?: string[];
  maxReadSizeBytes?: number;
  maxWriteSizeBytes?: number;
}

export const DEFAULT_SECURITY_POLICY: PathSecurityPolicy = {
  deniedDirs: [
    '/etc/shadow',
    '/etc/passwd',
    '/etc/sudoers',
    '/root/.ssh',
    '/var/log',
  ],
  maxReadSizeBytes: 10 * 1024 * 1024,
  maxWriteSizeBytes: 50 * 1024 * 1024,
};
