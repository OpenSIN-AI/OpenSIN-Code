import { exec } from "child_process"
import { promisify } from "util"
import { readFile, writeFile, access } from "fs/promises"
import type { LintError, LintResult, LintSource, AutoFixConfig, LintFix } from "./types.js"
import { LinterAggregator } from "./aggregator.js"

const execAsync = promisify(exec)

interface FileSnapshot {
  path: string
  content: string
}

interface FixAttempt {
  error: LintError
  success: boolean
  appliedFix?: LintFix
  validationErrors?: LintError[]
}

export class AutoFixEngine {
  private cfg: AutoFixConfig
  private aggregator: LinterAggregator
  private snapshots: Map<string, FileSnapshot>
  private fixHistory: Map<string, FixAttempt[]>

  constructor(config?: Partial<AutoFixConfig>, aggregator?: LinterAggregator) {
    this.cfg = {
      enabled: config?.enabled ?? true,
      maxAttempts: config?.maxAttempts ?? 3,
      validateAfterFix: config?.validateAfterFix ?? true,
      rollbackOnFailure: config?.rollbackOnFailure ?? true,
      sources: config?.sources ?? ["eslint", "prettier", "tsc"],
      ignoreRules: config?.ignoreRules ?? [],
      onlyRules: config?.onlyRules ?? [],
      timeout: config?.timeout ?? 30000,
    }
    this.aggregator = aggregator ?? new LinterAggregator()
    this.snapshots = new Map()
    this.fixHistory = new Map()
  }

  get config(): Readonly<AutoFixConfig> {
    return this.cfg
  }

  updateConfig(config: Partial<AutoFixConfig>): void {
    this.cfg = { ...this.cfg, ...config }
  }

  async fixErrors(errors: LintError[]): Promise<{ fixed: LintError[]; failed: LintError[] }> {
    if (!this.cfg.enabled) {
      return { fixed: [], failed: errors }
    }
    const fixed: LintError[] = []
    const failed: LintError[] = []
    const filteredErrors = this.filterErrors(errors)
    const errorsByFile = new Map<string, LintError[]>()
    for (const error of filteredErrors) {
      const fileErrors = errorsByFile.get(error.file) ?? []
      fileErrors.push(error)
      errorsByFile.set(error.file, fileErrors)
    }
    for (const [file, fileErrors] of errorsByFile) {
      await this.snapshotFile(file)
      const fixableErrors = fileErrors.filter((e) => e.fix)
      const nonFixableErrors = fileErrors.filter((e) => !e.fix)
      for (const error of fixableErrors) {
        const attempt = await this.attemptFix(error)
        if (attempt.success) {
          fixed.push(error)
        } else {
          failed.push(error)
        }
      }
      const autoFixableErrors = nonFixableErrors.filter((e) => this.canAutoFix(e))
      for (const error of autoFixableErrors) {
        const attempt = await this.attemptAutoFix(error, file)
        if (attempt.success) {
          fixed.push(error)
        } else {
          failed.push(error)
        }
      }
      failed.push(...nonFixableErrors.filter((e) => !this.canAutoFix(e)))
    }
    return { fixed, failed }
  }

  async fixFile(file: string): Promise<{ results: LintResult[]; fixed: LintError[]; failed: LintError[] }> {
    await this.snapshotFile(file)
    const results = await this.aggregator.lint(file)
    const allErrors = this.aggregator.getErrorsFromResults(results)
    const { fixed, failed } = await this.fixErrors(allErrors)
    return { results, fixed, failed }
  }

  async fixAll(files?: string[]): Promise<{ results: LintResult[]; fixed: LintError[]; failed: LintError[] }> {
    const results = await this.aggregator.lint(files?.[0])
    const allErrors = this.aggregator.getAllIssuesFromResults(results)
    const { fixed, failed } = await this.fixErrors(allErrors)
    return { results, fixed, failed }
  }

  private async attemptFix(error: LintError): Promise<FixAttempt> {
    const history = this.fixHistory.get(error.file) ?? []
    for (let attempt = 0; attempt < this.cfg.maxAttempts; attempt++) {
      if (!error.fix) {
        return { error, success: false }
      }
      try {
        const content = await readFile(error.file, "utf-8")
        const fixedContent = this.applyFixToContent(content, error.fix)
        await writeFile(error.file, fixedContent, "utf-8")
        if (this.cfg.validateAfterFix) {
          const validationResults = await this.aggregator.lint(error.file)
          const validationErrors = validationResults.flatMap((r) =>
            r.errors.filter((e) => e.ruleId === error.ruleId && e.line === error.line)
          )
          if (validationErrors.length > 0) {
            if (this.cfg.rollbackOnFailure) {
              await this.rollbackFile(error.file)
            }
            history.push({ error, success: false, appliedFix: error.fix, validationErrors })
            this.fixHistory.set(error.file, history)
            return { error, success: false, appliedFix: error.fix, validationErrors }
          }
        }
        history.push({ error, success: true, appliedFix: error.fix })
        this.fixHistory.set(error.file, history)
        return { error, success: true, appliedFix: error.fix }
      } catch {
        if (this.cfg.rollbackOnFailure) {
          await this.rollbackFile(error.file)
        }
        history.push({ error, success: false, appliedFix: error.fix })
        this.fixHistory.set(error.file, history)
        return { error, success: false, appliedFix: error.fix }
      }
    }
    return { error, success: false }
  }

  private async attemptAutoFix(error: LintError, file: string): Promise<FixAttempt> {
    const history = this.fixHistory.get(file) ?? []
    try {
      const source = error.source
      switch (source) {
        case "eslint": {
          const cmd = `npx eslint --fix ${file} 2>/dev/null || true`
          await execAsync(cmd, { cwd: process.cwd(), timeout: this.cfg.timeout })
          break
        }
        case "prettier": {
          const cmd = `npx prettier --write ${file} 2>/dev/null || true`
          await execAsync(cmd, { cwd: process.cwd(), timeout: this.cfg.timeout })
          break
        }
        case "tsc":
        case "pylint":
        default: {
          history.push({ error, success: false })
          this.fixHistory.set(file, history)
          return { error, success: false }
        }
      }
      if (this.cfg.validateAfterFix) {
        const validationResults = await this.aggregator.lint(file)
        const validationErrors = validationResults.flatMap((r) =>
          r.errors.filter((e) => e.ruleId === error.ruleId && e.line === error.line)
        )
        if (validationErrors.length > 0) {
          if (this.cfg.rollbackOnFailure) {
            await this.rollbackFile(file)
          }
          history.push({ error, success: false, validationErrors })
          this.fixHistory.set(file, history)
          return { error, success: false, validationErrors }
        }
      }
      history.push({ error, success: true })
      this.fixHistory.set(file, history)
      return { error, success: true }
    } catch {
      if (this.cfg.rollbackOnFailure) {
        await this.rollbackFile(file)
      }
      history.push({ error, success: false })
      this.fixHistory.set(file, history)
      return { error, success: false }
    }
  }

  private applyFixToContent(content: string, fix: LintFix): string {
    const [start, end] = fix.range
    return content.slice(0, start) + fix.text + content.slice(end)
  }

  private filterErrors(errors: LintError[]): LintError[] {
    const ignoreRules = this.cfg.ignoreRules ?? []
    const onlyRules = this.cfg.onlyRules ?? []
    return errors.filter((error) => {
      if (!this.cfg.sources.includes(error.source)) {
        return false
      }
      if (ignoreRules.length > 0 && error.ruleId && ignoreRules.includes(error.ruleId)) {
        return false
      }
      if (onlyRules.length > 0 && error.ruleId && !onlyRules.includes(error.ruleId)) {
        return false
      }
      return true
    })
  }

  private canAutoFix(error: LintError): boolean {
    const autoFixableSources: LintSource[] = ["eslint", "prettier"]
    return autoFixableSources.includes(error.source)
  }

  private async snapshotFile(file: string): Promise<void> {
    try {
      await access(file)
      const content = await readFile(file, "utf-8")
      this.snapshots.set(file, { path: file, content })
    } catch {
      this.snapshots.set(file, { path: file, content: "" })
    }
  }

  private async rollbackFile(file: string): Promise<void> {
    const snapshot = this.snapshots.get(file)
    if (snapshot) {
      await writeFile(file, snapshot.content, "utf-8")
    }
  }

  clearSnapshots(): void {
    this.snapshots.clear()
  }

  clearHistory(): void {
    this.fixHistory.clear()
  }

  getFixHistory(file?: string): Readonly<FixAttempt[]> {
    if (file) {
      return this.fixHistory.get(file) ?? []
    }
    return Array.from(this.fixHistory.values()).flat()
  }

  getSnapshot(file: string): FileSnapshot | undefined {
    return this.snapshots.get(file)
  }
}
