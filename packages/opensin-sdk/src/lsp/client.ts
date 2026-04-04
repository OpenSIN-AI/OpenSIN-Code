/**
 * LSP Client — manages connection to language servers.
 */

import { spawn, ChildProcess } from 'child_process';
import { LSPConfig, LanguageServerConfig } from './config.js';
import { LSPMessage, LSPInitializeParams } from './types.js';

export class LSPClient {
  private process: ChildProcess | null = null;
  private messageId = 0;
  private config: LSPConfig;
  private buffer = '';
  private pendingRequests: Map<number | string, {
    resolve: (value: unknown) => void;
    reject: (error: Error) => void;
  }> = new Map();
  private initialized = false;
  private rootUri: string | null = null;

  constructor(config?: LSPConfig) {
    this.config = config || new LSPConfig();
  }

  async initialize(rootUri: string, language: string): Promise<void> {
    this.rootUri = rootUri;
    const serverConfig = this.config.getServer(language);
    if (!serverConfig) {
      throw new Error(`No language server configured for: ${language}`);
    }

    await this.startServer(serverConfig);
    await this.sendInitialize(serverConfig);
    this.initialized = true;
  }

  async sendRequest(method: string, params: Record<string, unknown>): Promise<unknown> {
    if (!this.process) {
      throw new Error('LSP client not initialized');
    }

    const id = ++this.messageId;
    const message: LSPMessage = {
      jsonrpc: '2.0',
      id,
      method,
      params,
    };

    return new Promise((resolve, reject) => {
      this.pendingRequests.set(id, { resolve, reject });
      this.sendMessage(message);
    });
  }

  sendNotification(method: string, params: Record<string, unknown>): void {
    if (!this.process) return;
    const message: LSPMessage = {
      jsonrpc: '2.0',
      method,
      params,
    };
    this.sendMessage(message);
  }

  async shutdown(): Promise<void> {
    if (!this.process) return;
    try {
      await this.sendRequest('shutdown', {});
    } catch {
      // server may not support shutdown request
    }
    this.sendNotification('exit', {});
    this.process.kill();
    this.process = null;
    this.initialized = false;
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  private async startServer(serverConfig: LanguageServerConfig): Promise<void> {
    return new Promise((resolve, reject) => {
      this.process = spawn(serverConfig.command, serverConfig.args, {
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      this.process.on('error', (err) => {
        reject(new Error(`Failed to start language server: ${err.message}`));
      });

      this.process.on('spawn', () => {
        resolve();
      });

      this.process.stdout?.on('data', (chunk: Buffer) => {
        this.buffer += chunk.toString();
        this.processBuffer();
      });

      this.process.stderr?.on('data', () => {
        // Log stderr but don't fail
      });
    });
  }

  private async sendInitialize(serverConfig: LanguageServerConfig): Promise<void> {
    const params: LSPInitializeParams = {
      processId: process.pid,
      clientInfo: {
        name: 'opensin-sdk',
        version: '1.0.0',
      },
      rootUri: this.rootUri,
      capabilities: {
        textDocument: {
          completion: {
            completionItem: {
              snippetSupport: true,
              documentationFormat: ['markdown', 'plaintext'],
            },
            contextSupport: true,
          },
          definition: {
            linkSupport: true,
          },
          documentSymbol: {
            hierarchicalDocumentSymbolSupport: true,
          },
        },
        workspace: {
          workspaceFolders: true,
          configuration: true,
        },
      },
      initializationOptions: serverConfig.initializationOptions,
    };

    await this.sendRequest('initialize', params as unknown as Record<string, unknown>);
    this.sendNotification('initialized', {});
  }

  private sendMessage(message: LSPMessage): void {
    if (!this.process?.stdin) return;
    const content = JSON.stringify(message);
    const header = `Content-Length: ${Buffer.byteLength(content)}\r\n\r\n`;
    this.process.stdin.write(header + content);
  }

  private processBuffer(): void {
    while (true) {
      const contentLengthMatch = this.buffer.match(/Content-Length: (\d+)\r\n\r\n/);
      if (!contentLengthMatch) break;

      const contentLength = parseInt(contentLengthMatch[1] as string as string as string, 10);
      const headerEnd = (contentLengthMatch.index ?? 0) + contentLengthMatch[0].length;

      if (this.buffer.length < headerEnd + contentLength) break;

      const content = this.buffer.substring(headerEnd, headerEnd + contentLength);
      this.buffer = this.buffer.substring(headerEnd + contentLength);

      try {
        const message: LSPMessage = JSON.parse(content);
        this.handleMessage(message);
      } catch {
        // Ignore parse errors
      }
    }
  }

  private handleMessage(message: LSPMessage): void {
    if (message.id !== undefined && this.pendingRequests.has(message.id)) {
      const pending = this.pendingRequests.get(message.id)!;
      this.pendingRequests.delete(message.id);

      if (message.error) {
        pending.reject(new Error(message.error.message));
      } else {
        pending.resolve(message.result);
      }
    }
  }
}
