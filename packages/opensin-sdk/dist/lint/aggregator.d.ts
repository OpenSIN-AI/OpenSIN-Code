import type { LintConfig, LintError, LintResult } from "./types.js";
export declare class LinterAggregator {
    #private;
    constructor(config?: Partial<LintConfig>);
    get config(): Readonly<LintConfig>;
    updateConfig(config: Partial<LintConfig>): void;
    lint(file?: string): Promise<LintResult[]>;
    getErrorsFromResults(results: LintResult[]): LintError[];
    getWarningsFromResults(results: LintResult[]): LintError[];
    getAllIssuesFromResults(results: LintResult[]): LintError[];
}
//# sourceMappingURL=aggregator.d.ts.map