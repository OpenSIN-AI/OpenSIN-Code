import type {
  MessageRequest,
  MessageResponse,
  StreamEvent,
  InputMessage,
  ToolDefinition,
  ToolChoice,
  Value,
} from "./types.js";
import {
  resolveModelAlias,
  detectProviderKind,
  maxTokensForModel,
  metadataForModel,
  ProviderKind,
} from "./providers/mod.js";
import {
  SinApiClient,
  DEFAULT_BASE_URL,
  authFromEnv,
  type Provider,
  type ProviderStream,
} from "./providers/sin_provider.js";
import { type ProviderMetadata } from "./providers/mod.js";
import { ApiError } from "./error.js";

export class ProviderClient {
  private client: SinApiClient;
  private kind: ProviderKind;

  constructor(client: SinApiClient, kind: ProviderKind) {
    this.client = client;
    this.kind = kind;
  }

  static fromModel(model: string): ProviderClient {
    const resolvedModel = resolveModelAlias(model);
    return this.fromModelWithDefaultAuth(resolvedModel, undefined);
  }

  static fromModelWithDefaultAuth(
    model: string,
    defaultAuth?: ReturnType<typeof authFromEnv>
  ): ProviderClient {
    const resolvedModel = resolveModelAlias(model);
    const kind = detectProviderKind(resolvedModel);

    return new ProviderClient(
      new SinApiClient({
        auth: defaultAuth ?? authFromEnv(),
        baseUrl: readOpenAiBaseUrl(),
      }),
      kind
    );
  }

  get providerKind(): ProviderKind {
    return this.kind;
  }

  async sendMessage(request: MessageRequest): Promise<MessageResponse> {
    return this.client.sendMessage(request);
  }

  async streamMessage(
    request: MessageRequest
  ): Promise<StreamWrapper> {
    const stream = await this.client.streamMessage(request);
    return new StreamWrapper(stream);
  }
}

export class StreamWrapper implements ProviderStream {
  private stream: AsyncIterable<StreamEvent>;
  private iterator: AsyncIterator<StreamEvent> | null = null;

  constructor(stream: AsyncIterable<StreamEvent>) {
    this.stream = stream;
  }

  requestId(): string | undefined {
    return undefined;
  }

  async nextEvent(): Promise<StreamEvent | null> {
    if (!this.iterator) {
      this.iterator = this.stream[Symbol.asyncIterator]();
    }

    const result = await this.iterator.next();
    if (result.done) {
      return null;
    }
    return result.value;
  }
}

export function readOpenAiBaseUrl(): string {
  return process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1";
}

export interface SinMessageRequest extends MessageRequest {
  model: string;
  max_tokens: number;
  messages: InputMessage[];
  system?: string;
  tools?: ToolDefinition[];
  tool_choice?: ToolChoice;
  stream?: boolean;
}

export async function sendMessage(
  request: SinMessageRequest
): Promise<MessageResponse> {
  const client = ProviderClient.fromModel(request.model);
  return client.sendMessage(request);
}

export async function* streamMessage(
  request: SinMessageRequest
): AsyncGenerator<StreamEvent> {
  const client = ProviderClient.fromModel(request.model);
  const wrapper = await client.streamMessage(request);

  while (true) {
    const event = await wrapper.nextEvent();
    if (event === null) break;
    yield event;
  }
}

export type {
  MessageRequest,
  MessageResponse,
  StreamEvent,
  InputMessage,
  ToolDefinition,
  ToolChoice,
  ProviderKind,
  ProviderMetadata,
};
