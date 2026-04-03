import { BareModeConfig, BareModeResult, BareModeError } from "./types.js";
import { DEFAULT_BARE_CONFIG } from "./config.js";

export class BareRunner {
  private config: BareModeConfig;
  private skippedFeatures: string[] = [];

  constructor(config: Partial<BareModeConfig> = {}) {
    this.config = { ...DEFAULT_BARE_CONFIG, ...config };
    this.skippedFeatures = this.computeSkipped();
  }

  getConfig(): BareModeConfig {
    return { ...this.config };
  }

  getSkippedFeatures(): string[] {
    return [...this.skippedFeatures];
  }

  async execute(request: { endpoint: string; method?: string; body?: unknown }): Promise<BareModeResult> {
    const start = performance.now();
    const { endpoint, method = "POST", body } = request;

    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.config.apiKey}`,
        "X-OpenSIN-Bare": "true",
      };

      const response = await fetch(`${this.config.baseUrl}${endpoint}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        signal: AbortSignal.timeout(this.config.timeout),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorBody}`);
      }

      const data = await response.json();
      const duration = performance.now() - start;

      return {
        success: true,
        data,
        duration,
        skipped: this.skippedFeatures,
      };
    } catch (err) {
      const duration = performance.now() - start;
      return {
        success: false,
        data: null,
        duration,
        skipped: this.skippedFeatures,
      };
    }
  }

  async executeWithRetry(request: { endpoint: string; method?: string; body?: unknown }): Promise<BareModeResult> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= this.config.maxRetries; attempt++) {
      try {
        const result = await this.execute(request);
        if (result.success) return result;
        lastError = new Error("Request returned non-success");
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
      }

      if (attempt < this.config.maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
      }
    }

    return {
      success: false,
      data: null,
      duration: 0,
      skipped: this.skippedFeatures,
    };
  }

  private computeSkipped(): string[] {
    const skipped: string[] = [];
    if (this.config.disableHooks) skipped.push("hooks");
    if (this.config.disableLSP) skipped.push("lsp");
    if (this.config.disablePluginSync) skipped.push("plugin-sync");
    if (this.config.disableSkillWalks) skipped.push("skill-directory-walks");
    if (this.config.disableAutoMemory) skipped.push("auto-memory");
    if (this.config.disableOAuth) skipped.push("oauth-auth");
    if (this.config.disableKeychain) skipped.push("keychain-auth");
    return skipped;
  }
}
