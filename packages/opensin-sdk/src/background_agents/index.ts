/**
 * OpenSIN Background Agents — Public API
 *
 * Claude Code-style background agent delegation for OpenSIN-Code.
 *
 * Branded as OpenSIN/sincode.
 */

// Core Manager
export { BackgroundAgentManager } from './agent_manager.js';

// CLI Commands
export { BackgroundAgentCliHandler } from './cli_commands.js';
export type { CliCommandResult } from './cli_commands.js';

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
  DelegationStatus,
  TerminalStatus,
  DelegationProgress,
  DelegationArtifact,
  DelegationRetrieval,
  DelegationRecord,
  SpawnBackgroundAgentRequest,
  SpawnBackgroundAgentResult,
  DelegationListItem,
  BackgroundAgentEventType,
  BackgroundAgentEvent,
  BackgroundAgentEventListener,
  BackgroundAgentManagerConfig,
  BackgroundLLMCaller,
  BackgroundToolExecutor,
} from './types.js';

export {
  isTerminalStatus,
  isActiveStatus,
  DEFAULT_BACKGROUND_AGENT_CONFIG,
} from './types.js';
