import { EventEmitter as NodeEventEmitter } from "node:events";
import { PromptResponse, SessionId, SessionInfo, ContentBlock, McpServer, ProviderConfig } from "./types.js";
import { EventStream } from "./events.js";
import { IProvider, ProviderRegistry, ProviderName } from "./providers.js";
export type ConnectionStatus = "disconnected" | "connecting" | "connected" | "reconnecting" | "error";
export interface ConnectionConfig {
    baseUrl: string;
    apiKey?: string;
    timeout?: number;
    retries?: number;
    headers?: Record<string, string>;
}
export declare class OpenSINClient extends NodeEventEmitter {
    #private;
    constructor(config: ConnectionConfig);
    get status(): ConnectionStatus;
    get activeSessionId(): SessionId | null;
    get activeProvider(): IProvider | null;
    get providers(): ProviderRegistry;
    get sessions(): ReadonlyMap<SessionId, SessionInfo>;
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    createSession(request: {
        cwd: string;
        mcpServers?: McpServer[];
        additionalDirectories?: string[];
    }): Promise<{
        sessionId: SessionId;
    }>;
    loadSession(sessionId: SessionId, _cwd: string, _mcpServers?: McpServer[]): Promise<Record<string, unknown>>;
    listSessions(): Promise<{
        sessions: SessionInfo[];
    }>;
    closeSession(sessionId: SessionId): Promise<void>;
    prompt(sessionId: SessionId, prompt: ContentBlock[]): Promise<PromptResponse>;
    stream(sessionId: SessionId, prompt: ContentBlock[]): EventStream;
    registerProvider(config: ProviderConfig): IProvider;
    setProvider(name: ProviderName): void;
}
//# sourceMappingURL=client.d.ts.map