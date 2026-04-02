import { EventEmitter as NodeEventEmitter } from "node:events";
export class EventStream extends NodeEventEmitter {
    #sessionId;
    #active = false;
    #buffer = [];
    #maxBufferSize = 10_000;
    constructor(sessionId) {
        super();
        this.#sessionId = sessionId;
    }
    get sessionId() {
        return this.#sessionId;
    }
    get active() {
        return this.#active;
    }
    start() {
        this.#active = true;
        this.emit("start", { sessionId: this.#sessionId });
    }
    stop() {
        this.#active = false;
        this.emit("stop", { sessionId: this.#sessionId });
    }
    pushChunk(text, messageId) {
        const event = {
            type: "chunk",
            data: { text, messageId },
            timestamp: Date.now(),
        };
        this.#enqueue(event);
        this.emit("chunk", event);
    }
    pushPlanUpdate(plan) {
        const event = {
            type: "plan_update",
            data: plan,
            timestamp: Date.now(),
        };
        this.#enqueue(event);
        this.emit("plan_update", event);
    }
    pushToolCall(toolCall) {
        const event = {
            type: "tool_call",
            data: toolCall,
            timestamp: Date.now(),
        };
        this.#enqueue(event);
        this.emit("tool_call", event);
    }
    pushModeUpdate(update) {
        const event = {
            type: "chunk",
            data: update,
            timestamp: Date.now(),
        };
        this.#enqueue(event);
        this.emit("mode_update", event);
    }
    pushConfigUpdate(update) {
        const event = {
            type: "chunk",
            data: update,
            timestamp: Date.now(),
        };
        this.#enqueue(event);
        this.emit("config_update", event);
    }
    pushContent(chunk) {
        const event = {
            type: "chunk",
            data: chunk,
            timestamp: Date.now(),
        };
        this.#enqueue(event);
        this.emit("chunk", event);
    }
    complete() {
        const event = {
            type: "complete",
            data: null,
            timestamp: Date.now(),
        };
        this.#enqueue(event);
        this.emit("complete", event);
        this.stop();
    }
    error(err) {
        const event = {
            type: "error",
            data: err,
            timestamp: Date.now(),
        };
        this.#enqueue(event);
        this.emit("error", event);
    }
    getHistory() {
        return [...this.#buffer];
    }
    clearHistory() {
        this.#buffer = [];
    }
    onChunk(handler) {
        return this.on("chunk", handler);
    }
    onComplete(handler) {
        return this.on("complete", handler);
    }
    onError(handler) {
        return this.on("error", handler);
    }
    onToolCall(handler) {
        return this.on("tool_call", handler);
    }
    onPlanUpdate(handler) {
        return this.on("plan_update", handler);
    }
    #enqueue(event) {
        this.#buffer.push(event);
        if (this.#buffer.length > this.#maxBufferSize) {
            this.#buffer = this.#buffer.slice(-this.#maxBufferSize);
        }
    }
}
export class EventMultiplexer extends NodeEventEmitter {
    #streams = new Map();
    createStream(sessionId) {
        const existing = this.#streams.get(sessionId);
        if (existing)
            return existing;
        const stream = new EventStream(sessionId);
        this.#streams.set(sessionId, stream);
        return stream;
    }
    getStream(sessionId) {
        return this.#streams.get(sessionId);
    }
    removeStream(sessionId) {
        const stream = this.#streams.get(sessionId);
        if (stream) {
            stream.stop();
            stream.removeAllListeners();
            this.#streams.delete(sessionId);
        }
    }
    listStreams() {
        return Array.from(this.#streams.keys());
    }
    broadcast(type, data) {
        for (const stream of this.#streams.values()) {
            stream.emit(type, data);
        }
    }
    dispose() {
        for (const sessionId of this.#streams.keys()) {
            this.removeStream(sessionId);
        }
        this.removeAllListeners();
    }
}
export function parseSSELine(line) {
    if (line.startsWith("event: ")) {
        return { event: line.slice(7) };
    }
    if (line.startsWith("data: ")) {
        return { data: line.slice(6) };
    }
    return {};
}
export async function* streamSSE(response) {
    const reader = response.body?.getReader();
    if (!reader) {
        throw new Error("Response body is not readable");
    }
    const decoder = new TextDecoder();
    let buffer = "";
    try {
        while (true) {
            const { done, value } = await reader.read();
            if (done) {
                if (buffer.trim()) {
                    yield parseSSEBuffer(buffer);
                }
                break;
            }
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() ?? "";
            for (const line of lines) {
                const parsed = parseSSELine(line);
                if (parsed.data !== undefined) {
                    yield { event: parsed.event, data: parsed.data };
                }
            }
        }
    }
    finally {
        reader.releaseLock();
    }
}
function parseSSEBuffer(buffer) {
    const lines = buffer.split("\n");
    let event;
    let data = "";
    for (const line of lines) {
        const parsed = parseSSELine(line);
        if (parsed.event)
            event = parsed.event;
        if (parsed.data !== undefined)
            data = parsed.data;
    }
    return { event, data };
}
//# sourceMappingURL=events.js.map