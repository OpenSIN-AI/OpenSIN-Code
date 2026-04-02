export class SessionManager {
    #sessions = new Map();
    #activeSessionId = null;
    #defaultCwd;
    #defaultMcpServers;
    constructor(options = {}) {
        this.#defaultCwd = options.defaultCwd ?? process.cwd();
        this.#defaultMcpServers = options.defaultMcpServers ?? [];
    }
    get activeSessionId() {
        return this.#activeSessionId;
    }
    get sessionCount() {
        return this.#sessions.size;
    }
    register(sessionId, response) {
        const record = {
            sessionId,
            cwd: this.#defaultCwd,
            modes: response.modes ?? null,
            models: response.models ?? null,
            configOptions: response.configOptions ?? null,
            mcpServers: [...this.#defaultMcpServers],
            createdAt: Date.now(),
            lastActiveAt: Date.now(),
            metadata: new Map(),
        };
        this.#sessions.set(sessionId, record);
        this.#activeSessionId = sessionId;
        return record;
    }
    setActive(sessionId) {
        if (!this.#sessions.has(sessionId)) {
            throw new Error(`Session ${sessionId} not found`);
        }
        this.#activeSessionId = sessionId;
        const record = this.#sessions.get(sessionId);
        record.lastActiveAt = Date.now();
    }
    get(sessionId) {
        return this.#sessions.get(sessionId);
    }
    getActive() {
        if (!this.#activeSessionId)
            return undefined;
        return this.#sessions.get(this.#activeSessionId);
    }
    requireActive() {
        const session = this.getActive();
        if (!session) {
            throw new Error("No active session. Create or load a session first.");
        }
        return session;
    }
    remove(sessionId) {
        this.#sessions.delete(sessionId);
        if (this.#activeSessionId === sessionId) {
            this.#activeSessionId = null;
        }
    }
    list() {
        return Array.from(this.#sessions.values()).map((r) => ({
            sessionId: r.sessionId,
            cwd: r.cwd,
            lastUpdated: new Date(r.lastActiveAt).toISOString(),
        }));
    }
    updateModes(sessionId, state) {
        const record = this.#sessions.get(sessionId);
        if (record) {
            record.modes = state;
        }
    }
    updateModels(sessionId, state) {
        const record = this.#sessions.get(sessionId);
        if (record) {
            record.models = state;
        }
    }
    updateConfigOptions(sessionId, options) {
        const record = this.#sessions.get(sessionId);
        if (record) {
            record.configOptions = options;
        }
    }
    setMetadata(sessionId, key, value) {
        const record = this.#sessions.get(sessionId);
        if (record) {
            record.metadata.set(key, value);
        }
    }
    getMetadata(sessionId, key) {
        const record = this.#sessions.get(sessionId);
        if (record) {
            return record.metadata.get(key);
        }
        return undefined;
    }
    clear() {
        this.#sessions.clear();
        this.#activeSessionId = null;
    }
    dispose() {
        this.clear();
    }
}
export function createSessionId(prefix = "sin") {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).slice(2, 8);
    return `${prefix}_${timestamp}_${random}`;
}
export function serializeSession(session) {
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
    });
}
export function deserializeSession(data) {
    try {
        const parsed = JSON.parse(data);
        return {
            ...parsed,
            metadata: new Map(Object.entries(parsed.metadata ?? {})),
        };
    }
    catch {
        throw new Error("Failed to deserialize session data");
    }
}
//# sourceMappingURL=session.js.map