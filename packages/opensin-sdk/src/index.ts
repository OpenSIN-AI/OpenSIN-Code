// Core
export { OpenSINClient } from "./client.js";
export type { ConnectionConfig, ConnectionStatus } from "./client.js";

// Types
export type {
  SessionId,
  ModelId,
  RequestId,
  ProtocolVersion,
  Implementation,
  Meta,
  Position,
  Range,
  Role,
  TextContent,
  ImageContent,
  AudioContent,
  ResourceLink,
  TextResourceContents,
  BlobResourceContents,
  EmbeddedResource,
  ContentBlock,
  Annotations,
  Content,
  ContentChunk,
  StopReason,
  Usage,
  Cost,
  PlanEntryPriority,
  PlanEntryStatus,
  PlanEntry,
  Plan,
  Diff,
  ToolCall,
  SessionModeId,
  SessionMode,
  SessionModeState,
  ModelInfo,
  SessionModelState,
  SessionConfigOption,
  SessionInfo,
  PromptCapabilities,
  FileSystemCapabilities,
  ClientCapabilities,
  McpServerHttp,
  McpServerSse,
  McpServerStdio,
  McpServer,
  AgentCapabilities,
  SessionCapabilities,
  InitializeRequest,
  InitializeResponse,
  AuthMethodAgent,
  AuthMethod,
  NewSessionRequest,
  NewSessionResponse,
  LoadSessionRequest,
  LoadSessionResponse,
  ListSessionsRequest,
  ListSessionsResponse,
  CloseSessionRequest,
  CloseSessionResponse,
  PromptRequest,
  PromptResponse,
  CancelNotification,
  SessionUpdate,
  CurrentModeUpdate,
  ConfigOptionUpdate,
  SessionNotification,
  JsonRpcError,
  JsonRpcRequest,
  JsonRpcResponse,
  JsonRpcNotification,
  ProviderConfig,
  StreamEvent,
  StreamChunk,
  StreamError,
  DocumentEvent,
  DidOpenDocumentNotification,
  DidCloseDocumentNotification,
  DidFocusDocumentNotification,
  TextDocumentContentChangeEvent,
  DidChangeDocumentNotification,
  DidSaveDocumentNotification,
} from "./types.js";

// Session
export {
  SessionManager,
  createSessionId,
  serializeSession,
  deserializeSession,
} from "./session.js";
export type { SessionRecord, SessionManagerOptions } from "./session.js";

// Events
export { EventStream, EventMultiplexer, parseSSELine, streamSSE } from "./events.js";

// Providers
export type { IProvider as Provider, ProviderName } from "./providers.js";
export {
  BaseProvider,
  OpenAIProvider,
  AnthropicProvider,
  createProvider,
  ProviderRegistry,
  ProviderError,
} from "./providers.js";

// Autonomy
export { AutonomyLevel } from "./autonomy/index.js";
export type {
  AutonomyConfig,
  AutonomyPermissions,
  AdminAutonomyPolicy,
  AutonomyState,
  AutonomyChangeEvent,
} from "./autonomy/index.js";
export { AutonomySlider } from "./autonomy/index.js";
export { PermissionMatrix, resolvePermissions } from "./autonomy/index.js";

// CLI
export { handleAutonomyCommand, parseAutonomyCommand } from "./cli/index.js";
export type { AutonomyCommandResult } from "./cli/index.js";
export { StatusBarRenderer } from "./cli/index.js";
export type { StatusBarConfig } from "./cli/index.js";
