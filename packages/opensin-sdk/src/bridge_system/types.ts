/**
 * OpenSIN Bridge System — Type Definitions
 *
 * Core types for cross-process communication, transport layers,
 * and protocol definitions within the OpenSIN framework.
 */

/** Unique message identifier */
export type MessageId = string

/** Unique session identifier */
export type SessionId = string

/** Transport protocol type */
export type TransportType = 'stdio' | 'websocket' | 'http' | 'tcp'

/** Connection state for a bridge transport */
export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'error'

/** Message direction */
export type MessageDirection = 'inbound' | 'outbound'

/** Base bridge message */
export interface BridgeMessage {
  id: MessageId
  type: string
  direction: MessageDirection
  timestamp: number
  sessionId?: SessionId
  metadata?: Record<string, unknown>
}

/** Request message expecting a response */
export interface BridgeRequest extends BridgeMessage {
  type: 'request'
  method: string
  params: Record<string, unknown>
  timeoutMs?: number
}

/** Response to a bridge request */
export interface BridgeResponse extends BridgeMessage {
  type: 'response'
  requestId: MessageId
  result?: unknown
  error?: BridgeError
}

/** Notification message (fire and forget) */
export interface BridgeNotification extends BridgeMessage {
  type: 'notification'
  method: string
  params: Record<string, unknown>
}

/** Error payload in a response */
export interface BridgeError {
  code: number
  message: string
  data?: unknown
}

/** Transport configuration */
export interface TransportConfig {
  type: TransportType
  url?: string
  headers?: Record<string, string>
  timeoutMs?: number
  reconnectAttempts?: number
  reconnectDelayMs?: number
  maxMessageSize?: number
  compression?: boolean
}

/** Transport interface for sending and receiving messages */
export interface Transport {
  readonly type: TransportType
  readonly state: ConnectionState
  connect(): Promise<void>
  disconnect(): Promise<void>
  send(message: BridgeMessage): Promise<void>
  onMessage(handler: (message: BridgeMessage) => void): void
  onStateChange(handler: (state: ConnectionState) => void): void
  onError(handler: (error: Error) => void): void
}

/** Protocol handler for message routing */
export interface ProtocolHandler {
  handleRequest(request: BridgeRequest): Promise<unknown>
  handleNotification(notification: BridgeNotification): Promise<void>
  handleResponse(response: BridgeResponse): Promise<void>
  registerMethod(method: string, handler: (params: Record<string, unknown>) => Promise<unknown>): void
  unregisterMethod(method: string): void
}

/** Adapter bridging different protocol formats */
export interface ProtocolAdapter {
  name: string
  encode(message: BridgeMessage): string | Buffer
  decode(raw: string | Buffer): BridgeMessage
  supports(raw: string | Buffer): boolean
}

/** Bridge configuration */
export interface BridgeConfig {
  transports: TransportConfig[]
  protocol?: string
  adapters?: ProtocolAdapter[]
  defaultTimeoutMs?: number
  heartbeatIntervalMs?: number
  maxPendingRequests?: number
  logging?: boolean
}

/** Bridge state */
export interface BridgeState {
  connected: boolean
  transportType: TransportType | null
  activeSessions: Set<SessionId>
  pendingRequests: Map<MessageId, BridgeRequest>
  messageCount: { sent: number; received: number }
  uptime: number
  lastActivity: number
}

/** Bridge event */
export type BridgeEvent =
  | { type: 'connected'; transport: TransportType; timestamp: number }
  | { type: 'disconnected'; reason?: string; timestamp: number }
  | { type: 'message_sent'; message: BridgeMessage; timestamp: number }
  | { type: 'message_received'; message: BridgeMessage; timestamp: number }
  | { type: 'error'; error: Error; timestamp: number }
  | { type: 'session_started'; sessionId: SessionId; timestamp: number }
  | { type: 'session_ended'; sessionId: SessionId; timestamp: number }
  | { type: 'heartbeat'; timestamp: number }
