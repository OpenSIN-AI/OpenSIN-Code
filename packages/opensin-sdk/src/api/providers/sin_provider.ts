import type {
  MessageRequest,
  MessageResponse,
  InputMessage,
  InputContentBlock,
  ToolResultContentBlock,
  StreamEvent,
  Value,
} from "../types.js";
import { ApiError, NetworkError, RateLimitError, AuthError } from "../error.js";
import { SseParser } from "../sse.js";

export const DEFAULT_BASE_URL = "http://92.5.60.87:4100/v1";

export interface AuthSource {
  apiKey(): string | undefined;
  bearerToken(): string | undefined;
  maskedAuthorization(): string;
  applyHeaders(headers: Record<string, string>): Record<string, string>;
}

export function createApiKeyAuth(apiKey: string): AuthSource {
  return {
    apiKey: () => apiKey,
    bearerToken: () => undefined,
    maskedAuthorization: () => "Bearer [REDACTED]",
    applyHeaders: (headers) => ({ ...headers, Authorization: `Bearer ${apiKey}` }),
  };
}

export function createBearerAuth(token: string): AuthSource {
  return {
    apiKey: () => undefined,
    bearerToken: () => token,
    maskedAuthorization: () => "Bearer [REDACTED]",
    applyHeaders: (headers) => ({ ...headers, Authorization: `Bearer ${token}` }),
  };
}

export function createCombinedAuth(apiKey: string, bearerToken: string): AuthSource {
  return {
    apiKey: () => apiKey,
    bearerToken: () => bearerToken,
    maskedAuthorization: () => "Bearer [REDACTED]",
    applyHeaders: (headers) => ({
      ...headers,
      Authorization: `Bearer ${bearerToken}`,
    }),
  };
}

export function authFromEnv(): AuthSource {
  const apiKey = process.env.OPENAI_API_KEY;
  const bearerToken = process.env.OPENAI_AUTH_TOKEN;

  if (apiKey && bearerToken) {
    return createCombinedAuth(apiKey, bearerToken);
  }
  if (apiKey) {
    return createApiKeyAuth(apiKey);
  }
  if (bearerToken) {
    return createBearerAuth(bearerToken);
  }

  throw ApiError.missingCredentials("OpenSIN", ["OPENAI_API_KEY", "OPENAI_AUTH_TOKEN"]);
}

const DEFAULT_INITIAL_BACKOFF_MS = 200;
const DEFAULT_MAX_BACKOFF_MS = 2000;
const DEFAULT_MAX_RETRIES = 2;
const REQUEST_ID_HEADER = "request-id";
const ALT_REQUEST_ID_HEADER = "x-request-id";

export class SinApiClient implements Provider {
  private baseUrl: string;
  private auth: AuthSource;
  private maxRetries: number;
  private initialBackoffMs: number;
  private maxBackoffMs: number;

  constructor(options?: {
    apiKey?: string;
    auth?: AuthSource;
    baseUrl?: string;
    maxRetries?: number;
    initialBackoffMs?: number;
    maxBackoffMs?: number;
  }) {
    this.baseUrl = options?.baseUrl ?? DEFAULT_BASE_URL;
    this.auth = options?.auth ?? authFromEnv();
    this.maxRetries = options?.maxRetries ?? DEFAULT_MAX_RETRIES;
    this.initialBackoffMs = options?.initialBackoffMs ?? DEFAULT_INITIAL_BACKOFF_MS;
    this.maxBackoffMs = options?.maxBackoffMs ?? DEFAULT_MAX_BACKOFF_MS;
  }

  static fromEnv(): SinApiClient {
    return new SinApiClient({
      auth: authFromEnv(),
      baseUrl: readBaseUrl(),
    });
  }

  async sendMessage(request: MessageRequest): Promise<MessageResponse> {
    const nonStreamRequest = { ...request, stream: false };
    const response = await this.sendWithRetry(nonStreamRequest);
    const requestId = getRequestId(response.headers);
    const data = await response.json();
    const normalized = normalizeResponse(data);
    if (normalized.request_id === undefined) {
      normalized.request_id = requestId;
    }
    return normalized;
  }

  async streamMessage(
    request: MessageRequest
  ): Promise<AsyncIterable<StreamEvent>> {
    const streamRequest = { ...request, stream: true };
    const response = await this.sendWithRetry(streamRequest);
    const requestId = getRequestId(response.headers);

    return {
      [Symbol.asyncIterator]() {
        const parser = new SseParser();
        const pending: StreamEvent[] = [];
        let done = false;

        return {
          async next(): Promise<IteratorResult<StreamEvent>> {
            if (pending.length > 0) {
              return { done: false, value: pending.shift()! };
            }

            if (done) {
              const remaining = parser.finish();
              if (remaining.length > 0) {
                return { done: false, value: remaining[0] };
              }
              return { done: true, value: undefined as unknown as StreamEvent };
            }

            const chunk = await response.read();
            if (chunk === null) {
              done = true;
              const remaining = parser.finish();
              if (remaining.length > 0) {
                return { done: false, value: remaining[0] };
              }
              return { done: true, value: undefined as unknown as StreamEvent };
            }

            const events = parser.push(new Uint8Array(chunk));
            pending.push(...events);

            if (pending.length > 0) {
              return { done: false, value: pending.shift()! };
            }

            return { done: true, value: undefined as unknown as StreamEvent };
          },
        };
      },
    };
  }

  private async sendWithRetry(
    request: MessageRequest
  ): Promise<{
    json: () => Promise<unknown>;
    read: () => Promise<Uint8Array | null>;
    headers: Headers;
  }> {
    let attempts = 0;
    let lastError: Error | undefined;

    while (attempts <= this.maxRetries) {
      attempts++;

      try {
        const response = await this.sendRawRequest(request);

        if (!response.ok) {
          const body = await response.text();
          const retryable = isRetryableStatus(response.status);

          if (response.status === 429) {
            const retryAfter = response.headers.get("retry-after");
            throw RateLimitError.create({
              status: response.status,
              retryAfter: retryAfter ? parseInt(retryAfter, 10) : undefined,
              body,
            });
          }

          if (response.status === 401 || response.status === 403) {
            throw AuthError.create(`authentication failed: ${body}`);
          }

          throw ApiError.api({
            status: response.status,
            body,
            retryable,
          });
        }

        if (request.stream) {
          return {
            json: async () => ({}),
            read: async () => {
              const reader = response.body?.getReader();
              if (!reader) return null;
              const result = await reader.read();
              return result.done ? null : result.value;
            },
            headers: response.headers,
          };
        }

        return {
          json: () => response.json(),
          read: async () => null,
          headers: response.headers,
        };
      } catch (error) {
        const apiError = error instanceof ApiError ? error : NetworkError.create(String(error));
        if (apiError.isRetryable() && attempts <= this.maxRetries) {
          lastError = apiError as Error;
          const delay = this.backoffForAttempt(attempts);
          await sleep(delay);
          continue;
        }
        throw error;
      }
    }

    throw ApiError.retriesExhausted({
      attempts,
      lastError: lastError as unknown as ApiError,
    });
  }

  private async sendRawRequest(request: MessageRequest): Promise<Response> {
    const url = `${this.baseUrl.replace(/\/$/, "")}/chat/completions`;
    const headers = this.auth.applyHeaders({
      "Content-Type": "application/json",
    });

    const body = buildChatCompletionRequest(request);

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    return response;
  }

  private backoffForAttempt(attempt: number): number {
    const multiplier = Math.pow(2, attempt - 1);
    const delay = this.initialBackoffMs * multiplier;
    return Math.min(delay, this.maxBackoffMs);
  }
}

function readBaseUrl(): string {
  return process.env.OPENAI_BASE_URL ?? DEFAULT_BASE_URL;
}

function getRequestId(headers: Headers): string | undefined {
  return (
    headers.get(REQUEST_ID_HEADER) ??
    headers.get(ALT_REQUEST_ID_HEADER) ??
    undefined
  );
}

function isRetryableStatus(status: number): boolean {
  return [408, 409, 429, 500, 502, 503, 504].includes(status);
}

function buildChatCompletionRequest(request: MessageRequest): object {
  const messages: object[] = [];

  if (request.system) {
    messages.push({ role: "system", content: request.system });
  }

  for (const msg of request.messages) {
    messages.push(translateMessage(msg));
  }

  const payload: Record<string, unknown> = {
    model: request.model,
    max_tokens: request.max_tokens,
    messages,
    stream: request.stream ?? false,
  };

  if (request.tools && request.tools.length > 0) {
    payload.tools = request.tools.map((tool) => ({
      type: "function",
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.input_schema,
      },
    }));
  }

  if (request.tool_choice) {
    payload.tool_choice = translateToolChoice(request.tool_choice);
  }

  return payload;
}

function translateMessage(message: InputMessage): object {
  if (message.role === "assistant") {
    const textParts: string[] = [];
    const toolCalls: object[] = [];

    for (const block of message.content) {
      if (block.type === "text") {
        textParts.push(block.text);
      } else if (block.type === "tool_use") {
        toolCalls.push({
          id: block.id,
          type: "function",
          function: {
            name: block.name,
            arguments: JSON.stringify(block.input),
          },
        });
      }
    }

    const result: Record<string, unknown> = { role: "assistant" };
    if (textParts.length > 0) result.content = textParts.join("");
    if (toolCalls.length > 0) result.tool_calls = toolCalls;

    return result;
  }

  const contentParts: object[] = [];

  for (const block of message.content) {
    if (block.type === "text") {
      contentParts.push({ role: "user", content: block.text });
    } else if (block.type === "tool_result") {
      contentParts.push({
        role: "tool",
        tool_call_id: block.tool_use_id,
        content: flattenToolResultContent(block.content),
        is_error: block.is_error,
      });
    }
  }

  return contentParts[0] ?? { role: message.role, content: "" };
}

function flattenToolResultContent(content: ToolResultContentBlock[]): string {
  return content
    .map((block) => (block.type === "text" ? block.text : JSON.stringify(block.value)))
    .join("\n");
}

function translateToolChoice(toolChoice: MessageRequest["tool_choice"]): object {
  if (!toolChoice) return { type: "auto" };

  switch (toolChoice.type) {
    case "auto":
      return { type: "auto" };
    case "any":
      return { type: "required" };
    case "tool":
      return { type: "function", function: { name: toolChoice.name } };
    default:
      return { type: "auto" };
  }
}

interface ChatCompletionResponse {
  id: string;
  model: string;
  choices: Array<{
    message: {
      role: string;
      content: string | null;
      tool_calls?: Array<{
        id: string;
        function: { name: string; arguments: string };
      }>;
    };
    finish_reason: string | null;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
  };
}

function normalizeResponse(data: unknown): MessageResponse {
  const chatData = data as ChatCompletionResponse;
  const choice = chatData.choices[0];
  if (!choice) {
    throw ApiError.invalidSseFrame("chat completion response missing choices");
  }

  const content: MessageResponse["content"] = [];

  if (choice.message.content) {
    content.push({ type: "text", text: choice.message.content });
  }

  if (choice.message.tool_calls) {
    for (const tc of choice.message.tool_calls) {
      let input: Value = {};
      try {
        input = JSON.parse(tc.function.arguments) as Value;
      } catch {
        input = { raw: tc.function.arguments } as Value;
      }
      content.push({
        type: "tool_use",
        id: tc.id,
        name: tc.function.name,
        input,
      });
    }
  }

  return {
    id: chatData.id,
    type: "message",
    role: choice.message.role,
    content,
    model: chatData.model,
    stop_reason: choice.finish_reason,
    stop_sequence: undefined,
    usage: {
      input_tokens: chatData.usage?.prompt_tokens ?? 0,
      cache_creation_input_tokens: 0,
      cache_read_input_tokens: 0,
      output_tokens: chatData.usage?.completion_tokens ?? 0,
    },
    request_id: undefined,
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export interface Provider {
  sendMessage(request: MessageRequest): Promise<MessageResponse>;
  streamMessage(request: MessageRequest): Promise<AsyncIterable<StreamEvent>>;
}

export interface ProviderStream {
  requestId(): string | undefined;
  nextEvent(): Promise<StreamEvent | null>;
}

export enum ProviderKind {
  SinApi = "sin_api",
  Xai = "xai",
  OpenAi = "openai",
}

export function providerKindToString(kind: ProviderKind): string {
  switch (kind) {
    case ProviderKind.SinApi:
      return "sin_api";
    case ProviderKind.Xai:
      return "xai";
    case ProviderKind.OpenAi:
      return "openai";
  }
}
