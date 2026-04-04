/**
 * OpenSIN CLI Tool Types
 *
 * Core type definitions for all CLI tools.
 */

/**
 * Standard result returned by every tool execution.
 */
export interface ToolResult {
  /** Human-readable output text */
  output: string;
  /** Whether the tool execution encountered an error */
  isError: boolean;
  /** Numeric error code (0 = success) */
  errorCode?: number;
  /** Optional structured metadata */
  metadata?: Record<string, unknown>;
}

/**
 * JSON Schema for tool input validation.
 */
export interface InputSchema {
  type: 'object';
  properties: Record<string, unknown>;
  required?: string[];
  additionalProperties?: boolean;
}

/**
 * Tool definition interface.
 */
export interface ToolDefinition {
  /** Unique tool name (snake_case) */
  name: string;
  /** Human-readable description */
  description: string;
  /** JSON Schema for input validation */
  inputSchema: InputSchema;
  /** Execute the tool with validated input */
  execute: (input: Record<string, unknown>) => Promise<ToolResult>;
}

/**
 * Permission check result.
 */
export interface PermissionCheck {
  /** Whether the operation is allowed */
  allowed: boolean;
  /** Reason if denied */
  reason?: string;
  /** Error code if denied */
  errorCode?: number;
}

/**
 * Security policy for file path operations.
 */
export interface PathSecurityPolicy {
  /** Directories that are always denied */
  deniedDirs?: string[];
  /** Maximum file size for read operations (bytes) */
  maxReadSizeBytes?: number;
  /** Maximum file size for write operations (bytes) */
  maxWriteSizeBytes?: number;
}

/**
 * Default security policy.
 */
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
