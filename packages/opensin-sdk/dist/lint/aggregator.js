import { exec } from "child_process";
import { promisify } from "util";
import { existsSync } from "fs";
import { resolve } from "path";
const execAsync = promisify(exec);
let errorIdCounter = 0;
function generateId(source) {
    return `${source}_${++errorIdCounter}_${Date.now()}`;
}
function mapSeverity(severity) {
    const lower = severity.toLowerCase();
    if (lower === "error" || lower === "e")
        return "error";
    if (lower === "warning" || lower === "warn" || lower === "w")
        return "warning";
    return "info";
}
export class LinterAggregator {
    #config;
    constructor(config) {
        this.#config = {
            enabled: config?.enabled ?? true,
            sources: config?.sources ?? ["eslint", "prettier", "tsc"],
            autoFix: config?.autoFix ?? true,
            autoFixOnSave: config?.autoFixOnSave ?? true,
            autoFixAfterEdit: config?.autoFixAfterEdit ?? true,
            maxAttempts: config?.maxAttempts ?? 3,
            validateAfterFix: config?.validateAfterFix ?? true,
            rollbackOnFailure: config?.rollbackOnFailure ?? true,
            cwd: config?.cwd ?? process.cwd(),
        };
    }
    get config() {
        return this.#config;
    }
    updateConfig(config) {
        this.#config = { ...this.#config, ...config };
    }
    async lint(file) {
        if (!this.#config.enabled) {
            return [];
        }
        const results = [];
        const tasks = [];
        for (const source of this.#config.sources) {
            switch (source) {
                case "eslint":
                    tasks.push(this.#lintESLint(file));
                    break;
                case "pylint":
                    tasks.push(this.#lintPylint(file));
                    break;
                case "prettier":
                    tasks.push(this.#lintPrettier(file));
                    break;
                case "tsc":
                    tasks.push(this.#lintTSC(file));
                    break;
            }
        }
        const settled = await Promise.allSettled(tasks);
        for (const result of settled) {
            if (result.status === "fulfilled") {
                results.push(result.value);
            }
            else {
                results.push({
                    errors: [{
                            id: generateId("custom"),
                            source: "custom",
                            severity: "error",
                            message: `Linter failed: ${String(result.reason)}`,
                            file: "",
                            line: 0,
                            column: 0,
                        }],
                    warnings: [],
                    fixed: [],
                    failed: [],
                    duration: 0,
                    source: "custom",
                });
            }
        }
        return results;
    }
    async #lintESLint(file) {
        const start = Date.now();
        const errors = [];
        const warnings = [];
        const eslintPath = resolve(this.#config.cwd, "node_modules/.bin/eslint");
        if (!existsSync(eslintPath)) {
            return { errors: [], warnings: [], fixed: [], failed: [], duration: Date.now() - start, source: "eslint" };
        }
        const target = file ?? this.#config.cwd;
        const cmd = `${eslintPath} ${target} --format json 2>/dev/null || true`;
        try {
            const { stdout } = await execAsync(cmd, { cwd: this.#config.cwd, timeout: 30000 });
            if (!stdout.trim()) {
                return { errors: [], warnings: [], fixed: [], failed: [], duration: Date.now() - start, source: "eslint" };
            }
            const output = JSON.parse(stdout);
            for (const result of output ?? []) {
                for (const msg of result.messages ?? []) {
                    const fix = msg.fix ? { range: msg.fix.range, text: msg.fix.text } : undefined;
                    const lintError = {
                        id: generateId("eslint"),
                        source: "eslint",
                        severity: msg.severity === 2 ? "error" : "warning",
                        message: msg.message,
                        file: result.filePath,
                        line: msg.line,
                        column: msg.column,
                        endLine: msg.endLine ?? undefined,
                        endColumn: msg.endColumn ?? undefined,
                        ruleId: msg.ruleId ?? undefined,
                        fix,
                    };
                    if (lintError.severity === "error") {
                        errors.push(lintError);
                    }
                    else {
                        warnings.push(lintError);
                    }
                }
            }
        }
        catch {
            return { errors, warnings, fixed: [], failed: [], duration: Date.now() - start, source: "eslint" };
        }
        return { errors, warnings, fixed: [], failed: [], duration: Date.now() - start, source: "eslint" };
    }
    async #lintPylint(file) {
        const start = Date.now();
        const errors = [];
        const warnings = [];
        if (!file || !file.endsWith(".py")) {
            return { errors: [], warnings: [], fixed: [], failed: [], duration: Date.now() - start, source: "pylint" };
        }
        const cmd = `pylint --output-format=json ${file} 2>/dev/null || true`;
        try {
            const { stdout } = await execAsync(cmd, { cwd: this.#config.cwd, timeout: 30000 });
            if (!stdout.trim()) {
                return { errors: [], warnings: [], fixed: [], failed: [], duration: Date.now() - start, source: "pylint" };
            }
            const messages = JSON.parse(stdout);
            for (const msg of messages) {
                const lintError = {
                    id: generateId("pylint"),
                    source: "pylint",
                    severity: msg.type === "error" || msg.type === "fatal" ? "error" : "warning",
                    message: msg.message,
                    file,
                    line: msg.line,
                    column: msg.column,
                    endLine: msg.endLine ?? undefined,
                    endColumn: msg.endColumn ?? undefined,
                    ruleId: msg.symbol,
                };
                if (lintError.severity === "error") {
                    errors.push(lintError);
                }
                else {
                    warnings.push(lintError);
                }
            }
        }
        catch {
            return { errors, warnings, fixed: [], failed: [], duration: Date.now() - start, source: "pylint" };
        }
        return { errors, warnings, fixed: [], failed: [], duration: Date.now() - start, source: "pylint" };
    }
    async #lintPrettier(file) {
        const start = Date.now();
        const errors = [];
        const prettierPath = resolve(this.#config.cwd, "node_modules/.bin/prettier");
        if (!existsSync(prettierPath)) {
            return { errors: [], warnings: [], fixed: [], failed: [], duration: Date.now() - start, source: "prettier" };
        }
        const target = file ?? this.#config.cwd;
        const cmd = `${prettierPath} --check ${target} 2>&1 || true`;
        try {
            const { stdout, stderr } = await execAsync(cmd, { cwd: this.#config.cwd, timeout: 30000 });
            const output = stdout + stderr;
            const lines = output.split("\n");
            for (const line of lines) {
                if (line.includes("[warn]") || line.includes("[error]")) {
                    const fileMatch = line.match(/\[warn\]\s+(.+)/);
                    const errorMatch = line.match(/\[error\]\s+(.+?):\s+(.+)/);
                    if (fileMatch && fileMatch[1]) {
                        errors.push({
                            id: generateId("prettier"),
                            source: "prettier",
                            severity: "warning",
                            message: "File is not formatted according to Prettier rules",
                            file: fileMatch[1].trim(),
                            line: 1,
                            column: 1,
                        });
                    }
                    else if (errorMatch && errorMatch[1] && errorMatch[2]) {
                        errors.push({
                            id: generateId("prettier"),
                            source: "prettier",
                            severity: "error",
                            message: errorMatch[2].trim(),
                            file: errorMatch[1].trim(),
                            line: 1,
                            column: 1,
                        });
                    }
                }
            }
        }
        catch {
            return { errors, warnings: [], fixed: [], failed: [], duration: Date.now() - start, source: "prettier" };
        }
        return { errors, warnings: [], fixed: [], failed: [], duration: Date.now() - start, source: "prettier" };
    }
    async #lintTSC(file) {
        const start = Date.now();
        const errors = [];
        const warnings = [];
        const tscPath = resolve(this.#config.cwd, "node_modules/.bin/tsc");
        if (!existsSync(tscPath)) {
            return { errors: [], warnings: [], fixed: [], failed: [], duration: Date.now() - start, source: "tsc" };
        }
        const target = file ?? "";
        const cmd = `${tscPath} --noEmit --pretty false ${target} 2>&1 || true`;
        try {
            const { stdout } = await execAsync(cmd, { cwd: this.#config.cwd, timeout: 60000 });
            if (!stdout.trim()) {
                return { errors: [], warnings: [], fixed: [], failed: [], duration: Date.now() - start, source: "tsc" };
            }
            const lines = stdout.split("\n");
            const errorRegex = /^(.+?)\((\d+),(\d+)\):\s+(error|warning)\s+TS(\d+):\s+(.+)$/;
            for (const line of lines) {
                const match = line.match(errorRegex);
                if (match) {
                    const [, filePath, lineNum, colNum, severity, code, message] = match;
                    const lintError = {
                        id: generateId("tsc"),
                        source: "tsc",
                        severity: severity === "error" ? "error" : "warning",
                        message: `TS${code}: ${(message ?? "").trim()}`,
                        file: (filePath ?? "").trim(),
                        line: parseInt(lineNum ?? "1", 10),
                        column: parseInt(colNum ?? "1", 10),
                        ruleId: `TS${code}`,
                    };
                    if (lintError.severity === "error") {
                        errors.push(lintError);
                    }
                    else {
                        warnings.push(lintError);
                    }
                }
            }
        }
        catch {
            return { errors, warnings, fixed: [], failed: [], duration: Date.now() - start, source: "tsc" };
        }
        return { errors, warnings, fixed: [], failed: [], duration: Date.now() - start, source: "tsc" };
    }
    getErrorsFromResults(results) {
        return results.flatMap((r) => r.errors);
    }
    getWarningsFromResults(results) {
        return results.flatMap((r) => r.warnings);
    }
    getAllIssuesFromResults(results) {
        return results.flatMap((r) => [...r.errors, ...r.warnings]);
    }
}
//# sourceMappingURL=aggregator.js.map