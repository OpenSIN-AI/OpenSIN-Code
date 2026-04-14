/**
 * OpenSIN Client — HTTP/SSE client for the OpenSIN API.
 * 
 * Connects to the OpenSIN API server, manages sessions,
 * sends prompts, and handles streaming responses with tool calls.
 */

import {
  ConnectionConfig,
  ConnectionStatus,
  SessionInfo,
  NewSessionRequest,
  NewSessionResponse,
  PromptRequest,
  PromptResponse,
  Message,
  ToolDefinition,
  StreamChunk,
  TokenUsage,
  JsonRpcRequest,
  JsonRpcResponse,
} from './types';
import { OpenSINProvider, BaseProvider, ProviderConfig } from './providers';

export class OpenSINClient {
  private config: ConnectionConfig;
  private status: ConnectionStatus = 'disconnected';
  private provider: BaseProvider | null = null;
  private requestCounter = 0;

  constructor(config: ConnectionConfig) {
    this.config = config;
  }

  get connectionStatus(): ConnectionStatus {
    return this.status;
  }

  /**
   * Initialize connection to the API server.
   */
  async connect(): Promise<void> {
    this.status = 'connecting';
    try {
      const response = await fetch(`${this.config.baseUrl}/health`, {
        signal: this.config.timeout ? AbortSignal.timeout(this.config.timeout) : undefined,
      });

      if (!response.ok) {
        throw new Error(`Health check failed: ${response.status}`);
      }

      this.status = 'connected';

      // Initialize provider
      const providerConfig: ProviderConfig = {
        baseUrl: this.config.baseUrl,
        apiKey: this.config.apiKey || '',
        model: 'opensin-default',
        timeout: this.config.timeout,
      };
      this.provider = new OpenSINProvider(providerConfig);
    } catch (error) {
      this.status = 'error';
      throw error;
    }
  }

  /**
   * Disconnect from the API server.
   */
  disconnect(): void {
    this.status = 'disconnected';
    this.provider = null;
  }

  /**
   * Create a new session.
   */
  async createSession(request: NewSessionRequest): Promise<NewSessionResponse> {
    const response = await this.fetchJson('/api/sessions/create', {
      method: 'POST',
      body: JSON.stringify(request),
    });
    return response as NewSessionResponse;
  }

  /**
   * List all sessions.
   */
  async listSessions(limit = 50): Promise<{ sessions: SessionInfo[]; count: number }> {
    const response = await this.fetchJson(`/api/sessions/list?limit=${limit}`);
    return response as { sessions: SessionInfo[]; count: number };
  }

  /**
   * Resume a session.
   */
  async resumeSession(sessionId: string): Promise<Record<string, unknown>> {
    const response = await this.fetchJson(`/api/sessions/${sessionId}/resume`, {
      method: 'POST',
    });
    return response as Record<string, unknown>;
  }

  /**
   * Delete a session.
   */
  async deleteSession(sessionId: string): Promise<void> {
    await this.fetchJson(`/api/sessions/${sessionId}`, { method: 'DELETE' });
  }

  /**
   * Send a prompt and get a non-streaming response.
   */
  async prompt(
    sessionId: string,
    messages: Message[],
    tools?: ToolDefinition[],
    options?: { max_tokens?: number; temperature?: number },
  ): Promise<{ content: string; usage: TokenUsage }> {
    if (!this.provider) {
      throw new Error('Client not connected');
    }

    return this.provider.chat(messages, tools, options);
  }

  /**
   * Send a prompt and stream the response.
   */
  async *promptStream(
    sessionId: string,
    messages: Message[],
    tools?: ToolDefinition[],
    options?: { max_tokens?: number; temperature?: number },
  ): AsyncGenerator<StreamChunk, void, unknown> {
    if (!this.provider) {
      throw new Error('Client not connected');
    }

    yield* this.provider.chatStream(messages, tools, options);
  }

  /**
   * List available tools.
   */
  async listTools(): Promise<{ tools: ToolDefinition[]; count: number }> {
    const response = await this.fetchJson('/api/tools/list');
    return response as { tools: ToolDefinition[]; count: number };
  }

  /**
   * Execute a tool.
   */
  async executeTool(
    toolName: string,
    params: Record<string, unknown>,
    workspace: string,
    sessionId: string,
  ): Promise<Record<string, unknown>> {
    const response = await this.fetchJson('/api/tools/execute', {
      method: 'POST',
      body: JSON.stringify({
        tool_name: toolName,
        params,
        workspace,
        session_id: sessionId,
        permission_mode: 'allow',
      }),
    });
    return response as Record<string, unknown>;
  }

  /**
   * Send a JSON-RPC request.
   */
  async jsonRpc<T = unknown>(method: string, params?: Record<string, unknown>): Promise<T> {
    this.requestCounter++;
    const request: JsonRpcRequest = {
      jsonrpc: '2.0',
      id: this.requestCounter,
      method,
      params,
    };

    const response = await this.fetchJson('/rpc', {
      method: 'POST',
      body: JSON.stringify(request),
    });

    const jsonRpcResponse = response as JsonRpcResponse<T>;
    if (jsonRpcResponse.error) {
      throw new Error(`JSON-RPC error: ${jsonRpcResponse.error.message}`);
    }

    return jsonRpcResponse.result as T;
  }

  /**
   * Get health status.
   */
  async health(): Promise<Record<string, unknown>> {
    return this.fetchJson('/health') as Promise<Record<string, unknown>>;
  }

  /**
   * Fetch JSON from the API.
   */
  private async fetchJson(path: string, init?: RequestInit): Promise<unknown> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(this.config.apiKey ? { Authorization: `Bearer ${this.config.apiKey}` } : {}),
      ...(init?.headers as Record<string, string> || {}),
    };

    const response = await fetch(`${this.config.baseUrl}${path}`, {
      ...init,
      headers,
      signal: this.config.timeout ? AbortSignal.timeout(this.config.timeout) : undefined,
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      throw new Error(`API error ${response.status}: ${errorText}`);
    }

    return response.json();
  }
}

/**
 * Create a new OpenSIN client from a config.
 */
export function createClient(config: ConnectionConfig): OpenSINClient {
  return new OpenSINClient(config);
}
