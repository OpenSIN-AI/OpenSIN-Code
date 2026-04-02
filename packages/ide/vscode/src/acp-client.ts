import * as vscode from "vscode"
import { WebSocket } from "ws"

export interface AcpMessage {
  jsonrpc: "2.0"
  method?: string
  id?: number | string
  result?: unknown
  error?: { code: number; message: string; data?: unknown }
  params?: unknown
}

export interface SessionInfo {
  sessionId: string
  cwd: string
  title?: string
  updatedAt?: string
}

export type SessionUpdateHandler = (update: unknown) => void
export type ToolCallHandler = (call: unknown) => void
export type FileEditHandler = (edit: { path: string; oldText: string; newText: string }) => void

export class AcpClient implements vscode.Disposable {
  private ws: WebSocket | null = null
  private msgId = 0
  private pending = new Map<number | string, { resolve: (v: unknown) => void; reject: (e: Error) => void }>()
  private sessionUpdateHandlers: SessionUpdateHandler[] = []
  private toolCallHandlers: ToolCallHandler[] = []
  private fileEditHandlers: FileEditHandler[] = []
  private _connected = false

  constructor(public serverUrl: string) {}

  get connected() {
    return this._connected
  }

  async connect() {
    if (this.ws?.readyState === WebSocket.OPEN) return

    const wsUrl = this.serverUrl.replace(/^http/, "ws") + "/acp"

    return new Promise<void>((resolve, reject) => {
      this.ws = new WebSocket(wsUrl)

      this.ws.on("open", () => {
        this._connected = true
        resolve()
      })

      this.ws.on("message", (raw) => {
        try {
          const msg: AcpMessage = JSON.parse(raw.toString())
          this.handleMessage(msg)
        } catch {
          // ignore malformed messages
        }
      })

      this.ws.on("error", (err) => {
        this._connected = false
        reject(err)
      })

      this.ws.on("close", () => {
        this._connected = false
      })
    })
  }

  async disconnect() {
    this.ws?.close()
    this.ws = null
    this._connected = false
  }

  dispose() {
    this.disconnect()
  }

  onSessionUpdate(handler: SessionUpdateHandler) {
    this.sessionUpdateHandlers.push(handler)
    return () => {
      this.sessionUpdateHandlers = this.sessionUpdateHandlers.filter((h) => h !== handler)
    }
  }

  onToolCall(handler: ToolCallHandler) {
    this.toolCallHandlers.push(handler)
    return () => {
      this.toolCallHandlers = this.toolCallHandlers.filter((h) => h !== handler)
    }
  }

  onFileEdit(handler: FileEditHandler) {
    this.fileEditHandlers.push(handler)
    return () => {
      this.fileEditHandlers = this.fileEditHandlers.filter((h) => h !== handler)
    }
  }

  async initialize(cwd: string) {
    return this.request("initialize", {
      protocolVersion: 1,
      clientInfo: { name: "vscode", version: vscode.version },
      cwd,
      capabilities: { terminal: true, diff: true },
    })
  }

  async newSession(cwd: string) {
    return this.request("session/new", { cwd, mcpServers: [] })
  }

  async loadSession(sessionId: string, cwd: string) {
    return this.request("session/load", { sessionId, cwd, mcpServers: [] })
  }

  async prompt(sessionId: string, text: string) {
    return this.request("session/prompt", {
      sessionId,
      prompt: [{ type: "text", text }],
    })
  }

  async cancel(sessionId: string) {
    return this.request("session/cancel", { sessionId })
  }

  async listSessions(cwd: string) {
    return this.request("session/list", { cwd })
  }

  private request(method: string, params: unknown): Promise<unknown> {
    return new Promise((resolve, reject) => {
      const id = ++this.msgId
      this.pending.set(id, { resolve, reject })

      const msg: AcpMessage = {
        jsonrpc: "2.0",
        id,
        method,
        params,
      }

      this.ws?.send(JSON.stringify(msg))

      setTimeout(() => {
        if (this.pending.has(id)) {
          this.pending.delete(id)
          reject(new Error(`Request ${method} timed out`))
        }
      }, 30000)
    })
  }

  private handleMessage(msg: AcpMessage) {
    if (msg.id !== undefined && this.pending.has(msg.id)) {
      const pending = this.pending.get(msg.id)!
      this.pending.delete(msg.id)
      if (msg.error) {
        pending.reject(new Error(msg.error.message))
      } else {
        pending.resolve(msg.result)
      }
      return
    }

    if (msg.method) {
      switch (msg.method) {
        case "session/update":
          this.sessionUpdateHandlers.forEach((h) => h(msg.params))
          break
        case "session/tool_call":
          this.toolCallHandlers.forEach((h) => h(msg.params))
          break
        case "session/file_edit":
          this.fileEditHandlers.forEach((h) => h(msg.params as { path: string; oldText: string; newText: string }))
          break
      }
    }
  }
}
