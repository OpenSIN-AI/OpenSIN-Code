/**
 * OpenSIN agent status slash command.
 *
 * WHAT: Implements `/agents status <id> [--watch]` using `BackgroundAgentManager.getAgent`.
 * WHY: Operators need a detailed card view for one agent plus an optional live watch mode while
 *      the agent is still running.
 * WHY NOT A SEPARATE STREAMING SUBSYSTEM: The issue only calls for polling and terminal refresh,
 *      so a small watch loop inside the command is simpler and easier to reason about.
 * DEPENDENCIES: Requires command runtime context with manager access and, for the best watch
 *      experience, optional terminal writer/clear hooks supplied by the CLI shell.
 * CONSEQUENCES: In non-interactive contexts the command still works, but watch mode degrades to
 *      repeated snapshots concatenated into one response if no writer is available.
 */

import { isTerminalStatus } from '../background_agents/types.js'
import {
  WATCH_SPINNER_FRAMES,
  renderAgentCard,
  sleep,
} from './agentsShared.js'
import { CommandCategory, type CommandExecutionContext, type CommandSpec } from './index.js'

/**
 * Parsed status command arguments.
 */
export interface AgentsStatusArguments {
  agentId: string
  watch: boolean
}

/**
 * Parse `/agents status` arguments.
 *
 * WHAT: Accepts `<id>` plus an optional `--watch` flag in any order after the id.
 * WHY: Keeping the parser explicit gives predictable errors and simplifies unit tests.
 */
export function parseAgentsStatusArguments(rawArgs?: string): AgentsStatusArguments {
  const source = (rawArgs ?? '').trim()
  if (!source) {
    throw new Error('Usage: /agents status <id> [--watch]')
  }

  const tokens = source.split(/\s+/).filter(Boolean)
  const agentId = tokens[0]
  const extraTokens = tokens.slice(1)

  const watchTokens = extraTokens.filter((token) => token === '--watch')
  const invalidTokens = extraTokens.filter((token) => token !== '--watch')

  if (!agentId) {
    throw new Error('Usage: /agents status <id> [--watch]')
  }

  if (invalidTokens.length > 0) {
    throw new Error(`Unknown option(s): ${invalidTokens.join(', ')}`)
  }

  return {
    agentId,
    watch: watchTokens.length > 0,
  }
}

/**
 * Produce a single status snapshot.
 *
 * WHAT: Builds the card string for the current agent state, optionally with a spinner frame.
 * WHY: Both one-shot and watch mode need exactly the same rendering logic.
 */
function renderStatusSnapshot(
  context: CommandExecutionContext,
  agentId: string,
  spinnerIndex: number,
): string {
  const agent = context.backgroundAgentManager?.getAgent(agentId)
  if (!agent) {
    throw new Error(`OpenSIN background agent not found: ${agentId}`)
  }

  const spinnerFrame = isTerminalStatus(agent.status)
    ? undefined
    : WATCH_SPINNER_FRAMES[spinnerIndex % WATCH_SPINNER_FRAMES.length]

  return renderAgentCard(agent, spinnerFrame)
}

/**
 * Poll the manager until the agent becomes terminal or watch mode is aborted.
 *
 * WHAT: Re-renders the card every interval and writes it directly to the terminal if the CLI
 *      provided writer hooks.
 * WHY: This satisfies the issue's `--watch` acceptance criteria without changing manager state.
 * CONSEQUENCES: The loop is intentionally conservative and sleeps between polls to avoid busy
 *      waiting in the terminal process.
 */
async function watchAgentStatus(
  context: CommandExecutionContext,
  agentId: string,
): Promise<string> {
  const refreshIntervalMs = context.watchIntervalMs ?? 1_000
  const snapshots: string[] = []
  let spinnerIndex = 0

  while (true) {
    const snapshot = renderStatusSnapshot(context, agentId, spinnerIndex)
    snapshots.push(snapshot)

    if (context.clearTerminal) {
      context.clearTerminal()
    }

    if (context.writeLine) {
      context.writeLine(snapshot)
    }

    const agent = context.backgroundAgentManager?.getAgent(agentId)
    if (!agent) {
      throw new Error(`OpenSIN background agent disappeared while watching: ${agentId}`)
    }

    if (isTerminalStatus(agent.status) || context.abortSignal?.aborted) {
      return snapshots[snapshots.length - 1]
    }

    spinnerIndex += 1
    await sleep(refreshIntervalMs)
  }
}

/**
 * Command handler for `/agents status`.
 */
export async function handleAgentsStatus(
  rawArgs: string | undefined,
  context?: CommandExecutionContext,
): Promise<string> {
  if (!context?.backgroundAgentManager) {
    throw new Error('Background agents are not configured for this CLI session yet.')
  }

  const args = parseAgentsStatusArguments(rawArgs)
  const agent = context.backgroundAgentManager.getAgent(args.agentId)
  if (!agent) {
    throw new Error(`OpenSIN background agent not found: ${args.agentId}`)
  }

  if (!args.watch) {
    return renderAgentCard(agent)
  }

  return watchAgentStatus(context, args.agentId)
}

/**
 * Command registration exported for the shared registry.
 */
export const agentsStatusCommands: CommandSpec[] = [
  {
    name: 'agents status',
    aliases: [],
    description: 'Show detailed OpenSIN background agent status',
    argumentHint: '<id> [--watch]',
    resumeSupported: true,
    category: CommandCategory.Agents,
    handler: handleAgentsStatus,
  },
]
