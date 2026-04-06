// src/test/index.ts
import { PluginContext, ToolRegistry, EventBus, SINCoreAPI } from '../context.js';
import { SessionInfo, Logger } from '../types.js';

// Mock implementations
class MockToolRegistry implements ToolRegistry {
  private tools = new Map<string, any>();

  register(tool: any): void {
    this.tools.set(tool.name, tool);
  }

  unregister(name: string): void {
    this.tools.delete(name);
  }

  get(name: string): any {
    return this.tools.get(name);
  }

  list(): any[] {
    return Array.from(this.tools.values());
  }
}

class MockEventBus implements EventBus {
  private listenersMap = new Map<string, Function[]>();

  on(event: string, handler: Function): void {
    if (!this.listenersMap.has(event)) {
      this.listenersMap.set(event, []);
    }
    this.listenersMap.get(event)!.push(handler);
  }

  off(event: string, handler: Function): void {
    const eventListeners = this.listenersMap.get(event);
    if (eventListeners) {
      const index = eventListeners.indexOf(handler);
      if (index > -1) {
        eventListeners.splice(index, 1);
      }
    }
  }

  emit(event: string, data: unknown): void {
    const eventListeners = this.listenersMap.get(event);
    if (eventListeners) {
      for (const listener of eventListeners) {
        listener(data);
      }
    }
  }

  getListeners(event: string): ((data: unknown, ctx: PluginContext) => Promise<void>)[] {
    return (this.listenersMap.get(event) || []) as ((data: unknown, ctx: PluginContext) => Promise<void>)[];
  }
}

class MockLogger implements Logger {
  debug(message: string, ...args: unknown[]): void {
    console.debug(`[DEBUG] ${message}`, ...args);
  }

  info(message: string, ...args: unknown[]): void {
    console.info(`[INFO] ${message}`, ...args);
  }

  warn(message: string, ...args: unknown[]): void {
    console.warn(`[WARN] ${message}`, ...args);
  }

  error(message: string, ...args: unknown[]): void {
    console.error(`[ERROR] ${message}`, ...args);
  }
}

class MockSINCoreAPI implements SINCoreAPI {
  private memoryStore = new Map<string, unknown>();

  memory = {
    get: async (key: string) => this.memoryStore.get(key),
    set: async (key: string, value: unknown) => {
      this.memoryStore.set(key, value);
    },
    delete: async (key: string) => {
      this.memoryStore.delete(key);
    },
    list: async () => Array.from(this.memoryStore.keys()),
  };

  a2a = {
    send: async (agent: string, message: any) => ({
      success: true,
      data: { agent, message },
      correlationId: 'mock-correlation-id',
    }),
    broadcast: async (message: any) => {
      console.log('Broadcasting message:', message);
    },
  };

  permission = {
    check: async (action: string, resource: string) => true, // Always allow in tests
  };
}

/** Create a mock plugin context for testing */
export function mockContext(overrides: Partial<PluginContext> = {}): PluginContext {
  const defaultSession: SessionInfo = {
    id: 'test-session',
    agent: 'test-agent',
    model: 'gpt-4',
    messages: [],
    startTime: new Date(),
  };

  const defaultContext: PluginContext = {
    config: {},
    session: defaultSession,
    tools: new MockToolRegistry(),
    events: new MockEventBus(),
    logger: new MockLogger(),
    sin: new MockSINCoreAPI() as any,

    getConfig<T>(key: string, defaultValue?: T): T {
      return (this.config[key] as T) || defaultValue as T;
    },

    setConfig(key: string, value: unknown): void {
      this.config[key] = value;
    },

    hasPermission: async (action: string, resource: string) => true,
  };

  return { ...defaultContext, ...overrides };
}

/** Test runner for plugins */
export async function testPlugin(
  plugin: any,
  contextOverrides: Partial<PluginContext> = {}
): Promise<{
  success: boolean;
  errors: string[];
  warnings: string[];
}> {
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    const ctx = mockContext(contextOverrides);

    // Test init
    if (plugin.init) {
      await plugin.init(ctx);
    }

    // Test activate
    if (plugin.activate) {
      await plugin.activate(ctx);
    }

    // Test validateConfig if config provided
    if (plugin.validateConfig && contextOverrides.config) {
      const result = plugin.validateConfig(contextOverrides.config);
      if (!result.valid) {
        errors.push(...(result.errors || []));
      }
      if (result.warnings) {
        warnings.push(...result.warnings);
      }
    }

    // Test deactivate
    if (plugin.deactivate) {
      await plugin.deactivate(ctx);
    }

    // Test destroy
    if (plugin.destroy) {
      await plugin.destroy(ctx);
    }

  } catch (error) {
    errors.push(`Plugin test failed: ${error instanceof Error ? error.message : String(error)}`);
  }

  return {
    success: errors.length === 0,
    errors,
    warnings,
  };
}