import {
  ToolDefinition,
  RegisteredTool,
  ToolContext,
  ToolResult,
  ToolInputSchema,
} from "./types.js";

export class ToolRegistry {
  private tools: Map<string, RegisteredTool> = new Map();
  private toolCounter = 0;

  register(definition: ToolDefinition): RegisteredTool {
    this.validate(definition);

    const id = `tool-${++this.toolCounter}`;
    const registered: RegisteredTool = {
      ...definition,
      id,
      createdAt: new Date(),
    };

    this.tools.set(definition.name, registered);
    return registered;
  }

  unregister(name: string): boolean {
    return this.tools.delete(name);
  }

  get(name: string): RegisteredTool | undefined {
    return this.tools.get(name);
  }

  list(): RegisteredTool[] {
    return Array.from(this.tools.values());
  }

  listByTag(tag: string): RegisteredTool[] {
    return this.list().filter((tool) => tool.tags?.includes(tag));
  }

  async execute(
    name: string,
    input: Record<string, unknown>,
    context: ToolContext,
  ): Promise<ToolResult> {
    const tool = this.tools.get(name);
    if (!tool) {
      return {
        success: false,
        content: "",
        error: `Tool "${name}" not found`,
      };
    }

    const validation = this.validateInput(tool.inputSchema, input);
    if (!validation.valid) {
      return {
        success: false,
        content: "",
        error: validation.error,
      };
    }

    try {
      const result = await tool.handler(input, context);
      return result;
    } catch (error) {
      return {
        success: false,
        content: "",
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  has(name: string): boolean {
    return this.tools.has(name);
  }

  clear(): void {
    this.tools.clear();
  }

  private validate(definition: ToolDefinition): void {
    if (!definition.name || definition.name.trim().length === 0) {
      throw new Error("Tool name is required");
    }

    if (!/^[a-zA-Z][a-zA-Z0-9_-]*$/.test(definition.name)) {
      throw new Error(
        `Invalid tool name "${definition.name}". Must start with a letter and contain only alphanumeric characters, hyphens, and underscores`,
      );
    }

    if (!definition.description || definition.description.trim().length === 0) {
      throw new Error(`Tool "${definition.name}" requires a description`);
    }

    if (!definition.inputSchema) {
      throw new Error(`Tool "${definition.name}" requires an inputSchema`);
    }

    if (definition.inputSchema.type !== "object") {
      throw new Error(`Tool "${definition.name}" inputSchema must be of type "object"`);
    }

    if (this.tools.has(definition.name)) {
      throw new Error(`Tool "${definition.name}" is already registered`);
    }

    if (!definition.handler || typeof definition.handler !== "function") {
      throw new Error(`Tool "${definition.name}" requires a handler function`);
    }
  }

  private validateInput(
    schema: ToolInputSchema,
    input: Record<string, unknown>,
  ): { valid: boolean; error?: string } {
    const properties = schema.properties;
    const required = schema.required ?? [];

    for (const field of required) {
      if (!(field in input)) {
        return { valid: false, error: `Missing required field: ${field}` };
      }
    }

    for (const [key, value] of Object.entries(input)) {
      const propSchema = properties[key];
      if (!propSchema) {
        return { valid: false, error: `Unknown field: ${key}` };
      }

      if (value !== null && value !== undefined) {
        const actualType = typeof value;
        if (actualType !== propSchema.type && !(propSchema.type === "number" && actualType === "number")) {
          return {
            valid: false,
            error: `Field "${key}" expected type "${propSchema.type}", got "${actualType}"`,
          };
        }
      }
    }

    return { valid: true };
  }
}
