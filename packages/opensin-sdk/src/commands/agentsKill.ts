/**
 * OpenSIN agent kill slash command.
 *
 * WHAT: Implements `/agents kill <id>` using `BackgroundAgentManager.kill`.
 * WHY: Operators need an immediate terminal control to stop background work that is no longer
 *      useful or was started with the wrong prompt.
 * WHY NOT SOFT-CANCEL FIRST: The current manager API already exposes one direct kill path, so
 *      this command intentionally mirrors that contract rather than inventing additional states.
 * DEPENDENCIES: Requires a live manager in the command runtime context.
 * CONSEQUENCES: Killing a terminal/completed agent produces a clear actionable message instead
 *      of pretending the operation succeeded.
 */

import { isTerminalStatus } from '../background_agents/types.js'
import { color, formatStatusBadge } from './agentsShared.js'
import { CommandCategory, type CommandExecutionContext, type CommandSpec } from './index.js'

/**
 * Parse `/agents kill` arguments.
 */
export function parseAgentsKillArguments(rawArgs?: string): { agentId: string } {
  const source = (rawArgs ?? '').trim()
  if (!source) {
    throw new Error('Usage: /agents kill <id>')
  }

  const tokens = source.split(/\s+/).filter(Boolean)
  if (tokens.length !== 1) {
    throw new Error('Usage: /agents kill <id>')
  }

  return { agentId: tokens[0] }
}

/**
 * Command handler for `/agents kill`.
 */
export async function handleAgentsKill(
  rawArgs: string | undefined,
  context?: CommandExecutionContext,
): Promise<string> {
  if (!context?.backgroundAgentManager) {
    throw new Error('Background agents are not configured for this CLI session yet.')
  }

  const { agentId } = parseAgentsKillArguments(rawArgs)
  const existingAgent = context.backgroundAgentManager.getAgent(agentId)

  if (!existingAgent) {
    throw new Error(`OpenSIN background agent not found: ${agentId}`)
  }

  if (isTerminalStatus(existingAgent.status)) {
    throw new Error(
      `OpenSIN background agent ${agentId} is already terminal (${existingAgent.status}). Use /agents read ${agentId} for the result.`,
    )
  }

  const killed = await context.backgroundAgentManager.kill(agentId)
  if (!killed) {
    throw new Error(`OpenSIN background agent ${agentId} could not be killed.`)
  }

  return [
    color('OpenSIN background agent cancelled', 33),
    `  id: ${agentId}`,
    `  status: ${formatStatusBadge('cancelled')}`,
    '  next: /agents list --status cancelled',
  ].join('\n')
}

/**
 * Command registration exported for the shared registry.
 */
export const agentsKillCommands: CommandSpec[] = [
  {
    name: 'agents kill',
    aliases: [],
    description: 'Cancel a running OpenSIN background agent',
    argumentHint: '<id>',
    resumeSupported: true,
    category: CommandCategory.Agents,
    handler: handleAgentsKill,
  },
]
