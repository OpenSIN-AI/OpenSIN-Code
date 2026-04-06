// src/context.ts
import { PluginPermissions, SessionInfo, Logger, A2AMessage, A2AResponse } from './types.js';

export interface SINCoreAPI {
  memory: {
    get(key: string): Promise<unknown>;
    set(key: string, value: unknown): Promise<void>;
    delete(key: string): Promise<void>;
    list(): Promise<string[]>;
  };

  a2a: {
    send(agent: string, message: A2AMessage): Promise<A2AResponse>;
    broadcast(message: A2AMessage): Promise<void>;
  };

  permission: {
    check(action: string, resource: string): Promise<boolean>;
  };
}

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, {
    type: string;
    required?: boolean;
    description?: string;
    default?: unknown;
    enum?: unknown[];
  }>;
  execute: (params: Record<string, unknown>, ctx: PluginContext) => Promise<{
    content: string;
    error?: string;
    metadata?: Record<string, unknown>;
  }>;
}

export interface HookDefinition {
  event: string;
  handler: (data: unknown, ctx: PluginContext) => Promise<void>;
  priority?: number;
}

export interface ToolRegistry {
  register(tool: ToolDefinition): void;
  unregister(name: string): void;
  get(name: string): ToolDefinition | undefined;
  list(): ToolDefinition[];
}

export interface EventBus {
  on(event: string, handler: (data: unknown, ctx: PluginContext) => Promise<void>): void;
  off(event: string, handler: (data: unknown, ctx: PluginContext) => Promise<void>): void;
  emit(event: string, data: unknown): void;
  getListeners(event: string): ((data: unknown, ctx: PluginContext) => Promise<void>)[];
}

export interface PluginContext {
  config: Record<string, unknown>;
  session: SessionInfo;
  tools: ToolRegistry;
  events: EventBus;
  logger: Logger;
  sin: SINCoreAPI;

  // Utility methods
  getConfig<T = unknown>(key: string, defaultValue?: T): T;
  setConfig(key: string, value: unknown): void;
  hasPermission(action: string, resource: string): Promise<boolean>;
}