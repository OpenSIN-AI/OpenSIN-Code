import {
  SessionId,
  SessionModeState,
  SessionModelState,
  SessionConfigOption,
  SessionInfo,
  McpServer,
  NewSessionResponse,
  LoadSessionResponse,
} from "./types.js"

export interface SessionRecord {
  sessionId: SessionId
  cwd: string
  modes: SessionModeState | null
  models: SessionModelState | null
  configOptions: SessionConfigOption[] | null
  mcpServers: McpServer[]
  createdAt: number
  lastActiveAt: number
  metadata: Map<string, unknown>
}

export interface SessionManagerOptions {
  defaultCwd?: string
  defaultMcpServers?: McpServer[]
}

export class SessionManager {
  #sessions = new Map<SessionId, SessionRecord>()
  #activeSessionId: SessionId | null = null
  #defaultCwd: string
  #defaultMcpServers: McpServer[]

  constructor(options: SessionManagerOptions = {}) {
    this.#defaultCwd = options.defaultCwd ?? process.cwd()
    this.#defaultMcpServers = options.defaultMcpServers ?? []
  }

  get activeSessionId(): SessionId | null {
    return this.#activeSessionId
  }

  get sessionCount(): number {
    return this.#sessions.size
  }

  register(sessionId: SessionId, response: NewSessionResponse | LoadSessionResponse): SessionRecord {
    const record: SessionRecord = {
      sessionId,
      cwd: this.#defaultCwd,
      modes: response.modes ?? null,
      models: response.models ?? null,
      configOptions: response.configOptions ?? null,
      mcpServers: [...this.#defaultMcpServers],
      createdAt: Date.now(),
      lastActiveAt: Date.now(),
      metadata: new Map(),
    }
    this.#sessions.set(sessionId, record)
    this.#activeSessionId = sessionId
    return record
  }

  setActive(sessionId: SessionId): void {
    if (!this.#sessions.has(sessionId)) {
      throw new Error(`Session ${sessionId} not found`)
    }
    this.#activeSessionId = sessionId
    const record = this.#sessions.get(sessionId)!
    record.lastActiveAt = Date.now()
  }

  get(sessionId: SessionId): SessionRecord | undefined {
    return this.#sessions.get(sessionId)
  }

  getActive(): SessionRecord | undefined {
    if (!this.#activeSessionId) return undefined
    return this.#sessions.get(this.#activeSessionId)
  }

  requireActive(): SessionRecord {
    const session = this.getActive()
    if (!session) {
      throw new Error("No active session. Create or load a session first.")
    }
    return session
  }

  remove(sessionId: SessionId): void {
    this.#sessions.delete(sessionId)
    if (this.#activeSessionId === sessionId) {
      this.#activeSessionId = null
    }
  }

  list(): SessionInfo[] {
    return Array.from(this.#sessions.values()).map((r) => ({
      sessionId: r.sessionId,
      cwd: r.cwd,
      lastUpdated: new Date(r.lastActiveAt).toISOString(),
    }))
  }

  updateModes(sessionId: SessionId, state: SessionModeState): void {
    const record = this.#sessions.get(sessionId)
    if (record) {
      record.modes = state
    }
  }

  updateModels(sessionId: SessionId, state: SessionModelState): void {
    const record = this.#sessions.get(sessionId)
    if (record) {
      record.models = state
    }
  }

  updateConfigOptions(sessionId: SessionId, options: SessionConfigOption[]): void {
    const record = this.#sessions.get(sessionId)
    if (record) {
      record.configOptions = options
    }
  }

  setMetadata(sessionId: SessionId, key: string, value: unknown): void {
    const record = this.#sessions.get(sessionId)
    if (record) {
      record.metadata.set(key, value)
    }
  }

  getMetadata<T = unknown>(sessionId: SessionId, key: string): T | undefined {
    const record = this.#sessions.get(sessionId)
    if (record) {
      return record.metadata.get(key) as T | undefined
    }
    return undefined
  }

  clear(): void {
    this.#sessions.clear()
    this.#activeSessionId = null
  }

  dispose(): void {
    this.clear()
  }
}

export function createSessionId(prefix = "sin"): SessionId {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).slice(2, 8)
  return `${prefix}_${timestamp}_${random}`
}

export function serializeSession(session: SessionRecord): string {
  return JSON.stringify({
    sessionId: session.sessionId,
    cwd: session.cwd,
    modes: session.modes,
    models: session.models,
    configOptions: session.configOptions,
    mcpServers: session.mcpServers,
    createdAt: session.createdAt,
    lastActiveAt: session.lastActiveAt,
    metadata: Object.fromEntries(session.metadata),
  })
}

export function deserializeSession(data: string): SessionRecord {
  try {
    const parsed = JSON.parse(data) as {
      sessionId: SessionId
      cwd: string
      modes: SessionModeState | null
      models: SessionModelState | null
      configOptions: SessionConfigOption[] | null
      mcpServers: McpServer[]
      createdAt: number
      lastActiveAt: number
      metadata: Record<string, unknown>
    }
    return {
      ...parsed,
      metadata: new Map(Object.entries(parsed.metadata ?? {})),
    }
  } catch {
    throw new Error("Failed to deserialize session data")
  }
}
