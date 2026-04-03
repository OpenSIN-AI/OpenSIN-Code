export type { LintError, LintFix, LintConfig, LintResult, AutoFixConfig, RulesConfig, RuleConfig, LintEvent, LintListener, LintSeverity, LintSource, } from "./types.js";
export { LinterAggregator } from "./aggregator.js";
export { AutoFixEngine } from "./autofix.js";
export { RulesManager } from "./rules.js";
export { AutoLintSession } from "./session.js";
export type { AutoLintSessionConfig } from "./session.js";
import { LinterAggregator } from "./aggregator.js";
import { AutoFixEngine } from "./autofix.js";
import { RulesManager } from "./rules.js";
import { AutoLintSession } from "./session.js";
import type { LintConfig, AutoFixConfig, RulesConfig } from "./types.js";
import type { AutoLintSessionConfig } from "./session.js";
export declare function createLinter(config?: Partial<LintConfig>): LinterAggregator;
export declare function createAutoFixEngine(config?: Partial<AutoFixConfig>, aggregator?: LinterAggregator): AutoFixEngine;
export declare function createRulesManager(rules?: RulesConfig): RulesManager;
export declare function createAutoLintSession(config?: AutoLintSessionConfig): AutoLintSession;
//# sourceMappingURL=index.d.ts.map