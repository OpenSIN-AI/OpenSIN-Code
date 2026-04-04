/**
 * OpenSIN Protocol Types
 * 
 * All types for the A2A protocol, JSON-RPC, sessions, and CLI.
 */

// --- JSON-RPC 2.0 Types ---

export interface JsonRpcRequest {
  jsonrpc: '2.0';
  id: string | number;
  method: string;
  params?: Record<string, unknown>;
}

export interface JsonRpcResponse<T = unknown> {
  jsonrpc: '2.0';
  id: string | number;
  result?: T;
  error?: JsonRpcError;
}

export interface JsonRpcNotification {
  jsonrpc: '2.0';
  method: string;
  params?: Record<string, unknown>;
}

export interface JsonRpcError {
  code: number;
  message: string;
  data?: unknown;
}

// --- A2A Protocol Types ---

export interface InitializeRequest {
  protocolVersion: string;
  capabilities: ClientCapabilities;
  clientInfo: {
    name: string;
    version: string;
  };
}

export interface InitializeResponse {
  protocolVersion: string;
  capabilities: ServerCapabilities;
  serverInfo: {
    name: string;
    version: string;
  };
}

export interface ClientCapabilities {
  roots?: { listChanged?: boolean };
  sampling?: Record<string, unknown>;
}

export interface ServerCapabilities {
  tools?: { listChanged?: boolean };
  resources?: { subscribe?: boolean; listChanged?: boolean };
  logging?: Record<string, unknown>;
}

// --- Session Types ---

export type SessionId = string;

export interface SessionInfo {
  id: SessionId;
  title: string;
  workspace: string;
  model: string;
  createdAt: number;
  lastActive: number;
  messageCount: number;
  tokenCount: number;
}

export interface NewSessionRequest {
  workspace: string;
  model?: string;
  title?: string;
}

export interface NewSessionResponse {
  session_id: string;
  title: string;
  workspace: string;
}

// --- Message Types ---

export type Role = 'user' | 'assistant' | 'system' | 'tool';

export interface ContentBlock {
  type: string;
  text?: string;
  source?: {
    type: string;
    media_type: string;
    data: string;
  };
}

export interface ToolCall {
  id: string;
  name: string;
  input: Record<string, unknown>;
}

export interface ToolResult {
  output: string;
  is_error: boolean;
  error_code?: number;
  metadata?: Record<string, unknown>;
}

export interface UserMessage {
  role: 'user';
  content: string | ContentBlock[];
}

export interface AssistantMessage {
  role: 'assistant';
  content: string | ContentBlock[];
  tool_calls?: ToolCall[];
}

export interface ToolUseMessage {
  role: 'assistant';
  content: null;
  tool_calls: ToolCall[];
}

export interface ToolResultMessage {
  role: 'tool';
  tool_call_id: string;
  content: string;
}

export type Message = UserMessage | AssistantMessage | ToolUseMessage | ToolResultMessage;

// --- Prompt Types ---

export interface PromptRequest {
  session_id: SessionId;
  messages: Message[];
  tools?: ToolDefinition[];
  model?: string;
  max_tokens?: number;
  temperature?: number;
  stream?: boolean;
}

export interface PromptResponse {
  session_id: SessionId;
  message: AssistantMessage;
  usage: TokenUsage;
}

export interface TokenUsage {
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
}

// --- Tool Types ---

export interface ToolDefinition {
  name: string;
  description: string;
  input_schema: Record<string, unknown>;
}

// --- SSE Event Types ---

export interface SSEEvent {
  event?: string;
  data: string;
  id?: string;
  retry?: number;
}

export interface StreamChunk {
  type: 'text' | 'tool_use' | 'tool_result' | 'error' | 'done';
  content?: string;
  tool_call?: ToolCall;
  tool_result?: ToolResult;
  error?: string;
  usage?: TokenUsage;
}

// --- Connection Types ---

export interface ConnectionConfig {
  baseUrl: string;
  apiKey?: string;
  timeout?: number;
  retries?: number;
}

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

// --- CLI Types ---

export interface CliConfig {
  apiUrl: string;
  apiKey?: string;
  defaultModel: string;
  workspace: string;
  permissionMode: 'auto' | 'ask' | 'readonly';
  maxIterations: number;
  sandboxEnabled: boolean;
}

export interface CommandHistory {
  entries: string[];
  currentIndex: number;
  maxEntries: number;
}

export type CliMode = 'interactive' | 'command' | 'pipe';
