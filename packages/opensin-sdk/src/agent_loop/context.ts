/**
 * OpenSIN Agent Loop — Context Window Management
 *
 * Wraps the existing context management system for use in the agent loop.
 * Handles automatic compression when the context window approaches its limit.
 */

import type { Message, ToolCall, ToolResult, TokenUsage, AssistantMessage, UserMessage, ToolResultMessage } from '../types.js';
import type { AgentLoopConfig } from './types.js';
import { OpenSINContextManager } from '../context_mgmt/manager.js';
import { OpenSINContextCompressor } from '../context_mgmt/compressor.js';

/**
 * Estimate token count for a message.
 * Uses a simple character-based heuristic (~4 chars per token).
 */
export function estimateMessageTokens(message: Message): number {
  const content = typeof message.content === 'string'
    ? message.content
    : JSON.stringify(message.content);
  return Math.ceil(content.length / 4);
}

/**
 * Estimate total tokens for a message array.
 */
export function estimateTotalTokens(messages: Message[]): number {
  return messages.reduce((sum, m) => sum + estimateMessageTokens(m), 0);
}

/**
 * Context manager for the agent loop.
 * Wraps OpenSINContextManager with agent-loop-specific logic.
 */
export class AgentLoopContext {
  private manager: OpenSINContextManager;
  private compressor: OpenSINContextCompressor;
  private config: AgentLoopConfig;
  private messages: Message[] = [];

  constructor(sessionId: string, config: AgentLoopConfig) {
    this.config = config;
    this.manager = new OpenSINContextManager(sessionId, {
      maxTokens: config.maxContextTokens,
      compressionThreshold: config.compressionThreshold,
      autoCompress: true,
    });
    this.compressor = new OpenSINContextCompressor();
  }

  /**
   * Add a message to the context.
   */
  addMessage(message: Message): void {
    this.messages.push(message);
    const tokens = estimateMessageTokens(message);
    const content = typeof message.content === 'string' ? message.content : JSON.stringify(message.content);
    this.manager.addEntry(message.role as 'user' | 'assistant' | 'tool' | 'system', content, undefined, this.defaultPriority(message.role));

    // Auto-compress if needed
    if (this.manager.needsCompression()) {
      this.compress();
    }
  }

  /**
   * Add a system message (highest priority, always preserved).
   * System messages are stored as assistant messages with a system prefix
   * since the Message type union doesn't include a system role directly.
   */
  addSystemMessage(content: string): void {
    // Store as a special assistant message that acts as system prompt
    const message: AssistantMessage = { role: 'assistant', content: `[SYSTEM] ${content}` };
    this.messages.unshift(message);
    this.manager.addEntry('system', content, undefined, 100);
  }

  /**
   * Get the current messages array for sending to the LLM.
   */
  getMessages(): Message[] {
    return [...this.messages];
  }

  /**
   * Get the current token utilization (0.0–1.0).
   */
  getUtilization(): number {
    return this.manager.getUtilization();
  }

  /**
   * Get the total estimated token count.
   */
  getTotalTokens(): number {
    return estimateTotalTokens(this.messages);
  }

  /**
   * Check if compression is needed.
   */
  needsCompression(): boolean {
    return this.manager.needsCompression();
  }

  /**
   * Compress the context window.
   * Returns the number of tokens saved.
   */
  compress(): number {
    const before = this.getTotalTokens();

    // Separate system messages (those starting with [SYSTEM])
    const systemMessages = this.messages.filter(m =>
      typeof m.content === 'string' && m.content.startsWith('[SYSTEM]')
    );
    const recentMessages = this.messages.slice(-Math.min(10, this.messages.length));
    const middleMessages = this.messages.filter(
      m => !(typeof m.content === 'string' && m.content.startsWith('[SYSTEM]')) && !recentMessages.includes(m)
    );

    // Summarize middle messages
    const compressed: Message[] = [
      ...systemMessages,
      ...middleMessages.map(m => {
        const tokens = estimateMessageTokens(m);
        return {
          role: m.role,
          content: `[Previous ${m.role} message — ${tokens} tokens]`,
        } as AssistantMessage;
      }),
      ...recentMessages,
    ];

    this.messages = compressed;

    // Rebuild context manager state
    this.manager = new OpenSINContextManager(this.manager.state.sessionId, {
      maxTokens: this.config.maxContextTokens,
      compressionThreshold: this.config.compressionThreshold,
      autoCompress: true,
    });

    for (const msg of this.messages) {
      const content = typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content);
      this.manager.addEntry(
        msg.role as 'user' | 'assistant' | 'tool' | 'system',
        content,
        undefined,
        this.defaultPriority(msg.role)
      );
    }

    const after = this.getTotalTokens();
    return before - after;
  }

  /**
   * Clear all messages except system messages.
   */
  clearConversation(): void {
    this.messages = this.messages.filter(m =>
      typeof m.content === 'string' && m.content.startsWith('[SYSTEM]')
    );
    this.manager.clear();
    // Re-add system messages
    for (const msg of this.messages) {
      const content = typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content);
      this.manager.addEntry('system', content, undefined, 100);
    }
  }

  /**
   * Get context stats.
   */
  getStats(): {
    messageCount: number;
    totalTokens: number;
    utilization: number;
    needsCompression: boolean;
  } {
    return {
      messageCount: this.messages.length,
      totalTokens: this.getTotalTokens(),
      utilization: this.getUtilization(),
      needsCompression: this.needsCompression(),
    };
  }

  private defaultPriority(role: string): number {
    if (role === 'system' || (typeof role === 'string' && role.includes('SYSTEM'))) return 100;
    switch (role) {
      case 'user': return 80;
      case 'assistant': return 60;
      case 'tool': return 40;
      default: return 50;
    }
  }
}
