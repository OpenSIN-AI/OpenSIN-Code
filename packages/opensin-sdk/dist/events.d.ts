import { EventEmitter as NodeEventEmitter } from "node:events";
import { SessionId, StreamEvent, StreamChunk, StreamError, Plan, ToolCall, ContentChunk, CurrentModeUpdate, ConfigOptionUpdate } from "./types.js";
export declare class EventStream extends NodeEventEmitter {
    #private;
    constructor(sessionId: SessionId);
    get sessionId(): SessionId;
    get active(): boolean;
    start(): void;
    stop(): void;
    pushChunk(text: string, messageId?: string): void;
    pushPlanUpdate(plan: Plan): void;
    pushToolCall(toolCall: ToolCall): void;
    pushModeUpdate(update: CurrentModeUpdate): void;
    pushConfigUpdate(update: ConfigOptionUpdate): void;
    pushContent(chunk: ContentChunk): void;
    complete(): void;
    error(err: StreamError): void;
    getHistory(): ReadonlyArray<StreamEvent>;
    clearHistory(): void;
    onChunk(handler: (event: StreamEvent<StreamChunk>) => void): this;
    onComplete(handler: (event: StreamEvent<null>) => void): this;
    onError(handler: (event: StreamEvent<StreamError>) => void): this;
    onToolCall(handler: (event: StreamEvent<ToolCall>) => void): this;
    onPlanUpdate(handler: (event: StreamEvent<Plan>) => void): this;
}
export declare class EventMultiplexer extends NodeEventEmitter {
    #private;
    createStream(sessionId: SessionId): EventStream;
    getStream(sessionId: SessionId): EventStream | undefined;
    removeStream(sessionId: SessionId): void;
    listStreams(): SessionId[];
    broadcast(type: string, data: unknown): void;
    dispose(): void;
}
export declare function parseSSELine(line: string): {
    event?: string;
    data?: string;
};
export declare function streamSSE(response: Response): AsyncIterableIterator<{
    event?: string;
    data: string;
}>;
//# sourceMappingURL=events.d.ts.map