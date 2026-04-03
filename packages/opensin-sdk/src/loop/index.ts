/**
 * Loop Mode — prompt repetition for polling like Claude Code /loop
 */

import { LoopConfig, LoopIteration, LoopResult, LoopState, LoopStatus, StopCondition } from "./models.js";

export class LoopMode {
  private loops: Map<string, LoopState> = new Map();
  private results: Map<string, LoopResult> = new Map();
  private timers: Map<string, ReturnType<typeof setTimeout>> = new Map();
  private executor: (prompt: string) => Promise<string>;

  constructor(executor: (prompt: string) => Promise<string>) {
    this.executor = executor;
  }

  createLoop(config: Omit<LoopConfig, "id" | "createdAt">): LoopConfig {
    const loop: LoopConfig = {
      ...config,
      id: `loop-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      createdAt: new Date().toISOString(),
    };
    const state: LoopState = {
      loop,
      status: "idle",
      currentIteration: 0,
    };
    this.loops.set(loop.id, state);
    return loop;
  }

  getLoop(id: string): LoopState | undefined {
    return this.loops.get(id);
  }

  listLoops(status?: LoopStatus): LoopState[] {
    let loops = Array.from(this.loops.values());
    if (status) {
      loops = loops.filter(l => l.status === status);
    }
    return loops;
  }

  async startLoop(loopId: string): Promise<LoopState> {
    const state = this.loops.get(loopId);
    if (!state) throw new Error(`Loop ${loopId} not found`);
    if (state.status === "running") throw new Error(`Loop ${loopId} is already running`);

    state.status = "running";
    state.startedAt = new Date().toISOString();
    state.currentIteration = 0;

    this.runLoopIteration(loopId);
    return state;
  }

  private async runLoopIteration(loopId: string): Promise<void> {
    const state = this.loops.get(loopId);
    if (!state || state.status !== "running") return;

    const { loop } = state;
    if (state.currentIteration >= loop.maxIterations) {
      this.stopLoop(loopId, "max_iterations_reached");
      return;
    }

    const iteration: LoopIteration = {
      iterationNumber: state.currentIteration + 1,
      prompt: loop.prompt,
      response: "",
      timestamp: new Date().toISOString(),
      durationMs: 0,
    };

    const startTime = Date.now();
    try {
      iteration.response = await this.executor(loop.prompt);
      iteration.durationMs = Date.now() - startTime;

      const triggeredCondition = this.checkStopConditions(loop.stopConditions, iteration);
      if (triggeredCondition) {
        iteration.stopConditionTriggered = triggeredCondition;
        this.stopLoop(loopId, `stop_condition: ${triggeredCondition}`);
        return;
      }
    } catch (error) {
      iteration.error = error instanceof Error ? error.message : String(error);
      iteration.durationMs = Date.now() - startTime;

      const errorCondition = loop.stopConditions.find(s => s.type === "max_errors" && s.enabled);
      if (errorCondition) {
        const errorCount = state.currentIteration > 0 ? 1 : 0;
        if (errorCount >= (typeof errorCondition.value === "number" ? errorCondition.value : 1)) {
          this.stopLoop(loopId, "max_errors_reached");
          return;
        }
      }
    }

    state.currentIteration++;

    const timer = setTimeout(() => {
      this.runLoopIteration(loopId);
    }, loop.intervalMs);
    this.timers.set(loopId, timer);
  }

  private checkStopConditions(conditions: StopCondition[], iteration: LoopIteration): string | null {
    for (const condition of conditions) {
      if (!condition.enabled) continue;
      switch (condition.type) {
        case "output_contains":
          if (typeof condition.value === "string" && iteration.response.includes(condition.value)) {
            return `output_contains:${condition.value}`;
          }
          break;
        case "output_matches":
          if (typeof condition.value === "string") {
            const regex = new RegExp(condition.value);
            if (regex.test(iteration.response)) {
              return `output_matches:${condition.value}`;
            }
          }
          break;
        case "time_elapsed":
          break;
      }
    }
    return null;
  }

  pauseLoop(loopId: string): LoopState {
    const state = this.loops.get(loopId);
    if (!state) throw new Error(`Loop ${loopId} not found`);
    if (state.status !== "running") throw new Error(`Loop ${loopId} is not running`);

    const timer = this.timers.get(loopId);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(loopId);
    }

    state.status = "paused";
    state.pausedAt = new Date().toISOString();
    return state;
  }

  resumeLoop(loopId: string): LoopState {
    const state = this.loops.get(loopId);
    if (!state) throw new Error(`Loop ${loopId} not found`);
    if (state.status !== "paused") throw new Error(`Loop ${loopId} is not paused`);

    state.status = "running";
    state.pausedAt = undefined;
    this.runLoopIteration(loopId);
    return state;
  }

  stopLoop(loopId: string, reason: string = "manual_stop"): LoopState {
    const state = this.loops.get(loopId);
    if (!state) throw new Error(`Loop ${loopId} not found`);

    const timer = this.timers.get(loopId);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(loopId);
    }

    state.status = "stopped";
    state.stoppedAt = new Date().toISOString();
    state.lastError = reason;

    this.aggregateResult(loopId, reason);
    return state;
  }

  private aggregateResult(loopId: string, reason: string): void {
    const state = this.loops.get(loopId);
    if (!state) return;

    const result: LoopResult = {
      id: `result-${loopId}-${Date.now()}`,
      loopId,
      iterations: [],
      totalIterations: state.currentIteration,
      stoppedAt: state.stoppedAt || new Date().toISOString(),
      stopReason: reason,
      aggregatedResult: `Loop completed ${state.currentIterations} iterations. Stopped: ${reason}`,
      totalDurationMs: state.startedAt
        ? Date.now() - new Date(state.startedAt).getTime()
        : 0,
      successRate: state.currentIteration > 0 ? 1.0 : 0,
    };

    this.results.set(result.id, result);
  }

  getResult(resultId: string): LoopResult | undefined {
    return this.results.get(resultId);
  }

  getLoopResults(loopId: string): LoopResult[] {
    return Array.from(this.results.values()).filter(r => r.loopId === loopId);
  }

  deleteLoop(loopId: string): boolean {
    const timer = this.timers.get(loopId);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(loopId);
    }
    return this.loops.delete(loopId);
  }
}

let _loopMode: LoopMode | undefined;

export function getLoopMode(executor: (prompt: string) => Promise<string>): LoopMode {
  if (!_loopMode) {
    _loopMode = new LoopMode(executor);
  }
  return _loopMode;
}

export { LoopMode };
