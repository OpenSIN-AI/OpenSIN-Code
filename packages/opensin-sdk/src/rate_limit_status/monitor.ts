import {
  RateLimitStatus,
  RateLimitWindowInfo,
  RateLimitConfig,
  RateLimitEvent,
  RateLimitWindow,
  DEFAULT_RATE_LIMIT_CONFIG,
} from "./types.js";

export class RateLimitMonitor {
  private config: RateLimitConfig;
  private status: RateLimitStatus;
  private listeners: Array<(event: RateLimitEvent) => void> = [];
  private intervalId: ReturnType<typeof setInterval> | null = null;

  constructor(config?: Partial<RateLimitConfig>) {
    this.config = { ...DEFAULT_RATE_LIMIT_CONFIG, ...config };
    this.status = this.createEmptyStatus();
  }

  updateStatus(
    window5h: Partial<RateLimitWindowInfo>,
    window7d: Partial<RateLimitWindowInfo>,
  ): RateLimitStatus {
    const now = Date.now();

    const w5h: RateLimitWindowInfo = {
      window: "5h",
      used: window5h.used ?? 0,
      limit: window5h.limit ?? 1,
      used_percentage: window5h.used_percentage ?? 0,
      resets_at: window5h.resets_at ?? new Date(now + 5 * 60 * 60 * 1000).toISOString(),
    };

    const w7d: RateLimitWindowInfo = {
      window: "7d",
      used: window7d.used ?? 0,
      limit: window7d.limit ?? 1,
      used_percentage: window7d.used_percentage ?? 0,
      resets_at: window7d.resets_at ?? new Date(now + 7 * 24 * 60 * 60 * 1000).toISOString(),
    };

    const maxUsage = Math.max(w5h.used_percentage, w7d.used_percentage);
    const isThrottled = maxUsage >= this.config.throttleThreshold;
    const throttleFactor = isThrottled ? this.config.throttleFactor : 1.0;

    this.status = {
      windows: { "5h": w5h, "7d": w7d },
      isThrottled,
      throttleFactor,
      lastUpdated: now,
    };

    this.checkForEvents(w5h, w7d);
    return this.status;
  }

  getStatus(): RateLimitStatus {
    return { ...this.status };
  }

  getThrottleFactor(): number {
    return this.status.throttleFactor;
  }

  shouldThrottle(): boolean {
    return this.status.isThrottled;
  }

  getWarningMessage(): string | null {
    const windows = Object.values(this.status.windows);
    for (const w of windows) {
      if (w.used_percentage >= this.config.warningThreshold) {
        return `Rate limit warning: ${w.window} window at ${w.used_percentage.toFixed(1)}% usage (resets ${w.resets_at})`;
      }
    }
    return null;
  }

  getStatuslineText(): string {
    const parts: string[] = [];
    for (const w of Object.values(this.status.windows)) {
      const pct = w.used_percentage.toFixed(0);
      const icon = w.used_percentage >= this.config.throttleThreshold
        ? "🔴"
        : w.used_percentage >= this.config.warningThreshold
          ? "🟡"
          : "🟢";
      parts.push(`${icon}${pct}%${w.window}`);
    }
    return parts.join(" ");
  }

  startPolling(fetchFn: () => Promise<{ "5h": Partial<RateLimitWindowInfo>; "7d": Partial<RateLimitWindowInfo> }>): void {
    this.stopPolling();
    this.intervalId = setInterval(async () => {
      try {
        const data = await fetchFn();
        this.updateStatus(data["5h"], data["7d"]);
      } catch {
        // Silently handle polling errors
      }
    }, this.config.checkIntervalMs);
  }

  stopPolling(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  onChange(listener: (event: RateLimitEvent) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private checkForEvents(w5h: RateLimitWindowInfo, w7d: RateLimitWindowInfo): void {
    const windows = [w5h, w7d];
    for (const w of windows) {
      if (w.used_percentage >= this.config.throttleThreshold) {
        this.emit({
          type: "throttled",
          window: w.window,
          usedPercentage: w.used_percentage,
          timestamp: Date.now(),
          message: `Rate limited: ${w.window} window at ${w.used_percentage.toFixed(1)}% — throttling requests`,
        });
      } else if (w.used_percentage >= this.config.warningThreshold) {
        this.emit({
          type: "warning",
          window: w.window,
          usedPercentage: w.used_percentage,
          timestamp: Date.now(),
          message: `Approaching rate limit: ${w.window} window at ${w.used_percentage.toFixed(1)}%`,
        });
      } else if (w.used_percentage >= 95) {
        this.emit({
          type: "critical",
          window: w.window,
          usedPercentage: w.used_percentage,
          timestamp: Date.now(),
          message: `Critical: ${w.window} window at ${w.used_percentage.toFixed(1)}%`,
        });
      }
    }
  }

  private emit(event: RateLimitEvent): void {
    for (const listener of this.listeners) {
      try {
        listener(event);
      } catch {
        // Ignore listener errors
      }
    }
  }

  private createEmptyStatus(): RateLimitStatus {
    const now = new Date().toISOString();
    return {
      windows: {
        "5h": { window: "5h", used: 0, limit: 1, used_percentage: 0, resets_at: now },
        "7d": { window: "7d", used: 0, limit: 1, used_percentage: 0, resets_at: now },
      },
      isThrottled: false,
      throttleFactor: 1.0,
      lastUpdated: Date.now(),
    };
  }
}
