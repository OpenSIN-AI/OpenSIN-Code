/**
 * OpenSIN Background Agents — Public API
 *
 * Claude Code-style background agent delegation for OpenSIN-Code.
 *
 * Branded as OpenSIN/sincode.
 */

// Core Manager (manager.ts — the primary implementation used by tests)
export { BackgroundAgentManager } from './manager.js';

// CLI Commands
export { BackgroundAgentCommands } from './commands.js';
export type { CommandContext, CommandResult } from './commands.js';

// Stdin Handler
export { BackgroundAgentStdinHandler, BACKGROUND_AGENT_HELP } from './stdin_handler.js';
export type { StdinHandlerOptions } from './stdin_handler.js';

// Persistence
export {
  ensureDelegationsDir,
  getArtifactPath,
  persistDelegationResult,
  readArtifact,
  waitForArtifact,
  listArtifacts,
  deleteArtifact,
} from './persistence.js';

// ID Generation
export { generateDelegationId, generateSessionId, resetIdCounter } from './id_generator.js';

// Types
export type {
  BackgroundAgentStatus,
  TerminalStatus,
  DelegationProgress,
  DelegationArtifact,
  DelegationRetrieval,
  DelegationNotification,
  BackgroundAgentRecord,
  ParentNotificationState,
  SpawnAgentInput,
  SpawnAgentResult,
  AgentListItem,
  BackgroundAgentEvent,
  BackgroundAgentEventType,
  BackgroundAgentEventListener,
  BackgroundAgentConfig,
  // Legacy aliases
  DelegationStatus,
  DelegationRecord,
  SpawnBackgroundAgentRequest,
  SpawnBackgroundAgentResult,
  DelegationListItem,
  BackgroundAgentManagerConfig,
  BackgroundLLMCaller,
  BackgroundToolExecutor,
} from './types.js';

export {
  isTerminalStatus,
  isActiveStatus,
  DEFAULT_MAX_RUN_TIME_MS,
  DEFAULT_READ_POLL_INTERVAL_MS,
  DEFAULT_TERMINAL_WAIT_GRACE_MS,
  DEFAULT_ALL_COMPLETE_QUIET_PERIOD_MS,
  DEFAULT_BACKGROUND_AGENT_CONFIG,
} from './types.js';
