import { EventEmitter as NodeEventEmitter } from "node:events";
import {
  ProviderConfig,
  ModelInfo,
  PromptRequest,
  PromptResponse,
  StreamChunk,
  StreamEvent,
  ContentBlock,
  SessionId,
} from "./types.js";

export type ProviderName = "openai" | "anthropic" | "google" | "ollama" | "custom";

// ============================================================
// Provider Interface
// ============================================================

export interface IProvider extends NodeEventEmitter {
  readonly name: ProviderName;
  readonly config: ProviderConfig;
  connected: boolean;

  connect(): Promise<void>;
  disconnect(): Promise<void>;
  complete(request: PromptRequest): Promise<PromptResponse>;
  stream(request: PromptRequest): AsyncIterableIterator<StreamChunk>;
  listModels(): Promise<ModelInfo[]>;
}

// ============================================================
// Provider Error
// ============================================================

export class ProviderError extends Error {
  constructor(message: string, public readonly details?: Record<string, unknown>) {
    super(message);
    this.name = "ProviderError";
  }
}

// ============================================================
// Base Provider
// ============================================================

export abstract class BaseProvider extends NodeEventEmitter implements IProvider {
  abstract readonly name: ProviderName;
  #config: ProviderConfig;
  #connected = false;

  constructor(config: ProviderConfig) {
    super();
    this.#config = config;
  }

  get config(): ProviderConfig {
    return this.#config;
  }

  get connected(): boolean {
    return this.#connected;
  }

  protected setConnected(value: boolean): void {
    this.#connected = value;
  }

  protected get baseUrl(): string {
    return this.#config.baseUrl ?? this.defaultBaseUrl;
  }

  protected get apiKey(): string | undefined {
    return this.#config.apiKey;
  }

  protected get headers(): Record<string, string> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (this.apiKey) {
      headers["Authorization"] = this.authHeaderValue;
    }
    return headers;
  }

  protected get authHeaderValue(): string {
    return `Bearer ${this.apiKey}`;
  }

  protected get defaultBaseUrl(): string {
    throw new ProviderError("Provider must implement defaultBaseUrl");
  }

  async connect(): Promise<void> {
    if (this.#connected) return;
    await this.doConnect();
    this.#connected = true;
  }

  async disconnect(): Promise<void> {
    if (!this.#connected) return;
    await this.doDisconnect();
    this.#connected = false;
  }

  protected abstract doConnect(): Promise<void>;
  protected abstract doDisconnect(): Promise<void>;
  abstract complete(request: PromptRequest): Promise<PromptResponse>;
  abstract stream(request: PromptRequest): AsyncIterableIterator<StreamChunk>;
  abstract listModels(): Promise<ModelInfo[]>;
}

// ============================================================
// OpenAI Provider
// ============================================================

export class OpenAIProvider extends BaseProvider {
  override readonly name: ProviderName = "openai";

  protected override get defaultBaseUrl(): string {
    return "https://api.openai.com/v1";
  }

  protected override async doConnect(): Promise<void> {
    await this.listModels();
  }

  protected override async doDisconnect(): Promise<void> {
    // No persistent connection to manage
  }

  override async complete(request: PromptRequest): Promise<PromptResponse> {
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

    const data = (await response.json()) as OpenAICompletionResponse;
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

  override async *stream(request: PromptRequest): AsyncIterableIterator<StreamChunk> {
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
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith("data: ")) continue;

          const dataStr = trimmed.slice(6);
          if (dataStr === "[DONE]") {
            return;
          }

          try {
            const chunk = JSON.parse(dataStr) as OpenAIStreamChunk;
            const delta = chunk.choices[0]?.delta;
            if (delta?.content) {
              yield {
                text: delta.content,
              };
            }
          } catch {
            // Skip malformed chunks
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  override async listModels(): Promise<ModelInfo[]> {
    const response = await fetch(`${this.baseUrl}/models`, {
      headers: this.headers,
    });

    if (!response.ok) {
      throw new ProviderError(`Failed to list models: ${response.statusText}`);
    }

    const data = (await response.json()) as { data: Array<{ id: string }> };
    return data.data.map((m) => ({
      modelId: m.id,
      name: m.id,
    }));
  }

  private buildRequestBody(request: PromptRequest): Record<string, unknown> {
    const messages = this.buildMessages(request);
    const modelId = this.config.models[0]?.modelId ?? "gpt-4o";
    return {
      model: modelId,
      messages,
    };
  }

  private buildMessages(request: PromptRequest): Array<Record<string, unknown>> {
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
  override readonly name: ProviderName = "anthropic";

  protected override get defaultBaseUrl(): string {
    return "https://api.anthropic.com/v1";
  }

  protected override get headers(): Record<string, string> {
    return {
      "Content-Type": "application/json",
      "anthropic-version": "2023-06-01",
      "x-api-key": this.apiKey ?? "",
    };
  }

  protected override async doConnect(): Promise<void> {
    await this.listModels();
  }

  protected override async doDisconnect(): Promise<void> {
    // No persistent connection to manage
  }

  override async complete(request: PromptRequest): Promise<PromptResponse> {
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

    const data = (await response.json()) as AnthropicMessageResponse;
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

  override async *stream(request: PromptRequest): AsyncIterableIterator<StreamChunk> {
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
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data: ")) continue;

          try {
            const event = JSON.parse(trimmed.slice(6)) as AnthropicStreamEvent;

            if (event.type === "content_block_delta") {
              if (event.delta?.type === "text_delta" && event.delta.text) {
                yield {
                  text: event.delta.text,
                };
              }
            } else if (event.type === "message_stop") {
              return;
            }
          } catch {
            // Skip malformed events
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  override async listModels(): Promise<ModelInfo[]> {
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

  private buildRequestBody(request: PromptRequest): Record<string, unknown> {
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

export function createProvider(config: ProviderConfig): IProvider {
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
      throw new ProviderError(`Unknown provider: ${(config as { name: string }).name}`);
  }
}

// ============================================================
// Provider Registry
// ============================================================

export class ProviderRegistry {
  #providers = new Map<string, IProvider>();

  register(provider: IProvider): void {
    this.#providers.set(provider.name, provider);
  }

  get(name: ProviderName): IProvider | undefined {
    return this.#providers.get(name);
  }

  has(name: ProviderName): boolean {
    return this.#providers.has(name);
  }

  list(): IProvider[] {
    return Array.from(this.#providers.values());
  }

  async connectAll(): Promise<void> {
    await Promise.all(
      Array.from(this.#providers.values()).map(async (p) => {
        try {
          await p.connect();
        } catch {
          // Skip failed connections
        }
      }),
    );
  }

  async disconnectAll(): Promise<void> {
    await Promise.all(
      Array.from(this.#providers.values()).map(async (p) => {
        try {
          await p.disconnect();
        } catch {
          // Ignore disconnect errors
        }
      }),
    );
  }
}

// ============================================================
// API Response Types
// ============================================================

interface OpenAICompletionResponse {
  id: string;
  choices: Array<{
    message: { role: string; content: string | null };
    finish_reason: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

interface OpenAIStreamChunk {
  id: string;
  choices: Array<{
    delta: { role?: string; content?: string };
    finish_reason: string | null;
  }>;
}

interface AnthropicMessageResponse {
  id: string;
  content: Array<{ type: string; text?: string }>;
  stop_reason?: string;
  usage?: {
    input_tokens: number;
    output_tokens: number;
  };
}

interface AnthropicStreamEvent {
  type: string;
  message?: { id: string };
  delta?: { type: string; text?: string };
}

function extractTextBlocks(content: ContentBlock[]): string {
  return content
    .filter((b): b is { type: "text"; text: string } => b.type === "text")
    .map((b) => b.text)
    .join("\n");
}
