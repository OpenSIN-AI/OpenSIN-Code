import { RateLimitMonitor } from "./monitor.js";
import { RateLimitStatus, RateLimitEvent } from "./types.js";

export function renderRateLimitStatusline(monitor: RateLimitMonitor): string {
  return monitor.getStatuslineText();
}

export function renderRateLimitBanner(monitor: RateLimitMonitor): string | null {
  const msg = monitor.getWarningMessage();
  if (!msg) return null;

  const status = monitor.getStatus();
  if (status.isThrottled) {
    return `⚠️ RATE LIMITED — Requests throttled to ${(status.throttleFactor * 100).toFixed(0)}% capacity`;
  }
  return `⚠️ ${msg}`;
}

export function formatRateLimitDetails(status: RateLimitStatus): string {
  const lines = ["Rate Limit Status:", ""];

  for (const w of Object.values(status.windows)) {
    const bar = createProgressBar(w.used_percentage);
    lines.push(
      `${w.window} window: ${w.used}/${w.limit} (${w.used_percentage.toFixed(1)}%) ${bar}`,
    );
    lines.push(`  Resets at: ${w.resets_at}`);
    lines.push("");
  }

  if (status.isThrottled) {
    lines.push(`Throttling: ACTIVE (${(status.throttleFactor * 100).toFixed(0)}% capacity)`);
  } else {
    lines.push("Throttling: inactive");
  }

  return lines.join("\n");
}

function createProgressBar(percentage: number, width: number = 20): string {
  const filled = Math.round((percentage / 100) * width);
  const empty = width - filled;
  const bar = "█".repeat(filled) + "░".repeat(empty);
  return `[${bar}]`;
}
