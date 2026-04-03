import {
  LiveStatusSnapshot,
  TokenUsageDelta,
  CostInfo,
  LiveStatusConfig,
} from "./types.js";

const DEFAULT_CONFIG: LiveStatusConfig = {
  showTurnDuration: true,
  showCost: true,
  showModelInfo: true,
  updateIntervalMs: 250,
};

export class StatusMonitor {
  #config: LiveStatusConfig
  #sessionId: string
  #modelId: string
  #tokensIn: number
  #tokensOut: number
  #costUsd: number
  #turnStartTime: number | null = null
  #isStreaming: boolean
  #listeners: Array<(snapshot: LiveStatusSnapshot) => void> = []
  #intervalHandle: ReturnType<typeof setInterval> | null = null
  #costInfo: CostInfo

  constructor(
    sessionId: string,
    modelId: string,
    config: Partial<LiveStatusConfig> = {},
    costInfo: Partial<CostInfo> = {},
  ) {
    this.#sessionId = sessionId
    this.#modelId = modelId
    this.#config = { ...DEFAULT_CONFIG, ...config }
    this.#tokensIn = 0
    this.#tokensOut = 0
    this.#costUsd = 0
    this.#isStreaming = false
    this.#costInfo = {
      inputPerToken: costInfo.inputPerToken ?? 0,
      outputPerToken: costInfo.outputPerToken ?? 0,
      totalCost: 0,
      currency: costInfo.currency ?? "USD",
    }
  }

  get isStreaming(): boolean {
    return this.#isStreaming
  }

  get currentSnapshot(): LiveStatusSnapshot {
    return this.#buildSnapshot()
  }

  startTurn(): void {
    this.#isStreaming = true
    this.#turnStartTime = Date.now()
    this.#startBroadcast()
  }

  updateTokens(delta: TokenUsageDelta): void {
    this.#tokensIn += delta.inputTokens
    this.#tokensOut += delta.outputTokens
    this.#recalculateCost()
  }

  setTokens(absolute: { inputTokens: number; outputTokens: number }): void {
    this.#tokensIn = absolute.inputTokens
    this.#tokensOut = absolute.outputTokens
    this.#recalculateCost()
  }

  setModel(modelId: string): void {
    this.#modelId = modelId
  }

  endTurn(): void {
    this.#isStreaming = false
    this.#stopBroadcast()
  }

  onStatusUpdate(listener: (snapshot: LiveStatusSnapshot) => void): () => void {
    this.#listeners.push(listener)
    return () => {
      this.#listeners = this.#listeners.filter((l) => l !== listener)
    }
  }

  toggleTurnDuration(): void {
    this.#config.showTurnDuration = !this.#config.showTurnDuration
  }

  get config(): Readonly<LiveStatusConfig> {
    return { ...this.#config }
  }

  #recalculateCost(): void {
    this.#costUsd =
      this.#tokensIn * this.#costInfo.inputPerToken +
      this.#tokensOut * this.#costInfo.outputPerToken
  }

  #buildSnapshot(): LiveStatusSnapshot {
    const duration = this.#turnStartTime ? Date.now() - this.#turnStartTime : 0
    return {
      sessionId: this.#sessionId,
      modelId: this.#modelId,
      tokensIn: this.#tokensIn,
      tokensOut: this.#tokensOut,
      totalTokens: this.#tokensIn + this.#tokensOut,
      costUsd: this.#costUsd,
      turnDurationMs: duration,
      isStreaming: this.#isStreaming,
      timestamp: Date.now(),
    }
  }

  #startBroadcast(): void {
    if (this.#intervalHandle) return
    this.#intervalHandle = setInterval(() => {
      this.#emit(this.#buildSnapshot())
    }, this.#config.updateIntervalMs)
  }

  #stopBroadcast(): void {
    if (this.#intervalHandle) {
      clearInterval(this.#intervalHandle)
      this.#intervalHandle = null
    }
    this.#emit(this.#buildSnapshot())
  }

  #emit(snapshot: LiveStatusSnapshot): void {
    for (const listener of this.#listeners) {
      try {
        listener(snapshot)
      } catch {
        // listener errors should not break other listeners
      }
    }
  }

  dispose(): void {
    this.#stopBroadcast()
    this.#listeners = []
  }
}
