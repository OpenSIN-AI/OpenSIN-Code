/**
 * OpenSIN Code - Background Agents Plugin
 * Barrel export for the background agents module
 *
 * Branded: OpenSIN/sincode
 */

export { BackgroundAgentManager } from './manager.js'
export type {
  BackgroundAgentStatus,
  TerminalStatus,
  BackgroundAgentRecord,
  SpawnAgentInput,
  AgentListItem,
  AgentManagerOptions,
  AgentProgress,
  AgentNotificationState,
  AgentRetrievalState,
  AgentArtifactState,
} from './types.js'
export {
  isTerminalStatus,
  isActiveStatus,
  DEFAULT_MAX_RUN_TIME_MS,
  TERMINAL_WAIT_GRACE_MS,
  READ_POLL_INTERVAL_MS,
  ALL_COMPLETE_QUIET_PERIOD_MS,
} from './types.js'
