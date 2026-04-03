const BUILTIN_PRESETS = {
    recommended: {
        name: "Recommended",
        description: "Balanced set of rules for most projects",
        rules: {
            "eslint/no-unused-vars": "warning",
            "eslint/no-undef": "error",
            "eslint/semi": "warning",
            "eslint/quotes": "info",
            "eslint/no-console": "info",
            "prettier/format": "warning",
            "tsc/strict": "error",
            "pylint/unused-import": "warning",
            "pylint/undefined-variable": "error",
        },
    },
    strict: {
        name: "Strict",
        description: "All rules enabled as errors",
        rules: {
            "eslint/no-unused-vars": "error",
            "eslint/no-undef": "error",
            "eslint/semi": "error",
            "eslint/quotes": "error",
            "eslint/no-console": "error",
            "eslint/no-debugger": "error",
            "eslint/no-eval": "error",
            "eslint/no-implied-eval": "error",
            "prettier/format": "error",
            "tsc/strict": "error",
            "tsc/no-implicit-any": "error",
            "pylint/unused-import": "error",
            "pylint/undefined-variable": "error",
            "pylint/missing-docstring": "error",
        },
    },
    minimal: {
        name: "Minimal",
        description: "Only critical errors",
        rules: {
            "eslint/no-undef": "error",
            "tsc/strict": "error",
            "pylint/undefined-variable": "error",
        },
    },
};
const DEFAULT_RULES = {
    "eslint/no-unused-vars": "warning",
    "eslint/no-undef": "error",
    "eslint/semi": "off",
    "eslint/quotes": "off",
    "eslint/no-console": "info",
    "eslint/no-debugger": "error",
    "prettier/format": "warning",
    "tsc/strict": "error",
    "tsc/no-implicit-any": "warning",
    "pylint/unused-import": "warning",
    "pylint/undefined-variable": "error",
    "pylint/missing-docstring": "off",
};
export class RulesManager {
    rules = new Map();
    activePresets = new Set();
    projectRules = new Map();
    defaultSeverity;
    constructor(config = {}) {
        this.defaultSeverity = config.defaultSeverity ?? "error";
        this.initializeDefaultRules();
        this.applyPresets(config.presets ?? ["recommended"]);
        this.mergeCustomRules(config.rules ?? {});
    }
    initializeDefaultRules() {
        for (const [id, severity] of Object.entries(DEFAULT_RULES)) {
            const [source, ...nameParts] = id.split("/");
            const name = nameParts.join("/");
            this.rules.set(id, {
                id,
                source: source,
                severity,
                description: this.generateDescription(id),
                enabled: severity !== "off",
                projectSpecific: false,
            });
        }
    }
    generateDescription(ruleId) {
        const descriptions = {
            "eslint/no-unused-vars": "Disallow unused variables",
            "eslint/no-undef": "Disallow use of undeclared variables",
            "eslint/semi": "Require or disallow semicolons",
            "eslint/quotes": "Enforce consistent quote style",
            "eslint/no-console": "Disallow use of console",
            "eslint/no-debugger": "Disallow use of debugger",
            "eslint/no-eval": "Disallow use of eval()",
            "eslint/no-implied-eval": "Disallow implied eval()",
            "prettier/format": "Require code to be formatted with Prettier",
            "tsc/strict": "Enable strict type checking",
            "tsc/no-implicit-any": "Disallow implicit any types",
            "pylint/unused-import": "Disallow unused imports",
            "pylint/undefined-variable": "Disallow use of undefined variables",
            "pylint/missing-docstring": "Require docstrings in public methods",
        };
        return descriptions[ruleId] || `Rule: ${ruleId}`;
    }
    applyPresets(presetNames) {
        for (const name of presetNames) {
            const preset = BUILTIN_PRESETS[name];
            if (preset) {
                this.activePresets.add(name);
                for (const [id, severity] of Object.entries(preset.rules)) {
                    const existing = this.rules.get(id);
                    if (existing) {
                        existing.severity = severity;
                        existing.enabled = severity !== "off";
                    }
                    else {
                        const [source, ...nameParts] = id.split("/");
                        this.rules.set(id, {
                            id,
                            source: source,
                            severity,
                            description: this.generateDescription(id),
                            enabled: severity !== "off",
                            projectSpecific: false,
                        });
                    }
                }
            }
        }
    }
    mergeCustomRules(customRules) {
        for (const [id, severity] of Object.entries(customRules)) {
            const existing = this.rules.get(id);
            if (existing) {
                existing.severity = severity;
                existing.enabled = severity !== "off";
            }
            else {
                const [source, ...nameParts] = id.split("/");
                this.rules.set(id, {
                    id,
                    source: source,
                    severity,
                    description: this.generateDescription(id),
                    enabled: severity !== "off",
                    projectSpecific: false,
                });
            }
        }
    }
    enableRule(ruleId) {
        const rule = this.rules.get(ruleId) || this.projectRules.get(ruleId);
        if (rule) {
            rule.enabled = true;
            if (rule.severity === "off") {
                rule.severity = this.defaultSeverity;
            }
        }
    }
    disableRule(ruleId) {
        const rule = this.rules.get(ruleId) || this.projectRules.get(ruleId);
        if (rule) {
            rule.enabled = false;
            rule.severity = "off";
        }
    }
    setRuleSeverity(ruleId, severity) {
        const rule = this.rules.get(ruleId) || this.projectRules.get(ruleId);
        if (rule) {
            rule.severity = severity;
            rule.enabled = severity !== "off";
        }
    }
    getRule(ruleId) {
        return this.rules.get(ruleId) || this.projectRules.get(ruleId);
    }
    getAllRules() {
        return [...this.rules.values(), ...this.projectRules.values()];
    }
    getEnabledRules() {
        return this.getAllRules().filter(r => r.enabled);
    }
    getRulesBySource(source) {
        return this.getAllRules().filter(r => r.source === source);
    }
    addProjectRule(rule) {
        const projectRule = {
            ...rule,
            projectSpecific: true,
        };
        this.projectRules.set(rule.id, projectRule);
    }
    removeProjectRule(ruleId) {
        this.projectRules.delete(ruleId);
    }
    isRuleEnabled(ruleId) {
        const rule = this.rules.get(ruleId) || this.projectRules.get(ruleId);
        return rule?.enabled ?? false;
    }
    getRuleSeverity(ruleId) {
        const rule = this.rules.get(ruleId) || this.projectRules.get(ruleId);
        return rule?.severity ?? "off";
    }
    applyPreset(presetName) {
        const preset = BUILTIN_PRESETS[presetName];
        if (!preset) {
            throw new Error(`Unknown preset: ${presetName}`);
        }
        this.activePresets.add(presetName);
        for (const [id, severity] of Object.entries(preset.rules)) {
            const existing = this.rules.get(id);
            if (existing) {
                existing.severity = severity;
                existing.enabled = severity !== "off";
            }
        }
    }
    removePreset(presetName) {
        this.activePresets.delete(presetName);
    }
    getActivePresets() {
        return [...this.activePresets];
    }
    getAvailablePresets() {
        return { ...BUILTIN_PRESETS };
    }
    setDefaultSeverity(severity) {
        this.defaultSeverity = severity;
    }
    getDefaultSeverity() {
        return this.defaultSeverity;
    }
    resetToDefaults() {
        this.rules.clear();
        this.projectRules.clear();
        this.activePresets.clear();
        this.initializeDefaultRules();
        this.applyPresets(["recommended"]);
    }
    exportConfig() {
        const rules = {};
        for (const [id, rule] of this.rules) {
            rules[id] = rule.severity;
        }
        for (const [id, rule] of this.projectRules) {
            rules[id] = rule.severity;
        }
        return {
            defaultSeverity: this.defaultSeverity,
            rules,
            presets: [...this.activePresets],
            projectRoot: process.cwd(),
        };
    }
    importConfig(config) {
        this.rules.clear();
        this.projectRules.clear();
        this.activePresets.clear();
        this.defaultSeverity = config.defaultSeverity;
        this.applyPresets(config.presets);
        this.mergeCustomRules(config.rules);
    }
    shouldFixError(ruleId) {
        const rule = this.rules.get(ruleId) || this.projectRules.get(ruleId);
        if (!rule || !rule.enabled)
            return false;
        return rule.severity === "error" || rule.severity === "warning";
    }
    getRulesBySeverity(severity) {
        return this.getAllRules().filter(r => r.severity === severity);
    }
    getRulesByTag(tag) {
        return this.getAllRules().filter(r => r.tags?.includes(tag));
    }
    addTagToRule(ruleId, tag) {
        const rule = this.rules.get(ruleId) || this.projectRules.get(ruleId);
        if (rule) {
            if (!rule.tags)
                rule.tags = [];
            if (!rule.tags.includes(tag)) {
                rule.tags.push(tag);
            }
        }
    }
    removeTagFromRule(ruleId, tag) {
        const rule = this.rules.get(ruleId) || this.projectRules.get(ruleId);
        if (rule?.tags) {
            rule.tags = rule.tags.filter(t => t !== tag);
        }
    }
}
//# sourceMappingURL=rules.js.map