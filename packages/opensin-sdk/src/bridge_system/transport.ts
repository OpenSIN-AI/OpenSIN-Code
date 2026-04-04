/**
 * OpenSIN Bridge Transport Layer
 *
 * Implements stdio, WebSocket, and HTTP transports for cross-process
 * communication between OpenSIN agents.
 */

import { randomUUID } from 'crypto'
import type {
  Transport,
  TransportType,
  TransportConfig,
  ConnectionState,
  BridgeMessage,
} from './types.js'

type MessageHandler = (message: BridgeMessage) => void
type StateHandler = (state: ConnectionState) => void
type ErrorHandler = (error: Error) => void

abstract class BaseTransport implements Transport {
  abstract readonly type: TransportType
  protected _state: ConnectionState = 'disconnected'
  protected messageHandlers: Set<MessageHandler> = new Set()
  protected stateHandlers: Set<StateHandler> = new Set()
  protected errorHandlers: Set<ErrorHandler> = new Set()

  get state(): ConnectionState {
    return this._state
  }

  protected setState(state: ConnectionState): void {
    this._state = state
    for (const handler of this.stateHandlers) {
      try { handler(state) } catch { /* ignore */ }
    }
  }

  protected emitMessage(message: BridgeMessage): void {
    for (const handler of this.messageHandlers) {
      try { handler(message) } catch { /* ignore */ }
    }
  }

  protected emitError(error: Error): void {
    for (const handler of this.errorHandlers) {
      try { handler(error) } catch { /* ignore */ }
    }
  }

  abstract connect(): Promise<void>
  abstract disconnect(): Promise<void>
  abstract send(message: BridgeMessage): Promise<void>

  onMessage(handler: MessageHandler): void {
    this.messageHandlers.add(handler)
  }

  onStateChange(handler: StateHandler): void {
    this.stateHandlers.add(handler)
  }

  onError(handler: ErrorHandler): void {
    this.errorHandlers.add(handler)
  }
}

export class StdioTransport extends BaseTransport {
  readonly type: TransportType = 'stdio'
  private stdin: NodeJS.ReadStream
  private stdout: NodeJS.WriteStream
  private buffer = ''

  constructor(stdin?: NodeJS.ReadStream, stdout?: NodeJS.WriteStream) {
    super()
    this.stdin = stdin ?? process.stdin
    this.stdout = stdout ?? process.stdout
  }

  async connect(): Promise<void> {
    this.setState('connecting')

    return new Promise((resolve) => {
      this.stdin.setEncoding('utf8')
      this.stdin.on('data', (chunk: string) => this.handleData(chunk))
      this.setState('connected')
      resolve()
    })
  }

  async disconnect(): Promise<void> {
    this.setState('disconnected')
  }

  async send(message: BridgeMessage): Promise<void> {
    const line = JSON.stringify(message) + '\n'
    this.stdout.write(line)
  }

  private handleData(chunk: string): void {
    this.buffer += chunk
    const lines = this.buffer.split('\n')
    this.buffer = lines.pop() ?? ''

    for (const line of lines) {
      if (!line.trim()) continue
      try {
        const message = JSON.parse(line) as BridgeMessage
        if (!message.id) message.id = randomUUID()
        if (!message.timestamp) message.timestamp = Date.now()
        this.emitMessage(message)
      } catch (error) {
        this.emitError(error instanceof Error ? error : new Error(String(error)))
      }
    }
  }
}

export class WebSocketTransport extends BaseTransport {
  readonly type: TransportType = 'websocket'
  private url: string
  private ws: unknown = null
  private headers: Record<string, string>
  private reconnectAttempts: number
  private reconnectDelayMs: number
  private maxReconnectAttempts: number
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private currentAttempt = 0

  constructor(config: { url: string; headers?: Record<string, string>; maxReconnectAttempts?: number; reconnectDelayMs?: number }) {
    super()
    this.url = config.url
    this.headers = config.headers ?? {}
    this.maxReconnectAttempts = config.maxReconnectAttempts ?? 5
    this.reconnectDelayMs = config.reconnectDelayMs ?? 1000
    this.reconnectAttempts = this.maxReconnectAttempts
  }

  async connect(): Promise<void> {
    this.setState('connecting')

    try {
      const { WebSocket } = await import('ws')
      this.ws = new WebSocket(this.url, { headers: this.headers })

      ;(this.ws as any).on('open', () => {
        this.currentAttempt = 0
        this.setState('connected')
      })

      ;(this.ws as any).on('message', (data: Buffer) => {
        try {
          const message = JSON.parse(data.toString()) as BridgeMessage
          if (!message.id) message.id = randomUUID()
          if (!message.timestamp) message.timestamp = Date.now()
          this.emitMessage(message)
        } catch (error) {
          this.emitError(error instanceof Error ? error : new Error(String(error)))
        }
      })

      ;(this.ws as any).on('close', () => {
        this.setState('disconnected')
        this.scheduleReconnect()
      })

      ;(this.ws as any).on('error', (err: Error) => {
        this.emitError(err)
      })
    } catch (error) {
      this.setState('error')
      this.emitError(error instanceof Error ? error : new Error(String(error)))
      throw error
    }
  }

  async disconnect(): Promise<void> {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
    if (this.ws) {
      ;(this.ws as any).close()
      this.ws = null
    }
    this.setState('disconnected')
  }

  async send(message: BridgeMessage): Promise<void> {
    if (!this.ws || this._state !== 'connected') {
      throw new Error('WebSocket not connected')
    }
    ;(this.ws as any).send(JSON.stringify(message))
  }

  private scheduleReconnect(): void {
    if (this.currentAttempt >= this.maxReconnectAttempts) {
      this.setState('error')
      return
    }

    this.setState('reconnecting')
    this.currentAttempt++

    const delay = this.reconnectDelayMs * Math.pow(2, this.currentAttempt - 1)
    this.reconnectTimer = setTimeout(() => {
      this.connect().catch(() => { /* error handler fires */ })
    }, delay)
  }
}

export class HttpTransport extends BaseTransport {
  readonly type: TransportType = 'http'
  private baseUrl: string
  private headers: Record<string, string>
  private pollInterval: ReturnType<typeof setInterval> | null = null

  constructor(config: { url: string; headers?: Record<string, string> }) {
    super()
    this.baseUrl = config.url
    this.headers = config.headers ?? {}
  }

  async connect(): Promise<void> {
    this.setState('connecting')
    try {
      const response = await this.fetch('/health')
      if (response.ok) {
        this.setState('connected')
      } else {
        throw new Error(`HTTP ${response.status}`)
      }
    } catch (error) {
      this.setState('error')
      throw error
    }
  }

  async disconnect(): Promise<void> {
    if (this.pollInterval) {
      clearInterval(this.pollInterval)
      this.pollInterval = null
    }
    this.setState('disconnected')
  }

  async send(message: BridgeMessage): Promise<void> {
    await this.fetch('/messages', {
      method: 'POST',
      body: JSON.stringify(message),
    })
  }

  startPolling(intervalMs = 1000): void {
    this.pollInterval = setInterval(async () => {
      try {
        const response = await this.fetch('/messages')
        if (response.ok) {
          const messages = await response.json() as BridgeMessage[]
          for (const msg of messages) {
            this.emitMessage(msg)
          }
        }
      } catch (error) {
        this.emitError(error instanceof Error ? error : new Error(String(error)))
      }
    }, intervalMs)
  }

  private async fetch(path: string, options?: RequestInit): Promise<Response> {
    const url = `${this.baseUrl}${path}`
    return globalThis.fetch(url, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...this.headers, ...options?.headers },
    })
  }
}

export function createTransport(config: TransportConfig): Transport {
  switch (config.type) {
    case 'stdio':
      return new StdioTransport()
    case 'websocket':
      return new WebSocketTransport({
        url: config.url ?? '',
        headers: config.headers,
        maxReconnectAttempts: config.reconnectAttempts,
        reconnectDelayMs: config.reconnectDelayMs,
      })
    case 'http':
      return new HttpTransport({ url: config.url ?? '', headers: config.headers })
    default:
      throw new Error(`Unsupported transport type: ${config.type}`)
  }
}
