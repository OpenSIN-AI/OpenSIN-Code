/**
 * OpenSIN CLI Command Executor
 *
 * Executes parsed commands with error handling, context setup,
 * and lifecycle management.
 */

import type {
  CommandDefinition,
  CommandContext,
  CliConfig,
  CliResult,
  CliEvent,
} from './types.js'
import { OpenSINParser } from './parser.js'

type EventHandler = (event: CliEvent) => void

export class OpenSINExecutor {
  private parser: OpenSINParser
  private config: CliConfig
  private handlers: Map<string, Set<EventHandler>> = new Map()

  constructor(config: CliConfig) {
    this.config = config
    this.parser = new OpenSINParser()
    for (const cmd of config.commands) {
      this.parser.register(cmd)
    }
  }

  async execute(argv: string[]): Promise<CliResult> {
    const startTime = Date.now()

    try {
      const parsed = this.parser.parse(argv)

      if (parsed.command === '' || parsed.command === 'help') {
        this.emit({ type: 'help_requested', command: parsed.command, timestamp: Date.now() })
        return this.showHelp(parsed.command === 'help' ? parsed.positional[0] : undefined)
      }

      if (parsed.command === 'version' || parsed.command === '-v' || parsed.command === '--version') {
        process.stdout.write(`${this.config.name} v${this.config.version}\n`)
        return { success: true, exitCode: 0 }
      }

      const command = this.parser.getCommand(parsed.command)
      if (!command) {
        const error = `Unknown command: ${parsed.command}`
        this.emit({ type: 'command_failed', command: parsed.command, error, timestamp: Date.now() })
        if (this.config.exitOnError) {
          process.stderr.write(`${error}\n`)
          process.exit(1)
        }
        return { success: false, exitCode: 1, error }
      }

      this.emit({ type: 'command_parsed', command: parsed.command, timestamp: Date.now() })
      this.emit({ type: 'command_started', command: parsed.command, timestamp: Date.now() })

      const ctx: CommandContext = {
        args: parsed.args,
        options: parsed.options,
        positional: parsed.positional,
        cwd: process.cwd(),
        env: process.env,
        stdin: process.stdin,
        stdout: process.stdout,
        stderr: process.stderr,
      }

      await command.handler(ctx)

      const duration = Date.now() - startTime
      this.emit({
        type: 'command_completed',
        command: parsed.command,
        duration,
        timestamp: Date.now(),
      })

      return { success: true, exitCode: 0 }
    } catch (error) {
      const duration = Date.now() - startTime
      const message = error instanceof Error ? error.message : String(error)

      this.emit({
        type: 'command_failed',
        command: argv[2] ?? '',
        error: message,
        timestamp: Date.now(),
      })

      process.stderr.write(`Error: ${message}\n`)

      if (this.config.exitOnError) {
        process.exit(1)
      }

      return { success: false, exitCode: 1, error: message }
    }
  }

  private showHelp(commandName?: string): CliResult {
    const { generateHelp } = require('./help.js')
    const commands = this.parser.getCommands()

    if (commandName) {
      const cmd = commands.find((c) => c.name === commandName || c.aliases?.includes(commandName))
      if (cmd) {
        process.stdout.write(generateHelp(cmd, this.config))
        return { success: true, exitCode: 0 }
      }
    }

    process.stdout.write(generateHelp(null, this.config, commands))
    return { success: true, exitCode: 0 }
  }

  on(eventType: string, handler: EventHandler): void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, new Set())
    }
    this.handlers.get(eventType)!.add(handler)
  }

  off(eventType: string, handler: EventHandler): void {
    this.handlers.get(eventType)?.delete(handler)
  }

  private emit(event: CliEvent): void {
    const typeHandlers = this.handlers.get(event.type) ?? new Set()
    for (const handler of typeHandlers) {
      try { handler(event) } catch { /* ignore */ }
    }
  }
}

export function createExecutor(config: CliConfig): OpenSINExecutor {
  return new OpenSINExecutor(config)
}
