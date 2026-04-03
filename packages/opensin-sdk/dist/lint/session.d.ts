import { LinterAggregator } from "./aggregator.js";
import { AutoFixEngine } from "./autofix.js";
import { RulesManager } from "./rules.js";
import type { LintConfig, AutoFixConfig, LintResult, LintError, LintEvent } from "./types.js";
import type { RulesConfig } from "./rules.js";
export interface AutoLintSessionConfig {
    lint?: Partial<LintConfig>;
    autoFix?: Partial<AutoFixConfig>;
    rules?: Partial<RulesConfig>;
    enabled?: boolean;
    lintAfterEdit?: boolean;
    lintOnSave?: boolean;
    lintBeforeCommit?: boolean;
}
export declare class AutoLintSession {
    #private;
    constructor(config?: AutoLintSessionConfig);
    get linter(): LinterAggregator;
    get autoFix(): AutoFixEngine;
    get rules(): RulesManager;
    addEventListener(listener: (event: LintEvent) => void): void;
    removeEventListener(listener: (event: LintEvent) => void): void;
    lintAfterEdit(file: string): Promise<{
        results: LintResult[];
        fixed: LintError[];
        failed: LintError[];
    }>;
    lintOnSave(file: string): Promise<{
        results: LintResult[];
        fixed: LintError[];
        failed: LintError[];
    }>;
    lintBeforeCommit(files?: string[]): Promise<{
        results: LintResult[];
        hasErrors: boolean;
    }>;
    updateConfig(config: AutoLintSessionConfig): void;
    dispose(): void;
}
//# sourceMappingURL=session.d.ts.map