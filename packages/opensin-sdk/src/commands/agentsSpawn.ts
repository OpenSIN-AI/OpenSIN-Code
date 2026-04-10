/**
 * OpenSIN agent spawn slash command.
 *
 * WHAT: This command implements `/agents spawn ...` for the terminal slash-command layer.
 * WHY: The issue explicitly requires direct wiring into `BackgroundAgentManager`, so this
 *      file keeps the spawn orchestration close to the command surface instead of creating
 *      an extra transport or an HTTP round-trip.
 * WHY NOT ALTERNATIVES: We intentionally do not shell out to another CLI process and we do
 *      not proxy through the API client surface, because both options would add latency,
 *      duplicate validation, and drift away from the already-implemented manager contract.
 * DEPENDENCIES: This command depends on the command runtime context exposing a live
 *      `BackgroundAgentManager` plus the current parent session metadata.
 * CONSEQUENCES: The command can create real background agents immediately, but it also means
 *      the command layer must be initialized with a manager before `/agents spawn` is usable.
 */

import { CommandCategory, type CommandExecutionContext, type CommandSpec } from './index.js'

/**
 * Parsed argument bag for the spawn command.
 *
 * WHAT: We keep the parser output explicit so tests can validate the user-facing contract
 *      without having to instantiate the full CLI agent.
 * WHY: This command has the most complicated argument grammar in the new `/agents` family
 *      because it accepts both a free-form prompt and optional flags.
 */
export interface AgentsSpawnArguments {
  prompt: string
  agent: string
  title?: string
}

/**
 * Minimal ANSI color helper.
 *
 * WHAT: Returns the provided text wrapped in an ANSI escape sequence.
 * WHY: The issue requires colored output, but the package currently does not declare chalk
 *      or picocolors. Using a tiny helper lets us satisfy the requirement without adding a
 *      new dependency in the middle of an otherwise local CLI feature.
 * CONSEQUENCE: Colors are simple and deterministic, but not theme-aware.
 */
function color(text: string, openCode: number): string {
  return `\u001B[${openCode}m${text}\u001B[0m`
}

/**
 * Strip a single layer of matching quotes around a value.
 *
 * WHAT: Supports the common `/agents spawn "analyze codebase"` usage shown in the issue.
 * WHY: The slash command parser currently forwards a raw string, so this helper normalizes
 *      a friendly prompt without requiring shell-style tokenization for every case.
 */
function stripMatchingQuotes(value: string): string {
  const trimmed = value.trim()
  if (trimmed.length < 2) return trimmed

  const startsWithSingle = trimmed.startsWith("'") && trimmed.endsWith("'")
  const startsWithDouble = trimmed.startsWith('"') && trimmed.endsWith('"')
  if (!startsWithSingle && !startsWithDouble) return trimmed

  return trimmed.slice(1, -1).trim()
}

/**
 * Split the raw spawn argument string into its prompt section and supported flags.
 *
 * WHAT: We scan for `--agent` and `--title` markers while preserving whitespace inside the
 *      free-form prompt.
 * WHY: A naive `split(/\s+/)` approach would destroy multi-word prompts and titles, which
 *      would make the command unpleasant to use from the terminal.
 * WHY NOT FULL SHELL PARSER: That would be overkill here because the command grammar is small
 *      and stable, so a focused parser is easier to audit and maintain.
 */
export function parseAgentsSpawnArguments(rawArgs?: string): AgentsSpawnArguments {
  const source = (rawArgs ?? '').trim()
  if (!source) {
    throw new Error('Usage: /agents spawn <prompt> [--agent <type>] [--title <title>]')
  }

  const flagPattern = /\s--(agent|title)\s+/g
  const matches = Array.from(source.matchAll(flagPattern))
  const firstFlagIndex = matches[0]?.index ?? source.length

  const prompt = stripMatchingQuotes(source.slice(0, firstFlagIndex))
  if (!prompt) {
    throw new Error('Spawn prompt is required. Example: /agents spawn "analyze codebase"')
  }

  let agent = 'general-purpose'
  let title: string | undefined

  for (let index = 0; index < matches.length; index += 1) {
    const match = matches[index]
    const flagName = match[1]
    const valueStart = (match.index ?? 0) + match[0].length
    const valueEnd = matches[index + 1]?.index ?? source.length
    const rawValue = stripMatchingQuotes(source.slice(valueStart, valueEnd))

    if (!rawValue) {
      throw new Error(`Missing value for --${flagName}`)
    }

    if (flagName === 'agent') {
      agent = rawValue
      continue
    }

    title = rawValue
  }

  return { prompt, agent, title }
}

/**
 * Format the happy-path confirmation returned to the human operator.
 *
 * WHAT: Produces a concise multi-line summary with the new agent id and key metadata.
 * WHY: Spawn is an action command, so the operator primarily needs confirmation plus the id
 *      required by the follow-up `/agents status`, `/agents kill`, and `/agents read` calls.
 */
function formatSpawnSuccess(args: AgentsSpawnArguments, agentId: string): string {
  const heading = color('OpenSIN background agent started', 32)
  const lines = [
    heading,
    `  id: ${agentId}`,
    `  type: ${args.agent}`,
    `  prompt: ${args.prompt}`,
  ]

  if (args.title) {
    lines.push(`  title: ${args.title}`)
  }

  lines.push(`  next: /agents status ${agentId}`)
  return lines.join('\n')
}

/**
 * Real command handler for `/agents spawn`.
 *
 * WHAT: Parses user input, creates the manager-backed background agent, and returns a
 *      branded confirmation message.
 * WHY: This keeps command logic thin: parsing and user messaging live here, while execution
 *      stays delegated to `BackgroundAgentManager`.
 * CONSEQUENCE: If the runtime context was not initialized, the operator gets an actionable
 *      error instead of a silent failure.
 */
export async function handleAgentsSpawn(
  rawArgs: string | undefined,
  context?: CommandExecutionContext,
): Promise<string> {
  if (!context?.backgroundAgentManager) {
    throw new Error('Background agents are not configured for this CLI session yet.')
  }

  if (!context.sessionId) {
    throw new Error('Current CLI session is missing a session id, so the agent cannot be spawned.')
  }

  const args = parseAgentsSpawnArguments(rawArgs)
  const parentMessageID = context.parentMessageId ?? `cli-msg-${Date.now()}`
  const parentAgent = context.parentAgentName ?? 'opensin-cli'

  const agentRecord = await context.backgroundAgentManager.spawn({
    parentSessionID: context.sessionId,
    parentMessageID,
    parentAgent,
    prompt: args.prompt,
    agent: args.agent,
  })

  /**
   * WHAT: Persist an optional human-friendly title directly onto the in-memory record.
   * WHY: The current manager API does not expose a dedicated title setter, and adding one
   *      would expand the manager surface for a purely presentational concern.
   * CONSEQUENCE: The title survives for the current process lifetime, which is enough for
   *      the interactive CLI flow this issue is targeting.
   */
  if (args.title) {
    agentRecord.title = args.title
  }

  return formatSpawnSuccess(args, agentRecord.id)
}

/**
 * Command registration exported for the shared registry.
 *
 * WHAT: Registers the multi-word slash command name `agents spawn`.
 * WHY: Keeping each `/agents ...` action in its own file mirrors the issue breakdown and
 *      keeps test targets small and focused.
 */
export const agentsSpawnCommands: CommandSpec[] = [
  {
    name: 'agents spawn',
    aliases: [],
    description: 'Spawn an OpenSIN background agent',
    argumentHint: '<prompt> [--agent <type>] [--title <title>]',
    resumeSupported: true,
    category: CommandCategory.Agents,
    handler: handleAgentsSpawn,
  },
]
