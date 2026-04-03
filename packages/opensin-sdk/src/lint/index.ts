export type {
  LintError,
  LintFix,
  LintConfig,
  LintResult,
  AutoFixConfig,
  RulesConfig,
  RuleConfig,
  LintEvent,
  LintListener,
  LintSeverity,
  LintSource,
} from "./types.js"

export { LinterAggregator } from "./aggregator.js"
export { AutoFixEngine } from "./autofix.js"
export { RulesManager } from "./rules.js"
export { AutoLintSession } from "./session.js"
export type { AutoLintSessionConfig } from "./session.js"

import { LinterAggregator } from "./aggregator.js"
import { AutoFixEngine } from "./autofix.js"
import { RulesManager } from "./rules.js"
import { AutoLintSession } from "./session.js"
import type { LintConfig, AutoFixConfig, RulesConfig } from "./types.js"
import type { AutoLintSessionConfig } from "./session.js"

export function createLinter(config?: Partial<LintConfig>): LinterAggregator {
  return new LinterAggregator(config)
}

export function createAutoFixEngine(
  config?: Partial<AutoFixConfig>,
  aggregator?: LinterAggregator
): AutoFixEngine {
  return new AutoFixEngine(config, aggregator)
}

export function createRulesManager(rules?: RulesConfig): RulesManager {
  return new RulesManager(rules)
}

export function createAutoLintSession(config?: AutoLintSessionConfig): AutoLintSession {
  return new AutoLintSession(config)
}
