import type {
  AgentConfig,
  AgentLifecycleState,
  AgentRunResult,
  ToolCallRecord,
  ToolResult,
} from './types.js';
import { ToolRegistry } from './tools.js';
import { PermissionManager } from './permissions.js';

export class Agent {
  private config: AgentConfig;
  private toolRegistry: ToolRegistry;
  private permissionManager: PermissionManager;
  private lifecycle: AgentLifecycleState;
  private toolCalls: ToolCallRecord[] = [];

  constructor(config: AgentConfig) {
    this.config = config;
    this.toolRegistry = new ToolRegistry();
    this.permissionManager = new PermissionManager(config.permissions || []);
    this.lifecycle = {
      initialized: true,
      running: false,
      error: null,
      startedAt: null,
      stoppedAt: null,
    };

    if (config.tools) {
      for (const tool of config.tools) {
        this.toolRegistry.register(tool);
      }
    }
  }

  getConfig(): AgentConfig {
    return { ...this.config };
  }

  getLifecycle(): AgentLifecycleState {
    return { ...this.lifecycle };
  }

  getToolCalls(): ToolCallRecord[] {
    return [...this.toolCalls];
  }

  getToolRegistry(): ToolRegistry {
    return this.toolRegistry;
  }

  getPermissionManager(): PermissionManager {
    return this.permissionManager;
  }

  async start(): Promise<void> {
    if (this.lifecycle.running) {
      throw new Error('Agent is already running');
    }
    this.lifecycle.running = true;
    this.lifecycle.startedAt = new Date();
    this.lifecycle.error = null;
  }

  async stop(): Promise<void> {
    if (!this.lifecycle.running) {
      throw new Error('Agent is not running');
    }
    this.lifecycle.running = false;
    this.lifecycle.stoppedAt = new Date();
  }

  async executeTool(
    toolName: string,
    input: Record<string, unknown>
  ): Promise<ToolResult> {
    if (!this.lifecycle.running) {
      throw new Error('Agent is not running');
    }

    const tool = this.toolRegistry.getTool(toolName);
    if (!tool) {
      return {
        success: false,
        content: '',
        error: `Tool not found: ${toolName}`,
      };
    }

    const permissionCheck = this.permissionManager.checkPermission({
      resource: toolName,
      action: 'execute',
    });

    if (!permissionCheck.allowed) {
      return {
        success: false,
        content: '',
        error: `Permission denied: ${permissionCheck.reason}`,
      };
    }

    const startedAt = new Date();
    try {
      const result = await tool.handler(input, {
        agentId: this.config.id,
        cwd: process.cwd(),
        permissions: permissionCheck,
      });
      const completedAt = new Date();

      this.toolCalls.push({
        toolId: tool.name,
        toolName: tool.name,
        input,
        result,
        startedAt,
        completedAt,
      });

      return result;
    } catch (error) {
      const completedAt = new Date();
      const errorMessage = error instanceof Error ? error.message : String(error);

      this.toolCalls.push({
        toolId: tool.name,
        toolName: tool.name,
        input,
        result: {
          success: false,
          content: '',
          error: errorMessage,
        },
        startedAt,
        completedAt,
      });

      return {
        success: false,
        content: '',
        error: errorMessage,
      };
    }
  }

  async run(): Promise<AgentRunResult> {
    await this.start();
    const startTime = Date.now();

    try {
      // Agent runs until explicitly stopped
      return {
        success: true,
        output: `Agent ${this.config.name} started successfully`,
        toolCalls: this.toolCalls,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      this.lifecycle.error = error instanceof Error ? error : new Error(String(error));
      return {
        success: false,
        output: '',
        error: this.lifecycle.error.message,
        toolCalls: this.toolCalls,
        duration: Date.now() - startTime,
      };
    } finally {
      await this.stop();
    }
  }
}

export class AgentBuilder {
  private config: Partial<AgentConfig> = {};

  setId(id: string): this {
    this.config.id = id;
    return this;
  }

  setName(name: string): this {
    this.config.name = name;
    return this;
  }

  setDescription(description: string): this {
    this.config.description = description;
    return this;
  }

  setVersion(version: string): this {
    this.config.version = version;
    return this;
  }

  setMaxConcurrentTasks(max: number): this {
    this.config.maxConcurrentTasks = max;
    return this;
  }

  setTimeout(timeout: number): this {
    this.config.timeout = timeout;
    return this;
  }

  build(): Agent {
    if (!this.config.id || !this.config.name) {
      throw new Error('Agent id and name are required');
    }

    return new Agent({
      id: this.config.id,
      name: this.config.name,
      description: this.config.description || '',
      version: this.config.version || '0.1.0',
      permissions: this.config.permissions,
      tools: this.config.tools,
      maxConcurrentTasks: this.config.maxConcurrentTasks,
      timeout: this.config.timeout,
    });
  }
}

export function createAgent(config: AgentConfig): Agent {
  return new Agent(config);
}
