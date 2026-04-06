import type { PruningConfig, ContextMessage, PruningResult, TokenCount } from './types.js';

const DEFAULT_CONFIG: PruningConfig = {
  maxTokens: 8000,
  keepLastN: 4,
  keepSystemPrompt: true,
  keepRecentToolOutputs: 2,
};

export function countTokens(text: string): number {
  if (!text) return 0;
  const words = text.split(/\s+/).filter(Boolean).length;
  return Math.ceil(words * 1.3);
}

export function countContextTokens(messages: ContextMessage[]): TokenCount {
  const byRole: Record<string, number> = {};
  let total = 0;
  for (const msg of messages) {
    const tokens = countTokens(msg.content);
    byRole[msg.role] = (byRole[msg.role] ?? 0) + tokens;
    total += tokens;
  }
  return { total, byRole };
}

export function pruneContext(
  messages: ContextMessage[],
  config: Partial<PruningConfig> = {}
): PruningResult {
  const cfg: PruningConfig = { ...DEFAULT_CONFIG, ...config };
  const tokenCount = countContextTokens(messages);

  if (tokenCount.total <= cfg.maxTokens) {
    return {
      messages: [...messages],
      tokensRemoved: 0,
      tokensRemaining: tokenCount.total,
      prunedCount: 0,
      reason: 'Context within token limit',
    };
  }

  const systemMessages = cfg.keepSystemPrompt
    ? messages.filter(m => m.role === 'system')
    : [];

  const nonSystemMessages = messages.filter(m => m.role !== 'system');
  const lastN = nonSystemMessages.slice(-cfg.keepLastN);

  const recentToolOutputs = cfg.keepRecentToolOutputs > 0
    ? nonSystemMessages
        .filter(m => m.role === 'tool')
        .slice(-cfg.keepRecentToolOutputs)
    : [];

  const preserved = new Set([...systemMessages, ...lastN, ...recentToolOutputs]);
  const toRemove = messages.filter(m => !preserved.has(m));

  const tokensRemoved = toRemove.reduce((sum, m) => sum + countTokens(m.content), 0);
  const remaining = messages.filter(m => preserved.has(m));
  const tokensRemaining = countContextTokens(remaining).total;

  return {
    messages: remaining,
    tokensRemoved,
    tokensRemaining,
    prunedCount: toRemove.length,
    reason: `Pruned ${toRemove.length} messages to reduce context from ${tokenCount.total} to ${tokensRemaining} tokens`,
  };
}

export class ContextPruningPlugin {
  private config: PruningConfig;

  constructor(config?: Partial<PruningConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  getConfig(): PruningConfig {
    return { ...this.config };
  }

  setConfig(config: Partial<PruningConfig>): void {
    this.config = { ...this.config, ...config };
  }

  shouldPrune(messages: ContextMessage[]): boolean {
    return countContextTokens(messages).total > this.config.maxTokens;
  }

  prune(messages: ContextMessage[]): PruningResult {
    return pruneContext(messages, this.config);
  }

  getManifest() {
    return {
      id: 'context-pruning',
      name: 'Context Pruning Plugin',
      version: '0.1.0',
      description: 'Dynamic context pruning for token optimization',
      author: 'OpenSIN-AI',
      license: 'MIT',
    };
  }
}
