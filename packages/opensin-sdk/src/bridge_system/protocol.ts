/**
 * OpenSIN Bridge Protocol
 *
 * Defines the message protocol for agent-to-agent communication including
 * request/response patterns, notifications, and error handling.
 */

import { randomUUID } from 'crypto'
import type {
  BridgeRequest,
  BridgeResponse,
  BridgeNotification,
  BridgeMessage,
  BridgeError,
  ProtocolHandler,
  MessageId,
} from './types'

const JSONRPC_VERSION = '2.0'

/** OpenSIN protocol error codes */
export const ProtocolError = {
  PARSE_ERROR: -32700,
  INVALID_REQUEST: -32600,
  METHOD_NOT_FOUND: -32601,
  INVALID_PARAMS: -32602,
  INTERNAL_ERROR: -32603,
  TIMEOUT: -32000,
  TRANSPORT_ERROR: -32001,
} as const

/** Pending request tracker */
interface PendingRequest {
  resolve: (result: unknown) => void
  reject: (error: Error) => void
  timer: ReturnType<typeof setTimeout>
}

export class OpenSINProtocol implements ProtocolHandler {
  private methodHandlers: Map<string, (params: Record<string, unknown>) => Promise<unknown>> = new Map()
  private pendingRequests: Map<MessageId, PendingRequest> = new Map()
  private sendFn: (message: BridgeMessage) => Promise<void>

  constructor(sendFn: (message: BridgeMessage) => Promise<void>) {
    this.sendFn = sendFn
  }

  registerMethod(
    method: string,
    handler: (params: Record<string, unknown>) => Promise<unknown>
  ): void {
    this.methodHandlers.set(method, handler)
  }

  unregisterMethod(method: string): void {
    this.methodHandlers.delete(method)
  }

  async handleRequest(request: BridgeRequest): Promise<unknown> {
    const handler = this.methodHandlers.get(request.method)
    if (!handler) {
      const response: BridgeResponse = {
        id: request.id,
        type: 'response',
        direction: 'outbound',
        timestamp: Date.now(),
        requestId: request.id,
        error: {
          code: ProtocolError.METHOD_NOT_FOUND,
          message: `Method not found: ${request.method}`,
        },
      }
      await this.sendFn(response)
      return
    }

    try {
      const result = await handler(request.params)
      const response: BridgeResponse = {
        id: randomUUID(),
        type: 'response',
        direction: 'outbound',
        timestamp: Date.now(),
        requestId: request.id,
        result,
      }
      await this.sendFn(response)
    } catch (error) {
      const response: BridgeResponse = {
        id: randomUUID(),
        type: 'response',
        direction: 'outbound',
        timestamp: Date.now(),
        requestId: request.id,
        error: {
          code: ProtocolError.INTERNAL_ERROR,
          message: error instanceof Error ? error.message : String(error),
        },
      }
      await this.sendFn(response)
    }
  }

  async handleNotification(notification: BridgeNotification): Promise<void> {
    const handler = this.methodHandlers.get(notification.method)
    if (handler) {
      try {
        await handler(notification.params)
      } catch {
        // Notifications don't report errors back
      }
    }
  }

  async handleResponse(response: BridgeResponse): Promise<void> {
    const pending = this.pendingRequests.get(response.requestId)
    if (!pending) return

    clearTimeout(pending.timer)
    this.pendingRequests.delete(response.requestId)

    if (response.error) {
      pending.reject(new Error(response.error.message))
    } else {
      pending.resolve(response.result)
    }
  }

  async request(method: string, params: Record<string, unknown>, timeoutMs = 30000): Promise<unknown> {
    const id = randomUUID()
    const request: BridgeRequest = {
      id,
      type: 'request',
      direction: 'outbound',
      timestamp: Date.now(),
      method,
      params,
      timeoutMs,
    }

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pendingRequests.delete(id)
        reject(new Error(`Request timeout: ${method}`))
      }, timeoutMs)

      this.pendingRequests.set(id, { resolve, reject, timer })
      this.sendFn(request).catch((err) => {
        clearTimeout(timer)
        this.pendingRequests.delete(id)
        reject(err)
      })
    })
  }

  async notify(method: string, params: Record<string, unknown>): Promise<void> {
    const notification: BridgeNotification = {
      id: randomUUID(),
      type: 'notification',
      direction: 'outbound',
      timestamp: Date.now(),
      method,
      params,
    }
    await this.sendFn(notification)
  }

  /** Encode a message to JSON-RPC format */
  static encode(message: BridgeMessage): string {
    return JSON.stringify({
      jsonrpc: JSONRPC_VERSION,
      ...message,
    })
  }

  /** Decode a JSON-RPC message */
  static decode(raw: string): BridgeMessage | null {
    try {
      const parsed = JSON.parse(raw)
      if (parsed.jsonrpc !== JSONRPC_VERSION) return null
      const { jsonrpc, ...message } = parsed
      return message as BridgeMessage
    } catch {
      return null
    }
  }
}
