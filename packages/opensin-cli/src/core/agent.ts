import { Message, ToolCall, ToolResult, Session, Config } from '../core/types.js';
import { ToolRegistry } from '../tools/index.js';
import { generateId, loadConfig } from '../utils/helpers.js';

export class AgentLoop {
  private messages: Message[] = [];
  private config: Config;
  private toolRegistry: ToolRegistry;
  private running = false;
  private onMessage?: (message: Message) => void;
  private onToolCall?: (toolCall: ToolCall) => void;
  private onToolResult?: (result: ToolResult) => void;
  private maxIterations = 50;

  constructor(config: Config, toolRegistry: ToolRegistry) {
    this.config = config;
    this.toolRegistry = toolRegistry;
  }

  setCallbacks(callbacks: {
    onMessage?: (message: Message) => void;
    onToolCall?: (toolCall: ToolCall) => void;
    onToolResult?: (result: ToolResult) => void;
  }) {
    this.onMessage = callbacks.onMessage;
    this.onToolCall = callbacks.onToolCall;
    this.onToolResult = callbacks.onToolResult;
  }

  async start(userInput: string, session?: Session): Promise<Message[]> {
    this.running = true;

    if (session) {
      this.messages = [...session.messages];
    }

    const userMessage: Message = { role: 'user', content: userInput };
    this.messages.push(userMessage);
    this.onMessage?.(userMessage);

    let iterations = 0;

    while (this.running && iterations < this.maxIterations) {
      iterations++;

      const response = await this.callLLM(this.messages);

      if (!response) {
        break;
      }

      this.messages.push(response);
      this.onMessage?.(response);

      if (response.tool_calls && response.tool_calls.length > 0) {
        const results = await this.executeTools(response.tool_calls);

        for (const result of results) {
          this.messages.push({
            role: 'tool',
            tool_call_id: result.tool_call_id,
            content: result.content,
            name: result.metadata?.toolName as string,
          });
          this.onToolResult?.(result);
        }

        continue;
      }

      if (response.content) {
        break;
      }
    }

    this.running = false;
    return this.messages;
  }

  stop() {
    this.running = false;
  }

  getMessages(): Message[] {
    return [...this.messages];
  }

  private async callLLM(messages: Message[]): Promise<Message | null> {
    try {
      const { callLLM } = await import('../utils/llm.js');
      const response = await callLLM(messages, {
        model: this.config.model,
        tools: this.toolRegistry.getToolDescriptions() as any,
      });

      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        role: 'assistant',
        content: `Error calling LLM: ${errorMessage}`,
      };
    }
  }

  private async executeTools(toolCalls: ToolCall[]): Promise<ToolResult[]> {
    const results: ToolResult[] = [];

    const executions = toolCalls.map(async (toolCall) => {
      this.onToolCall?.(toolCall);

      const toolName = toolCall.function.name;
      let toolInput: Record<string, unknown>;

      try {
        toolInput = JSON.parse(toolCall.function.arguments);
      } catch {
        return {
          tool_call_id: toolCall.id,
          content: `Invalid JSON arguments: ${toolCall.function.arguments}`,
          isError: true,
        };
      }

      const tool = this.toolRegistry.getTool(toolName);
      if (!tool) {
        return {
          tool_call_id: toolCall.id,
          content: `Unknown tool: ${toolName}`,
          isError: true,
        };
      }

      try {
        const result = await tool.execute(toolInput);
        return {
          tool_call_id: toolCall.id,
          content: result.output,
          isError: result.isError,
          metadata: { toolName, ...result.metadata },
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
          tool_call_id: toolCall.id,
          content: `Tool execution error: ${errorMessage}`,
          isError: true,
          metadata: { toolName },
        };
      }
    });

    const settled = await Promise.allSettled(executions);

    for (const result of settled) {
      if (result.status === 'fulfilled') {
        results.push(result.value);
      } else {
        results.push({
          tool_call_id: 'unknown',
          content: `Tool execution failed: ${result.reason}`,
          isError: true,
        });
      }
    }

    return results;
  }
}
