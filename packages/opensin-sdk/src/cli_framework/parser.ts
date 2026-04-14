/**
 * OpenSIN CLI Argument Parser
 *
 * Parses command-line arguments into structured command definitions
 * with support for options, positional args, and subcommands.
 */

import type {
  CommandDefinition,
  CommandOption,
  ParsedCommand,
  ArgType,
} from './types'

export class OpenSINParser {
  private commands: Map<string, CommandDefinition> = new Map()
  private aliases: Map<string, string> = new Map()

  register(command: CommandDefinition): void {
    this.commands.set(command.name, command)
    for (const alias of command.aliases ?? []) {
      this.aliases.set(alias, command.name)
    }
  }

  parse(argv: string[]): ParsedCommand {
    const args = argv.slice(2)
    if (args.length === 0) {
      return { command: '', args: {}, options: {}, positional: [], raw: args }
    }

    const commandName = this.resolveCommand(args[0]!)
    const command = this.commands.get(commandName)

    if (!command) {
      return { command: args[0] ?? '', args: {}, options: {}, positional: args, raw: args }
    }

    const remaining = args.slice(1)
    const parsed = this.parseCommandArgs(command, remaining)
    return { command: commandName, ...parsed, raw: args }
  }

  parseCommandArgs(command: CommandDefinition, args: string[]): { args: Record<string, unknown>; options: Record<string, unknown>; positional: string[] } {
    const options: Record<string, unknown> = {}
    const positional: string[] = []
    const parsedArgs: Record<string, unknown> = {}

    // Set defaults
    for (const opt of command.options ?? []) {
      if (opt.default !== undefined) {
        options[opt.name] = opt.default
      }
    }

    let i = 0
    while (i < args.length) {
      const arg = args[i]!

      if (arg === '--') {
        positional.push(...args.slice(i + 1))
        break
      }

      if (arg.startsWith('--')) {
        const optName = arg.slice(2).split('=')[0]!
        const option = command.options?.find((o) => o.name === optName)

        if (option) {
          if (arg.includes('=')) {
            options[option.name] = this.parseValue(arg.split('=').slice(1).join('='), option.type)
          } else if (option.type === 'boolean') {
            options[option.name] = true
          } else {
            const next = args[++i]
            options[option.name] = next !== undefined ? this.parseValue(next, option.type) : true
          }
        } else {
          options[optName] = args[i + 1]?.startsWith('--') ? true : args[++i] ?? true
        }
      } else if (arg.startsWith('-') && arg.length === 2) {
        const short = arg.slice(1)
        const option = command.options?.find((o) => o.short === short)

        if (option) {
          if (option.type === 'boolean') {
            options[option.name] = true
          } else {
            const next = args[++i]
            options[option.name] = next !== undefined ? this.parseValue(next, option.type) : true
          }
        }
      } else {
        positional.push(arg)
      }

      i++
    }

    // Parse positional arguments
    const cmdArgs = command.arguments ?? []
    for (let j = 0; j < cmdArgs.length; j++) {
      const argDef = cmdArgs[j]!
      if (argDef.variadic) {
        parsedArgs[argDef.name] = positional.slice(j)
      } else if (j < positional.length) {
        parsedArgs[argDef.name] = this.parseValue(positional[j]!, argDef.type)
      } else if (argDef.default !== undefined) {
        parsedArgs[argDef.name] = argDef.default
      } else if (argDef.required) {
        throw new Error(`Missing required argument: ${argDef.name}`)
      }
    }

    return { args: parsedArgs, options, positional }
  }

  getCommands(): CommandDefinition[] {
    return Array.from(this.commands.values())
  }

  getCommand(name: string): CommandDefinition | undefined {
    const resolved = this.resolveCommand(name)
    return this.commands.get(resolved)
  }

  private resolveCommand(name: string): string {
    return this.aliases.get(name) ?? name
  }

  private parseValue(value: string, type: ArgType): unknown {
    switch (type) {
      case 'number':
        return Number(value)
      case 'boolean':
        return value !== 'false'
      case 'array':
        return value.split(',').map((v) => v.trim())
      default:
        return value
    }
  }
}

export function createParser(): OpenSINParser {
  return new OpenSINParser()
}
