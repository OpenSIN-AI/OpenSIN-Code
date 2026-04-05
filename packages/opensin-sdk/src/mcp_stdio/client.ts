/**
 * MCP Stdio Client — JSON-RPC 2.0 over stdin/stdout
 * 
 * Handles bidirectional communication with MCP servers via child process stdio.
 * OpenSIN-Code Phase 2.3
 */

import { spawn, ChildProcess } from 'child_process';
import {
  JsonRpcRequest,
  JsonRpcResponse,
  JsonRpcNotification,
  McpServerConfig,
} from './types';

/** Pending RPC request with resolve/reject callbacks */
interface PendingRequest {
  resolve: (value: unknown) => void;
  reject: (error: Error) => void;
  timeout: NodeJS.Timeout;
}

/**
 * MCP Client that communicates with a server process over stdio.
 * Implements JSON-RPC 2.0 protocol.
 */
export class McpStdioClient {
  private process: ChildProcess | null = null;
  private pendingRequests = new Map<number | string, PendingRequest>();
  private requestId = 0;
  private buffer = '';
  private config: McpServerConfig;
  private onNotification?: (notification: JsonRpcNotification) => void;
  private onError?: (error: Error) => void;

  constructor(config: McpServerConfig) {
    this.config = config;
  }

  /** Set notification handler */
  setNotificationHandler(handler: (notification: JsonRpcNotification) => void): void {
    this.onNotification = handler;
  }

  /** Set error handler */
  setErrorHandler(handler: (error: Error) => void): void {
    this.onError = handler;
  }

  /** Start the MCP server process */
  async start(): Promise<void> {
    return new Promise((resolve, reject) => {
      const env = { ...process.env, ...this.config.env };

      this.process = spawn(this.config.command, this.config.args, {
        stdio: ['pipe', 'pipe', 'pipe'],
        env,
        cwd: this.config.cwd,
      });

      // Setup stdout handler
      this.process.stdout?.on('data', (data: Buffer) => {
        this.handleStdout(data.toString());
      });

      // Setup stderr handler
      this.process.stderr?.on('data', (data: Buffer) => {
        const error = new Error(`MCP server stderr: ${data.toString()}`);
        this.onError?.(error);
      });

      // Setup process exit handler
      this.process.on('exit', (code, signal) => {
        this.handleExit(code, signal);
      });

      this.process.on('error', (error) => {
        reject(new Error(`Failed to start MCP server: ${error.message}`));
      });

      // Resolve after short delay to ensure process started
      setTimeout(() => {
        if (this.process && !this.process.killed) {
          resolve();
        } else {
          reject(new Error('MCP server process failed to start'));
        }
      }, 500);
    });
  }

  /** Send a JSON-RPC request and wait for response */
  async request(method: string, params?: Record<string, unknown>): Promise<unknown> {
    if (!this.process || this.process.killed) {
      throw new Error('MCP server is not running');
    }

    const id = ++this.requestId;
    const timeout = this.config.timeout ?? 30000;

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pendingRequests.delete(id);
        reject(new Error(`MCP request timeout: ${method} (${timeout}ms)`));
      }, timeout);

      this.pendingRequests.set(id, { resolve, reject, timeout: timer });

      const request: JsonRpcRequest = {
        jsonrpc: '2.0',
        method,
        params,
        id,
      };

      this.writeMessage(request);
    });
  }

  /** Send a JSON-RPC notification (no response expected) */
  notify(method: string, params?: Record<string, unknown>): void {
    if (!this.process || this.process.killed) {
      throw new Error('MCP server is not running');
    }

    const notification: JsonRpcNotification = {
      jsonrpc: '2.0',
      method,
      params,
    };

    this.writeMessage(notification);
  }

  /** Stop the MCP server process */
  async stop(): Promise<void> {
    // Clear all pending requests
    this.pendingRequests.forEach((pending, id) => {
      clearTimeout(pending.timeout);
      pending.reject(new Error('Server shutting down'));
      this.pendingRequests.delete(id);
    });

    if (this.process && !this.process.killed) {
      // Send shutdown notification
      this.notify('notifications/stdio/shutdown');

      // Give server time to shutdown gracefully
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Force kill if still running
      if (this.process && !this.process.killed) {
        this.process.kill('SIGTERM');
        await new Promise((resolve) => setTimeout(resolve, 1000));

        if (this.process && !this.process.killed) {
          this.process.kill('SIGKILL');
        }
      }
    }

    this.process = null;
    this.buffer = '';
  }

  /** Check if the server is running */
  isRunning(): boolean {
    return this.process !== null && !this.process.killed;
  }

  /** Get the server process PID */
  getPid(): number | undefined {
    return this.process?.pid;
  }

  /** Handle incoming data from stdout */
  private handleStdout(data: string): void {
    this.buffer += data;

    // Process complete lines (JSON-RPC messages are newline-delimited)
    let newlineIndex: number;
    while ((newlineIndex = this.buffer.indexOf('\n')) !== -1) {
      const line = this.buffer.substring(0, newlineIndex).trim();
      this.buffer = this.buffer.substring(newlineIndex + 1);

      if (!line) continue;

      try {
        const message = JSON.parse(line);
        this.handleMessage(message);
      } catch (error) {
        this.onError?.(new Error(`Failed to parse MCP message: ${error instanceof Error ? error.message : String(error)}`));
      }
    }
  }

  /** Handle a parsed JSON-RPC message */
  private handleMessage(message: JsonRpcResponse | JsonRpcNotification): void {
    // Check if it's a response (has id)
    if ('id' in message && message.id !== null) {
      const pending = this.pendingRequests.get(message.id);
      if (pending) {
        clearTimeout(pending.timeout);
        this.pendingRequests.delete(message.id);

        if ('error' in message && message.error) {
          pending.reject(new Error(`MCP error: ${message.error.message} (code: ${message.error.code})`));
        } else {
          pending.resolve(message.result);
        }
      }
    } else if ('method' in message) {
      // It's a notification
      this.onNotification?.(message as JsonRpcNotification);
    }
  }

  /** Write a JSON-RPC message to stdin */
  private writeMessage(message: JsonRpcRequest | JsonRpcNotification): void {
    if (!this.process || !this.process.stdin) {
      throw new Error('Cannot write to MCP server: no stdin');
    }

    const json = JSON.stringify(message);
    this.process.stdin.write(json + '\n');
  }

  /** Handle server process exit */
  private handleExit(code: number | null, signal: NodeJS.Signals | null): void {
    // Reject all pending requests
    this.pendingRequests.forEach((pending, id) => {
      clearTimeout(pending.timeout);
      pending.reject(new Error(`MCP server exited with code ${code}, signal ${signal}`));
      this.pendingRequests.delete(id);
    });

    this.process = null;
    this.buffer = '';
  }
}
