/**
 * OpenSIN agent read slash command.
 *
 * WHAT: Implements `/agents read <id>` using `BackgroundAgentManager.readAgentResult`.
 * WHY: The operator needs a direct terminal way to retrieve the final result of a background
 *      agent without manually opening artifacts on disk.
 * WHY NOT READ FILES DIRECTLY: The manager already encapsulates persistence timing, fallback
 *      behavior, and deterministic interim responses, so the command should reuse that logic.
 * DEPENDENCIES: Requires command runtime context with a live manager and current reader session.
 * CONSEQUENCES: Reading a still-running agent may return the manager's deterministic interim
 *      response until persistence finishes, which is exactly the behavior the manager promises.
 */

import { color } from './agentsShared.js'
import { CommandCategory, type CommandExecutionContext, type CommandSpec } from './index.js'

/**
 * Parse `/agents read` arguments.
 */
export function parseAgentsReadArguments(rawArgs?: string): { agentId: string } {
  const source = (rawArgs ?? '').trim()
  if (!source) {
    throw new Error('Usage: /agents read <id>')
  }

  const tokens = source.split(/\s+/).filter(Boolean)
  if (tokens.length !== 1) {
    throw new Error('Usage: /agents read <id>')
  }

  return { agentId: tokens[0] }
}

/**
 * Command handler for `/agents read`.
 */
export async function handleAgentsRead(
  rawArgs: string | undefined,
  context?: CommandExecutionContext,
): Promise<string> {
  if (!context?.backgroundAgentManager) {
    throw new Error('Background agents are not configured for this CLI session yet.')
  }

  if (!context.sessionId) {
    throw new Error('Current CLI session is missing a session id, so the agent result cannot be read.')
  }

  const { agentId } = parseAgentsReadArguments(rawArgs)
  const result = await context.backgroundAgentManager.readAgentResult(agentId, context.sessionId)

  return [
    color(`OpenSIN background agent result: ${agentId}`, 32),
    '',
    result,
  ].join('\n')
}

/**
 * Command registration exported for the shared registry.
 */
export const agentsReadCommands: CommandSpec[] = [
  {
    name: 'agents read',
    aliases: [],
    description: 'Read an OpenSIN background agent result',
    argumentHint: '<id>',
    resumeSupported: true,
    category: CommandCategory.Agents,
    handler: handleAgentsRead,
  },
]
