import { spawn, ChildProcess } from 'node:child_process';
import type { McpServerConfig, ToolDefinition, ToolExecutionResult } from '../core/types.js';

let requestIdCounter = 0;

interface JsonRpcRequest {
  jsonrpc: '2.0';
  id: number;
  method: string;
  params?: Record<string, unknown>;
}

interface JsonRpcResponse {
  jsonrpc: '2.0';
  id?: number;
  result?: unknown;
  error?: { code: number; message: string; data?: unknown };
}

export class McpServer {
  private process: ChildProcess | null = null;
  private name: string;
  private config: McpServerConfig;
  private initialized = false;
  private buffer = '';
  private pendingRequests = new Map<number, {
    resolve: (value: unknown) => void;
    reject: (error: Error) => void;
    timeout: ReturnType<typeof setTimeout>;
  }>();
  private tools: ToolDefinition[] = [];

  constructor(name: string, config: McpServerConfig) {
    this.name = name;
    this.config = config;
  }

  async start(): Promise<void> {
    this.process = spawn(this.config.command, this.config.args, {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, ...this.config.env },
    });

    this.process.stdout?.on('data', (data: Buffer) => {
      this.buffer += data.toString();
      this.processBuffer();
    });

    this.process.stderr?.on('data', () => {
      // MCP server stderr, ignore
    });

    this.process.on('exit', (code) => {
      if (code !== 0) {
        // server exited unexpectedly
      }
      this.rejectAll(new Error(`Server "${this.name}" exited with code ${code}`));
    });

    await this.initialize();
  }

  async stop(): Promise<void> {
    if (this.process) {
      this.process.kill();
      this.process = null;
    }
    this.rejectAll(new Error('Server stopped'));
    this.initialized = false;
  }

  getTools(): ToolDefinition[] {
    return this.tools;
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  private async initialize(): Promise<void> {
    await this.sendRequest('initialize', {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: { name: 'sincode', version: '0.1.0' },
    });

    await this.sendNotification('notifications/initialized', {});
    this.initialized = true;

    const result = await this.sendRequest('tools/list', {}) as any;
    const toolsList = result?.tools || [];

    this.tools = toolsList.map((tool: any) => ({
      name: `mcp__${this.name}__${tool.name}`,
      description: tool.description || '',
      parameters: tool.inputSchema || {},
      execute: async (input: Record<string, unknown>): Promise<ToolExecutionResult> => {
        try {
          const callResult = await this.sendRequest('tools/call', {
            name: tool.name,
            arguments: input,
          });
          const content = (callResult as any)?.content || [];
          const text = content
            .filter((c: any) => c.type === 'text')
            .map((c: any) => c.text)
            .join('\n');
          return { output: text || JSON.stringify(callResult) };
        } catch (error) {
          return {
            output: `MCP tool call failed: ${error instanceof Error ? error.message : String(error)}`,
            isError: true,
          };
        }
      },
    }));
  }

  private sendRequest(method: string, params: Record<string, unknown>): Promise<unknown> {
    return new Promise((resolve, reject) => {
      const id = ++requestIdCounter;
      const request: JsonRpcRequest = { jsonrpc: '2.0', id, method, params };
      const message = JSON.stringify(request) + '\n';
      const contentLength = Buffer.byteLength(message, 'utf-8');
      const header = `Content-Length: ${contentLength}\r\n\r\n`;

      const timeout = setTimeout(() => {
        this.pendingRequests.delete(id);
        reject(new Error(`Request "${method}" timed out after 30s`));
      }, 30000);

      this.pendingRequests.set(id, { resolve, reject, timeout });

      try {
        this.process?.stdin?.write(header + message);
      } catch (error) {
        clearTimeout(timeout);
        this.pendingRequests.delete(id);
        reject(error);
      }
    });
  }

  private sendNotification(method: string, params: Record<string, unknown>): void {
    const notification: Omit<JsonRpcRequest, 'id'> = { jsonrpc: '2.0', method, params };
    const message = JSON.stringify(notification) + '\n';
    const contentLength = Buffer.byteLength(message, 'utf-8');
    const header = `Content-Length: ${contentLength}\r\n\r\n`;
    this.process?.stdin?.write(header + message);
  }

  private processBuffer(): void {
    while (this.buffer.length > 0) {
      const headerEnd = this.buffer.indexOf('\r\n\r\n');
      if (headerEnd === -1) break;

      const header = this.buffer.slice(0, headerEnd);
      const match = header.match(/Content-Length:\s*(\d+)/i);
      if (!match) {
        this.buffer = this.buffer.slice(headerEnd + 4);
        continue;
      }

      const contentLength = parseInt(match[1], 10);
      const contentStart = headerEnd + 4;

      if (this.buffer.length < contentStart + contentLength) break;

      const content = this.buffer.slice(contentStart, contentStart + contentLength);
      this.buffer = this.buffer.slice(contentStart + contentLength);

      try {
        const response: JsonRpcResponse = JSON.parse(content);
        if (response.id !== undefined && this.pendingRequests.has(response.id)) {
          const pending = this.pendingRequests.get(response.id)!;
          clearTimeout(pending.timeout);
          this.pendingRequests.delete(response.id);
          if (response.error) {
            pending.reject(new Error(response.error.message));
          } else {
            pending.resolve(response.result);
          }
        }
      } catch {
        // skip non-JSON
      }
    }
  }

  private rejectAll(error: Error): void {
    for (const [, pending] of this.pendingRequests) {
      clearTimeout(pending.timeout);
      pending.reject(error);
    }
    this.pendingRequests.clear();
  }
}

export class McpManager {
  private servers = new Map<string, McpServer>();

  async registerServer(name: string, config: McpServerConfig): Promise<void> {
    const existing = this.servers.get(name);
    if (existing) {
      await existing.stop();
      this.servers.delete(name);
    }
    const server = new McpServer(name, config);
    await server.start();
    this.servers.set(name, server);
  }

  async unregisterServer(name: string): Promise<void> {
    const server = this.servers.get(name);
    if (server) {
      await server.stop();
      this.servers.delete(name);
    }
  }

  getAllTools(): ToolDefinition[] {
    const tools: ToolDefinition[] = [];
    for (const server of this.servers.values()) {
      if (server.isInitialized()) {
        tools.push(...server.getTools());
      }
    }
    return tools;
  }

  async shutdown(): Promise<void> {
    for (const [, server] of this.servers) {
      await server.stop();
    }
    this.servers.clear();
  }
}
