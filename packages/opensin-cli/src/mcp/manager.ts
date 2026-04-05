import { spawn, ChildProcess } from 'node:child_process';
import type { McpServerConfig, ToolDefinition, ToolExecutionResult } from '../core/types.js';

let requestId = 1;

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

    this.process.stderr?.on('data', (data: Buffer) => {
      console.error(`[${this.name}] stderr: ${data.toString().trim()}`);
    });

    this.process.on('exit', (code) => {
      if (code !== 0) {
        console.error(`[${this.name}] exited with code ${code}`);
      }
      this.rejectAll(new Error(`Server exited with code ${code}`));
    });

    await this.initialize();
  }

  async stop(): Promise<void> {
    if (this.process) {
      this.process.kill();
      this.process = null;
    }
    this.rejectAll(new Error('Server stopped'));
  }

  async callTool(toolName: string, args: Record<string, unknown>): Promise<ToolExecutionResult> {
    const result = await this.sendRequest('tools/call', { name: toolName, arguments: args });
    const content = (result as any)?.content || [];
    const text = content
      .filter((c: any) => c.type === 'text')
      .map((c: any) => c.text)
      .join('\n');
    const isError = (result as any)?.isError || false;
    return { output: text, isError };
  }

  async listTools(): Promise<ToolDefinition[]> {
    const result = await this.sendRequest('tools/list', {}) as any;
    const tools = result?.tools || [];
    return tools.map((t: any) => ({
      name: `mcp__${this.name}__${t.name}`,
      description: t.description || '',
      parameters: t.inputSchema || {},
      execute: async (input: Record<string, unknown>) => this.callTool(t.name, input),
    }));
  }

  private async initialize(): Promise<void> {
    if (this.initialized) return;
    await this.sendRequest('initialize', {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: { name: 'sincode', version: '0.1.0' },
    });
    await this.sendRequest('notifications/initialized', {});
    this.initialized = true;
  }

  private sendRequest(method: string, params: Record<string, unknown>): Promise<unknown> {
    return new Promise((resolve, reject) => {
      const id = requestId++;
      const request: JsonRpcRequest = { jsonrpc: '2.0', id, method, params };
      const message = JSON.stringify(request) + '\n';

      const timeout = setTimeout(() => {
        this.pendingRequests.delete(id);
        reject(new Error(`Request ${method} timed out after 30s`));
      }, 30000);

      this.pendingRequests.set(id, { resolve, reject, timeout });

      try {
        this.process?.stdin?.write(message);
      } catch (error) {
        clearTimeout(timeout);
        this.pendingRequests.delete(id);
        reject(error);
      }
    });
  }

  private processBuffer(): void {
    const lines = this.buffer.split('\n');
    this.buffer = lines.pop() || '';

    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const response: JsonRpcResponse = JSON.parse(line);
        if (response.id !== undefined) {
          const pending = this.pendingRequests.get(response.id);
          if (pending) {
            clearTimeout(pending.timeout);
            this.pendingRequests.delete(response.id);
            if (response.error) {
              pending.reject(new Error(response.error.message));
            } else {
              pending.resolve(response.result);
            }
          }
        }
      } catch {
        // skip non-JSON lines
      }
    }
  }

  private rejectAll(error: Error): void {
    for (const [id, pending] of this.pendingRequests) {
      clearTimeout(pending.timeout);
      pending.reject(error);
    }
    this.pendingRequests.clear();
  }
}

export class McpManager {
  private servers = new Map<string, McpServer>();

  async addServer(name: string, config: McpServerConfig): Promise<void> {
    if (this.servers.has(name)) {
      await this.removeServer(name);
    }
    const server = new McpServer(name, config);
    await server.start();
    this.servers.set(name, server);
  }

  async removeServer(name: string): Promise<void> {
    const server = this.servers.get(name);
    if (server) {
      await server.stop();
      this.servers.delete(name);
    }
  }

  async listAllTools(): Promise<ToolDefinition[]> {
    const allTools: ToolDefinition[] = [];
    for (const [name, server] of this.servers) {
      try {
        const tools = await server.listTools();
        allTools.push(...tools);
      } catch (error) {
        console.error(`Failed to list tools from ${name}: ${error}`);
      }
    }
    return allTools;
  }

  async stopAll(): Promise<void> {
    const promises = Array.from(this.servers.values()).map(s => s.stop());
    await Promise.allSettled(promises);
    this.servers.clear();
  }

  getServer(name: string): McpServer | undefined {
    return this.servers.get(name);
  }
}
