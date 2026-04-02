import { SessionId, SessionModeState, SessionModelState, SessionConfigOption, SessionInfo, McpServer, NewSessionResponse, LoadSessionResponse } from "./types.js";
export interface SessionRecord {
    sessionId: SessionId;
    cwd: string;
    modes: SessionModeState | null;
    models: SessionModelState | null;
    configOptions: SessionConfigOption[] | null;
    mcpServers: McpServer[];
    createdAt: number;
    lastActiveAt: number;
    metadata: Map<string, unknown>;
}
export interface SessionManagerOptions {
    defaultCwd?: string;
    defaultMcpServers?: McpServer[];
}
export declare class SessionManager {
    #private;
    constructor(options?: SessionManagerOptions);
    get activeSessionId(): SessionId | null;
    get sessionCount(): number;
    register(sessionId: SessionId, response: NewSessionResponse | LoadSessionResponse): SessionRecord;
    setActive(sessionId: SessionId): void;
    get(sessionId: SessionId): SessionRecord | undefined;
    getActive(): SessionRecord | undefined;
    requireActive(): SessionRecord;
    remove(sessionId: SessionId): void;
    list(): SessionInfo[];
    updateModes(sessionId: SessionId, state: SessionModeState): void;
    updateModels(sessionId: SessionId, state: SessionModelState): void;
    updateConfigOptions(sessionId: SessionId, options: SessionConfigOption[]): void;
    setMetadata(sessionId: SessionId, key: string, value: unknown): void;
    getMetadata<T = unknown>(sessionId: SessionId, key: string): T | undefined;
    clear(): void;
    dispose(): void;
}
export declare function createSessionId(prefix?: string): SessionId;
export declare function serializeSession(session: SessionRecord): string;
export declare function deserializeSession(data: string): SessionRecord;
//# sourceMappingURL=session.d.ts.map