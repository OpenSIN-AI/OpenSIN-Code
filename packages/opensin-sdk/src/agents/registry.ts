/**
 * A2A SIN Agent Registry
 *
 * Central registry of all available SIN agents (built-in + user-defined).
 * Provides lookup, listing, and registration capabilities.
 */

import type { SinAgentDefinition, AgentSource } from './types.js'

class SinAgentRegistry {
  private agents: Map<string, SinAgentDefinition> = new Map()

  /**
   * Register a built-in agent definition.
   */
  register(definition: SinAgentDefinition): void {
    this.agents.set(definition.agentType, definition)
  }

  /**
   * Get an agent definition by type.
   */
  get(agentType: string): SinAgentDefinition | undefined {
    return this.agents.get(agentType)
  }

  /**
   * Check if an agent type exists.
   */
  has(agentType: string): boolean {
    return this.agents.has(agentType)
  }

  /**
   * List all registered agents.
   */
  list(): { agentType: string; whenToUse: string; source: AgentSource }[] {
    return Array.from(this.agents.entries()).map(([type, def]) => ({
      agentType: type,
      whenToUse: def.whenToUse,
      source: def.source || 'built-in',
    }))
  }

  /**
   * Get all agents of a specific source.
   */
  listBySource(source: AgentSource): SinAgentDefinition[] {
    return Array.from(this.agents.values()).filter(a => a.source === source)
  }

  /**
   * Remove an agent from the registry.
   */
  unregister(agentType: string): boolean {
    return this.agents.delete(agentType)
  }

  /**
   * Clear all registered agents.
   */
  clear(): void {
    this.agents.clear()
  }

  /**
   * Get count of registered agents.
   */
  get size(): number {
    return this.agents.size
  }
}

/**
 * Singleton registry instance.
 */
export const sinAgentRegistry = new SinAgentRegistry()

/**
 * Register all built-in SIN agents.
 */
export function registerBuiltInAgents(): void {
  // Import and register all built-in agents
  import('./built-in/sinExplorer.js').then(m => sinAgentRegistry.register(m.SIN_EXPLORER))
  import('./built-in/sinPlanner.js').then(m => sinAgentRegistry.register(m.SIN_PLANNER))
  import('./built-in/sinVerifier.js').then(m => sinAgentRegistry.register(m.SIN_VERIFIER))
  import('./built-in/sinCreator.js').then(m => sinAgentRegistry.register(m.SIN_CREATOR))
  import('./built-in/sinImageGen.js').then(m => sinAgentRegistry.register(m.SIN_IMAGE_GEN))
  import('./built-in/sinVideoGen.js').then(m => sinAgentRegistry.register(m.SIN_VIDEO_GEN))
  import('./built-in/sinTeamLead.js').then(m => sinAgentRegistry.register(m.SIN_TEAM_LEAD))
  import('./built-in/sinResearcher.js').then(m => sinAgentRegistry.register(m.SIN_RESEARCHER))
  import('./built-in/sinGuide.js').then(m => sinAgentRegistry.register(m.SIN_GUIDE))
}
