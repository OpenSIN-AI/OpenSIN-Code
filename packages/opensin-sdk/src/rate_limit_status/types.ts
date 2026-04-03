export type RateLimitWindow = "5h" | "7d";

export interface RateLimitWindowInfo {
  window: RateLimitWindow;
  used: number;
  limit: number;
  used_percentage: number;
  resets_at: string;
}

export interface RateLimitStatus {
  windows: Record<RateLimitWindow, RateLimitWindowInfo>;
  isThrottled: boolean;
  throttleFactor: number;
  lastUpdated: number;
}

export interface RateLimitConfig {
  warningThreshold: number;
  throttleThreshold: number;
  throttleFactor: number;
  checkIntervalMs: number;
}

export interface RateLimitEvent {
  type: "warning" | "critical" | "throttled" | "recovered";
  window: RateLimitWindow;
  usedPercentage: number;
  timestamp: number;
  message: string;
}

export const DEFAULT_RATE_LIMIT_CONFIG: RateLimitConfig = {
  warningThreshold: 75,
  throttleThreshold: 90,
  throttleFactor: 0.5,
  checkIntervalMs: 30000,
};
