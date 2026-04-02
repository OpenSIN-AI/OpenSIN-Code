import { EventEmitter as NodeEventEmitter } from "node:events";
import { EventStream } from "./events.js";
import { ProviderRegistry, createProvider } from "./providers.js";
export class OpenSINClient extends NodeEventEmitter {
    #config;
    #status = "disconnected";
    #sessions = new Map();
    #activeSessionId = null;
    #providerRegistry = new ProviderRegistry();
    #activeProvider = null;
    #sessionIdCounter = 0;
    constructor(config) {
        super();
        this.#config = config;
    }
    get status() {
        return this.#status;
    }
    get activeSessionId() {
        return this.#activeSessionId;
    }
    get activeProvider() {
        return this.#activeProvider;
    }
    get providers() {
        return this.#providerRegistry;
    }
    get sessions() {
        return this.#sessions;
    }
    async connect() {
        if (this.#status === "connected")
            return;
        this.#status = "connecting";
        try {
            await this.#providerRegistry.connectAll();
            if (this.#providerRegistry.list().length > 0 && !this.#activeProvider) {
                this.#activeProvider = this.#providerRegistry.list()[0];
            }
            this.#status = "connected";
            this.emit("connect", { status: "connected" });
        }
        catch (error) {
            this.#status = "error";
            const err = error instanceof Error ? error : new Error(String(error));
            this.emit("error", { message: err.message });
            throw new Error(`Failed to connect: ${err.message}`);
        }
    }
    async disconnect() {
        await this.#providerRegistry.disconnectAll();
        this.#activeProvider = null;
        this.#status = "disconnected";
        this.emit("disconnect", { status: "disconnected" });
    }
    async createSession(request) {
        const sessionId = this.#generateSessionId();
        const sessionInfo = {
            sessionId,
            cwd: request.cwd,
            lastUpdated: new Date().toISOString(),
        };
        this.#sessions.set(sessionId, sessionInfo);
        this.#activeSessionId = sessionId;
        this.emit("session:created", { sessionId });
        return { sessionId };
    }
    async loadSession(sessionId, _cwd, _mcpServers) {
        const session = this.#sessions.get(sessionId);
        if (!session) {
            throw new Error(`Session ${sessionId} not found`);
        }
        this.#activeSessionId = sessionId;
        return {};
    }
    async listSessions() {
        return { sessions: Array.from(this.#sessions.values()) };
    }
    async closeSession(sessionId) {
        this.#sessions.delete(sessionId);
        if (this.#activeSessionId === sessionId) {
            this.#activeSessionId = null;
        }
        this.emit("session:closed", { sessionId });
    }
    async prompt(sessionId, prompt) {
        const provider = this.#resolveProvider();
        const request = { sessionId, prompt };
        const response = await provider.complete(request);
        this.#touchSession(sessionId);
        this.emit("message", { response, sessionId });
        return response;
    }
    stream(sessionId, prompt) {
        const provider = this.#resolveProvider();
        const stream = new EventStream(sessionId);
        const request = { sessionId, prompt };
        this.#touchSession(sessionId);
        this.emit("stream:start", { sessionId });
        this.#processStream(provider, request, stream).catch((error) => {
            stream.error({ message: error.message });
            this.emit("error", { message: error.message, sessionId });
        });
        return stream;
    }
    registerProvider(config) {
        const provider = createProvider(config);
        this.#providerRegistry.register(provider);
        return provider;
    }
    setProvider(name) {
        const provider = this.#providerRegistry.get(name);
        if (!provider) {
            throw new Error(`Provider ${name} not registered`);
        }
        this.#activeProvider = provider;
    }
    #resolveProvider() {
        if (this.#activeProvider)
            return this.#activeProvider;
        const providers = this.#providerRegistry.list();
        if (providers.length === 0) {
            throw new Error("No providers registered");
        }
        return providers[0];
    }
    async #processStream(provider, request, stream) {
        stream.start();
        for await (const chunk of provider.stream(request)) {
            stream.pushChunk(chunk.text);
        }
        stream.complete();
    }
    #touchSession(sessionId) {
        const session = this.#sessions.get(sessionId);
        if (session) {
            session.lastUpdated = new Date().toISOString();
        }
    }
    #generateSessionId() {
        this.#sessionIdCounter += 1;
        return `sin_${Date.now()}_${this.#sessionIdCounter}`;
    }
}
//# sourceMappingURL=client.js.map