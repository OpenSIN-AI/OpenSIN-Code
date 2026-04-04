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
} from './types.js'

// Registry
export { sinAgentRegistry, registerBuiltInAgents } from './registry.js'

// Built-in Agents
export { SIN_EXPLORER } from './built-in/sinExplorer.js'
export { SIN_PLANNER } from './built-in/sinPlanner.js'
export { SIN_VERIFIER } from './built-in/sinVerifier.js'
export { SIN_CREATOR } from './built-in/sinCreator.js'
export { SIN_IMAGE_GEN } from './built-in/sinImageGen.js'
export { SIN_VIDEO_GEN } from './built-in/sinVideoGen.js'
export { SIN_TEAM_LEAD } from './built-in/sinTeamLead.js'
export { SIN_RESEARCHER } from './built-in/sinResearcher.js'
export { SIN_GUIDE } from './built-in/sinGuide.js'

/**
 * All built-in agent definitions as an array.
 */
import { SIN_EXPLORER } from './built-in/sinExplorer.js'
import { SIN_PLANNER } from './built-in/sinPlanner.js'
import { SIN_VERIFIER } from './built-in/sinVerifier.js'
import { SIN_CREATOR } from './built-in/sinCreator.js'
import { SIN_IMAGE_GEN } from './built-in/sinImageGen.js'
import { SIN_VIDEO_GEN } from './built-in/sinVideoGen.js'
import { SIN_TEAM_LEAD } from './built-in/sinTeamLead.js'
import { SIN_RESEARCHER } from './built-in/sinResearcher.js'
import { SIN_GUIDE } from './built-in/sinGuide.js'

import { sinAgentRegistry } from './registry.js'

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
