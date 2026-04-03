import type { LintError, LintResult, AutoFixConfig, LintFix } from "./types.js";
import { LinterAggregator } from "./aggregator.js";
interface FileSnapshot {
    path: string;
    content: string;
}
interface FixAttempt {
    error: LintError;
    success: boolean;
    appliedFix?: LintFix;
    validationErrors?: LintError[];
}
export declare class AutoFixEngine {
    private cfg;
    private aggregator;
    private snapshots;
    private fixHistory;
    constructor(config?: Partial<AutoFixConfig>, aggregator?: LinterAggregator);
    get config(): Readonly<AutoFixConfig>;
    updateConfig(config: Partial<AutoFixConfig>): void;
    fixErrors(errors: LintError[]): Promise<{
        fixed: LintError[];
        failed: LintError[];
    }>;
    fixFile(file: string): Promise<{
        results: LintResult[];
        fixed: LintError[];
        failed: LintError[];
    }>;
    fixAll(files?: string[]): Promise<{
        results: LintResult[];
        fixed: LintError[];
        failed: LintError[];
    }>;
    private attemptFix;
    private attemptAutoFix;
    private applyFixToContent;
    private filterErrors;
    private canAutoFix;
    private snapshotFile;
    private rollbackFile;
    clearSnapshots(): void;
    clearHistory(): void;
    getFixHistory(file?: string): Readonly<FixAttempt[]>;
    getSnapshot(file: string): FileSnapshot | undefined;
}
export {};
//# sourceMappingURL=autofix.d.ts.map