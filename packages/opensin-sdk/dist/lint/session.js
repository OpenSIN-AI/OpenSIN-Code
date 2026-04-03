import { LinterAggregator } from "./aggregator.js";
import { AutoFixEngine } from "./autofix.js";
import { RulesManager } from "./rules.js";
export class AutoLintSession {
    #enabled;
    #lintAfterEdit;
    #lintOnSave;
    #lintBeforeCommit;
    #linter;
    #autoFix;
    #rules;
    #eventListeners;
    constructor(config) {
        this.#enabled = config?.enabled ?? true;
        this.#lintAfterEdit = config?.lintAfterEdit ?? true;
        this.#lintOnSave = config?.lintOnSave ?? true;
        this.#lintBeforeCommit = config?.lintBeforeCommit ?? true;
        this.#rules = new RulesManager(config?.rules);
        this.#linter = new LinterAggregator(config?.lint);
        this.#autoFix = new AutoFixEngine(config?.autoFix, this.#linter);
        this.#eventListeners = new Set();
    }
    get linter() {
        return this.#linter;
    }
    get autoFix() {
        return this.#autoFix;
    }
    get rules() {
        return this.#rules;
    }
    addEventListener(listener) {
        this.#eventListeners.add(listener);
    }
    removeEventListener(listener) {
        this.#eventListeners.delete(listener);
    }
    #emit(event) {
        for (const listener of this.#eventListeners) {
            listener(event);
        }
    }
    async lintAfterEdit(file) {
        if (!this.#enabled || !this.#lintAfterEdit) {
            return { results: [], fixed: [], failed: [] };
        }
        const start = Date.now();
        this.#emit({ type: "lint_start", source: "eslint", file });
        const results = await this.#linter.lint(file);
        const errors = this.#linter.getErrorsFromResults(results);
        if (errors.length === 0) {
            this.#emit({ type: "lint_complete", source: "eslint", file, duration: Date.now() - start });
            return { results, fixed: [], failed: [] };
        }
        this.#emit({ type: "autofix_start", source: "eslint", file });
        const { fixed, failed } = await this.#autoFix.fixErrors(errors);
        this.#emit({
            type: "autofix_complete",
            source: "eslint",
            file,
            errors,
            fixed,
            duration: Date.now() - start,
        });
        return { results, fixed, failed };
    }
    async lintOnSave(file) {
        if (!this.#enabled || !this.#lintOnSave) {
            return { results: [], fixed: [], failed: [] };
        }
        const start = Date.now();
        this.#emit({ type: "lint_start", source: "eslint", file });
        const results = await this.#linter.lint(file);
        const errors = this.#linter.getErrorsFromResults(results);
        if (errors.length === 0) {
            this.#emit({ type: "lint_complete", source: "eslint", file, duration: Date.now() - start });
            return { results, fixed: [], failed: [] };
        }
        const { fixed, failed } = await this.#autoFix.fixErrors(errors);
        this.#emit({
            type: "autofix_complete",
            source: "eslint",
            file,
            errors,
            fixed,
            duration: Date.now() - start,
        });
        return { results, fixed, failed };
    }
    async lintBeforeCommit(files) {
        if (!this.#enabled || !this.#lintBeforeCommit) {
            return { results: [], hasErrors: false };
        }
        const start = Date.now();
        const targetFile = files?.[0];
        if (targetFile) {
            this.#emit({ type: "lint_start", source: "eslint", file: targetFile });
        }
        const results = await this.#linter.lint(targetFile);
        const errors = this.#linter.getErrorsFromResults(results);
        this.#emit({
            type: "lint_complete",
            source: "eslint",
            file: targetFile ?? "",
            errors,
            duration: Date.now() - start,
        });
        return { results, hasErrors: errors.length > 0 };
    }
    updateConfig(config) {
        if (config.enabled !== undefined) {
            this.#enabled = config.enabled;
        }
        if (config.lintAfterEdit !== undefined) {
            this.#lintAfterEdit = config.lintAfterEdit;
        }
        if (config.lintOnSave !== undefined) {
            this.#lintOnSave = config.lintOnSave;
        }
        if (config.lintBeforeCommit !== undefined) {
            this.#lintBeforeCommit = config.lintBeforeCommit;
        }
        if (config.lint) {
            this.#linter.updateConfig(config.lint);
        }
        if (config.autoFix) {
            this.#autoFix.updateConfig(config.autoFix);
        }
        if (config.rules) {
            for (const [ruleId, ruleConfig] of Object.entries(config.rules)) {
                const severity = ruleConfig;
                if (severity === "off") {
                    this.#rules.disableRule(ruleId);
                }
                else {
                    this.#rules.enableRule(ruleId);
                    this.#rules.setRuleSeverity(ruleId, severity);
                }
            }
        }
    }
    dispose() {
        this.#eventListeners.clear();
        this.#autoFix.clearSnapshots();
        this.#autoFix.clearHistory();
    }
}
//# sourceMappingURL=session.js.map