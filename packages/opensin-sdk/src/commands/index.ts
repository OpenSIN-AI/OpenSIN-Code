/**
 * Central slash-command registry for the lightweight OpenSIN CLI agent surface.
 *
 * WHAT: This module owns command metadata, command parsing, command lookup, and help rendering.
 * WHY: The individual command files should focus on one command each, while this file keeps the
 *      shared registry rules in one place.
 * WHY NOT A BIG SWITCH STATEMENT IN THE CLI: A registry is easier to extend and test, and the
 *      issue explicitly asks for command registration in the existing command registry.
 * DEPENDENCIES: Depends on the per-category command arrays and the optional background-agent
 *      runtime context used by the new `/agents ...` family.
 * CONSEQUENCES: Multi-word commands such as `/agents spawn` are now first-class citizens across
 *      lookup, help, and suggestions, which is necessary for this issue.
 */

import type { BackgroundAgentManager } from '../background_agents/manager.js'
import { agentsKillCommands } from './agentsKill.js'
import { agentsListCommands } from './agentsList.js'
import { agentsReadCommands } from './agentsRead.js'
import { agentsSpawnCommands } from './agentsSpawn.js'
import { agentsStatusCommands } from './agentsStatus.js'
import { navigationCommands } from './navigation.js'
import { projectCommands } from './project.js'
import { sessionCommands } from './session.js'
import { systemCommands } from './system.js'
import { toolCommands } from './tool.js'

/**
 * Runtime context passed into slash command handlers.
 *
 * WHAT: Exposes the small amount of mutable session/runtime state that command handlers need.
 * WHY: The original command API only accepted a raw argument string, which was enough for stub
 *      handlers but not enough for real background-agent control.
 * CONSEQUENCES: Commands remain framework-light, but the CLI shell can now inject live runtime
 *      capabilities such as the background-agent manager and watch-mode output hooks.
 */
export interface CommandExecutionContext {
  sessionId?: string
  parentMessageId?: string
  parentAgentName?: string
  backgroundAgentManager?: BackgroundAgentManager
  writeLine?: (line: string) => void
  clearTerminal?: () => void
  abortSignal?: AbortSignal
  watchIntervalMs?: number
}

/**
 * Command metadata consumed by lookup, help, and the CLI shell.
 */
export interface CommandSpec {
  name: string
  aliases: string[]
  description: string
  argumentHint?: string
  resumeSupported: boolean
  category: CommandCategory
  handler: CommandHandler
}

/**
 * Handler signature used by every command implementation.
 */
export type CommandHandler = (
  args?: string,
  context?: CommandExecutionContext,
) => Promise<string> | string

/**
 * High-level command buckets used by help output.
 */
export enum CommandCategory {
  Session = 'Session',
  Navigation = 'Navigation',
  Tool = 'Tool',
  Project = 'Project',
  Agents = 'Agents',
  System = 'System',
}

/**
 * Result of parsing a slash command string.
 *
 * WHAT: Separates the matched command name from its trailing raw args.
 * WHY: Multi-word command names require us to know exactly which registered command matched
 *      before we can safely treat the remainder as arguments.
 */
export interface ParsedCommand {
  name: string
  args?: string
}

/**
 * Flat command registry.
 */
export const allCommands: CommandSpec[] = [
  ...sessionCommands,
  ...navigationCommands,
  ...toolCommands,
  ...projectCommands,
  ...agentsSpawnCommands,
  ...agentsListCommands,
  ...agentsStatusCommands,
  ...agentsKillCommands,
  ...agentsReadCommands,
  ...systemCommands,
]

/**
 * Lower-case slash command names/aliases and prefer the longest names first.
 *
 * WHAT: `/agents status` must win over a hypothetical `/agents` command if both exist.
 * WHY: Longest-prefix matching is the simplest correct rule for multi-word commands.
 */
function getOrderedCommandEntries(commands: CommandSpec[]): Array<{
  command: CommandSpec
  candidate: string
}> {
  return commands
    .flatMap((command) => [command.name, ...command.aliases].map((candidate) => ({
      command,
      candidate: candidate.toLowerCase(),
    })))
    .sort((left, right) => right.candidate.length - left.candidate.length)
}

/**
 * Parse user input into a registered command plus its trailing args.
 *
 * WHAT: Matches against the real registry instead of only taking the first token.
 * WHY: This is what enables `/agents spawn`, `/agents list`, and the rest of the new issue
 *      scope without breaking single-word commands.
 */
export function parseCommand(input: string): ParsedCommand | undefined {
  const trimmed = input.trim()
  if (!trimmed.startsWith('/')) return undefined

  const source = trimmed.slice(1).trim()
  if (!source) return undefined

  for (const entry of getOrderedCommandEntries(allCommands)) {
    if (source === entry.candidate) {
      return { name: entry.command.name }
    }

    if (source.startsWith(`${entry.candidate} `)) {
      return {
        name: entry.command.name,
        args: source.slice(entry.candidate.length).trim() || undefined,
      }
    }
  }

  const parts = source.split(/\s+/)
  const name = parts[0]?.toLowerCase()
  const args = parts.slice(1).join(' ').trim()
  if (!name) return undefined
  return { name, args: args || undefined }
}

/**
 * Resolve a command spec from raw input.
 */
export function findCommand(input: string): CommandSpec | undefined {
  const parsed = parseCommand(input)
  if (!parsed) return undefined

  return allCommands.find((command) => command.name === parsed.name)
}

/**
 * Suggest commands for tab-complete/help-like flows.
 *
 * WHAT: Scores both command names and aliases while returning canonical command names.
 * WHY: Suggestions should stay stable even if the user typed an alias.
 */
export function suggestCommands(input: string, limit = 5): string[] {
  const normalized = input.trim().startsWith('/')
    ? input.trim().slice(1).toLowerCase()
    : input.trim().toLowerCase()

  if (!normalized || limit === 0) return []

  const scored = allCommands
    .map((command) => {
      const candidates = [command.name, ...command.aliases].map((value) => value.toLowerCase())
      const exactMatch = candidates.some((candidate) => candidate === normalized)
      const prefixMatch = candidates.some((candidate) => candidate.startsWith(normalized))
      const containsMatch = candidates.some((candidate) => candidate.includes(normalized))

      if (exactMatch) return { command, score: 0 }
      if (prefixMatch) return { command, score: 1 }
      if (containsMatch) return { command, score: 2 }
      return null
    })
    .filter((value): value is { command: CommandSpec; score: number } => value !== null)
    .sort((left, right) => left.score - right.score)
    .slice(0, limit)
    .map(({ command }) => {
      return command.argumentHint
        ? `/${command.name} ${command.argumentHint}`
        : `/${command.name}`
    })

  return [...new Set(scored)]
}

/**
 * Render human-readable help for every registered command.
 */
export function renderHelp(): string {
  const categories = [
    { name: 'Session', commands: sessionCommands },
    { name: 'Navigation', commands: navigationCommands },
    { name: 'Tool', commands: toolCommands },
    { name: 'Project', commands: projectCommands },
    {
      name: 'Agents',
      commands: [
        ...agentsSpawnCommands,
        ...agentsListCommands,
        ...agentsStatusCommands,
        ...agentsKillCommands,
        ...agentsReadCommands,
      ],
    },
    { name: 'System', commands: systemCommands },
  ]

  const lines = ['Slash commands', '  Tab completes commands inside the REPL.']

  for (const { name, commands } of categories) {
    lines.push('', name)
    for (const command of commands) {
      const aliasSuffix = command.aliases.length > 0
        ? ` (aliases: ${command.aliases.map((alias) => `/${alias}`).join(', ')})`
        : ''
      const resumeSuffix = command.resumeSupported ? ' [resume]' : ''
      const nameString = command.argumentHint
        ? `/${command.name} ${command.argumentHint}`
        : `/${command.name}`
      lines.push(
        `  ${nameString.padEnd(72)} ${command.description}${aliasSuffix}${resumeSuffix}`,
      )
    }
  }

  return lines.join('\n')
}
