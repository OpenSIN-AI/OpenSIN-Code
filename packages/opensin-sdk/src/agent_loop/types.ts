/**
 * OpenSIN Agent Loop — Type Definitions
 *
 * Core types for the agent loop: query → API → tools → repeat.
 * NDJSON streaming, error handling, retry logic, context management.
 */

import type { Message, ToolCall, ToolResult, ToolDefinition, TokenUsage, StreamChunk } from '../types';

// --- Agent Loop Events (NDJSON output) ---

export type AgentEventType =
  | 'status'
  | 'thinking'
  | 'text_delta'
  | 'tool_call_start'
  | 'tool_call_end'
  | 'tool_result'
  | 'error'
  | 'retry'
  | 'context_compressed'
  | 'turn_complete'
  | 'session_start'
  | 'session_end';

export interface AgentEvent {
  type: AgentEventType;
  timestamp: string;
  turnId?: string;
  data: Record<string, unknown>;
}

// --- NDJSON Line ---

export interface NDJSONLine {
  type: AgentEventType;
  ts: string;
  turn?: string;
  [key: string]: unknown;
}

// --- Agent Loop Configuration ---

export interface AgentLoopConfig {
  /** Maximum number of tool-execution iterations per turn */
  maxToolIterations: number;
  /** Maximum retries on transient errors */
  maxRetries: number;
  /** Base delay in ms for exponential backoff */
  retryBaseDelayMs: number;
  /** Maximum delay in ms for exponential backoff */
  retryMaxDelayMs: number;
  /** Context window max tokens */
  maxContextTokens: number;
  /** Compression threshold (0.0–1.0) */
  compressionThreshold: number;
  /** Whether to stream NDJSON to stdout */
  streamNDJSON: boolean;
  /** Model identifier */
  model: string;
  /** Workspace directory */
  workspace: string;
  /** Permission mode for tool execution */
  permissionMode: 'auto' | 'ask' | 'readonly';
}

export const DEFAULT_AGENT_LOOP_CONFIG: AgentLoopConfig = {
  maxToolIterations: 50,
  maxRetries: 3,
  retryBaseDelayMs: 1000,
  retryMaxDelayMs: 10000,
  maxContextTokens: 128000,
  compressionThreshold: 0.8,
  streamNDJSON: true,
  model: 'openai/gpt-5.4',
  workspace: process.cwd(),
  permissionMode: 'auto',
};

// --- Turn State ---

export interface TurnState {
  turnId: string;
  messages: Message[];
  toolCalls: ToolCall[];
  toolResults: ToolResult[];
  iterationCount: number;
  retryCount: number;
  totalTokens: number;
  startTime: number;
  status: 'running' | 'completed' | 'error' | 'cancelled';
  error?: string;
}

// --- Tool Executor ---

export type ToolExecutor = (
  toolCall: ToolCall,
  workspace: string,
  sessionId: string,
) => Promise<ToolResult>;

// --- LLM Caller (wraps opencode CLI or provider) ---

export interface LLMResponse {
  content: string;
  toolCalls: ToolCall[];
  usage: TokenUsage;
  stopReason: 'end_turn' | 'tool_use' | 'max_tokens' | 'error';
}

export type LLMCaller = (
  messages: Message[],
  tools: ToolDefinition[],
  options?: { stream?: boolean; max_tokens?: number; temperature?: number },
) => Promise<LLMResponse>;

export type LLMStreamCallback = (chunk: StreamChunk) => void;

// --- Agent Loop Result ---

export interface AgentLoopResult {
  turnId: string;
  finalContent: string;
  toolCallsExecuted: number;
  totalTokens: TokenUsage;
  iterations: number;
  durationMs: number;
  error?: string;
}
