/**
 * OpenSIN CLI Framework — Type Definitions
 *
 * Core types for command parsing, help generation, and execution
 * within the OpenSIN CLI framework.
 */

/** Argument type for command parameters */
export type ArgType = 'string' | 'number' | 'boolean' | 'array' | 'enum'

/** Command option definition */
export interface CommandOption {
  name: string
  short?: string
  description: string
  type: ArgType
  required?: boolean
  default?: unknown
  choices?: string[]
  alias?: string[]
}

/** Command argument definition */
export interface CommandArgument {
  name: string
  description: string
  required: boolean
  type: ArgType
  variadic?: boolean
  default?: unknown
  choices?: string[]
}

/** Command handler context */
export interface CommandContext {
  args: Record<string, unknown>
  options: Record<string, unknown>
  positional: string[]
  cwd: string
  env: NodeJS.ProcessEnv
  stdin: NodeJS.ReadStream
  stdout: NodeJS.WriteStream
  stderr: NodeJS.WriteStream
}

/** Command handler function */
export type CommandHandler = (ctx: CommandContext) => Promise<void> | void

/** Command definition */
export interface CommandDefinition {
  name: string
  description: string
  summary?: string
  usage?: string
  options?: CommandOption[]
  arguments?: CommandArgument[]
  handler: CommandHandler
  aliases?: string[]
  hidden?: boolean
  category?: string
  examples?: string[]
}

/** Command group for organization */
export interface CommandGroup {
  name: string
  description: string
  commands: CommandDefinition[]
}

/** Parsed CLI result */
export interface ParsedCommand {
  command: string
  args: Record<string, unknown>
  options: Record<string, unknown>
  positional: string[]
  raw: string[]
}

/** Help format options */
export interface HelpOptions {
  width?: number
  colors?: boolean
  showHidden?: boolean
  showExamples?: boolean
  commandName?: string
  version?: string
}

/** CLI configuration */
export interface CliConfig {
  name: string
  description: string
  version: string
  commands: CommandDefinition[]
  defaultCommand?: string
  helpCommand?: boolean
  versionCommand?: boolean
  exitOnError?: boolean
  strict?: boolean
}

/** CLI execution result */
export interface CliResult {
  success: boolean
  exitCode: number
  output?: string
  error?: string
}

/** CLI event */
export type CliEvent =
  | { type: 'command_parsed'; command: string; timestamp: number }
  | { type: 'command_started'; command: string; timestamp: number }
  | { type: 'command_completed'; command: string; duration: number; timestamp: number }
  | { type: 'command_failed'; command: string; error: string; timestamp: number }
  | { type: 'help_requested'; command?: string; timestamp: number }
