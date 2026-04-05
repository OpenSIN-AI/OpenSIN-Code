import type {
  ToolDefinition,
  RegisteredTool,
  ToolHandler,
  ToolResult,
  ToolContext,
} from './types.js';

export class ToolRegistry {
  private tools = new Map<string, RegisteredTool>();

  register(tool: ToolDefinition): RegisteredTool {
    const registered: RegisteredTool = {
      ...tool,
      id: `tool_${tool.name}_${Date.now()}`,
      createdAt: new Date(),
    };
    this.tools.set(tool.name, registered);
    return registered;
  }

  unregister(name: string): boolean {
    return this.tools.delete(name);
  }

  getTool(name: string): ToolDefinition | undefined {
    return this.tools.get(name);
  }

  getAllTools(): ToolDefinition[] {
    return Array.from(this.tools.values()).map(({ id, createdAt, ...tool }) => tool);
  }

  hasTool(name: string): boolean {
    return this.tools.has(name);
  }

  async executeTool(
    name: string,
    input: Record<string, unknown>,
    context: ToolContext
  ): Promise<ToolResult> {
    const tool = this.tools.get(name);
    if (!tool) {
      return {
        success: false,
        content: '',
        error: `Tool not found: ${name}`,
      };
    }

    try {
      const result = await tool.handler(input, context);
      return result;
    } catch (error) {
      return {
        success: false,
        content: '',
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  getToolDescriptions() {
    return Array.from(this.tools.values()).map(({ id, createdAt, handler, ...tool }) => ({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema,
      tags: tool.tags,
    }));
  }
}

export function createTool(
  name: string,
  description: string,
  inputSchema: ToolDefinition['inputSchema'],
  handler: ToolHandler,
  tags?: string[]
): ToolDefinition {
  return {
    name,
    description,
    inputSchema,
    handler,
    tags,
  };
}

export function registerTools(registry: ToolRegistry, tools: ToolDefinition[]): RegisteredTool[] {
  return tools.map((tool) => registry.register(tool));
}
