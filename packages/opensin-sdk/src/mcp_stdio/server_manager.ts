/**
 * MCP Server Manager — Lifecycle management with auto-restart
 * 
 * Manages MCP server processes: start, stop, health checks, auto-restart on crash.
 * OpenSIN-Code Phase 2.3
 */

import { McpServerConfig, McpServerStatus, McpServerHealth } from './types';
import { McpStdioClient } from './client';

export interface ServerManagerOptions {
  /** Max restart attempts before giving up */
  maxRestarts?: number;
  /** Delay between restart attempts in ms */
  restartDelay?: number;
  /** Health check interval in ms */
  healthCheckInterval?: number;
}

const DEFAULT_OPTIONS: Required<ServerManagerOptions> = {
  maxRestarts: 3,
  restartDelay: 2000,
  healthCheckInterval: 30000,
};

export class McpServerManager {
  private config: McpServerConfig;
  private options: Required<ServerManagerOptions>;
  private client: McpStdioClient | null = null;
  private status: McpServerStatus = 'stopped';
  private restartCount = 0;
  private lastError?: string;
  private healthTimer?: NodeJS.Timeout;
  private onStatusChange?: (status: McpServerStatus, health: McpServerHealth) => void;

  constructor(config: McpServerConfig, options?: ServerManagerOptions) {
    this.config = config;
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  async start(): Promise<McpStdioClient> {
    if (this.status === 'running') {
      return this.client!;
    }

    this.status = 'starting';
    this.emitStatusChange();

    this.client = new McpStdioClient(this.config);

    this.client.setErrorHandler((error) => {
      this.lastError = error.message;
      this.status = 'error';
      this.emitStatusChange();
    });

    await this.client.start();
    await this.initialize();

    this.status = 'running';
    this.restartCount = 0;
    this.lastError = undefined;
    this.emitStatusChange();
    this.startHealthCheck();

    return this.client;
  }

  async stop(): Promise<void> {
    this.stopHealthCheck();

    if (this.client) {
      await this.client.stop();
      this.client = null;
    }

    this.status = 'stopped';
    this.emitStatusChange();
  }

  async restart(): Promise<McpStdioClient> {
    if (this.restartCount >= this.options.maxRestarts) {
      throw new Error(
        `MCP server '${this.config.name}' exceeded max restarts (${this.options.maxRestarts})`
      );
    }

    this.status = 'restarting';
    this.restartCount++;
    this.emitStatusChange();

    if (this.client) {
      try {
        await this.client.stop();
      } catch {
        // Ignore stop errors during restart
      }
    }

    await new Promise((resolve) => setTimeout(resolve, this.options.restartDelay));

    this.client = new McpStdioClient(this.config);
    this.client.setErrorHandler((error) => {
      this.lastError = error.message;
      this.status = 'error';
      this.emitStatusChange();
    });

    await this.client.start();
    await this.initialize();

    this.status = 'running';
    this.lastError = undefined;
    this.emitStatusChange();
    this.startHealthCheck();

    return this.client;
  }

  getHealth(): McpServerHealth {
    return {
      status: this.status,
      pid: this.client?.getPid(),
      lastError: this.lastError,
      restartCount: this.restartCount,
    };
  }

  getClient(): McpStdioClient | null {
    return this.client;
  }

  setStatusChangeHandler(handler: (status: McpServerStatus, health: McpServerHealth) => void): void {
    this.onStatusChange = handler;
  }

  private async initialize(): Promise<void> {
    if (!this.client) return;

    await this.client.request('initialize', {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: {
        name: 'opensin-code',
        version: '0.1.0',
      },
    });

    this.client.notify('notifications/initialized');
  }

  private startHealthCheck(): void {
    this.stopHealthCheck();
    this.healthTimer = setInterval(() => {
      this.performHealthCheck();
    }, this.options.healthCheckInterval);
  }

  private stopHealthCheck(): void {
    if (this.healthTimer) {
      clearInterval(this.healthTimer);
      this.healthTimer = undefined;
    }
  }

  private async performHealthCheck(): Promise<void> {
    if (this.status !== 'running') return;

    if (!this.client || !this.client.isRunning()) {
      this.lastError = 'Server process not running';
      this.status = 'error';
      this.emitStatusChange();

      try {
        await this.restart();
      } catch (error) {
        this.lastError = `Auto-restart failed: ${error instanceof Error ? error.message : String(error)}`;
        this.status = 'error';
        this.emitStatusChange();
      }
    }
  }

  private emitStatusChange(): void {
    this.onStatusChange?.(this.status, this.getHealth());
  }
}
