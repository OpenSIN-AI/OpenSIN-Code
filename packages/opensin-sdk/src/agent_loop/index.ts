/**
 * OpenSIN Agent Loop — Public API
 *
 * Core agent loop: Query input → API call → Tool execution → Response loop.
 */

export { AgentLoop, createAgentLoop } from './agent_loop.js';
export { AgentLoopContext, estimateMessageTokens, estimateTotalTokens } from './context.js';
export { ToolRegistry, createToolRegistry, type ToolHandler } from './tool_registry.js';
export {
  toNDJSONLine,
  emitNDJSON,
  makeEvent,
  parseNDJSONLine,
  parseNDJSONStream,
  streamNDJSON,
} from './ndjson.js';

export type {
  AgentEvent,
  AgentEventType,
  NDJSONLine,
  AgentLoopConfig,
  TurnState,
  ToolExecutor,
  LLMResponse,
  LLMCaller,
  LLMStreamCallback,
  AgentLoopResult,
} from './types.js';

export { DEFAULT_AGENT_LOOP_CONFIG } from './types.js';
