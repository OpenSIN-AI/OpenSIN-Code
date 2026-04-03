export type LintSeverity = "error" | "warning" | "info"

export type LintSource = "eslint" | "pylint" | "prettier" | "tsc" | "custom"

export interface LintFix {
  range: [number, number]
  text: string
}

export interface LintError {
  id: string
  source: LintSource
  severity: LintSeverity
  message: string
  file: string
  line: number
  column: number
  endLine?: number
  endColumn?: number
  ruleId?: string
  fix?: LintFix
  raw?: unknown
}

export interface LintConfig {
  enabled: boolean
  sources: LintSource[]
  autoFix: boolean
  autoFixOnSave: boolean
  autoFixAfterEdit: boolean
  maxAttempts: number
  validateAfterFix: boolean
  rollbackOnFailure: boolean
  cwd: string
}

export interface LintResult {
  errors: LintError[]
  warnings: LintError[]
  fixed: LintError[]
  failed: LintError[]
  duration: number
  source: LintSource
}

export interface AutoFixConfig {
  enabled: boolean
  maxAttempts: number
  validateAfterFix: boolean
  rollbackOnFailure: boolean
  sources: LintSource[]
  ignoreRules?: string[]
  onlyRules?: string[]
  timeout?: number
}

export interface RuleConfig {
  enabled: boolean
  severity: LintSeverity
  options?: unknown
}

export interface RulesConfig {
  [ruleId: string]: RuleConfig
}

export interface LintEvent {
  type: "lint_start" | "lint_complete" | "autofix_start" | "autofix_complete" | "autofix_rollback"
  source: LintSource
  file: string
  errors?: LintError[]
  fixed?: LintError[]
  error?: string
  duration?: number
}

export interface LintListener {
  onEvent(event: LintEvent): void
}
