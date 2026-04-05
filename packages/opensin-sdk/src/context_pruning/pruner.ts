/**
 * OpenSIN Context Pruner — Dynamic context optimization
 * 
 * Prunes obsolete tool outputs and stale messages from conversation context
 * to optimize token usage while preserving essential information.
 */

import type { PruningPolicy, PruningStats } from './types.js';
import { DEFAULT_PRUNING_POLICY } from './types.js';

export interface ContextMessage {
  role: string;
  content: string;
  toolCallId?: string;
  timestamp?: number;
}

export class ContextPruner {
  private policy: PruningPolicy;
  private stats: PruningStats;

  constructor(policy: Partial<PruningPolicy> = {}) {
    this.policy = { ...DEFAULT_PRUNING_POLICY, ...policy };
    this.stats = { messagesPruned: 0, tokensSaved: 0, lastPrunedAt: new Date() };
  }

  prune(messages: ContextMessage[]): ContextMessage[] {
    if (!this.policy.pruneStaleOutputs) return messages;

    const result: ContextMessage[] = [];
    let pruned = 0;

    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i];
      const age = messages.length - i;

      // Keep system messages and user messages
      if (msg.role === 'system' || msg.role === 'user') {
        result.push(msg);
        continue;
      }

      // Keep recent assistant messages
      if (age <= this.policy.maxMessageAge) {
        result.push(msg);
        continue;
      }

      // Prune tool results that exceed line limit
      if (msg.toolCallId && msg.content) {
        const lines = msg.content.split('\n');
        if (lines.length > this.policy.maxToolOutputLines) {
          const summary = `[Pruned: ${lines.length} lines → first 10 + last 10]\n` +
            lines.slice(0, 10).join('\n') + '\n...\n' +
            lines.slice(-10).join('\n');
          result.push({ ...msg, content: summary });
          pruned++;
          this.stats.tokensSaved += lines.length - 20;
          continue;
        }
      }

      result.push(msg);
    }

    this.stats.messagesPruned += pruned;
    this.stats.lastPrunedAt = new Date();
    return result;
  }

  getStats(): PruningStats {
    return { ...this.stats };
  }

  resetStats(): void {
    this.stats = { messagesPruned: 0, tokensSaved: 0, lastPrunedAt: new Date() };
  }
}
