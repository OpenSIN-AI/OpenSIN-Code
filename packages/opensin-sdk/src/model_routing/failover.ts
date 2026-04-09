/**
 * OpenSIN Failover Model Router
 *
 * Multi-provider failover routing with Antigravity, OCI Proxy, and NVIDIA NIM.
 * Supports primary → secondary → tertiary model chains with automatic fallback
 * on rate limits, errors, and capacity issues.
 */

export interface FailoverModelConfig {
  id: string;
  name: string;
  provider: 'antigravity' | 'openai-oci' | 'nvidia-nim' | 'local' | 'custom';
  baseURL?: string;
  capabilities: string[];
  costPerInputToken: number;
  costPerOutputToken: number;
  contextLimit: number;
  maxOutputTokens: number;
  latencyProfile: 'fast' | 'medium' | 'slow';
  reliability: number;
}

export interface FailoverChain {
  id: string;
  name: string;
  models: FailoverModelConfig[];
  strategy: 'cost-first' | 'speed-first' | 'quality-first' | 'task-based';
}

export interface FailoverResult {
  selectedModel: FailoverModelConfig;
  chainId: string;
  attempt: number;
  fallbackFrom?: string;
  fallbackReason?: string;
  estimatedCost: number;
  estimatedLatencyMs: number;
}

export interface FailoverEvent {
  type: 'route' | 'fallback' | 'exhausted' | 'recovered';
  timestamp: number;
  chainId: string;
  modelId: string;
  data: Record<string, unknown>;
}

const OPENSIN_MODELS: FailoverModelConfig[] = [
  {
    id: 'openai/gpt-5.4',
    name: 'GPT-5.4 via OCI Proxy',
    provider: 'openai-oci',
    baseURL: 'http://92.5.60.87:4100/v1',
    capabilities: ['tool_use', 'code', 'reasoning', 'vision', 'function_calling', 'json_mode', 'streaming'],
    costPerInputToken: 0,
    costPerOutputToken: 0,
    contextLimit: 128_000,
    maxOutputTokens: 16_384,
    latencyProfile: 'fast',
    reliability: 0.95,
  },
  {
    id: 'google/antigravity-claude-sonnet-4-6',
    name: 'Claude Sonnet 4.6 via Antigravity',
    provider: 'antigravity',
    capabilities: ['tool_use', 'code', 'reasoning', 'vision', 'function_calling', 'json_mode', 'streaming'],
    costPerInputToken: 0,
    costPerOutputToken: 0,
    contextLimit: 200_000,
    maxOutputTokens: 16_384,
    latencyProfile: 'medium',
    reliability: 0.92,
  },
  {
    id: 'google/antigravity-gemini-3.1-pro',
    name: 'Gemini 3.1 Pro via Antigravity',
    provider: 'antigravity',
    capabilities: ['tool_use', 'code', 'reasoning', 'vision', 'function_calling', 'json_mode', 'streaming', 'image_generation'],
    costPerInputToken: 0,
    costPerOutputToken: 0,
    contextLimit: 1_000_000,
    maxOutputTokens: 65_536,
    latencyProfile: 'medium',
    reliability: 0.93,
  },
  {
    id: 'google/antigravity-claude-opus-4-6-thinking',
    name: 'Claude Opus 4.6 Thinking via Antigravity',
    provider: 'antigravity',
    capabilities: ['tool_use', 'code', 'reasoning', 'vision', 'function_calling', 'json_mode', 'streaming', 'extended_thinking'],
    costPerInputToken: 0,
    costPerOutputToken: 0,
    contextLimit: 200_000,
    maxOutputTokens: 32_768,
    latencyProfile: 'slow',
    reliability: 0.90,
  },
  {
    id: 'google/antigravity-gemini-3-flash',
    name: 'Gemini 3 Flash via Antigravity',
    provider: 'antigravity',
    capabilities: ['tool_use', 'code', 'function_calling', 'json_mode', 'streaming'],
    costPerInputToken: 0,
    costPerOutputToken: 0,
    contextLimit: 1_000_000,
    maxOutputTokens: 8_192,
    latencyProfile: 'fast',
    reliability: 0.96,
  },
  {
    id: 'nvidia-nim/qwen-3.5-397b',
    name: 'Qwen 3.5 397B via NVIDIA NIM',
    provider: 'nvidia-nim',
    capabilities: ['tool_use', 'code', 'reasoning', 'function_calling', 'json_mode', 'streaming'],
    costPerInputToken: 0,
    costPerOutputToken: 0,
    contextLimit: 128_000,
    maxOutputTokens: 16_384,
    latencyProfile: 'medium',
    reliability: 0.88,
  },
];

const DEFAULT_CHAINS: FailoverChain[] = [
  {
    id: 'default',
    name: 'Default Chain',
    models: [
      OPENSIN_MODELS.find(m => m.id === 'openai/gpt-5.4')!,
      OPENSIN_MODELS.find(m => m.id === 'google/antigravity-claude-sonnet-4-6')!,
      OPENSIN_MODELS.find(m => m.id === 'google/antigravity-gemini-3.1-pro')!,
    ],
    strategy: 'quality-first',
  },
  {
    id: 'fast',
    name: 'Speed-Optimized Chain',
    models: [
      OPENSIN_MODELS.find(m => m.id === 'google/antigravity-gemini-3-flash')!,
      OPENSIN_MODELS.find(m => m.id === 'openai/gpt-5.4')!,
      OPENSIN_MODELS.find(m => m.id === 'nvidia-nim/qwen-3.5-397b')!,
    ],
    strategy: 'speed-first',
  },
  {
    id: 'reasoning',
    name: 'Deep Reasoning Chain',
    models: [
      OPENSIN_MODELS.find(m => m.id === 'google/antigravity-claude-opus-4-6-thinking')!,
      OPENSIN_MODELS.find(m => m.id === 'google/antigravity-gemini-3.1-pro')!,
      OPENSIN_MODELS.find(m => m.id === 'google/antigravity-claude-sonnet-4-6')!,
    ],
    strategy: 'quality-first',
  },
  {
    id: 'long-context',
    name: 'Long Context Chain',
    models: [
      OPENSIN_MODELS.find(m => m.id === 'google/antigravity-gemini-3.1-pro')!,
      OPENSIN_MODELS.find(m => m.id === 'google/antigravity-gemini-3-flash')!,
      OPENSIN_MODELS.find(m => m.id === 'openai/gpt-5.4')!,
    ],
    strategy: 'quality-first',
  },
];

export class FailoverRouter {
  private chains: Map<string, FailoverChain> = new Map();
  private activeChainId = 'default';
  private modelHealth: Map<string, { failures: number; lastFailureAt: number | null; cooldownUntil: number | null }> = new Map();
  private eventListeners: ((event: FailoverEvent) => void)[] = [];
  private recentRoutes: FailoverResult[] = [];

  constructor(chains?: FailoverChain[]) {
    const initialChains = chains || DEFAULT_CHAINS;
    for (const chain of initialChains) {
      this.chains.set(chain.id, chain);
      for (const model of chain.models) {
        if (!this.modelHealth.has(model.id)) {
          this.modelHealth.set(model.id, { failures: 0, lastFailureAt: null, cooldownUntil: null });
        }
      }
    }
  }

  route(
    prompt: string,
    options?: {
      requiresVision?: boolean;
      requiresReasoning?: boolean;
      requiresCode?: boolean;
      requiresLongContext?: boolean;
      preferSpeed?: boolean;
      estimatedInputTokens?: number;
    },
  ): FailoverResult {
    const chain = this.selectChain(options);
    const selectedModel = this.selectModelFromChain(chain, options);

    const estimatedTokens = options?.estimatedInputTokens || Math.ceil(prompt.length / 4);
    const estimatedCost = estimatedTokens * selectedModel.costPerInputToken;

    const result: FailoverResult = {
      selectedModel,
      chainId: chain.id,
      attempt: 1,
      estimatedCost,
      estimatedLatencyMs: this.estimateLatency(selectedModel),
    };

    this.recentRoutes.push(result);
    this.emitEvent('route', chain.id, selectedModel.id, { result });

    return result;
  }

  reportFailure(modelId: string, error: string): void {
    const health = this.modelHealth.get(modelId);
    if (!health) return;

    health.failures++;
    health.lastFailureAt = Date.now();
    health.cooldownUntil = Date.now() + Math.min(30000 * health.failures, 300000);

    this.emitEvent('fallback', this.activeChainId, modelId, {
      error,
      failures: health.failures,
      cooldownUntil: health.cooldownUntil,
    });
  }

  reportSuccess(modelId: string): void {
    const health = this.modelHealth.get(modelId);
    if (!health) return;

    health.failures = Math.max(0, health.failures - 1);
    health.cooldownUntil = null;

    this.emitEvent('recovered', this.activeChainId, modelId, {});
  }

  getFallback(
    currentModelId: string,
    chainId?: string,
    error?: string,
  ): FailoverResult | null {
    const chain = this.chains.get(chainId || this.activeChainId);
    if (!chain) return null;

    const currentIndex = chain.models.findIndex(m => m.id === currentModelId);
    if (currentIndex === -1 || currentIndex >= chain.models.length - 1) {
      this.emitEvent('exhausted', chain.id, currentModelId, { error });
      return null;
    }

    for (let i = currentIndex + 1; i < chain.models.length; i++) {
      const candidate = chain.models[i];
      const health = this.modelHealth.get(candidate.id);

      if (health?.cooldownUntil && Date.now() < health.cooldownUntil) {
        continue;
      }

      return {
        selectedModel: candidate,
        chainId: chain.id,
        attempt: i + 1,
        fallbackFrom: currentModelId,
        fallbackReason: error || 'automatic_fallback',
        estimatedCost: 0,
        estimatedLatencyMs: this.estimateLatency(candidate),
      };
    }

    this.emitEvent('exhausted', chain.id, currentModelId, { error });
    return null;
  }

  setActiveChain(chainId: string): void {
    if (this.chains.has(chainId)) {
      this.activeChainId = chainId;
    }
  }

  addChain(chain: FailoverChain): void {
    this.chains.set(chain.id, chain);
    for (const model of chain.models) {
      if (!this.modelHealth.has(model.id)) {
        this.modelHealth.set(model.id, { failures: 0, lastFailureAt: null, cooldownUntil: null });
      }
    }
  }

  getChain(chainId: string): FailoverChain | undefined {
    return this.chains.get(chainId);
  }

  listChains(): FailoverChain[] {
    return Array.from(this.chains.values());
  }

  getModelHealth(modelId: string): { failures: number; lastFailureAt: number | null; cooldownUntil: number | null } | undefined {
    return this.modelHealth.get(modelId);
  }

  getRecentRoutes(limit = 20): FailoverResult[] {
    return this.recentRoutes.slice(-limit);
  }

  onEvent(listener: (event: FailoverEvent) => void): () => void {
    this.eventListeners.push(listener);
    return () => {
      this.eventListeners = this.eventListeners.filter(l => l !== listener);
    };
  }

  private selectChain(options?: {
    requiresVision?: boolean;
    requiresReasoning?: boolean;
    requiresLongContext?: boolean;
    preferSpeed?: boolean;
  }): FailoverChain {
    if (options?.preferSpeed) {
      return this.chains.get('fast') || this.chains.get(this.activeChainId)!;
    }
    if (options?.requiresReasoning) {
      return this.chains.get('reasoning') || this.chains.get(this.activeChainId)!;
    }
    if (options?.requiresLongContext) {
      return this.chains.get('long-context') || this.chains.get(this.activeChainId)!;
    }
    return this.chains.get(this.activeChainId)!;
  }

  private selectModelFromChain(chain: FailoverChain, options?: {
    requiresVision?: boolean;
    requiresCode?: boolean;
    estimatedInputTokens?: number;
  }): FailoverModelConfig {
    for (const model of chain.models) {
      const health = this.modelHealth.get(model.id);
      if (health?.cooldownUntil && Date.now() < health.cooldownUntil) {
        continue;
      }
      if (options?.requiresVision && !model.capabilities.includes('vision')) {
        continue;
      }
      if (options?.requiresCode && !model.capabilities.includes('code')) {
        continue;
      }
      if (options?.estimatedInputTokens && options.estimatedInputTokens > model.contextLimit) {
        continue;
      }
      return model;
    }
    return chain.models[0];
  }

  private estimateLatency(model: FailoverModelConfig): number {
    const baseLatencies: Record<string, number> = {
      fast: 500,
      medium: 2000,
      slow: 5000,
    };
    return baseLatencies[model.latencyProfile] || 2000;
  }

  private emitEvent(type: FailoverEvent['type'], chainId: string, modelId: string, data: Record<string, unknown>): void {
    const event: FailoverEvent = { type, timestamp: Date.now(), chainId, modelId, data };
    for (const listener of this.eventListeners) {
      try { listener(event); } catch { }
    }
  }
}

export function createFailoverRouter(chains?: FailoverChain[]): FailoverRouter {
  return new FailoverRouter(chains);
}

export { OPENSIN_MODELS, DEFAULT_CHAINS };
