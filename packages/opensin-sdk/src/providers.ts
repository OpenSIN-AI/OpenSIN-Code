/**
 * LLM Provider Abstraction
 * 
 * Unified interface for multiple LLM providers (OpenAI, Anthropic, OpenSIN).
 */

import { ConnectionConfig, ConnectionStatus, Message, ToolDefinition, StreamChunk, TokenUsage } from './types.js';
import { streamSSE } from './events.js';

export interface ProviderConfig {
  baseUrl: string;
  apiKey: string;
  model: string;
  timeout?: number;
}

export abstract class BaseProvider {
  abstract readonly name: string;
  protected config: ProviderConfig;

  constructor(config: ProviderConfig) {
    this.config = config;
  }

  abstract chat(
    messages: Message[],
    tools?: ToolDefinition[],
    options?: { max_tokens?: number; temperature?: number },
  ): Promise<{ content: string; usage: TokenUsage }>;

  abstract chatStream(
    messages: Message[],
    tools?: ToolDefinition[],
    options?: { max_tokens?: number; temperature?: number },
  ): AsyncGenerator<StreamChunk, void, unknown>;
}

export class OpenSINProvider extends BaseProvider {
  readonly name = 'opensin';

  async chat(
    messages: Message[],
    tools?: ToolDefinition[],
    options?: { max_tokens?: number; temperature?: number },
  ): Promise<{ content: string; usage: TokenUsage }> {
    const response = await fetch(`${this.config.baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(this.config.apiKey ? { Authorization: `Bearer ${this.config.apiKey}` } : {}),
      },
      body: JSON.stringify({
        model: this.config.model,
        messages: messages.map(m => ({ role: m.role, content: m.content })),
        tools: tools?.map(t => ({
          type: 'function',
          function: { name: t.name, description: t.description, parameters: t.input_schema },
        })),
        max_tokens: options?.max_tokens,
        temperature: options?.temperature ?? 0.7,
        stream: false,
      }),
      signal: this.config.timeout ? AbortSignal.timeout(this.config.timeout) : undefined,
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    const data: any = await response.json();
    const choice = data.choices?.[0];
    return {
      content: choice?.message?.content ?? '',
      usage: data.usage ?? { input_tokens: 0, output_tokens: 0, total_tokens: 0 },
    };
  }

  async *chatStream(
    messages: Message[],
    tools?: ToolDefinition[],
    options?: { max_tokens?: number; temperature?: number },
  ): AsyncGenerator<StreamChunk, void, unknown> {
    const response = await fetch(`${this.config.baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(this.config.apiKey ? { Authorization: `Bearer ${this.config.apiKey}` } : {}),
      },
      body: JSON.stringify({
        model: this.config.model,
        messages: messages.map(m => ({ role: m.role, content: m.content })),
        tools: tools?.map(t => ({
          type: 'function',
          function: { name: t.name, description: t.description, parameters: t.input_schema },
        })),
        max_tokens: options?.max_tokens,
        temperature: options?.temperature ?? 0.7,
        stream: true,
      }),
      signal: this.config.timeout ? AbortSignal.timeout(this.config.timeout) : undefined,
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    for await (const chunk of streamSSE(response)) {
      yield chunk;
    }
  }
}

export class OpenAIProvider extends BaseProvider {
  readonly name = 'openai';

  async chat(
    messages: Message[],
    tools?: ToolDefinition[],
    options?: { max_tokens?: number; temperature?: number },
  ): Promise<{ content: string; usage: TokenUsage }> {
    const response = await fetch(`${this.config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify({
        model: this.config.model,
        messages: messages.map(m => ({ role: m.role, content: m.content })),
        tools: tools?.map(t => ({
          type: 'function',
          function: { name: t.name, description: t.description, parameters: t.input_schema },
        })),
        max_tokens: options?.max_tokens,
        temperature: options?.temperature ?? 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data: any = await response.json();
    const choice = data.choices?.[0];
    return {
      content: choice?.message?.content ?? '',
      usage: {
        input_tokens: data.usage?.prompt_tokens ?? 0,
        output_tokens: data.usage?.completion_tokens ?? 0,
        total_tokens: data.usage?.total_tokens ?? 0,
      },
    };
  }

  async *chatStream(
    messages: Message[],
    tools?: ToolDefinition[],
    options?: { max_tokens?: number; temperature?: number },
  ): AsyncGenerator<StreamChunk, void, unknown> {
    const response = await fetch(`${this.config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify({
        model: this.config.model,
        messages: messages.map(m => ({ role: m.role, content: m.content })),
        tools: tools?.map(t => ({
          type: 'function',
          function: { name: t.name, description: t.description, parameters: t.input_schema },
        })),
        max_tokens: options?.max_tokens,
        temperature: options?.temperature ?? 0.7,
        stream: true,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    for await (const chunk of streamSSE(response)) {
      yield chunk;
    }
  }
}

export class AnthropicProvider extends BaseProvider {
  readonly name = 'anthropic';

  async chat(
    messages: Message[],
    tools?: ToolDefinition[],
    options?: { max_tokens?: number; temperature?: number },
  ): Promise<{ content: string; usage: TokenUsage }> {
    const systemMessages = messages.filter(m => (m as any).role === 'system');
    const nonSystemMessages = messages.filter(m => (m as any).role !== 'system');

    const response = await fetch(`${this.config.baseUrl}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.config.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: this.config.model,
        system: systemMessages.map(m => (m as any).content).join('\n'),
        messages: nonSystemMessages.map(m => ({ role: m.role, content: m.content })),
        tools: tools?.map(t => ({ name: t.name, description: t.description, input_schema: t.input_schema })),
        max_tokens: options?.max_tokens ?? 4096,
        temperature: options?.temperature ?? 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.status}`);
    }

    const data: any = await response.json();
    const textBlock = data.content?.find((b: { type: string; text?: string }) => b.type === 'text');
    return {
      content: textBlock?.text ?? '',
      usage: {
        input_tokens: data.usage?.input_tokens ?? 0,
        output_tokens: data.usage?.output_tokens ?? 0,
        total_tokens: (data.usage?.input_tokens ?? 0) + (data.usage?.output_tokens ?? 0),
      },
    };
  }

  async *chatStream(
    messages: Message[],
    tools?: ToolDefinition[],
    options?: { max_tokens?: number; temperature?: number },
  ): AsyncGenerator<StreamChunk, void, unknown> {
    // Anthropic uses different SSE format - simplified here
    const result = await this.chat(messages, tools, options);
    yield { type: 'text', content: result.content };
    yield { type: 'done', usage: result.usage };
  }
}

export function createProvider(
  providerName: string,
  config: ProviderConfig,
): BaseProvider {
  switch (providerName.toLowerCase()) {
    case 'openai':
      return new OpenAIProvider(config);
    case 'anthropic':
      return new AnthropicProvider(config);
    case 'opensin':
    default:
      return new OpenSINProvider(config);
  }
}

export class ProviderRegistry {
  private providers: Map<string, BaseProvider> = new Map();

  register(name: string, provider: BaseProvider): void {
    this.providers.set(name, provider);
  }

  get(name: string): BaseProvider | undefined {
    return this.providers.get(name);
  }

  list(): string[] {
    return Array.from(this.providers.keys());
  }
}
