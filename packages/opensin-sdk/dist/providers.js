import { EventEmitter as NodeEventEmitter } from "node:events";
// ============================================================
// Provider Error
// ============================================================
export class ProviderError extends Error {
    details;
    constructor(message, details) {
        super(message);
        this.details = details;
        this.name = "ProviderError";
    }
}
// ============================================================
// Base Provider
// ============================================================
export class BaseProvider extends NodeEventEmitter {
    #config;
    #connected = false;
    constructor(config) {
        super();
        this.#config = config;
    }
    get config() {
        return this.#config;
    }
    get connected() {
        return this.#connected;
    }
    setConnected(value) {
        this.#connected = value;
    }
    get baseUrl() {
        return this.#config.baseUrl ?? this.defaultBaseUrl;
    }
    get apiKey() {
        return this.#config.apiKey;
    }
    get headers() {
        const headers = {
            "Content-Type": "application/json",
        };
        if (this.apiKey) {
            headers["Authorization"] = this.authHeaderValue;
        }
        return headers;
    }
    get authHeaderValue() {
        return `Bearer ${this.apiKey}`;
    }
    get defaultBaseUrl() {
        throw new ProviderError("Provider must implement defaultBaseUrl");
    }
    async connect() {
        if (this.#connected)
            return;
        await this.doConnect();
        this.#connected = true;
    }
    async disconnect() {
        if (!this.#connected)
            return;
        await this.doDisconnect();
        this.#connected = false;
    }
}
// ============================================================
// OpenAI Provider
// ============================================================
export class OpenAIProvider extends BaseProvider {
    name = "openai";
    get defaultBaseUrl() {
        return "https://api.openai.com/v1";
    }
    async doConnect() {
        await this.listModels();
    }
    async doDisconnect() {
        // No persistent connection to manage
    }
    async complete(request) {
        const response = await fetch(`${this.baseUrl}/chat/completions`, {
            method: "POST",
            headers: this.headers,
            body: JSON.stringify(this.buildRequestBody(request)),
        });
        if (!response.ok) {
            throw new ProviderError(`OpenAI API error: ${response.statusText}`, {
                status: response.status,
            });
        }
        const data = (await response.json());
        const choice = data.choices[0];
        if (!choice?.message) {
            throw new ProviderError("No completion choice returned");
        }
        return {
            stopReason: choice.finish_reason === "stop" ? "end_turn" : "end_turn",
            usage: data.usage
                ? {
                    inputTokens: data.usage.prompt_tokens,
                    outputTokens: data.usage.completion_tokens,
                    totalTokens: data.usage.total_tokens,
                }
                : null,
        };
    }
    async *stream(request) {
        const response = await fetch(`${this.baseUrl}/chat/completions`, {
            method: "POST",
            headers: this.headers,
            body: JSON.stringify({ ...this.buildRequestBody(request), stream: true }),
        });
        if (!response.ok) {
            throw new ProviderError(`OpenAI API error: ${response.statusText}`, {
                status: response.status,
            });
        }
        const reader = response.body?.getReader();
        if (!reader) {
            throw new ProviderError("Response body is not readable");
        }
        const decoder = new TextDecoder();
        let buffer = "";
        try {
            while (true) {
                const { done, value } = await reader.read();
                if (done)
                    break;
                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split("\n");
                buffer = lines.pop() ?? "";
                for (const line of lines) {
                    const trimmed = line.trim();
                    if (!trimmed || !trimmed.startsWith("data: "))
                        continue;
                    const dataStr = trimmed.slice(6);
                    if (dataStr === "[DONE]") {
                        return;
                    }
                    try {
                        const chunk = JSON.parse(dataStr);
                        const delta = chunk.choices[0]?.delta;
                        if (delta?.content) {
                            yield {
                                text: delta.content,
                            };
                        }
                    }
                    catch {
                        // Skip malformed chunks
                    }
                }
            }
        }
        finally {
            reader.releaseLock();
        }
    }
    async listModels() {
        const response = await fetch(`${this.baseUrl}/models`, {
            headers: this.headers,
        });
        if (!response.ok) {
            throw new ProviderError(`Failed to list models: ${response.statusText}`);
        }
        const data = (await response.json());
        return data.data.map((m) => ({
            modelId: m.id,
            name: m.id,
        }));
    }
    buildRequestBody(request) {
        const messages = this.buildMessages(request);
        const modelId = this.config.models[0]?.modelId ?? "gpt-4o";
        return {
            model: modelId,
            messages,
        };
    }
    buildMessages(request) {
        const content = request.prompt;
        return [
            { role: "user", content: content },
        ];
    }
}
// ============================================================
// Anthropic Provider
// ============================================================
export class AnthropicProvider extends BaseProvider {
    name = "anthropic";
    get defaultBaseUrl() {
        return "https://api.anthropic.com/v1";
    }
    get headers() {
        return {
            "Content-Type": "application/json",
            "anthropic-version": "2023-06-01",
            "x-api-key": this.apiKey ?? "",
        };
    }
    async doConnect() {
        await this.listModels();
    }
    async doDisconnect() {
        // No persistent connection to manage
    }
    async complete(request) {
        const response = await fetch(`${this.baseUrl}/messages`, {
            method: "POST",
            headers: this.headers,
            body: JSON.stringify(this.buildRequestBody(request)),
        });
        if (!response.ok) {
            throw new ProviderError(`Anthropic API error: ${response.statusText}`, {
                status: response.status,
            });
        }
        const data = (await response.json());
        const textBlock = data.content.find((b) => b.type === "text");
        return {
            stopReason: data.stop_reason === "end_turn" ? "end_turn" : "end_turn",
            usage: data.usage
                ? {
                    inputTokens: data.usage.input_tokens,
                    outputTokens: data.usage.output_tokens,
                    totalTokens: data.usage.input_tokens + data.usage.output_tokens,
                }
                : null,
        };
    }
    async *stream(request) {
        const response = await fetch(`${this.baseUrl}/messages`, {
            method: "POST",
            headers: { ...this.headers, Accept: "text/event-stream" },
            body: JSON.stringify({ ...this.buildRequestBody(request), stream: true }),
        });
        if (!response.ok) {
            throw new ProviderError(`Anthropic API error: ${response.statusText}`, {
                status: response.status,
            });
        }
        const reader = response.body?.getReader();
        if (!reader) {
            throw new ProviderError("Response body is not readable");
        }
        const decoder = new TextDecoder();
        let buffer = "";
        try {
            while (true) {
                const { done, value } = await reader.read();
                if (done)
                    break;
                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split("\n");
                buffer = lines.pop() ?? "";
                for (const line of lines) {
                    const trimmed = line.trim();
                    if (!trimmed.startsWith("data: "))
                        continue;
                    try {
                        const event = JSON.parse(trimmed.slice(6));
                        if (event.type === "content_block_delta") {
                            if (event.delta?.type === "text_delta" && event.delta.text) {
                                yield {
                                    text: event.delta.text,
                                };
                            }
                        }
                        else if (event.type === "message_stop") {
                            return;
                        }
                    }
                    catch {
                        // Skip malformed events
                    }
                }
            }
        }
        finally {
            reader.releaseLock();
        }
    }
    async listModels() {
        return [
            {
                modelId: "claude-sonnet-4-20250514",
                name: "Claude Sonnet 4",
            },
            {
                modelId: "claude-opus-4-20250514",
                name: "Claude Opus 4",
            },
        ];
    }
    buildRequestBody(request) {
        const modelId = this.config.models[0]?.modelId ?? "claude-sonnet-4-20250514";
        const text = extractTextBlocks(request.prompt);
        return {
            model: modelId,
            max_tokens: 4096,
            messages: [{ role: "user", content: text }],
        };
    }
}
// ============================================================
// Provider Factory
// ============================================================
export function createProvider(config) {
    switch (config.name) {
        case "openai":
            return new OpenAIProvider(config);
        case "anthropic":
            return new AnthropicProvider(config);
        case "google":
        case "ollama":
        case "custom":
            throw new ProviderError(`Provider ${config.name} not yet implemented`);
        default:
            throw new ProviderError(`Unknown provider: ${config.name}`);
    }
}
// ============================================================
// Provider Registry
// ============================================================
export class ProviderRegistry {
    #providers = new Map();
    register(provider) {
        this.#providers.set(provider.name, provider);
    }
    get(name) {
        return this.#providers.get(name);
    }
    has(name) {
        return this.#providers.has(name);
    }
    list() {
        return Array.from(this.#providers.values());
    }
    async connectAll() {
        await Promise.all(Array.from(this.#providers.values()).map(async (p) => {
            try {
                await p.connect();
            }
            catch {
                // Skip failed connections
            }
        }));
    }
    async disconnectAll() {
        await Promise.all(Array.from(this.#providers.values()).map(async (p) => {
            try {
                await p.disconnect();
            }
            catch {
                // Ignore disconnect errors
            }
        }));
    }
}
function extractTextBlocks(content) {
    return content
        .filter((b) => b.type === "text")
        .map((b) => b.text)
        .join("\n");
}
//# sourceMappingURL=providers.js.map