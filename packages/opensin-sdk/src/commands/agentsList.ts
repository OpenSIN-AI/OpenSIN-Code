/**
 * OpenSIN agent list slash command.
 *
 * WHAT: Implements `/agents list [--status ...]` on top of `BackgroundAgentManager.listAgents`.
 * WHY: Operators need a fast, table-oriented overview of every background agent that belongs
 *      to the current CLI session.
 * WHY NOT AN API ROUND-TRIP: The issue requires direct manager integration, and the manager
 *      already owns the authoritative in-process state.
 * DEPENDENCIES: Requires command runtime context with a live `BackgroundAgentManager` and the
 *      current parent session id.
 * CONSEQUENCES: The list only shows agents from the active CLI session, which matches the
 *      current manager API and keeps output scoped to the operator's current work.
 */

import type { BackgroundAgentStatus } from '../background_agents/types.js'
import { renderAgentTable } from './agentsShared.js'
import { CommandCategory, type CommandExecutionContext, type CommandSpec } from './index.js'

/**
 * Supported `/agents list --status ...` filters.
 *
 * WHAT: Restricts the command to the status values requested in the issue.
 * WHY: Being explicit keeps error messages crisp and prevents operators from assuming arbitrary
 *      filter expressions are available when they are not.
 */
export type AgentsListFilter = BackgroundAgentStatus | 'all'

/**
 * Parse the optional `--status` filter.
 *
 * WHAT: Accepts either no args or a single `--status <value>` pair.
 * WHY: The issue only requires one filter flag, so the parser stays intentionally narrow.
 */
export function parseAgentsListArguments(rawArgs?: string): { status: AgentsListFilter } {
  const source = (rawArgs ?? '').trim()
  if (!source) {
    return { status: 'all' }
  }

  const match = source.match(/^--status\s+(registered|running|complete|error|cancelled|timeout|all)$/i)
  if (!match) {
    throw new Error(
      'Usage: /agents list [--status registered|running|complete|error|cancelled|timeout|all]',
    )
  }

  return { status: match[1].toLowerCase() as AgentsListFilter }
}

/**
 * Filter agent rows according to the parsed status argument.
 *
 * WHAT: Applies the optional status constraint before rendering the table.
 * WHY: Filtering at the command layer avoids growing the manager API for a trivial projection.
 */
function filterAgentsByStatus<T extends { status: BackgroundAgentStatus }>(
  items: T[],
  status: AgentsListFilter,
): T[] {
  if (status === 'all') {
    return items
  }

  return items.filter((item) => item.status === status)
}

/**
 * Command handler for `/agents list`.
 *
 * WHAT: Retrieves session-scoped agent rows, applies the optional filter, and renders the
 *      required table view.
 * WHY: Keeping the output logic here means the CLI can evolve independently from the underlying
 *      manager contract.
 */
export async function handleAgentsList(
  rawArgs: string | undefined,
  context?: CommandExecutionContext,
): Promise<string> {
  if (!context?.backgroundAgentManager) {
    throw new Error('Background agents are not configured for this CLI session yet.')
  }

  if (!context.sessionId) {
    throw new Error('Current CLI session is missing a session id, so agents cannot be listed.')
  }

  const args = parseAgentsListArguments(rawArgs)
  const items = await context.backgroundAgentManager.listAgents(context.sessionId)
  const filteredItems = filterAgentsByStatus(items, args.status)

  if (filteredItems.length === 0) {
    return args.status === 'all'
      ? 'No OpenSIN background agents found for this session.'
      : `No OpenSIN background agents matched status filter: ${args.status}`
  }

  return renderAgentTable(filteredItems)
}

/**
 * Command registration exported for the shared registry.
 */
export const agentsListCommands: CommandSpec[] = [
  {
    name: 'agents list',
    aliases: [],
    description: 'List OpenSIN background agents',
    argumentHint: '[--status registered|running|complete|error|cancelled|timeout|all]',
    resumeSupported: true,
    category: CommandCategory.Agents,
    handler: handleAgentsList,
  },
]
