/**
 * OpenSIN Agent Loop — Tool Registry
 *
 * Registry for available tools with execution dispatch.
 */

import type { ToolDefinition, ToolCall, ToolResult } from '../types.js';
import type { ToolExecutor } from './types.js';

export interface ToolHandler {
  definition: ToolDefinition;
  execute: ToolExecutor;
}

export class ToolRegistry {
  private tools: Map<string, ToolHandler> = new Map();

  /**
   * Register a tool with its handler.
   */
  register(name: string, handler: ToolHandler): void {
    this.tools.set(name, handler);
  }

  /**
   * Unregister a tool.
   */
  unregister(name: string): boolean {
    return this.tools.delete(name);
  }

  /**
   * Get a tool handler by name.
   */
  get(name: string): ToolHandler | undefined {
    return this.tools.get(name);
  }

  /**
   * Get all tool definitions (for sending to LLM).
   */
  getDefinitions(): ToolDefinition[] {
    return Array.from(this.tools.values()).map(h => h.definition);
  }

  /**
   * Get all registered tool names.
   */
  getNames(): string[] {
    return Array.from(this.tools.keys());
  }

  /**
   * Execute a tool call.
   */
  async execute(
    toolCall: ToolCall,
    workspace: string,
    sessionId: string,
  ): Promise<ToolResult> {
    const handler = this.tools.get(toolCall.name);
    if (!handler) {
      return {
        output: `Error: Unknown tool "${toolCall.name}"`,
        is_error: true,
        error_code: 404,
        metadata: { tool_name: toolCall.name },
      };
    }

    try {
      return await handler.execute(toolCall, workspace, sessionId);
    } catch (error) {
      return {
        output: `Error executing tool "${toolCall.name}": ${error instanceof Error ? error.message : String(error)}`,
        is_error: true,
        error_code: 500,
        metadata: { tool_name: toolCall.name },
      };
    }
  }

  /**
   * Check if a tool is registered.
   */
  has(name: string): boolean {
    return this.tools.has(name);
  }

  /**
   * Get the count of registered tools.
   */
  get size(): number {
    return this.tools.size;
  }
}

/**
 * Create a new ToolRegistry instance.
 */
export function createToolRegistry(): ToolRegistry {
  return new ToolRegistry();
}
