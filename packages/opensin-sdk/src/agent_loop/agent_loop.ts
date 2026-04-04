/**
 * OpenSIN Agent Loop — Core Agent Loop
 *
 * The heart of the OpenSIN CLI: Query input → API call → Tool execution → Response loop.
 *
 * Features:
 * - NDJSON streaming output
 * - Exponential backoff retry on transient errors
 * - Tool result processing and re-injection
 * - Context window management with auto-compression
 * - Continuous loop until final response (no tool calls remaining)
 */

import { randomUUID } from 'crypto';
import type {
  Message,
  ToolCall,
  ToolResult,
  ToolDefinition,
  TokenUsage,
  StreamChunk,
} from '../types.js';
import {
  AgentLoopConfig,
  DEFAULT_AGENT_LOOP_CONFIG,
  AgentLoopResult,
  TurnState,
  LLMCaller,
  LLMResponse,
  ToolExecutor,
  AgentEventType,
} from './types.js';
import { emitNDJSON, makeEvent } from './ndjson.js';
import { ToolRegistry } from './tool_registry.js';
import { AgentLoopContext } from './context.js';

/**
 * Check if an error is transient (retryable).
 */
function isTransientError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  const transientPatterns = [
    /rate.?limit/i,
    /too many requests/i,
    /429/i,
    /503/i,
    /502/i,
    /504/i,
    /timeout/i,
    /network/i,
    /ECONNREFUSED/i,
    /ECONNRESET/i,
    /ETIMEDOUT/i,
    /service unavailable/i,
    /overloaded/i,
  ];
  return transientPatterns.some(pattern => pattern.test(message));
}

/**
 * Calculate exponential backoff delay.
 */
function calculateBackoff(attempt: number, baseDelayMs: number, maxDelayMs: number): number {
  const delay = baseDelayMs * Math.pow(2, attempt);
  // Add jitter (±25%)
  const jitter = delay * 0.25 * (Math.random() * 2 - 1);
  return Math.min(delay + jitter, maxDelayMs);
}

/**
 * Sleep for a given number of milliseconds.
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Build the default tool definitions for the agent loop.
 */
function buildDefaultToolDefinitions(registry: ToolRegistry): ToolDefinition[] {
  return registry.getDefinitions();
}

/**
 * The core OpenSIN Agent Loop.
 *
 * Manages the continuous cycle of:
 * 1. Send messages to LLM
 * 2. Parse response (text + tool calls)
 * 3. Execute tool calls
 * 4. Feed results back to LLM
 * 5. Repeat until no more tool calls
 */
export class AgentLoop {
  private config: AgentLoopConfig;
  private llmCaller: LLMCaller;
  private toolRegistry: ToolRegistry;
  private context: AgentLoopContext | null = null;
  private currentTurn: TurnState | null = null;
  private running = false;
  private cancelled = false;

  constructor(
    llmCaller: LLMCaller,
    toolRegistry: ToolRegistry,
    config?: Partial<AgentLoopConfig>,
  ) {
    this.llmCaller = llmCaller;
    this.toolRegistry = toolRegistry;
    this.config = { ...DEFAULT_AGENT_LOOP_CONFIG, ...config };
  }

  /**
   * Initialize the agent loop for a session.
   */
  init(sessionId: string): void {
    this.context = new AgentLoopContext(sessionId, this.config);
    this.running = false;
    this.cancelled = false;
  }

  /**
   * Add a system message to the context.
   */
  setSystemMessage(content: string): void {
    if (!this.context) {
      throw new Error('Agent loop not initialized. Call init() first.');
    }
    this.context.addSystemMessage(content);
  }

  /**
   * Process a user query through the full agent loop.
   *
   * This is the main entry point. It:
   * 1. Adds the user message to context
   * 2. Calls the LLM
   * 3. Executes any tool calls
   * 4. Repeats until the LLM produces a final text response
   * 5. Streams NDJSON events throughout
   */
  async processTurn(
    userMessage: string,
    sessionId: string,
  ): Promise<AgentLoopResult> {
    if (!this.context) {
      throw new Error('Agent loop not initialized. Call init() first.');
    }

    const turnId = randomUUID();
    this.currentTurn = {
      turnId,
      messages: this.context.getMessages(),
      toolCalls: [],
      toolResults: [],
      iterationCount: 0,
      retryCount: 0,
      totalTokens: 0,
      startTime: Date.now(),
      status: 'running',
    };

    this.running = true;
    this.cancelled = false;

    // Emit session start event
    this.emit('session_start', { sessionId, turnId });
    this.emit('status', { status: 'starting', turnId });

    // Add user message to context
    const userMsg: Message = { role: 'user', content: userMessage };
    this.context.addMessage(userMsg);

    // Emit thinking event
    this.emit('thinking', { message: userMessage, turnId });

    let finalContent = '';
    let toolCallsExecuted = 0;
    let totalUsage: TokenUsage = { input_tokens: 0, output_tokens: 0, total_tokens: 0 };

    try {
      // Main loop: keep going while LLM returns tool calls
      while (this.currentTurn.iterationCount < this.config.maxToolIterations) {
        if (this.cancelled) {
          this.currentTurn.status = 'cancelled';
          break;
        }

        this.currentTurn.iterationCount++;
        this.emit('status', {
          status: 'iterating',
          iteration: this.currentTurn.iterationCount,
          turnId,
        });

        // Call LLM with retry
        let llmResponse: LLMResponse;
        try {
          llmResponse = await this.callLLMWithRetry(
            this.context.getMessages(),
            buildDefaultToolDefinitions(this.toolRegistry),
            turnId,
          );
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : String(error);
          this.emit('error', { message: errorMsg, turnId, fatal: true });
          this.currentTurn.status = 'error';
          this.currentTurn.error = errorMsg;
          return this.buildResult(turnId, finalContent, toolCallsExecuted, totalUsage, errorMsg);
        }

        // Accumulate usage
        totalUsage.input_tokens += llmResponse.usage.input_tokens;
        totalUsage.output_tokens += llmResponse.usage.output_tokens;
        totalUsage.total_tokens += llmResponse.usage.total_tokens;
        this.currentTurn.totalTokens = totalUsage.total_tokens;

        // Handle the LLM response
        if (llmResponse.content) {
          finalContent = llmResponse.content;
          this.emit('text_delta', { content: llmResponse.content, turnId });

          // Add assistant response to context
          const assistantMsg: Message = { role: 'assistant', content: llmResponse.content };
          this.context.addMessage(assistantMsg);
        }

        // Check if there are tool calls to execute
        if (llmResponse.toolCalls.length === 0) {
          // No more tool calls — we're done
          this.emit('status', { status: 'complete', turnId });
          break;
        }

        // Execute tool calls
        for (const toolCall of llmResponse.toolCalls) {
          if (this.cancelled) break;

          this.emit('tool_call_start', {
            tool_name: toolCall.name,
            tool_id: toolCall.id,
            input: toolCall.input,
            turnId,
          });

          // Execute the tool
          const toolResult = await this.executeToolWithRetry(
            toolCall,
            this.config.workspace,
            sessionId,
            turnId,
          );

          this.currentTurn.toolCalls.push(toolCall);
          this.currentTurn.toolResults.push(toolResult);
          toolCallsExecuted++;

          this.emit('tool_call_end', {
            tool_name: toolCall.name,
            tool_id: toolCall.id,
            is_error: toolResult.is_error,
            turnId,
          });

          this.emit('tool_result', {
            tool_name: toolCall.name,
            tool_id: toolCall.id,
            output: toolResult.output,
            is_error: toolResult.is_error,
            turnId,
          });

          // Add tool result to context
          const toolMsg: Message = {
            role: 'tool',
            content: toolResult.output,
            tool_call_id: toolCall.id,
          } as Message;
          this.context.addMessage(toolMsg);
        }

        // Check context window and compress if needed
        if (this.context.needsCompression()) {
          const saved = this.context.compress();
          this.emit('context_compressed', {
            tokens_saved: saved,
            remaining: this.context.getTotalTokens(),
            turnId,
          });
        }
      }

      // Check if we hit max iterations
      if (this.currentTurn.iterationCount >= this.config.maxToolIterations) {
        this.emit('error', {
          message: `Max tool iterations reached (${this.config.maxToolIterations})`,
          turnId,
          fatal: false,
        });
      }

      this.currentTurn.status = this.currentTurn.status === 'running' ? 'completed' : this.currentTurn.status;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.emit('error', { message: errorMsg, turnId, fatal: true });
      this.currentTurn.status = 'error';
      this.currentTurn.error = errorMsg;
    }

    this.running = false;

    // Emit turn complete
    this.emit('turn_complete', {
      turnId,
      finalContent,
      toolCallsExecuted,
      iterations: this.currentTurn.iterationCount,
      totalTokens: totalUsage,
      durationMs: Date.now() - this.currentTurn.startTime,
    });

    this.emit('session_end', { sessionId, turnId });

    return this.buildResult(
      turnId,
      finalContent,
      toolCallsExecuted,
      totalUsage,
      this.currentTurn.error,
    );
  }

  /**
   * Call the LLM with exponential backoff retry.
   */
  private async callLLMWithRetry(
    messages: Message[],
    tools: ToolDefinition[],
    turnId: string,
  ): Promise<LLMResponse> {
    let lastError: unknown;

    for (let attempt = 0; attempt <= this.config.maxRetries; attempt++) {
      if (this.cancelled) {
        throw new Error('Agent loop cancelled');
      }

      try {
        return await this.llmCaller(messages, tools);
      } catch (error) {
        lastError = error;

        if (!isTransientError(error) || attempt >= this.config.maxRetries) {
          throw error;
        }

        const delay = calculateBackoff(
          attempt,
          this.config.retryBaseDelayMs,
          this.config.retryMaxDelayMs,
        );

        this.currentTurn!.retryCount++;
        this.emit('retry', {
          attempt: attempt + 1,
          maxRetries: this.config.maxRetries,
          delayMs: Math.round(delay),
          error: error instanceof Error ? error.message : String(error),
          turnId,
        });

        await sleep(delay);
      }
    }

    throw lastError;
  }

  /**
   * Execute a tool call with retry logic.
   */
  private async executeToolWithRetry(
    toolCall: ToolCall,
    workspace: string,
    sessionId: string,
    turnId: string,
  ): Promise<ToolResult> {
    let lastError: unknown;

    for (let attempt = 0; attempt <= this.config.maxRetries; attempt++) {
      if (this.cancelled) {
        return {
          output: 'Tool execution cancelled',
          is_error: true,
          error_code: 499,
        };
      }

      try {
        return await this.toolRegistry.execute(toolCall, workspace, sessionId);
      } catch (error) {
        lastError = error;

        if (!isTransientError(error) || attempt >= this.config.maxRetries) {
          return {
            output: `Tool execution failed: ${error instanceof Error ? error.message : String(error)}`,
            is_error: true,
            error_code: 500,
          };
        }

        const delay = calculateBackoff(
          attempt,
          this.config.retryBaseDelayMs,
          this.config.retryMaxDelayMs,
        );

        this.emit('retry', {
          attempt: attempt + 1,
          maxRetries: this.config.maxRetries,
          delayMs: Math.round(delay),
          tool: toolCall.name,
          error: error instanceof Error ? error.message : String(error),
          turnId,
        });

        await sleep(delay);
      }
    }

    return {
      output: `Tool execution failed after ${this.config.maxRetries} retries: ${lastError instanceof Error ? lastError.message : String(lastError)}`,
      is_error: true,
      error_code: 500,
    };
  }

  /**
   * Cancel the current turn.
   */
  cancel(): void {
    this.cancelled = true;
    this.running = false;
  }

  /**
   * Check if the loop is currently running.
   */
  isRunning(): boolean {
    return this.running;
  }

  /**
   * Get the current turn state.
   */
  getTurnState(): TurnState | null {
    return this.currentTurn;
  }

  /**
   * Get the context manager.
   */
  getContext(): AgentLoopContext | null {
    return this.context;
  }

  /**
   * Get the tool registry.
   */
  getToolRegistry(): ToolRegistry {
    return this.toolRegistry;
  }

  /**
   * Emit an NDJSON event (to stdout if streaming is enabled).
   */
  private emit(type: AgentEventType, data: Record<string, unknown>): void {
    const event = makeEvent(type, data, this.currentTurn?.turnId);
    if (this.config.streamNDJSON) {
      emitNDJSON(event);
    }
  }

  /**
   * Build the final result object.
   */
  private buildResult(
    turnId: string,
    finalContent: string,
    toolCallsExecuted: number,
    totalTokens: TokenUsage,
    error?: string,
  ): AgentLoopResult {
    return {
      turnId,
      finalContent,
      toolCallsExecuted,
      totalTokens,
      iterations: this.currentTurn?.iterationCount || 0,
      durationMs: this.currentTurn ? Date.now() - this.currentTurn.startTime : 0,
      error,
    };
  }
}

/**
 * Create a new AgentLoop instance.
 */
export function createAgentLoop(
  llmCaller: LLMCaller,
  toolRegistry: ToolRegistry,
  config?: Partial<AgentLoopConfig>,
): AgentLoop {
  return new AgentLoop(llmCaller, toolRegistry, config);
}
