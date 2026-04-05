import type { Message, CompactionStats } from '../core/types.js';

const DEFAULT_MAX_MESSAGE_SIZE = 10000;
const DEFAULT_CIRCUIT_BREAKER_THRESHOLD = 3;

export class CompactionManager {
  private stats: CompactionStats = {
    totalCompactions: 0,
    lastCompactionAt: null,
    circuitBreakerTripped: false,
    consecutiveFailures: 0,
  };

  private maxMessageSize: number;
  private circuitBreakerThreshold: number;

  constructor(options?: { maxMessageSize?: number; circuitBreakerThreshold?: number }) {
    this.maxMessageSize = options?.maxMessageSize || DEFAULT_MAX_MESSAGE_SIZE;
    this.circuitBreakerThreshold = options?.circuitBreakerThreshold || DEFAULT_CIRCUIT_BREAKER_THRESHOLD;
  }

  shouldCompact(messages: Message[], contextWindow: number): boolean {
    if (this.stats.circuitBreakerTripped) return false;

    const totalSize = this.estimateTokenCount(messages);
    return totalSize > contextWindow * 0.8;
  }

  async compact(messages: Message[], keepLast: number = 3): Promise<Message[]> {
    if (messages.length <= keepLast + 1) return messages;

    try {
      const firstUser = messages.find((m) => m.role === 'user');
      const lastMessages = messages.slice(-keepLast);

      const summary = this.summarizeMiddle(messages.slice(1, -keepLast));

      const compacted: Message[] = [];
      if (firstUser) {
        compacted.push(firstUser);
      }
      compacted.push({ role: 'system', content: `[Previous conversation summarized: ${summary}]` });
      compacted.push(...lastMessages);

      this.stats.totalCompactions++;
      this.stats.lastCompactionAt = new Date().toISOString();
      this.stats.consecutiveFailures = 0;

      return compacted;
    } catch {
      this.stats.consecutiveFailures++;
      if (this.stats.consecutiveFailures >= this.circuitBreakerThreshold) {
        this.stats.circuitBreakerTripped = true;
      }
      return messages;
    }
  }

  async microCompact(messages: Message[]): Promise<Message[]> {
    const result: Message[] = [];

    for (const msg of messages) {
      if (msg.content && msg.content.length > this.maxMessageSize) {
        result.push({
          ...msg,
          content: msg.content.slice(0, this.maxMessageSize) + '\n... (truncated)',
        });
      } else {
        result.push(msg);
      }
    }

    return result;
  }

  extractMemory(messages: Message[]): string {
    const memories: string[] = [];

    for (const msg of messages) {
      if (msg.role === 'assistant' && msg.content) {
        const lines = msg.content.split('\n');
        for (const line of lines) {
          if (line.includes('important') || line.includes('note') || line.includes('remember')) {
            memories.push(line.trim());
          }
        }
      }
    }

    return memories.slice(-10).join('\n');
  }

  getStats(): CompactionStats {
    return { ...this.stats };
  }

  resetCircuitBreaker(): void {
    this.stats.circuitBreakerTripped = false;
    this.stats.consecutiveFailures = 0;
  }

  private summarizeMiddle(messages: Message[]): string {
    const toolCalls = messages.filter((m) => m.tool_calls?.length).length;
    const toolResults = messages.filter((m) => m.role === 'tool').length;
    const assistantMsgs = messages.filter((m) => m.role === 'assistant' && m.content).length;

    const parts: string[] = [];
    if (toolCalls > 0) parts.push(`${toolCalls} tool calls executed`);
    if (toolResults > 0) parts.push(`${toolResults} tool results received`);
    if (assistantMsgs > 0) parts.push(`${assistantMsgs} assistant responses`);

    return parts.join(', ') || 'no significant activity';
  }

  private estimateTokenCount(messages: Message[]): number {
    let total = 0;
    for (const msg of messages) {
      if (msg.content) {
        total += Math.ceil(msg.content.length / 4);
      }
      if (msg.tool_calls) {
        total += msg.tool_calls.length * 20;
      }
    }
    return total;
  }
}
