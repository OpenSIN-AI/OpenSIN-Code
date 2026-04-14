/**
 * OpenSIN CLI Help System
 *
 * Auto-generates help documentation for commands with formatting,
 * colorization, and structured output.
 */

import type { CommandDefinition, CliConfig, HelpOptions } from './types'

const DEFAULT_WIDTH = 80
const INDENT = '  '
const OPTION_INDENT = '    '

function padRight(str: string, width: number): string {
  return str.padEnd(width)
}

function wrapText(text: string, width: number, indent: string): string {
  const words = text.split(' ')
  const lines: string[] = []
  let currentLine = indent

  for (const word of words) {
    const testLine = currentLine + (currentLine === indent ? '' : ' ') + word
    if (testLine.length > width) {
      lines.push(currentLine)
      currentLine = indent + word
    } else {
      currentLine = testLine
    }
  }

  if (currentLine !== indent) {
    lines.push(currentLine)
  }

  return lines.join('\n')
}

function formatOption(option: { name: string; short?: string; description: string; default?: unknown; choices?: string[] }, maxWidth: number): string {
  const flags = [
    option.short ? `-${option.short}, ` : '',
    `--${option.name}`,
  ].join('')

  const padded = padRight(flags, maxWidth)
  let desc = option.description

  if (option.default !== undefined) {
    desc += ` (default: ${option.default})`
  }
  if (option.choices && option.choices.length > 0) {
    desc += ` [choices: ${option.choices.join(', ')}]`
  }

  return `${OPTION_INDENT}${padded} ${desc}`
}

function formatArgument(arg: { name: string; description: string; required: boolean; variadic?: boolean; default?: unknown; choices?: string[] }, maxWidth: number): string {
  const displayName = arg.variadic ? `<${arg.name}...>` : `<${arg.name}>`
  const padded = padRight(displayName, maxWidth)
  let desc = arg.description

  if (!arg.required) {
    desc = `[optional] ${desc}`
  }
  if (arg.default !== undefined) {
    desc += ` (default: ${arg.default})`
  }
  if (arg.choices && arg.choices.length > 0) {
    desc += ` [choices: ${arg.choices.join(', ')}]`
  }

  return `${OPTION_INDENT}${padded} ${desc}`
}

export function generateCommandHelp(command: CommandDefinition, options?: HelpOptions): string {
  const width = options?.width ?? DEFAULT_WIDTH
  const lines: string[] = []

  lines.push('')
  lines.push(`  ${command.name} - ${command.description}`)
  lines.push('')

  if (command.usage) {
    lines.push(`  Usage:`)
    lines.push(`    ${INDENT}${command.usage}`)
    lines.push('')
  }

  if (command.arguments && command.arguments.length > 0) {
    lines.push('  Arguments:')
    const maxNameLen = Math.max(...command.arguments.map((a) => (a.variadic ? a.name.length + 5 : a.name.length + 2)))
    for (const arg of command.arguments) {
      lines.push(formatArgument(arg, maxNameLen))
    }
    lines.push('')
  }

  if (command.options && command.options.length > 0) {
    lines.push('  Options:')
    const maxFlagLen = Math.max(...command.options.map((o) => {
      const short = o.short ? `-${o.short}, ` : ''
      return short.length + o.name.length + 4
    }))
    for (const opt of command.options) {
      lines.push(formatOption(opt, maxFlagLen))
    }
    lines.push('')
  }

  if (command.examples && command.examples.length > 0 && options?.showExamples !== false) {
    lines.push('  Examples:')
    for (const example of command.examples) {
      lines.push(`    ${INDENT}${example}`)
    }
    lines.push('')
  }

  return lines.join('\n')
}

export function generateHelp(
  command: CommandDefinition | null,
  config: CliConfig,
  allCommands?: CommandDefinition[]
): string {
  const lines: string[] = []

  if (command) {
    return generateCommandHelp(command)
  }

  lines.push('')
  lines.push(`  ${config.name} v${config.version}`)
  lines.push(`  ${config.description}`)
  lines.push('')
  lines.push('  Usage:')
  lines.push(`    ${config.name} <command> [options]`)
  lines.push('')

  if (allCommands && allCommands.length > 0) {
    const visible = allCommands.filter((c) => !c.hidden)
    const categories = new Map<string, CommandDefinition[]>()

    for (const cmd of visible) {
      const cat = cmd.category ?? 'Commands'
      if (!categories.has(cat)) categories.set(cat, [])
      categories.get(cat)!.push(cmd)
    }

    const maxNameLen = Math.max(...visible.map((c) => c.name.length))

    for (const [category, cmds] of categories) {
      lines.push(`  ${category}:`)
      for (const cmd of cmds) {
        const padded = padRight(cmd.name, maxNameLen + 2)
        const desc = cmd.summary ?? cmd.description
        lines.push(`    ${padded} ${desc}`)
        if (cmd.aliases && cmd.aliases.length > 0) {
          lines.push(`    ${padRight('', maxNameLen + 2)} aliases: ${cmd.aliases.join(', ')}`)
        }
      }
      lines.push('')
    }
  }

  lines.push('  Options:')
  lines.push('    -h, --help     Show help')
  lines.push('    -v, --version  Show version')
  lines.push('')

  return lines.join('\n')
}
