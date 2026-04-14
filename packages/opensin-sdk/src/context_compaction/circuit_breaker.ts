import { CompactionConfig, CompactionTrigger, CompactionResult } from './types';
import { OpenSINContextCompressor } from '../context_mgmt/compressor';
import type { ContextEntry, CompressionStrategy } from '../context_mgmt/types';

const DEFAULT_CONFIG: CompactionConfig = {
  threshold: 0.8,
  maxTokens: 128000,
  keepRecent: 10,
};

export class CircuitBreaker {
  private config: CompactionConfig;
  private compressor: OpenSINContextCompressor;
  private compactedCount = 0;

  constructor(config?: Partial<CompactionConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.compressor = new OpenSINContextCompressor();
  }

  shouldCompact(currentTokens: number): boolean {
    return currentTokens >= this.config.maxTokens * this.config.threshold;
  }

  autoCompact(entries: ContextEntry[], currentTokens: number): CompactionResult {
    const strategy = this.selectStrategy(entries, currentTokens);
    const targetTokens = Math.floor(this.config.maxTokens * 0.6);

    const result = this.compressor.compress(entries, targetTokens, strategy);
    this.compactedCount++;

    return {
      success: result.compressedTokens < currentTokens,
      tokensBefore: result.originalTokens,
      tokensAfter: result.compressedTokens,
      messagesRemoved: result.entriesRemoved,
    };
  }

  getCompactedCount(): number {
    return this.compactedCount;
  }

  private selectStrategy(entries: ContextEntry[], currentTokens: number): CompressionStrategy {
    const usageRatio = currentTokens / this.config.maxTokens;

    if (usageRatio > 0.95) return 'truncate';
    if (usageRatio > 0.9) return 'sliding_window';
    if (usageRatio > 0.85) return 'hybrid';
    return 'priority_based';
  }
}
