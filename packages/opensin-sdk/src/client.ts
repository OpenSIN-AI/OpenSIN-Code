import { EventEmitter as NodeEventEmitter } from "node:events";
import {
  PromptRequest,
  PromptResponse,
  StreamChunk,
  SessionId,
  SessionInfo,
  ContentBlock,
  McpServer,
  ProviderConfig,
} from "./types.js";
import { EventStream } from "./events.js";
import { IProvider, ProviderRegistry, createProvider, ProviderName } from "./providers.js";

export type ConnectionStatus = "disconnected" | "connecting" | "connected" | "reconnecting" | "error";

export interface ConnectionConfig {
  baseUrl: string;
  apiKey?: string;
  timeout?: number;
  retries?: number;
  headers?: Record<string, string>;
}

export class OpenSINClient extends NodeEventEmitter {
  #config: ConnectionConfig;
  #status: ConnectionStatus = "disconnected";
  #sessions = new Map<SessionId, SessionInfo>();
  #activeSessionId: SessionId | null = null;
  #providerRegistry = new ProviderRegistry();
  #activeProvider: IProvider | null = null;
  #sessionIdCounter = 0;

  constructor(config: ConnectionConfig) {
    super();
    this.#config = config;
  }

  get status(): ConnectionStatus {
    return this.#status;
  }

  get activeSessionId(): SessionId | null {
    return this.#activeSessionId;
  }

  get activeProvider(): IProvider | null {
    return this.#activeProvider;
  }

  get providers(): ProviderRegistry {
    return this.#providerRegistry;
  }

  get sessions(): ReadonlyMap<SessionId, SessionInfo> {
    return this.#sessions;
  }

  async connect(): Promise<void> {
    if (this.#status === "connected") return;

    this.#status = "connecting";

    try {
      await this.#providerRegistry.connectAll();

      if (this.#providerRegistry.list().length > 0 && !this.#activeProvider) {
        this.#activeProvider = this.#providerRegistry.list()[0]!;
      }

      this.#status = "connected";
      this.emit("connect", { status: "connected" });
    } catch (error) {
      this.#status = "error";
      const err = error instanceof Error ? error : new Error(String(error));
      this.emit("error", { message: err.message });
      throw new Error(`Failed to connect: ${err.message}`);
    }
  }

  async disconnect(): Promise<void> {
    await this.#providerRegistry.disconnectAll();
    this.#activeProvider = null;
    this.#status = "disconnected";
    this.emit("disconnect", { status: "disconnected" });
  }

  async createSession(request: {
    cwd: string;
    mcpServers?: McpServer[];
    additionalDirectories?: string[];
  }): Promise<{ sessionId: SessionId }> {
    const sessionId = this.#generateSessionId();
    const sessionInfo: SessionInfo = {
      sessionId,
      cwd: request.cwd,
      lastUpdated: new Date().toISOString(),
    };

    this.#sessions.set(sessionId, sessionInfo);
    this.#activeSessionId = sessionId;
    this.emit("session:created", { sessionId });
    return { sessionId };
  }

  async loadSession(sessionId: SessionId, _cwd: string, _mcpServers?: McpServer[]): Promise<Record<string, unknown>> {
    const session = this.#sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }
    this.#activeSessionId = sessionId;
    return {};
  }

  async listSessions(): Promise<{ sessions: SessionInfo[] }> {
    return { sessions: Array.from(this.#sessions.values()) };
  }

  async closeSession(sessionId: SessionId): Promise<void> {
    this.#sessions.delete(sessionId);
    if (this.#activeSessionId === sessionId) {
      this.#activeSessionId = null;
    }
    this.emit("session:closed", { sessionId });
  }

  async prompt(sessionId: SessionId, prompt: ContentBlock[]): Promise<PromptResponse> {
    const provider = this.#resolveProvider();
    const request: PromptRequest = { sessionId, prompt };
    const response = await provider.complete(request);
    this.#touchSession(sessionId);
    this.emit("message", { response, sessionId });
    return response;
  }

  stream(sessionId: SessionId, prompt: ContentBlock[]): EventStream {
    const provider = this.#resolveProvider();
    const stream = new EventStream(sessionId);
    const request: PromptRequest = { sessionId, prompt };

    this.#touchSession(sessionId);
    this.emit("stream:start", { sessionId });

    this.#processStream(provider, request, stream).catch((error) => {
      stream.error({ message: error.message });
      this.emit("error", { message: error.message, sessionId });
    });

    return stream;
  }

  registerProvider(config: ProviderConfig): IProvider {
    const provider = createProvider(config);
    this.#providerRegistry.register(provider);
    return provider;
  }

  setProvider(name: ProviderName): void {
    const provider = this.#providerRegistry.get(name);
    if (!provider) {
      throw new Error(`Provider ${name} not registered`);
    }
    this.#activeProvider = provider;
  }

  #resolveProvider(): IProvider {
    if (this.#activeProvider) return this.#activeProvider;
    const providers = this.#providerRegistry.list();
    if (providers.length === 0) {
      throw new Error("No providers registered");
    }
    return providers[0]!;
  }

  async #processStream(
    provider: IProvider,
    request: PromptRequest,
    stream: EventStream,
  ): Promise<void> {
    stream.start();
    for await (const chunk of provider.stream(request)) {
      stream.pushChunk(chunk.text);
    }
    stream.complete();
  }

  #touchSession(sessionId: SessionId): void {
    const session = this.#sessions.get(sessionId);
    if (session) {
      session.lastUpdated = new Date().toISOString();
    }
  }

  #generateSessionId(): SessionId {
    this.#sessionIdCounter += 1;
    return `sin_${Date.now()}_${this.#sessionIdCounter}`;
  }
}
