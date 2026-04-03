export enum HookEvent {
  PreEdit = "pre-edit",
  PostEdit = "post-edit",
  PreCommit = "pre-commit",
  PostCommit = "post-commit",
  PreTool = "pre-tool",
  PostTool = "post-tool",
}

export interface HookConfig {
  id: string
  event: HookEvent
  command: string
  args?: string[]
  cwd?: string
  env?: Record<string, string>
  timeout?: number
  onError?: "continue" | "abort"
  enabled?: boolean
}

export type HookDefinition = HookConfig

export interface HookResult {
  hookId: string
  event: HookEvent
  command: string
  exitCode: number
  stdout: string
  stderr: string
  duration: number
  timedOut: boolean
  error?: string
}

export interface HookExecutionContext {
  event: HookEvent
  cwd: string
  filePath?: string
  toolName?: string
  toolInput?: unknown
  sessionId?: string
  env: Record<string, string>
}

export interface HookContext {
  event: HookEvent
  cwd: string
  filePath?: string
  toolName?: string
  toolInput?: unknown
  env: Record<string, string>
}

export interface HooksConfig {
  enabled?: boolean
  defaultTimeout?: number
  defaultOnError?: "continue" | "abort"
  hooks?: HookConfig[]
  builtin?: {
    prettier?: boolean
    eslint?: boolean
    pytest?: boolean
    typecheck?: boolean
  }
}
