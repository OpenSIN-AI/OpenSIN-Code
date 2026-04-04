export type {
  LiveStatusSnapshot,
  TokenUsageDelta,
  TokenUsageDelta as TokenUsage,
  CostInfo,
  LiveStatusConfig,
  LiveStatusConfig as StatusMonitorConfig,
  StatusDisplayOptions,
  StatusDisplayOptions as StatusDisplayMode,
  ModelInfo,
  TurnInfo,
  StreamingStatusUpdate,
} from "./types.js";
export { StatusMonitor } from "./status_monitor.js";
export { StatusDisplay } from "./display.js";

import type { LiveStatusConfig } from "./types.js";
import { StatusMonitor } from "./status_monitor.js";
import { StatusDisplay } from "./display.js";

export function renderLiveStatus(
  sessionId: string,
  modelId: string,
  config?: Partial<LiveStatusConfig>,
): StatusMonitor {
  const monitor = new StatusMonitor(sessionId, modelId, config);
  const display = new StatusDisplay();
  monitor.onStatusUpdate((snapshot) => display.update(snapshot));
  display.show();
  return monitor;
}
