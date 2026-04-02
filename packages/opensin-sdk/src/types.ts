export type SessionId = string
export type ModelId = string
export type RequestId = string | number
export type ProtocolVersion = number

export interface Implementation {
  name: string
  version: string
  title?: string | null
  _meta?: Record<string, unknown> | null
}

export interface Meta {
  _meta?: Record<string, unknown> | null
}

export type Position = {
  line: number
  character: number
}

export type Range = {
  start: Position
  end: Position
}

export type Role = "user" | "agent"

export type TextContent = {
  type: "text"
  text: string
  _meta?: Record<string, unknown> | null
}

export type ImageContent = {
  type: "image"
  data: string
  mimeType: string
  uri?: string | null
  _meta?: Record<string, unknown> | null
}

export type AudioContent = {
  type: "audio"
  data: string
  mimeType: string
  _meta?: Record<string, unknown> | null
}

export type ResourceLink = {
  type: "resource_link"
  uri: string
  name: string
  mimeType?: string | null
  _meta?: Record<string, unknown> | null
}

export type TextResourceContents = {
  uri: string
  mimeType?: string | null
  text: string
}

export type BlobResourceContents = {
  uri: string
  mimeType?: string | null
  blob: string
}

export type EmbeddedResource = {
  type: "resource"
  resource: TextResourceContents | BlobResourceContents
  _meta?: Record<string, unknown> | null
}

export type ContentBlock = TextContent | ImageContent | AudioContent | ResourceLink | EmbeddedResource

export type Annotations = {
  audience?: Role[] | null
  lastModified?: string | null
  priority?: number | null
  _meta?: Record<string, unknown> | null
}

export type Content = {
  content: ContentBlock
  _meta?: Record<string, unknown> | null
}

export type ContentChunk = {
  content: ContentBlock
  messageId?: string | null
  _meta?: Record<string, unknown> | null
}

export type StopReason = "end_turn" | "stop_sequence" | "max_tokens" | "tool_call" | "cancelled" | "error"

export type Usage = {
  inputTokens: number
  outputTokens: number
  totalTokens: number
  _meta?: Record<string, unknown> | null
}

export type Cost = {
  amount: number
  currency: string
}

export type PlanEntryPriority = "high" | "medium" | "low"
export type PlanEntryStatus = "pending" | "in_progress" | "completed"

export type PlanEntry = {
  content: string
  priority: PlanEntryPriority
  status: PlanEntryStatus
  _meta?: Record<string, unknown> | null
}

export type Plan = {
  entries: PlanEntry[]
  _meta?: Record<string, unknown> | null
}

export type Diff = {
  path: string
  oldText?: string | null
  newText: string
  _meta?: Record<string, unknown> | null
}

export type ToolCall = {
  id: string
  name: string
  input: unknown
  status: "pending" | "running" | "completed" | "failed"
  result?: ContentBlock[]
  _meta?: Record<string, unknown> | null
}

export type SessionModeId = string

export type SessionMode = {
  id: SessionModeId
  name: string
  description: string
  systemPrompt?: string | null
  _meta?: Record<string, unknown> | null
}

export type SessionModeState = {
  availableModes: SessionMode[]
  currentModeId: SessionModeId
  _meta?: Record<string, unknown> | null
}

export type ModelInfo = {
  modelId: ModelId
  name: string
  description?: string | null
  _meta?: Record<string, unknown> | null
}

export type SessionModelState = {
  availableModels: ModelInfo[]
  currentModelId?: ModelId | null
  _meta?: Record<string, unknown> | null
}

export type SessionConfigOption = {
  id: string
  name: string
  description?: string | null
  value: unknown
  _meta?: Record<string, unknown> | null
}

export type SessionInfo = {
  sessionId: SessionId
  cwd: string
  lastUpdated: string
  _meta?: Record<string, unknown> | null
}

export type PromptCapabilities = {
  audio?: boolean
  image?: boolean
  embeddedContext?: boolean
  _meta?: Record<string, unknown> | null
}

export type FileSystemCapabilities = {
  readTextFile?: boolean
  writeTextFile?: boolean
  _meta?: Record<string, unknown> | null
}

export type ClientCapabilities = {
  fs?: FileSystemCapabilities
  terminal?: boolean
  _meta?: Record<string, unknown> | null
}

export type McpServerHttp = {
  type: "http"
  name: string
  url: string
  headers: Array<{ name: string; value: string }>
  _meta?: Record<string, unknown> | null
}

export type McpServerSse = {
  type: "sse"
  name: string
  url: string
  headers: Array<{ name: string; value: string }>
  _meta?: Record<string, unknown> | null
}

export type McpServerStdio = {
  type: "stdio"
  name: string
  command: string
  args: string[]
  env: Array<{ name: string; value: string }>
  _meta?: Record<string, unknown> | null
}

export type McpServer = McpServerHttp | McpServerSse | McpServerStdio

export type AgentCapabilities = {
  loadSession?: boolean
  promptCapabilities?: PromptCapabilities
  sessionCapabilities?: SessionCapabilities
  _meta?: Record<string, unknown> | null
}

export type SessionCapabilities = {
  list?: boolean
  _meta?: Record<string, unknown> | null
}

export type InitializeRequest = {
  protocolVersion: ProtocolVersion
  clientInfo?: Implementation | null
  clientCapabilities?: ClientCapabilities
  _meta?: Record<string, unknown> | null
}

export type InitializeResponse = {
  protocolVersion: ProtocolVersion
  agentInfo?: Implementation | null
  agentCapabilities?: AgentCapabilities
  authMethods?: AuthMethod[]
  _meta?: Record<string, unknown> | null
}

export type AuthMethodAgent = {
  id: string
  name: string
  description?: string | null
  _meta?: Record<string, unknown> | null
}

export type AuthMethod = AuthMethodAgent

export type NewSessionRequest = {
  cwd: string
  mcpServers: McpServer[]
  additionalDirectories?: string[]
  _meta?: Record<string, unknown> | null
}

export type NewSessionResponse = {
  sessionId: SessionId
  modes?: SessionModeState | null
  models?: SessionModelState | null
  configOptions?: SessionConfigOption[] | null
  _meta?: Record<string, unknown> | null
}

export type LoadSessionRequest = {
  sessionId: SessionId
  cwd: string
  mcpServers: McpServer[]
  additionalDirectories?: string[]
  _meta?: Record<string, unknown> | null
}

export type LoadSessionResponse = {
  modes?: SessionModeState | null
  models?: SessionModelState | null
  configOptions?: SessionConfigOption[] | null
  _meta?: Record<string, unknown> | null
}

export type ListSessionsRequest = {
  cursor?: string | null
  cwd?: string | null
  _meta?: Record<string, unknown> | null
}

export type ListSessionsResponse = {
  sessions: SessionInfo[]
  nextCursor?: string | null
  _meta?: Record<string, unknown> | null
}

export type CloseSessionRequest = {
  sessionId: SessionId
  _meta?: Record<string, unknown> | null
}

export type CloseSessionResponse = Meta

export type PromptRequest = {
  sessionId: SessionId
  prompt: ContentBlock[]
  messageId?: string | null
  _meta?: Record<string, unknown> | null
}

export type PromptResponse = {
  stopReason: StopReason
  usage?: Usage | null
  userMessageId?: string | null
  _meta?: Record<string, unknown> | null
}

export type CancelNotification = {
  sessionId: SessionId
  _meta?: Record<string, unknown> | null
}

export type SessionUpdate = {
  sessionId: SessionId
  update: ContentChunk | Plan | ToolCall | CurrentModeUpdate | ConfigOptionUpdate
  _meta?: Record<string, unknown> | null
}

export type CurrentModeUpdate = {
  currentModeId: SessionModeId
  _meta?: Record<string, unknown> | null
}

export type ConfigOptionUpdate = {
  configOptions: SessionConfigOption[]
  _meta?: Record<string, unknown> | null
}

export type SessionNotification = {
  method: string
  params: SessionUpdate
}

export type JsonRpcError = {
  code: number
  message: string
  data?: unknown
}

export type JsonRpcRequest<T = unknown> = {
  jsonrpc: "2.0"
  id: RequestId
  method: string
  params?: T
}

export type JsonRpcResponse<T = unknown> = {
  jsonrpc: "2.0"
  id: RequestId
  result?: T
  error?: JsonRpcError
}

export type JsonRpcNotification<T = unknown> = {
  jsonrpc: "2.0"
  method: string
  params?: T
}

export type ProviderConfig = {
  name: string
  baseUrl: string
  apiKey?: string
  models: ModelInfo[]
  _meta?: Record<string, unknown> | null
}

export type StreamEvent<T = unknown> = {
  type: "chunk" | "complete" | "error" | "tool_call" | "plan_update"
  data: T
  timestamp: number
}

export type StreamChunk = {
  text: string
  messageId?: string
}

export type StreamError = {
  message: string
  code?: number
  original?: unknown
}

export type DocumentEvent = "didOpen" | "didClose" | "didFocus" | "didChange" | "didSave"

export type DidOpenDocumentNotification = {
  sessionId: SessionId
  uri: string
  languageId: string
  text: string
  version: number
  _meta?: Record<string, unknown> | null
}

export type DidCloseDocumentNotification = {
  sessionId: SessionId
  uri: string
  _meta?: Record<string, unknown> | null
}

export type DidFocusDocumentNotification = {
  sessionId: SessionId
  uri: string
  position: Position
  visibleRange: Range
  version: number
  _meta?: Record<string, unknown> | null
}

export type TextDocumentContentChangeEvent = {
  range?: Range
  text: string
}

export type DidChangeDocumentNotification = {
  sessionId: SessionId
  uri: string
  version: number
  contentChanges: TextDocumentContentChangeEvent[]
  _meta?: Record<string, unknown> | null
}

export type DidSaveDocumentNotification = {
  sessionId: SessionId
  uri: string
  _meta?: Record<string, unknown> | null
}
