export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  cacheCreationInputTokens: number;
  cacheReadInputTokens: number;
}

export class UsageTracker {
  private turns: number = 0;
  private totalInput: number = 0;
  private totalOutput: number = 0;
  private totalCacheCreation: number = 0;
  private totalCacheRead: number = 0;

  static fromSession(_session: unknown): UsageTracker {
    return new UsageTracker();
  }

  record(usage: TokenUsage): void {
    this.turns++;
    this.totalInput += usage.inputTokens;
    this.totalOutput += usage.outputTokens;
    this.totalCacheCreation += usage.cacheCreationInputTokens;
    this.totalCacheRead += usage.cacheReadInputTokens;
  }

  turns(): number {
    return this.turns;
  }

  cumulativeUsage(): TokenUsage {
    return {
      inputTokens: this.totalInput,
      outputTokens: this.totalOutput,
      cacheCreationInputTokens: this.totalCacheCreation,
      cacheReadInputTokens: this.totalCacheRead,
    };
  }

  totalTokens(): number {
    return (
      this.totalInput +
      this.totalOutput +
      this.totalCacheCreation +
      this.totalCacheRead
    );
  }

  inputTokens(): number {
    return this.totalInput;
  }

  outputTokens(): number {
    return this.totalOutput;
  }
}

export function createTokenUsage(
  inputTokens: number,
  outputTokens: number,
  cacheCreationInputTokens: number = 0,
  cacheReadInputTokens: number = 0
): TokenUsage {
  return {
    inputTokens,
    outputTokens,
    cacheCreationInputTokens,
    cacheReadInputTokens,
  };
}

export function tokenUsageTotal(usage: TokenUsage): number {
  return (
    usage.inputTokens +
    usage.outputTokens +
    usage.cacheCreationInputTokens +
    usage.cacheReadInputTokens
  );
}

export function addTokenUsage(a: TokenUsage, b: TokenUsage): TokenUsage {
  return {
    inputTokens: a.inputTokens + b.inputTokens,
    outputTokens: a.outputTokens + b.outputTokens,
    cacheCreationInputTokens: a.cacheCreationInputTokens + b.cacheCreationInputTokens,
    cacheReadInputTokens: a.cacheReadInputTokens + b.cacheReadInputTokens,
  };
}