/**
 * MCP Stdio Integration — Type Definitions
 * 
 * Core types for MCP (Model Context Protocol) communication over stdio transport.
 * OpenSIN-Code Phase 2.3
 */

/** MCP Server configuration from opencode.json */
export interface McpServerConfig {
  /** Unique server identifier */
  name: string;
  /** Command to execute the MCP server */
  command: string;
  /** Command arguments */
  args: string[];
  /** Environment variables for the server process */
  env?: Record<string, string>;
  /** Working directory for the server process */
  cwd?: string;
  /** Startup timeout in milliseconds */
  timeout?: number;
}

/** MCP Server lifecycle states */
export type McpServerStatus =
  | 'stopped'
  | 'starting'
  | 'running'
  | 'error'
  | 'restarting';

/** MCP Tool definition as returned by server */
export interface McpToolDefinition {
  /** Tool name */
  name: string;
  /** Tool description */
  description: string;
  /** JSON Schema for input parameters */
  inputSchema: Record<string, unknown>;
}

/** MCP Resource definition */
export interface McpResourceDefinition {
  /** Resource URI template */
  uri: string;
  /** Resource name */
  name: string;
  /** Resource description */
  description?: string;
  /** MIME type */
  mimeType?: string;
}

/** MCP Tool call result */
export interface McpToolResult {
  /** Tool execution output */
  content: Array<{
    type: 'text' | 'image' | 'resource';
    text?: string;
    data?: string;
    mimeType?: string;
  }>;
  /** Whether the operation was successful */
  isError?: boolean;
}

/** MCP Resource read result */
export interface McpResourceResult {
  /** Resource contents */
  contents: Array<{
    uri: string;
    mimeType?: string;
    text?: string;
    blob?: string;
  }>;
}

/** JSON-RPC 2.0 Request */
export interface JsonRpcRequest {
  jsonrpc: '2.0';
  method: string;
  params?: Record<string, unknown>;
  id: number | string;
}

/** JSON-RPC 2.0 Response */
export interface JsonRpcResponse {
  jsonrpc: '2.0';
  result?: unknown;
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
  id: number | string | null;
}

/** JSON-RPC 2.0 Notification (no id) */
export interface JsonRpcNotification {
  jsonrpc: '2.0';
  method: string;
  params?: Record<string, unknown>;
}

/** Server health information */
export interface McpServerHealth {
  status: McpServerStatus;
  pid?: number;
  uptime?: number;
  toolCount?: number;
  resourceCount?: number;
  lastError?: string;
  restartCount?: number;
}
