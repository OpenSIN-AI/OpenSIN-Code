import { LinterAggregator } from "./aggregator.js"
import { AutoFixEngine } from "./autofix.js"
import { RulesManager } from "./rules.js"
import type { LintConfig, AutoFixConfig, LintResult, LintError, LintEvent } from "./types.js"
import type { RulesConfig } from "./rules.js"

export interface AutoLintSessionConfig {
  lint?: Partial<LintConfig>
  autoFix?: Partial<AutoFixConfig>
  rules?: Partial<RulesConfig>
  enabled?: boolean
  lintAfterEdit?: boolean
  lintOnSave?: boolean
  lintBeforeCommit?: boolean
}

export class AutoLintSession {
  #enabled: boolean
  #lintAfterEdit: boolean
  #lintOnSave: boolean
  #lintBeforeCommit: boolean
  #linter: LinterAggregator
  #autoFix: AutoFixEngine
  #rules: RulesManager
  #eventListeners: Set<(event: LintEvent) => void>

  constructor(config?: AutoLintSessionConfig) {
    this.#enabled = config?.enabled ?? true
    this.#lintAfterEdit = config?.lintAfterEdit ?? true
    this.#lintOnSave = config?.lintOnSave ?? true
    this.#lintBeforeCommit = config?.lintBeforeCommit ?? true
    this.#rules = new RulesManager(config?.rules)
    this.#linter = new LinterAggregator(config?.lint)
    this.#autoFix = new AutoFixEngine(config?.autoFix, this.#linter)
    this.#eventListeners = new Set()
  }

  get linter(): LinterAggregator {
    return this.#linter
  }

  get autoFix(): AutoFixEngine {
    return this.#autoFix
  }

  get rules(): RulesManager {
    return this.#rules
  }

  addEventListener(listener: (event: LintEvent) => void): void {
    this.#eventListeners.add(listener)
  }

  removeEventListener(listener: (event: LintEvent) => void): void {
    this.#eventListeners.delete(listener)
  }

  #emit(event: LintEvent): void {
    for (const listener of this.#eventListeners) {
      listener(event)
    }
  }

  async lintAfterEdit(file: string): Promise<{ results: LintResult[]; fixed: LintError[]; failed: LintError[] }> {
    if (!this.#enabled || !this.#lintAfterEdit) {
      return { results: [], fixed: [], failed: [] }
    }

    const start = Date.now()
    this.#emit({ type: "lint_start", source: "eslint", file })

    const results = await this.#linter.lint(file)
    const errors = this.#linter.getErrorsFromResults(results)

    if (errors.length === 0) {
      this.#emit({ type: "lint_complete", source: "eslint", file, duration: Date.now() - start })
      return { results, fixed: [], failed: [] }
    }

    this.#emit({ type: "autofix_start", source: "eslint", file })

    const { fixed, failed } = await this.#autoFix.fixErrors(errors)

    this.#emit({
      type: "autofix_complete",
      source: "eslint",
      file,
      errors,
      fixed,
      duration: Date.now() - start,
    })

    return { results, fixed, failed }
  }

  async lintOnSave(file: string): Promise<{ results: LintResult[]; fixed: LintError[]; failed: LintError[] }> {
    if (!this.#enabled || !this.#lintOnSave) {
      return { results: [], fixed: [], failed: [] }
    }

    const start = Date.now()
    this.#emit({ type: "lint_start", source: "eslint", file })

    const results = await this.#linter.lint(file)
    const errors = this.#linter.getErrorsFromResults(results)

    if (errors.length === 0) {
      this.#emit({ type: "lint_complete", source: "eslint", file, duration: Date.now() - start })
      return { results, fixed: [], failed: [] }
    }

    const { fixed, failed } = await this.#autoFix.fixErrors(errors)

    this.#emit({
      type: "autofix_complete",
      source: "eslint",
      file,
      errors,
      fixed,
      duration: Date.now() - start,
    })

    return { results, fixed, failed }
  }

  async lintBeforeCommit(files?: string[]): Promise<{ results: LintResult[]; hasErrors: boolean }> {
    if (!this.#enabled || !this.#lintBeforeCommit) {
      return { results: [], hasErrors: false }
    }

    const start = Date.now()
    const targetFile = files?.[0]

    if (targetFile) {
      this.#emit({ type: "lint_start", source: "eslint", file: targetFile })
    }

    const results = await this.#linter.lint(targetFile)
    const errors = this.#linter.getErrorsFromResults(results)

    this.#emit({
      type: "lint_complete",
      source: "eslint",
      file: targetFile ?? "",
      errors,
      duration: Date.now() - start,
    })

    return { results, hasErrors: errors.length > 0 }
  }

  updateConfig(config: AutoLintSessionConfig): void {
    if (config.enabled !== undefined) {
      this.#enabled = config.enabled
    }
    if (config.lintAfterEdit !== undefined) {
      this.#lintAfterEdit = config.lintAfterEdit
    }
    if (config.lintOnSave !== undefined) {
      this.#lintOnSave = config.lintOnSave
    }
    if (config.lintBeforeCommit !== undefined) {
      this.#lintBeforeCommit = config.lintBeforeCommit
    }
    if (config.lint) {
      this.#linter.updateConfig(config.lint)
    }
    if (config.autoFix) {
      this.#autoFix.updateConfig(config.autoFix)
    }
    if (config.rules) {
      for (const [ruleId, ruleConfig] of Object.entries(config.rules)) {
        const severity = ruleConfig as string
        if (severity === "off") {
          this.#rules.disableRule(ruleId)
        } else {
          this.#rules.enableRule(ruleId)
          this.#rules.setRuleSeverity(ruleId, severity as any)
        }
      }
    }
  }

  dispose(): void {
    this.#eventListeners.clear()
    this.#autoFix.clearSnapshots()
    this.#autoFix.clearHistory()
  }
}
