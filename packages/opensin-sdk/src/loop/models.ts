/**
 * Loop Mode — prompt repetition for polling like Claude Code /loop
 */

export interface LoopConfig {
  id: string;
  prompt: string;
  intervalMs: number;
  maxIterations: number;
  stopConditions: StopCondition[];
  createdAt: string;
  metadata: Record<string, unknown>;
}

export interface StopCondition {
  type: "output_contains" | "output_matches" | "max_errors" | "time_elapsed" | "custom";
  value: string | number;
  enabled: boolean;
}

export interface LoopIteration {
  iterationNumber: number;
  prompt: string;
  response: string;
  timestamp: string;
  durationMs: number;
  error?: string;
  stopConditionTriggered?: string;
}

export interface LoopResult {
  id: string;
  loopId: string;
  iterations: LoopIteration[];
  totalIterations: number;
  stoppedAt: string;
  stopReason: string;
  aggregatedResult: string;
  totalDurationMs: number;
  successRate: number;
}

export type LoopStatus = "idle" | "running" | "paused" | "stopped" | "error";

export interface LoopState {
  loop: LoopConfig;
  status: LoopStatus;
  currentIteration: number;
  startedAt?: string;
  pausedAt?: string;
  stoppedAt?: string;
  lastError?: string;
}
