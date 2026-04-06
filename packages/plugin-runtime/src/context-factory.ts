import { PluginContext, ToolRegistry, EventBus, Logger, SINCoreAPI, SessionInfo } from '@opensin/plugin-sdk';

export interface ContextOptions {
  config?: Record<string, unknown>;
  session?: SessionInfo;
  tools?: ToolRegistry;
  events?: EventBus;
  logger?: Logger;
  sin?: SINCoreAPI;
}

export function createPluginContext(options: ContextOptions = {}): PluginContext {
  const config = options.config || {};

  return {
    config,
    session: options.session || {
      id: 'unknown',
      agent: 'default',
      model: 'unknown',
      messages: [],
      startTime: new Date(),
    },
    tools: options.tools || createDefaultToolRegistry(),
    events: options.events || createDefaultEventBus(),
    logger: options.logger || createDefaultLogger(),
    sin: options.sin || createDefaultSINCore(),

    getConfig<T = unknown>(key: string, defaultValue?: T): T {
      return (config[key] as T) ?? (defaultValue as T);
    },

    setConfig(key: string, value: unknown): void {
      config[key] = value;
    },

    hasPermission: async (action: string, resource: string): Promise<boolean> => {
      return true;
    },
  };
}

function createDefaultToolRegistry(): ToolRegistry {
  const tools = new Map<string, any>();
  return {
    register(tool: any) { tools.set(tool.name, tool); },
    unregister(name: string) { tools.delete(name); },
    get(name: string) { return tools.get(name); },
    list() { return Array.from(tools.values()); },
  };
}

function createDefaultEventBus(): EventBus {
  const listeners = new Map<string, Function[]>();
  return {
    on(event: string, handler: Function) {
      if (!listeners.has(event)) listeners.set(event, []);
      listeners.get(event)!.push(handler);
    },
    off(event: string, handler: Function) {
      const h = listeners.get(event);
      if (h) { const i = h.indexOf(handler); if (i > -1) h.splice(i, 1); }
    },
    emit(event: string, data: unknown) {
      const h = listeners.get(event);
      if (h) h.forEach(fn => fn(data));
    },
    getListeners(event: string) {
      return (listeners.get(event) || []) as any;
    },
  };
}

function createDefaultLogger(): Logger {
  return {
    debug: (m: string, ...a: unknown[]) => console.debug(`[plugin] ${m}`, ...a),
    info: (m: string, ...a: unknown[]) => console.info(`[plugin] ${m}`, ...a),
    warn: (m: string, ...a: unknown[]) => console.warn(`[plugin] ${m}`, ...a),
    error: (m: string, ...a: unknown[]) => console.error(`[plugin] ${m}`, ...a),
  };
}

function createDefaultSINCore(): SINCoreAPI {
  const memoryStore = new Map<string, unknown>();
  return {
    memory: {
      get: async (k: string) => memoryStore.get(k),
      set: async (k: string, v: unknown) => { memoryStore.set(k, v); },
      delete: async (k: string) => { memoryStore.delete(k); },
      list: async () => Array.from(memoryStore.keys()),
    },
    a2a: {
      send: async (agent: string, message: any) => ({
        success: true, data: { agent, message }, correlationId: 'mock',
      }),
      broadcast: async (message: any) => { console.log('[a2a] broadcast:', message); },
    },
    permission: {
      check: async (_action: string, _resource: string) => true,
    },
  };
}
