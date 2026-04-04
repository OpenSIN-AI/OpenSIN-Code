export type {
  CliMode,
  CliConfig,
  NdjsonMessage,
  SessionRecord,
  HistoryEntry,
  StdinCommand,
  SessionResumeState,
  CliStatus,
} from "./types.js";

export { SessionManager } from "./session_manager.js";
export { HistoryManager } from "./history.js";
export { StdinHandler } from "./stdin_handler.js";

export async function createStandaloneCli(overrides?: Partial<CliConfig>): Promise<{
  start: () => Promise<void>;
  stop: () => void;
}> {
  const os = await import("os");
  const path = await import("path");

  const platform = process.platform as CliConfig["platform"];
  const historyDir = path.join(os.homedir(), ".opensin", "cli");

  const config: CliConfig = {
    baseUrl: "http://localhost:8000",
    cwd: process.cwd(),
    autoApprove: true,
    timeoutMs: 60000,
    historyFile: historyDir,
    maxHistoryEntries: 1000,
    imageSupport: true,
    platform: platform === "darwin" ? "darwin" : platform === "win32" ? "win32" : "linux-arm64",
    ...overrides,
  };

  const { SessionManager } = await import("./session_manager.js");
  const { HistoryManager } = await import("./history.js");
  const { StdinHandler } = await import("./stdin_handler.js");

  const sessionManager = new SessionManager(config);
  const historyManager = new HistoryManager(config);
  const stdinHandler = new StdinHandler(config, sessionManager, historyManager);

  return {
    start: () => stdinHandler.start(),
    stop: () => stdinHandler.stop(),
  };
}
