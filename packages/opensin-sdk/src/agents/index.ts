/**
 * A2A SIN Agents — Agent System for OpenSIN-Code
 *
 * Provides built-in agent definitions, a registry for agent management,
 * and a spawn system for creating agent instances.
 *
 * Architecture mirrors the Claude Code sub-agent pattern but is fully
 * rebranded for the OpenSIN ecosystem.
 */

// Types
export type {
  SinAgentDefinition,
  SpawnedAgent,
  SpawnAgentRequest,
  SpawnAgentResult,
  AgentColorName,
  AgentSource,
  AgentIsolation,
  AgentMemory,
  AgentModel,
  PermissionMode,
  AgentMcpServerSpec,
  HooksSetting,
} from './types'

// Registry
export { sinAgentRegistry, registerBuiltInAgents } from './registry'

// Built-in Agents
export { SIN_EXPLORER } from './built-in/sinExplorer'
export { SIN_PLANNER } from './built-in/sinPlanner'
export { SIN_VERIFIER } from './built-in/sinVerifier'
export { SIN_CREATOR } from './built-in/sinCreator'
export { SIN_IMAGE_GEN } from './built-in/sinImageGen'
export { SIN_VIDEO_GEN } from './built-in/sinVideoGen'
export { SIN_TEAM_LEAD } from './built-in/sinTeamLead'
export { SIN_RESEARCHER } from './built-in/sinResearcher'
export { SIN_GUIDE } from './built-in/sinGuide'

/**
 * All built-in agent definitions as an array.
 */
import { SIN_EXPLORER } from './built-in/sinExplorer'
import { SIN_PLANNER } from './built-in/sinPlanner'
import { SIN_VERIFIER } from './built-in/sinVerifier'
import { SIN_CREATOR } from './built-in/sinCreator'
import { SIN_IMAGE_GEN } from './built-in/sinImageGen'
import { SIN_VIDEO_GEN } from './built-in/sinVideoGen'
import { SIN_TEAM_LEAD } from './built-in/sinTeamLead'
import { SIN_RESEARCHER } from './built-in/sinResearcher'
import { SIN_GUIDE } from './built-in/sinGuide'

import { sinAgentRegistry } from './registry'

export const BUILT_IN_AGENTS = [
  SIN_EXPLORER,
  SIN_PLANNER,
  SIN_VERIFIER,
  SIN_CREATOR,
  SIN_IMAGE_GEN,
  SIN_VIDEO_GEN,
  SIN_TEAM_LEAD,
  SIN_RESEARCHER,
  SIN_GUIDE,
]

/**
 * Register all built-in agents synchronously.
 */
export function registerAllAgents(): void {
  for (const agent of BUILT_IN_AGENTS) {
    sinAgentRegistry.register(agent)
  }
}
