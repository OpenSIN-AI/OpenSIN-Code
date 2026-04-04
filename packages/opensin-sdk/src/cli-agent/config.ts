/**
 * CLI Agent Configuration Manager
 */

import type { CLIAgentConfig, CLICommandOptions } from "./types.js";

const DEFAULT_CONFIG: Omit<CLIAgentConfig, "sessionId" | "workspacePath"> = {
  model: "claude-sonnet-4-20250514",
  provider: "anthropic",
  maxTokens: 8192,
  temperature: 0.7,
  interactive: true,
  batchMode: false,
  contextWindowSize: 200000,
  toolTimeoutMs: 30000,
  autoApproveTools: ["read_file", "list_files", "grep"],
  verbose: false,
};

export function createDefaultConfig(overrides: Partial<CLIAgentConfig> = {}): CLIAgentConfig {
  return {
    ...DEFAULT_CONFIG,
    sessionId: overrides.sessionId ?? generateSessionId(),
    workspacePath: overrides.workspacePath ?? process.cwd(),
    ...overrides,
  } as CLIAgentConfig;
}

export function loadConfigFromFile(configPath: string): CLIAgentConfig | null {
  try {
    const fs = require("fs");
    const path = require("path");
    const fullPath = path.resolve(configPath);
    if (!fs.existsSync(fullPath)) return null;
    const raw = fs.readFileSync(fullPath, "utf-8");
    const parsed = JSON.parse(raw);
    return createDefaultConfig(parsed);
  } catch {
    return null;
  }
}

export function saveConfigToFile(config: CLIAgentConfig, configPath: string): boolean {
  try {
    const fs = require("fs");
    const path = require("path");
    const fullPath = path.resolve(configPath);
    const dir = path.dirname(fullPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(fullPath, JSON.stringify(config, null, 2), "utf-8");
    return true;
  } catch {
    return false;
  }
}

export function mergeCommandOptions(config: CLIAgentConfig, options: CLICommandOptions): CLIAgentConfig {
  return {
    ...config,
    model: options.model ?? config.model,
    temperature: options.temperature ?? config.temperature,
    maxTokens: options.maxTokens ?? config.maxTokens,
    verbose: options.verbose ?? config.verbose,
  };
}

export function validateConfig(config: CLIAgentConfig): string[] {
  const errors: string[] = [];

  if (!config.sessionId) errors.push("sessionId is required");
  if (!config.workspacePath) errors.push("workspacePath is required");
  if (!config.model) errors.push("model is required");
  if (!config.provider) errors.push("provider is required");
  if (config.temperature < 0 || config.temperature > 2) errors.push("temperature must be between 0 and 2");
  if (config.maxTokens < 1) errors.push("maxTokens must be positive");
  if (config.contextWindowSize < 1000) errors.push("contextWindowSize must be at least 1000");

  return errors;
}

export function getConfigDefaults(): Record<string, unknown> {
  return {
    model: DEFAULT_CONFIG.model,
    provider: DEFAULT_CONFIG.provider,
    maxTokens: DEFAULT_CONFIG.maxTokens,
    temperature: DEFAULT_CONFIG.temperature,
    interactive: DEFAULT_CONFIG.interactive,
    batchMode: DEFAULT_CONFIG.batchMode,
    contextWindowSize: DEFAULT_CONFIG.contextWindowSize,
    toolTimeoutMs: DEFAULT_CONFIG.toolTimeoutMs,
    autoApproveTools: DEFAULT_CONFIG.autoApproveTools,
    verbose: DEFAULT_CONFIG.verbose,
  };
}

function generateSessionId(): string {
  return `cli-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
