/**
 * Shared helpers for OpenSIN `/agents ...` slash commands.
 *
 * WHAT: Centralizes status coloring, table/card rendering, watch timing, and small formatting
 *       helpers used by the five agent-management commands.
 * WHY: The issue introduces a family of commands with the same visual language. A shared helper
 *      keeps the formatting consistent and avoids five slightly different implementations that
 *      would drift over time.
 * WHY NOT A FULL UI FRAMEWORK: The existing command layer returns plain strings, so a lightweight
 *      helper module is enough. Introducing a larger rendering abstraction here would add more
 *      moving parts than the current CLI needs.
 * DEPENDENCIES: These helpers intentionally depend only on background-agent types, so command
 *      files can stay focused on control flow and validation.
 * CONSEQUENCES: Formatting logic is now reusable and easier to test independently.
 */

import type {
  AgentListItem,
  BackgroundAgentRecord,
  BackgroundAgentStatus,
} from '../background_agents/types.js'

/**
 * Spinner frames used by the `--watch` status flow.
 *
 * WHAT: A tiny deterministic sequence for visually confirming that the CLI is still polling.
 * WHY: A running agent can otherwise look frozen during repeated refreshes.
 */
export const WATCH_SPINNER_FRAMES = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'] as const

/**
 * ANSI color wrapper used across agent command output.
 *
 * WHAT: Produces portable terminal colors without adding a new dependency.
 * WHY: The package currently has no declared color library, and the issue only needs basic,
 *      reliable status colors.
 */
export function color(text: string, openCode: number): string {
  return `\u001B[${openCode}m${text}\u001B[0m`
}

/**
 * Map a background-agent status to a colored label.
 *
 * WHAT: Gives every status a stable visual indicator for tables and cards.
 * WHY: Operators scan agent state far faster when terminal output is color-coded.
 */
export function formatStatusBadge(status: BackgroundAgentStatus): string {
  switch (status) {
    case 'complete':
      return color('● complete', 32)
    case 'running':
      return color('● running', 36)
    case 'registered':
      return color('● queued', 34)
    case 'error':
      return color('● error', 31)
    case 'cancelled':
      return color('● cancelled', 33)
    case 'timeout':
      return color('● timeout', 35)
    default:
      return status
  }
}

/**
 * Shorten long text so table output stays readable.
 *
 * WHAT: Trims long prompts/titles while keeping enough context for operators to recognize the
 *      right agent row.
 * WHY: Background prompts can be arbitrarily long, and unconstrained table columns would make
 *      `/agents list` wrap badly in a normal terminal.
 */
export function truncate(value: string | undefined, maxLength: number): string {
  const normalized = (value ?? '').trim()
  if (normalized.length <= maxLength) return normalized
  if (maxLength <= 1) return normalized.slice(0, maxLength)
  return `${normalized.slice(0, maxLength - 1)}…`
}

/**
 * Render an ISO-friendly timestamp in a compact operator-readable form.
 *
 * WHAT: Converts a `Date` into `YYYY-MM-DD HH:mm:ss` in local time.
 * WHY: The raw ISO form is precise but noisy in narrow terminal layouts.
 */
export function formatDateTime(value?: Date): string {
  if (!value) return '—'

  const year = value.getFullYear()
  const month = String(value.getMonth() + 1).padStart(2, '0')
  const day = String(value.getDate()).padStart(2, '0')
  const hours = String(value.getHours()).padStart(2, '0')
  const minutes = String(value.getMinutes()).padStart(2, '0')
  const seconds = String(value.getSeconds()).padStart(2, '0')
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

/**
 * Format elapsed runtime from start/end timestamps.
 *
 * WHAT: Returns `12s`, `3m 04s`, or `1h 02m` depending on duration.
 * WHY: Operators care about how long an agent has been running or took to finish, not just the
 *      absolute timestamps.
 */
export function formatDuration(start?: Date, end?: Date): string {
  if (!start) return '—'

  const totalMs = Math.max(0, (end ?? new Date()).getTime() - start.getTime())
  const totalSeconds = Math.floor(totalMs / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  if (hours > 0) {
    return `${hours}h ${String(minutes).padStart(2, '0')}m`
  }

  if (minutes > 0) {
    return `${minutes}m ${String(seconds).padStart(2, '0')}s`
  }

  return `${seconds}s`
}

/**
 * Normalize agent records into a table view.
 *
 * WHAT: Creates the operator-facing `/agents list` table requested by the issue.
 * WHY: The table view is the fastest way to scan multiple agents in one command response.
 */
export function renderAgentTable(items: AgentListItem[]): string {
  if (items.length === 0) {
    return 'No OpenSIN background agents found for this session.'
  }

  const headers = ['ID', 'Status', 'Type', 'Title', 'Created', 'Done']
  const rows = items.map((item) => [
    item.id,
    formatStatusBadge(item.status),
    truncate(item.agent ?? 'general-purpose', 18),
    truncate(item.title ?? item.description ?? item.prompt ?? '—', 32),
    formatDateTime(item.createdAt),
    formatDateTime(item.completedAt),
  ])

  const widths = headers.map((header, index) => {
    return Math.max(
      header.length,
      ...rows.map((row) => stripAnsi(row[index]).length),
    )
  })

  const headerLine = headers
    .map((header, index) => header.padEnd(widths[index]))
    .join('  ')

  const separatorLine = widths.map((width) => '-'.repeat(width)).join('  ')

  const bodyLines = rows.map((row) => {
    return row
      .map((cell, index) => padAnsi(cell, widths[index]))
      .join('  ')
  })

  return [headerLine, separatorLine, ...bodyLines].join('\n')
}

/**
 * Render a detailed card for `/agents status`.
 *
 * WHAT: Surfaces all meaningful manager state in a readable card layout.
 * WHY: The issue explicitly asks for card output on the status command.
 */
export function renderAgentCard(agent: BackgroundAgentRecord, spinnerFrame?: string): string {
  const headingPrefix = spinnerFrame ? `${spinnerFrame} ` : ''
  const lines = [
    `${headingPrefix}OpenSIN background agent`,
    `  id: ${agent.id}`,
    `  status: ${formatStatusBadge(agent.status)}`,
    `  type: ${agent.agent}`,
    `  created: ${formatDateTime(agent.createdAt)}`,
    `  started: ${formatDateTime(agent.startedAt ?? agent.createdAt)}`,
    `  completed: ${formatDateTime(agent.completedAt)}`,
    `  runtime: ${formatDuration(agent.startedAt ?? agent.createdAt, agent.completedAt)}`,
    `  unread: ${agent.notification.terminalNotifiedAt && !agent.retrieval.retrievedAt ? 'yes' : 'no'}`,
    `  tool calls: ${agent.progress.toolCalls}`,
    `  last update: ${formatDateTime(agent.progress.lastUpdateAt)}`,
    `  artifact: ${agent.artifact.filePath}`,
  ]

  if (agent.title) {
    lines.push(`  title: ${agent.title}`)
  }

  if (agent.description) {
    lines.push(`  summary: ${agent.description}`)
  }

  if (agent.progress.lastMessage) {
    lines.push(`  last message: ${truncate(agent.progress.lastMessage, 120)}`)
  }

  if (agent.error) {
    lines.push(`  error: ${agent.error}`)
  }

  return lines.join('\n')
}

/**
 * Sleep helper used by polling flows.
 *
 * WHAT: Wraps `setTimeout` in a promise.
 * WHY: Keeps watch loops readable and testable.
 */
export async function sleep(milliseconds: number): Promise<void> {
  await new Promise<void>((resolve) => {
    setTimeout(resolve, milliseconds)
  })
}

/**
 * Remove ANSI codes so width calculations stay correct.
 *
 * WHAT: Internal helper for table alignment.
 * WHY: Colored status badges would otherwise break `padEnd` calculations.
 */
function stripAnsi(value: string): string {
  return value.replace(/\u001B\[[0-9;]*m/g, '')
}

/**
 * Pad a possibly-colored string to a target width.
 *
 * WHAT: Uses the visible length instead of the raw string length.
 * WHY: ANSI escape sequences are invisible but still count toward JavaScript string length.
 */
function padAnsi(value: string, width: number): string {
  const visibleLength = stripAnsi(value).length
  if (visibleLength >= width) return value
  return `${value}${' '.repeat(width - visibleLength)}`
}
