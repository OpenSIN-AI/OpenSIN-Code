import { EventEmitter as NodeEventEmitter } from "node:events"
import {
  SessionId,
  StreamEvent,
  StreamChunk,
  StreamError,
  Plan,
  ToolCall,
  ContentChunk,
  CurrentModeUpdate,
  ConfigOptionUpdate,
} from "./types.js"

export class EventStream extends NodeEventEmitter {
  #sessionId: SessionId
  #active = false
  #buffer: StreamEvent[] = []
  #maxBufferSize = 10_000

  constructor(sessionId: SessionId) {
    super()
    this.#sessionId = sessionId
  }

  get sessionId(): SessionId {
    return this.#sessionId
  }

  get active(): boolean {
    return this.#active
  }

  start(): void {
    this.#active = true
    this.emit("start", { sessionId: this.#sessionId })
  }

  stop(): void {
    this.#active = false
    this.emit("stop", { sessionId: this.#sessionId })
  }

  pushChunk(text: string, messageId?: string): void {
    const event: StreamEvent<StreamChunk> = {
      type: "chunk",
      data: { text, messageId },
      timestamp: Date.now(),
    }
    this.#enqueue(event)
    this.emit("chunk", event)
  }

  pushPlanUpdate(plan: Plan): void {
    const event: StreamEvent<Plan> = {
      type: "plan_update",
      data: plan,
      timestamp: Date.now(),
    }
    this.#enqueue(event)
    this.emit("plan_update", event)
  }

  pushToolCall(toolCall: ToolCall): void {
    const event: StreamEvent<ToolCall> = {
      type: "tool_call",
      data: toolCall,
      timestamp: Date.now(),
    }
    this.#enqueue(event)
    this.emit("tool_call", event)
  }

  pushModeUpdate(update: CurrentModeUpdate): void {
    const event: StreamEvent<CurrentModeUpdate> = {
      type: "chunk",
      data: update,
      timestamp: Date.now(),
    }
    this.#enqueue(event)
    this.emit("mode_update", event)
  }

  pushConfigUpdate(update: ConfigOptionUpdate): void {
    const event: StreamEvent<ConfigOptionUpdate> = {
      type: "chunk",
      data: update,
      timestamp: Date.now(),
    }
    this.#enqueue(event)
    this.emit("config_update", event)
  }

  pushContent(chunk: ContentChunk): void {
    const event: StreamEvent<ContentChunk> = {
      type: "chunk",
      data: chunk,
      timestamp: Date.now(),
    }
    this.#enqueue(event)
    this.emit("chunk", event)
  }

  complete(): void {
    const event: StreamEvent<null> = {
      type: "complete",
      data: null,
      timestamp: Date.now(),
    }
    this.#enqueue(event)
    this.emit("complete", event)
    this.stop()
  }

  error(err: StreamError): void {
    const event: StreamEvent<StreamError> = {
      type: "error",
      data: err,
      timestamp: Date.now(),
    }
    this.#enqueue(event)
    this.emit("error", event)
  }

  getHistory(): ReadonlyArray<StreamEvent> {
    return [...this.#buffer]
  }

  clearHistory(): void {
    this.#buffer = []
  }

  onChunk(handler: (event: StreamEvent<StreamChunk>) => void): this {
    return this.on("chunk", handler) as this
  }

  onComplete(handler: (event: StreamEvent<null>) => void): this {
    return this.on("complete", handler) as this
  }

  onError(handler: (event: StreamEvent<StreamError>) => void): this {
    return this.on("error", handler) as this
  }

  onToolCall(handler: (event: StreamEvent<ToolCall>) => void): this {
    return this.on("tool_call", handler) as this
  }

  onPlanUpdate(handler: (event: StreamEvent<Plan>) => void): this {
    return this.on("plan_update", handler) as this
  }

  #enqueue(event: StreamEvent): void {
    this.#buffer.push(event)
    if (this.#buffer.length > this.#maxBufferSize) {
      this.#buffer = this.#buffer.slice(-this.#maxBufferSize)
    }
  }
}

export class EventMultiplexer extends NodeEventEmitter {
  #streams = new Map<SessionId, EventStream>()

  createStream(sessionId: SessionId): EventStream {
    const existing = this.#streams.get(sessionId)
    if (existing) return existing
    const stream = new EventStream(sessionId)
    this.#streams.set(sessionId, stream)
    return stream
  }

  getStream(sessionId: SessionId): EventStream | undefined {
    return this.#streams.get(sessionId)
  }

  removeStream(sessionId: SessionId): void {
    const stream = this.#streams.get(sessionId)
    if (stream) {
      stream.stop()
      stream.removeAllListeners()
      this.#streams.delete(sessionId)
    }
  }

  listStreams(): SessionId[] {
    return Array.from(this.#streams.keys())
  }

  broadcast(type: string, data: unknown): void {
    for (const stream of this.#streams.values()) {
      stream.emit(type, data)
    }
  }

  dispose(): void {
    for (const sessionId of this.#streams.keys()) {
      this.removeStream(sessionId)
    }
    this.removeAllListeners()
  }
}

export function parseSSELine(line: string): { event?: string; data?: string } {
  if (line.startsWith("event: ")) {
    return { event: line.slice(7) }
  }
  if (line.startsWith("data: ")) {
    return { data: line.slice(6) }
  }
  return {}
}

export async function* streamSSE(
  response: Response,
): AsyncIterableIterator<{ event?: string; data: string }> {
  const reader = response.body?.getReader()
  if (!reader) {
    throw new Error("Response body is not readable")
  }

  const decoder = new TextDecoder()
  let buffer = ""

  try {
    while (true) {
      const { done, value } = await reader.read()

      if (done) {
        if (buffer.trim()) {
          yield parseSSEBuffer(buffer)
        }
        break
      }

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split("\n")
      buffer = lines.pop() ?? ""

      for (const line of lines) {
        const parsed = parseSSELine(line)
        if (parsed.data !== undefined) {
          yield { event: parsed.event, data: parsed.data }
        }
      }
    }
  } finally {
    reader.releaseLock()
  }
}

function parseSSEBuffer(buffer: string): { event?: string; data: string } {
  const lines = buffer.split("\n")
  let event: string | undefined
  let data = ""

  for (const line of lines) {
    const parsed = parseSSELine(line)
    if (parsed.event) event = parsed.event
    if (parsed.data !== undefined) data = parsed.data
  }

  return { event, data }
}
