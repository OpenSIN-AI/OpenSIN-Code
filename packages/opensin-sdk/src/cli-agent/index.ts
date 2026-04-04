/**
 * CLI Agent — Terminal-based AI coding like Augment Code/Kilo Code
 *
 * Provides:
 * - Terminal-based AI coding agent
 * - Full Context Engine integration
 * - Interactive chat mode
 * - Batch processing mode
 * - Tool execution and result display
 */

export { CLIAgent } from "./agent.js";
export { SessionManager } from "./session.js";
export { ToolRegistry, createBuiltinTools } from "./tools.js";
export { createDefaultConfig, loadConfigFromFile, saveConfigToFile, mergeCommandOptions, validateConfig, getConfigDefaults } from "./config.js";

export type {
  CLIAgentConfig,
  CLIAgentSession,
  CLIMessage,
  CLIContext,
  CLITool,
  ToolCallRecord,
  ToolResult,
  TokenUsage,
  CLICommand,
  CLICommandOptions,
  CLIAgentState,
  CLIEvent,
} from "./types.js";
