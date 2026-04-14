/**
 * OpenSIN Bridge Adapter
 *
 * Adapts between different protocol formats and provides a unified
 * interface for bridge communication.
 */

import type {
  BridgeMessage,
  ProtocolAdapter,
  Transport,
  BridgeConfig,
  BridgeState,
  BridgeEvent,
  SessionId,
  MessageId,
  BridgeRequest,
  BridgeResponse,
  BridgeNotification,
} from './types'
import { OpenSINProtocol, ProtocolError } from './protocol'
import { createTransport } from './transport'

type EventHandler = (event: BridgeEvent) => void

export class OpenSINBridge {
  private transport: Transport | null = null
  private protocol: OpenSINProtocol | null = null
  private config: BridgeConfig
  private eventHandlers: Map<string, Set<EventHandler>> = new Map()
  private _state: BridgeState
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null
  private adapters: Map<string, ProtocolAdapter> = new Map()

  constructor(config: BridgeConfig) {
    this.config = config
    this._state = {
      connected: false,
      transportType: null,
      activeSessions: new Set(),
      pendingRequests: new Map(),
      messageCount: { sent: 0, received: 0 },
      uptime: 0,
      lastActivity: Date.now(),
    }

    for (const adapter of config.adapters ?? []) {
      this.adapters.set(adapter.name, adapter)
    }
  }

  get state(): BridgeState {
    return { ...this._state, activeSessions: new Set(this._state.activeSessions) }
  }

  async connect(): Promise<void> {
    if (this.config.transports.length === 0) {
      throw new Error('No transports configured')
    }

    const transportConfig = this.config.transports[0]!
    this.transport = createTransport(transportConfig)

    this.protocol = new OpenSINProtocol(async (message) => {
      if (!this.transport) throw new Error('Transport not initialized')
      await this.transport.send(message)
      this._state.messageCount.sent++
      this._state.lastActivity = Date.now()
      this.emit({ type: 'message_sent', message, timestamp: Date.now() })
    })

    this.transport.onMessage((message) => {
      this._state.messageCount.received++
      this._state.lastActivity = Date.now()
      this.emit({ type: 'message_received', message, timestamp: Date.now() })
      this.dispatchMessage(message)
    })

    this.transport.onStateChange((state) => {
      if (state === 'connected') {
        this._state.connected = true
        this._state.transportType = transportConfig.type
        this._state.uptime = Date.now()
        this.emit({ type: 'connected', transport: transportConfig.type, timestamp: Date.now() })
        this.startHeartbeat()
      } else if (state === 'disconnected' || state === 'error') {
        this._state.connected = false
        this.emit({
          type: 'disconnected',
          reason: state === 'error' ? 'transport_error' : undefined,
          timestamp: Date.now(),
        })
        this.stopHeartbeat()
      }
    })

    this.transport.onError((error) => {
      this.emit({ type: 'error', error, timestamp: Date.now() })
    })

    await this.transport.connect()
  }

  async disconnect(): Promise<void> {
    this.stopHeartbeat()
    await this.transport?.disconnect()
    this.transport = null
    this.protocol = null
    this._state.connected = false
  }

  async sendRequest(method: string, params: Record<string, unknown>, timeoutMs?: number): Promise<unknown> {
    if (!this.protocol) throw new Error('Bridge not connected')
    return this.protocol.request(method, params, timeoutMs ?? this.config.defaultTimeoutMs ?? 30000)
  }

  async sendNotification(method: string, params: Record<string, unknown>): Promise<void> {
    if (!this.protocol) throw new Error('Bridge not connected')
    return this.protocol.notify(method, params)
  }

  registerHandler(method: string, handler: (params: Record<string, unknown>) => Promise<unknown>): void {
    if (!this.protocol) throw new Error('Bridge not connected')
    this.protocol.registerMethod(method, handler)
  }

  startSession(sessionId: SessionId): void {
    this._state.activeSessions.add(sessionId)
    this.emit({ type: 'session_started', sessionId, timestamp: Date.now() })
  }

  endSession(sessionId: SessionId): void {
    this._state.activeSessions.delete(sessionId)
    this.emit({ type: 'session_ended', sessionId, timestamp: Date.now() })
  }

  on(eventType: string, handler: EventHandler): void {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, new Set())
    }
    this.eventHandlers.get(eventType)!.add(handler)
  }

  off(eventType: string, handler: EventHandler): void {
    this.eventHandlers.get(eventType)?.delete(handler)
  }

  addAdapter(adapter: ProtocolAdapter): void {
    this.adapters.set(adapter.name, adapter)
  }

  detectAndDecode(raw: string | Buffer): BridgeMessage | null {
    for (const adapter of this.adapters.values()) {
      if (adapter.supports(raw)) {
        return adapter.decode(raw)
      }
    }
    return OpenSINProtocol.decode(typeof raw === 'string' ? raw : raw.toString())
  }

  private async dispatchMessage(message: BridgeMessage): Promise<void> {
    if (!this.protocol) return

    switch (message.type) {
      case 'request':
        await this.protocol.handleRequest(message as BridgeRequest)
        break
      case 'response':
        await this.protocol.handleResponse(message as BridgeResponse)
        break
      case 'notification':
        await this.protocol.handleNotification(message as BridgeNotification)
        break
    }
  }

  private startHeartbeat(): void {
    if (!this.config.heartbeatIntervalMs) return

    this.heartbeatTimer = setInterval(() => {
      this.emit({ type: 'heartbeat', timestamp: Date.now() })
    }, this.config.heartbeatIntervalMs)

    if (this.heartbeatTimer.unref) {
      this.heartbeatTimer.unref()
    }
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer)
      this.heartbeatTimer = null
    }
  }

  private emit(event: BridgeEvent): void {
    const typeHandlers = this.eventHandlers.get(event.type) ?? new Set()
    const allHandlers = this.eventHandlers.get('*') ?? new Set()
    for (const handler of [...typeHandlers, ...allHandlers]) {
      try { handler(event) } catch { /* ignore */ }
    }
  }
}

/** JSON-RPC adapter */
export class JsonRpcAdapter implements ProtocolAdapter {
  readonly name = 'jsonrpc'

  encode(message: BridgeMessage): string {
    return OpenSINProtocol.encode(message)
  }

  decode(raw: string | Buffer): BridgeMessage {
    const msg = OpenSINProtocol.decode(typeof raw === 'string' ? raw : raw.toString())
    if (!msg) throw new Error('Invalid JSON-RPC message')
    return msg
  }

  supports(raw: string | Buffer): boolean {
    try {
      const parsed = JSON.parse(typeof raw === 'string' ? raw : raw.toString())
      return parsed.jsonrpc === '2.0'
    } catch {
      return false
    }
  }
}

/** NDJSON adapter for streaming */
export class NdjsonAdapter implements ProtocolAdapter {
  readonly name = 'ndjson'

  encode(message: BridgeMessage): string {
    return JSON.stringify(message) + '\n'
  }

  decode(raw: string | Buffer): BridgeMessage {
    return JSON.parse(typeof raw === 'string' ? raw : raw.toString().trim())
  }

  supports(raw: string | Buffer): boolean {
    try {
      JSON.parse(typeof raw === 'string' ? raw : raw.toString())
      return true
    } catch {
      return false
    }
  }
}

export function createBridge(config: BridgeConfig): OpenSINBridge {
  return new OpenSINBridge(config)
}
